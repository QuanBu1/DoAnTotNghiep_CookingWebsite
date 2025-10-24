// src/pages/CourseDetailPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert, ButtonGroup, Nav, ProgressBar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify'; // Import toast
import AuthContext from '../context/AuthContext';
import AddLessonModal from '../components/AddLessonModal';
import EditLessonModal from '../components/EditLessonModal';

const pageVariants = {
    initial: { opacity: 0, x: '-100vw' },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: '100vw' },
};
const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
};

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        let videoId = null;

        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1).split('?')[0];
        } else if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/live/')) {
                videoId = urlObj.pathname.split('/live/')[1].split('?')[0];
            } else {
                videoId = urlObj.searchParams.get('v');
            }
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : null;
    } catch (e) {
        console.error("Invalid YouTube URL", e);
        return null;
    }
};

const CourseDetailPage = () => {
    const { id } = useParams();
    const { user, isAuthenticated, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [enrollError, setEnrollError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);

    const refreshLessons = async () => {
        try {
            const config = isAuthenticated ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const lessonsRes = await axios.get(`/api/courses/${id}/lessons`, config);
            setLessons(lessonsRes.data);
        } catch (err) {
            console.error("Failed to refresh lessons", err);
        }
    };
    
    const fetchCourseData = React.useCallback(async () => {
        setLoading(true);
        try {
            const config = isAuthenticated ? { headers: { Authorization: `Bearer ${token}` } } : {};
            
            const coursePromise = axios.get(`/api/courses/${id}`);
            const lessonsPromise = axios.get(`/api/courses/${id}/lessons`, config);
            
            const promises = [coursePromise, lessonsPromise];
            if (isAuthenticated) {
                promises.push(axios.get(`/api/courses/${id}/enrollment-status`, config));
                promises.push(axios.get(`/api/courses/${id}/favorite-status`, config));
            }

            const responses = await Promise.all(promises);
            setCourse(responses[0].data);
            setLessons(responses[1].data);

            if (isAuthenticated) {
                setIsEnrolled(responses[2].data.isEnrolled);
                setIsFavorited(responses[3].data.isFavorited);
            } else {
                setIsEnrolled(false);
                setIsFavorited(false);
            }
        } catch (err) {
            setError('Không thể tải dữ liệu khóa học.');
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated, token]);

    useEffect(() => {
        fetchCourseData();
    }, [fetchCourseData]);

    // SỬA ĐỔI: Nâng cấp hàm handleEnroll
    const handleEnroll = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setEnrollError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`/api/courses/${id}/enroll`, {}, config);
            
            const { isFree, enrollmentId, message } = res.data;

            if (isFree) {
                // Thay thế alert bằng toast
                toast.success(message || "Ghi danh vào khóa học miễn phí thành công!");
                // Cập nhật lại giao diện sau một chút để người dùng thấy thông báo
                setTimeout(() => {
                    fetchCourseData();
                }, 1500); 
            } else if (enrollmentId) {
                navigate(`/checkout/${enrollmentId}`);
            }

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Ghi danh thất bại. Vui lòng thử lại.';
            toast.error(errorMsg);
            setEnrollError(errorMsg);
        }
    };

    const handleDeleteCourse = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn khóa học này?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/courses/${id}`, config);
                toast.success('Xóa khóa học thành công!');
                navigate('/');
            } catch (err) {
                toast.error('Xóa khóa học thất bại.');
            }
        }
     };

    const handleOpenEditModal = (lesson) => { 
        setEditingLesson(lesson); 
        setShowEditModal(true); 
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/lessons/${course.id}/${lessonId}`, config);
                refreshLessons();
            } catch (err) {
                toast.error('Xóa bài học thất bại.');
            }
        }
     };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`/api/courses/${id}/favorite`, {}, config);
            setIsFavorited(res.data.isFavorited);
        } catch (err) {
            toast.error('Thao tác thất bại, vui lòng thử lại.');
        }
     };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;
    if (!course) return null;

    const completedLessons = lessons.filter(l => l.completed).length;
    const totalLessons = lessons.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const firstUncompletedIndex = lessons.findIndex(lesson => !lesson.completed);
    const isOwner = user && user.id === course.instructor_id;
    const isAdmin = user && user.role === 'admin';
    const canManage = isOwner || isAdmin;
    const canViewContent = canManage || isEnrolled;
    const liveUrl = getYouTubeEmbedUrl(course.live_embed_url);

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <Container className="my-5">
                    <Link to="/courses">&larr; Quay lại danh sách khóa học</Link>
                    <Row className="mt-4">
                        <Col md={8}>
                            <h1>{course.title}</h1>
                            <p className="lead text-muted">Giảng viên: {course.instructor_name}</p>

                            {liveUrl ? (
                                <div className='mb-4'>
                                    <h4>🔴 TRỰC TIẾP</h4>
                                    <div className="ratio ratio-16x9">
                                        <iframe src={liveUrl} title="YouTube Livestream" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                                    </div>
                                </div>
                            ) : ( <Alert variant="info" className='mb-4'>Hiện không có buổi học trực tiếp nào.</Alert> )}

                            {isEnrolled && !canManage && (
                                <div className="mb-3">
                                    <strong>Tiến trình của bạn:</strong>
                                    <ProgressBar now={progress} label={`${progress}%`} variant="success" striped animated className="mt-2" />
                                </div>
                            )}

                            {canManage && ( <div className="d-flex flex-wrap gap-2 mb-3 p-3 bg-light border rounded"> <Button variant="success" onClick={() => setShowModal(true)}>+ Thêm bài học</Button> <Button variant="outline-primary" onClick={() => navigate(`/courses/${course.id}/edit`)}>Chỉnh sửa khóa học</Button> <Button variant="outline-danger" onClick={handleDeleteCourse}>Xóa khóa học</Button> </div> )}
                            <hr />
                            <h4>Mô tả khóa học</h4>
                            <p>{course.description}</p>
                            <h4 className="mt-4">Nội dung bài học</h4>
                            <ListGroup>
                                {lessons.map((lesson, index) => {
                                    const isLocked = !canManage && isEnrolled && firstUncompletedIndex !== -1 && index > firstUncompletedIndex;
                                    const renderTooltip = (props) => ( <Tooltip {...props}>Vui lòng hoàn thành các bài học trước</Tooltip> );
                                    const lessonItemContent = (
                                        <>
                                            {lesson.completed && <i className="bi bi-check-circle-fill text-success me-2" title="Đã hoàn thành"></i>}
                                            {!lesson.completed && isLocked && <i className="bi bi-lock-fill text-muted me-2" title="Bị khóa"></i>}
                                            {lesson.title}
                                        </>
                                    );
                                    const lessonItem = (
                                        <ListGroup.Item as="div" key={lesson.id} className="d-flex justify-content-between align-items-center" disabled={isLocked}>
                                            {canViewContent && !isLocked ? (
                                                <LinkContainer to={`/courses/${course.id}/lessons/${lesson.id}`}>
                                                    <Nav.Link className="p-0 text-dark">{lessonItemContent}</Nav.Link>
                                                </LinkContainer>
                                            ) : ( <span>{lessonItemContent}</span> )}
                                            {canManage && (
                                                <ButtonGroup size="sm">
                                                    <Button variant="outline-primary" onClick={() => handleOpenEditModal(lesson)}>Sửa</Button>
                                                    <Button variant="outline-danger" onClick={() => handleDeleteLesson(lesson.id)}>Xóa</Button>
                                                </ButtonGroup>
                                            )}
                                        </ListGroup.Item>
                                    );
                                    return isLocked ? ( <OverlayTrigger placement="top" overlay={renderTooltip} key={lesson.id}><div>{lessonItem}</div></OverlayTrigger> ) : ( lessonItem );
                                })}
                            </ListGroup>
                        </Col>
                        <Col md={4}>
                            <Card className="shadow-sm">
                                <Card.Img variant="top" src={course.image_url} alt={course.title} />
                                <Card.Body>
                                    <Card.Title as="h3" className="text-center">{course.price > 0 ? new Intl.NumberFormat('vi-VN').format(course.price) + ' VND' : 'Miễn phí'}</Card.Title>
                                    <div className="d-grid gap-2">
                                        <Button variant="primary" size="lg" onClick={handleEnroll} disabled={isAdmin || isOwner || isEnrolled}>
                                            {isAdmin ? "Chế độ xem của Admin" : isOwner ? "Đây là khóa học của bạn" : isEnrolled ? "Bạn đã ghi danh" : "Đăng ký học ngay"}
                                        </Button>
                                        {isAuthenticated && !canManage && (
                                            <Button variant={isFavorited ? "danger" : "outline-danger"} onClick={handleToggleFavorite}>
                                                <i className={isFavorited ? "bi bi-heart-fill" : "bi bi-heart"}></i>
                                                {isFavorited ? " Đã yêu thích" : " Thêm vào yêu thích"}
                                            </Button>
                                        )}
                                        {enrollError && <Alert variant="danger" className="mt-2">{enrollError}</Alert>}
                                    </div>
                                    <ListGroup variant="flush" className="mt-3">
                                        <ListGroup.Item>Cấp độ: {course.level}</ListGroup.Item>
                                        <ListGroup.Item>Phong cách: {course.cuisine}</ListGroup.Item>
                                        <ListGroup.Item>Số bài học: {lessons.length}</ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </motion.div>
            {canManage && <AddLessonModal show={showModal} handleClose={() => setShowModal(false)} courseId={id} onLessonAdded={refreshLessons} />}
            {canManage && <EditLessonModal show={showEditModal} handleClose={() => setShowEditModal(false)} courseId={id} lesson={editingLesson} onLessonUpdated={refreshLessons} />}
        </>
    );
};

export default CourseDetailPage;
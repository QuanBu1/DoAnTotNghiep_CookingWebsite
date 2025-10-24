// src/pages/LessonPlayerPage.js

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Spinner, Alert, Card, Button, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import './LessonPlayerPage.css'; 

import FloatingBotChat from '../components/FloatingBotChat';
import QandASection from '../components/QandASection';
import SlideInPanel from '../components/SlideInPanel';
import SubmissionTab from '../components/SubmissionTab'; // Thêm import cho tab mới

const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
const pageTransition = { duration: 0.5 };

const LessonPlayerPage = () => {
    const { courseId, lessonId } = useParams();
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [isQaPanelOpen, setIsQaPanelOpen] = useState(false);
    const [showNavButtons, setShowNavButtons] = useState(false);
    
    const contentEndRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolledToEnd = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200;
            setShowNavButtons(isScrolledToEnd);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchLessonData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [lessonRes, allLessonsRes] = await Promise.all([
                axios.get(`/api/lessons/${courseId}/${lessonId}`, config),
                axios.get(`/api/courses/${courseId}/lessons`, config)
            ]);
            
            setLesson(lessonRes.data);
            setAllLessons(allLessonsRes.data);

            const currentLessonStatus = allLessonsRes.data.find(l => l.id === parseInt(lessonId));
            setIsCompleted(currentLessonStatus?.completed || false);

        } catch (err) {
            setError(err.response?.data?.msg || 'Bạn không có quyền truy cập nội dung này.');
        } finally {
            setLoading(false);
        }
    }, [courseId, lessonId, token]);

    useEffect(() => {
        setShowNavButtons(false); 
        window.scrollTo(0, 0);   
        fetchLessonData();
    }, [lessonId, fetchLessonData]);

    const handleMarkAsComplete = useCallback(async (showToast = true) => {
        if (!isCompleted && token && user?.role === 'student') {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.post(`/api/lessons/${courseId}/${lessonId}/complete`, {}, config);
                if (showToast) {
                    toast.success(`✨ Đã hoàn thành "${lesson?.title}"!`);
                }
                setIsCompleted(true);
            } catch (err) {
                if (showToast) {
                    toast.error("Lỗi: Không thể đánh dấu hoàn thành.");
                }
            }
        }
    }, [isCompleted, token, user?.role, courseId, lessonId, lesson?.title]);

    const currentLessonIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
    const nextLesson = allLessons[currentLessonIndex + 1];
    const prevLesson = allLessons[currentLessonIndex - 1];

    useEffect(() => {
        if (user?.role !== 'student' || nextLesson) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isCompleted) {
                    handleMarkAsComplete(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = contentEndRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [isCompleted, handleMarkAsComplete, user?.role, nextLesson]);

    const handleNavigate = async (targetLessonId) => {
        await handleMarkAsComplete(false);
        navigate(`/courses/${courseId}/lessons/${targetLessonId}`);
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
            if (urlObj.hostname.includes('youtube.com')) return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
        } catch (e) { return null; }
        return null;
     };

    const processContentWithImages = () => {
        if (!lesson || !lesson.content) return "";
        let processedContent = lesson.content;
        if (lesson.images && lesson.images.length > 0) {
            lesson.images.forEach((image, index) => {
                const placeholder = `[HINHANH_${index + 1}]`;
                const markdownImage = `\n![Hình minh họa ${index + 1}](${image.image_url})\n`;
                processedContent = processedContent.replaceAll(placeholder, markdownImage);
            });
        }
        return processedContent;
    };
    
    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error} <Link to={`/courses/${courseId}`}>Quay lại</Link></Alert></Container>;
    if (!lesson) return null;
    
    const videoUrl = getYouTubeEmbedUrl(lesson.video_url);
    const isStudent = user && user.role === 'student';

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <Container fluid="lg" className="my-4" style={{ paddingBottom: '80px' }}>
                    <Link to={`/courses/${courseId}`}>&larr; Quay lại khóa học</Link>
                    <h1 className="mt-3">{lesson.title}</h1>
                    <hr />
                    <Row>
                        <Col>
                            {videoUrl && ( <div className="ratio ratio-16x9 mb-4 shadow-sm rounded"> <iframe src={videoUrl} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe> </div> )}
                            
                            <div className="d-flex justify-content-end my-3">
                                <Button variant="outline-primary" onClick={() => setIsQaPanelOpen(true)}>
                                    <i className="bi bi-patch-question-fill me-2"></i> Hỏi đáp
                                </Button>
                            </div>

                            <Tabs defaultActiveKey="content" id="lesson-tabs" className="mt-4">
                                <Tab eventKey="content" title="📝 Nội dung & Công thức">
                                    <Card>
                                        <Card.Body>
                                            <div className="lesson-content" style={{fontSize: '1.1rem', lineHeight: '1.7'}}>
                                                <ReactMarkdown>
                                                    {processContentWithImages()}
                                                </ReactMarkdown>
                                            </div>
                                            <div ref={contentEndRef} style={{ height: '1px' }} />
                                        </Card.Body>
                                    </Card>
                                </Tab>
                                
                                {isStudent && (
                                    <Tab eventKey="submission" title="📷 Nộp bài thực hành">
                                        <SubmissionTab 
                                            courseId={courseId} 
                                            lessonId={lessonId} 
                                            userId={user.id} 
                                        />
                                    </Tab>
                                )}
                            </Tabs>
                        </Col>
                    </Row>
                </Container>
            </motion.div>
            
            <FloatingBotChat courseId={courseId} />

            {prevLesson && (
                <Button 
                    onClick={() => handleNavigate(prevLesson.id)} 
                    className={`floating-nav-btn floating-prev-lesson-btn ${showNavButtons ? 'visible' : ''}`}
                >
                    <i className="bi bi-arrow-left-short arrow-icon"></i>
                    Bài trước
                </Button>
            )}

            {nextLesson && (
                <Button 
                    onClick={() => handleNavigate(nextLesson.id)}
                    className={`floating-nav-btn floating-next-lesson-btn ${showNavButtons ? 'visible' : ''}`}
                >
                    Bài tiếp theo
                    <i className="bi bi-arrow-right-short arrow-icon"></i>
                </Button>
            )}

            <SlideInPanel 
                title="Hỏi Đáp cho bài học" 
                isOpen={isQaPanelOpen} 
                onClose={() => setIsQaPanelOpen(false)}
            >
                <QandASection courseId={courseId} lessonId={lessonId} />
            </SlideInPanel>
        </>
    );
};

export default LessonPlayerPage;
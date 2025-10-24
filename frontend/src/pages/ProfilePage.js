// src/pages/ProfilePage.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // CHỈ GIỮ LẠI Link
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './ProfilePage.css';

// =========================================================================
// Component Con: Lịch sử Mua hàng Dụng cụ (ToolOrderHistory)
// =========================================================================
const ToolOrderHistory = () => {
    const { token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrderHistory = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/orders/tools/history', config); 
            setOrders(res.data);
        } catch (err) {
            setError('Không thể tải lịch sử mua hàng.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
            case 'pending_selection': return <Badge bg="warning">Chờ xử lý</Badge>;
            case 'confirmed': return <Badge bg="info">Đã xác nhận</Badge>;
            case 'shipped': return <Badge bg="primary">Đang giao</Badge>;
            case 'completed': return <Badge bg="success">Hoàn thành</Badge>;
            case 'cancelled': return <Badge bg="danger">Đã hủy</Badge>;
            default: return <Badge bg="secondary">Không rõ</Badge>;
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    
    return (
        <div className="order-history-tab mt-3">
            {orders.length === 0 ? (
                <Alert variant="info" className='text-center'>
                    Bạn chưa có đơn hàng dụng cụ nhà bếp nào.
                </Alert>
            ) : (
                <Table striped bordered hover responsive className="mb-0 small">
                    <thead>
                        <tr>
                            <th>Mã ĐH</th>
                            <th>Sản phẩm</th>
                            <th>Tổng tiền</th>
                            <th>PT Thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{order.tool_name}</td>
                                <td>{new Intl.NumberFormat('vi-VN').format(order.total_amount)} VND</td>
                                <td>{order.payment_method === 'cod' ? 'COD' : 'CK'}</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        as={Link} 
                                        to={`/tool-checkout/${order.id}`}
                                    >
                                        Xem
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

// =========================================================================
// Component Con: Lịch sử Đăng ký Khóa học (EnrollmentHistory)
// =========================================================================
const EnrollmentHistory = () => {
    const { token } = useContext(AuthContext);
    const [enrolled, setEnrolled] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const enrolledPromise = axios.get('/api/profile/enrolled-courses', config);
                const favoritesPromise = axios.get('/api/profile/favorites', config);
                
                const [enrolledRes, favoritesRes] = await Promise.all([enrolledPromise, favoritesPromise]);
                
                setEnrolled(enrolledRes.data);
                setFavorites(favoritesRes.data);
            } catch (err) {
                setError('Không thể tải danh sách khóa học.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [token]);
    
    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    const CourseCardItem = ({ course, isFavorite = false }) => (
        <Col sm={12} md={6} lg={6} className="mb-4">
            <Link to={`/courses/${course.id}`} className="text-decoration-none">
                <Card className="h-100 shadow-sm course-card-link">
                    <Card.Body>
                        <Card.Title as="h6" className={isFavorite ? "text-danger" : "text-primary"}>{course.title}</Card.Title>
                        <Card.Text className="text-muted small">Giảng viên: {course.instructor_name}</Card.Text>
                        {course.progress_percentage !== undefined && (
                            <div className='mt-2'>
                                <p className='mb-1 small'>Tiến trình: {Math.round(course.progress_percentage)}%</p>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-success" 
                                        role="progressbar" 
                                        style={{ width: `${course.progress_percentage}%` }}
                                        aria-valuenow={course.progress_percentage}
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                    ></div>
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Link>
        </Col>
    );

    return (
        <Tabs defaultActiveKey="enrolled" id="course-history-tabs" className="mt-3">
            
            <Tab eventKey="enrolled" title={`Khóa học đã Ghi danh (${enrolled.length})`}>
                <Row className="p-3">
                    {enrolled.length > 0 ? (
                        enrolled.map(course => <CourseCardItem key={course.id} course={course} />)
                    ) : (<Col><p>Bạn chưa ghi danh vào khóa học nào.</p></Col>)}
                </Row>
            </Tab>
            
            <Tab eventKey="favorites" title={`Khóa học Yêu thích (${favorites.length})`}>
                <Row className="p-3">
                    {favorites.length > 0 ? (
                         favorites.map(course => <CourseCardItem key={course.id} course={course} isFavorite={true} />)
                    ) : (<Col><p>Bạn chưa có khóa học yêu thích nào.</p></Col>)}
                </Row>
            </Tab>
        </Tabs>
    );
};


// =========================================================================
// Component Chính: ProfilePage
// =========================================================================
const ProfilePage = () => {
    const { user, token, loadUser } = useContext(AuthContext); 
    
    // FIX LỖI: Luôn khởi tạo bằng string rỗng để tránh gửi NULL
    const [profile, setProfile] = useState({ 
        full_name: user?.full_name || '', 
        email: user?.email || '', 
        phone_number: user?.phone_number || '', 
        address: user?.address || ''
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Cập nhật state local khi user context thay đổi
    useEffect(() => {
        setProfile({
            full_name: user?.full_name || '', 
            email: user?.email || '', 
            phone_number: user?.phone_number || '', 
            address: user?.address || ''
        });
    }, [user]); 

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!profile.full_name.trim()) {
                 toast.error('Họ và Tên không được để trống.');
                 setLoading(false);
                 return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Gửi dữ liệu, tên trường đã được đồng bộ hóa: full_name, phone_number, address
            await axios.put('/api/user/me', profile, config); 
            
            if (loadUser) {
                await loadUser(); 
            }
            toast.success('Cập nhật hồ sơ thành công!');

        } catch (err) {
            toast.error(err.response?.data?.msg || 'Cập nhật hồ sơ thất bại. Vui lòng kiểm tra console.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    return (
        <Container className="my-5 profile-page">
            <Row className="justify-content-center">
                <Col md={9}>
                    <Card className="shadow-lg">
                        <Card.Header className="bg-primary text-white text-center">
                            <h4>Hồ sơ Cá nhân & Quản lý</h4>
                        </Card.Header>
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-3 profile-tabs"
                                justify
                            >
                                {/* 1. Tab Thông tin Cá nhân */}
                                <Tab eventKey="profile" title="Thông tin Cá nhân">
                                    <div className="profile-info-content p-3">
                                        <div className="text-center mb-4">
                                            <img src="/images/student-avatar.jpg" alt="Avatar" className="profile-avatar mb-2" />
                                            <p className="lead fw-bold">{user?.full_name}</p>
                                        </div>

                                        <Form onSubmit={handleUpdateProfile}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Họ và Tên</Form.Label>
                                                <Form.Control type="text" name="full_name" value={profile.full_name} onChange={handleChange} required />
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email (Không đổi)</Form.Label>
                                                <Form.Control type="email" value={profile.email} readOnly disabled />
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Số điện thoại</Form.Label>
                                                <Form.Control type="text" name="phone_number" value={profile.phone_number} onChange={handleChange} />
                                            </Form.Group>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Địa chỉ Giao hàng</Form.Label>
                                                <Form.Control as="textarea" rows={2} name="address" value={profile.address} onChange={handleChange} placeholder="Nhập địa chỉ giao hàng chi tiết..." />
                                            </Form.Group>
                                            
                                            <div className="d-grid">
                                                <Button variant="success" type="submit" disabled={loading}>
                                                    {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Cập nhật Hồ sơ'}
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>
                                </Tab>

                                {/* 2. Tab Lịch sử Đăng ký Khóa học */}
                                <Tab eventKey="enrollment" title="Lịch sử Khóa học">
                                    <EnrollmentHistory />
                                </Tab>

                                {/* 3. Tab Lịch sử Mua hàng Dụng cụ */}
                                <Tab eventKey="toolHistory" title="Lịch sử Mua hàng">
                                    <ToolOrderHistory />
                                </Tab>

                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProfilePage;
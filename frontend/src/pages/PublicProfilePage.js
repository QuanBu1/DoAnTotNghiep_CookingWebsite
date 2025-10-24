// src/pages/PublicProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// SỬA LỖI: Đã xóa 'Row' và 'Col' không sử dụng
import { Container, Spinner, Alert } from 'react-bootstrap';
import './HomePage.css'; // Tái sử dụng style của course-card
import './PublicProfilePage.css'; // Style riêng cho trang

const PublicProfilePage = () => {
    const { userId } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            window.scrollTo(0, 0); // Cuộn lên đầu trang khi vào
            setLoading(true);
            try {
                const res = await axios.get(`/api/user/${userId}/public`);
                setProfileData(res.data);
            } catch (err) {
                setError(err.response?.data?.msg || 'Không thể tải trang cá nhân.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;
    if (!profileData) return null;

    const { user, recipes } = profileData;

    return (
        <Container className="my-5">
            <header className="profile-header">
                <img src="/images/student-avatar.jpg" alt={user.full_name} className="profile-avatar-public" />
                <h1 className="profile-name">{user.full_name}</h1>
                <p className="text-muted">Thành viên cộng đồng Bếp Của Quân</p>
            </header>

            <h3 className="section-title">Các công thức đã chia sẻ</h3>

            {recipes.length > 0 ? (
                <div className="courses-grid mt-4">
                    {recipes.map(recipe => (
                        <Link to={`/community-recipes/${recipe.id}`} key={recipe.id} className="course-card-link">
                            <div className="course-card">
                                <img 
                                    src={recipe.image_url || '/images/banner4.jpg'} 
                                    alt={recipe.title} 
                                    className="course-card-image" 
                                />
                                <div className="course-card-body">
                                    <h5>{recipe.title}</h5>
                                    <p className="small text-muted">{recipe.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Alert variant="info" className="mt-4 text-center">
                    {user.full_name} chưa chia sẻ công thức nào.
                </Alert>
            )}
        </Container>
    );
};

export default PublicProfilePage;
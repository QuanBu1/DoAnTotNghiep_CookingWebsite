// src/pages/CommunityRecipesPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import AuthContext from '../context/AuthContext'; // Import AuthContext
import './CommunityRecipesPage.css'; // <-- THÊM CSS MỚI

// Component con để hiển thị một card công thức (ĐÃ CẬP NHẬT)
const RecipeCard = ({ recipe }) => (
    // THAY ĐỔI: Sử dụng class mới 'recipe-card-link'
    <Link to={`/community-recipes/${recipe.id}`} className="recipe-card-link">
        {/* THAY ĐỔI: Sử dụng class mới 'recipe-card' */}
        <div className="recipe-card">
            {/* THAY ĐỔI: Sử dụng class mới 'recipe-card-image' */}
            <img
                src={recipe.image_url || '/images/banner4.jpg'}
                alt={recipe.title}
                className="recipe-card-image"
            />
            {/* THAY ĐỔI: Sử dụng class mới 'recipe-card-body' */}
            <div className="recipe-card-body">
                <h5>{recipe.title}</h5>
                {/* THAY ĐỔI: Sử dụng class mới 'recipe-card-description' */}
                <p className="recipe-card-description">
                    {recipe.description || 'Chưa có mô tả cho món ăn này...'}
                </p>
                
                {/* THÊM MỚI: Footer cho Card với Avatar và Tên tác giả */}
                <div className="recipe-card-footer">
                    <img 
                        src="/images/student-avatar.jpg" // (Sử dụng avatar mặc định)
                        alt={recipe.author_name}
                        className="recipe-author-avatar"
                    />
                    <span className="recipe-author-name">{recipe.author_name}</span>
                </div>
            </div>
        </div>
    </Link>
);

const CommunityRecipesPage = () => {
    const { isAuthenticated, token } = useContext(AuthContext); // Lấy trạng thái đăng nhập
    const [allRecipes, setAllRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Luôn lấy danh sách tất cả công thức
            const allRecipesPromise = axios.get(`/api/user-recipes/public?timestamp=${new Date().getTime()}`);
            
            // Nếu đã đăng nhập, lấy thêm danh sách công thức đã lưu
            if (isAuthenticated) {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const savedRecipesPromise = axios.get('/api/user-recipes/saved', config);
                
                const [allRes, savedRes] = await Promise.all([allRecipesPromise, savedRecipesPromise]);
                setAllRecipes(allRes.data);
                setSavedRecipes(savedRes.data);
            } else {
                const allRes = await allRecipesPromise;
                setAllRecipes(allRes.data);
            }
        } catch (err) {
            setError('Không thể tải danh sách công thức.');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]); // Phụ thuộc vào trạng thái đăng nhập

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        // THAY ĐỔI: Thêm class 'community-page' để bọc
        <div className="section community-page">
            {/* THAY ĐỔI: Căn giữa tiêu đề và thêm mô tả */}
            <h1 className="section-title text-center">Công thức từ Cộng đồng</h1>
            <p className="lead text-center text-muted mb-5">
                Khám phá, chia sẻ và lưu lại những sáng tạo ẩm thực từ hàng ngàn đầu bếp tại gia.
            </p>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                id="community-recipes-tabs"
                // THAY ĐỔI: Thêm class mới cho Tabs
                className="mb-4 community-tabs"
                justify
            >
                <Tab eventKey="all" title={`Tất cả công thức (${allRecipes.length})`}>
                    {allRecipes.length > 0 ? (
                        // THAY ĐỔI: Sử dụng class 'recipe-grid'
                        <div className="recipe-grid mt-4">
                            {allRecipes.map(recipe => (
                                <RecipeCard key={`all-${recipe.id}`} recipe={recipe} />
                            ))}
                        </div>
                    ) : (
                        <Alert variant="info" className="mt-4">Chưa có công thức nào được chia sẻ.</Alert>
                    )}
                </Tab>

                {/* Chỉ hiển thị tab này khi người dùng đã đăng nhập */}
                {isAuthenticated && (
                    <Tab eventKey="saved" title={`Công thức đã lưu (${savedRecipes.length})`}>
                        {savedRecipes.length > 0 ? (
                            // THAY ĐỔI: Sử dụng class 'recipe-grid'
                            <div className="recipe-grid mt-4">
                                {savedRecipes.map(recipe => (
                                    <RecipeCard key={`saved-${recipe.id}`} recipe={recipe} />
                                ))}
                            </div>
                        ) : (
                            <Alert variant="info" className="mt-4">
                                Bạn chưa lưu công thức nào. Hãy khám phá và lưu lại những món bạn yêu thích!
                            </Alert>
                        )}
                    </Tab>
                )}
            </Tabs>
        </div>
    );
};

export default CommunityRecipesPage;
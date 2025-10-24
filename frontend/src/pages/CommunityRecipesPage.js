// src/pages/CommunityRecipesPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import AuthContext from '../context/AuthContext'; // Import AuthContext
import '../pages/HomePage.css'; // Tái sử dụng CSS

// Component con để hiển thị một card công thức (tái sử dụng)
const RecipeCard = ({ recipe }) => (
    <Link to={`/community-recipes/${recipe.id}`} className="course-card-link">
        <div className="course-card">
            <img
                src={recipe.image_url || '/images/banner4.jpg'}
                alt={recipe.title}
                className="course-card-image"
            />
            <div className="course-card-body">
                <h5>{recipe.title}</h5>
                <p className="text-muted small">Tác giả: <strong>{recipe.author_name}</strong></p>
                <p className="small">{recipe.description}</p>
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
        <div className="section">
            <h1 className="section-title">Công thức từ Cộng đồng</h1>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                id="community-recipes-tabs"
                className="mb-4"
                justify
            >
                <Tab eventKey="all" title={`Tất cả công thức (${allRecipes.length})`}>
                    {allRecipes.length > 0 ? (
                        <div className="courses-grid mt-4">
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
                            <div className="courses-grid mt-4">
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
// src/pages/CommunityRecipeDetailPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert, Card, Row, Col, ListGroup, Button } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import ReactionToolbar from '../components/ReactionToolbar';
import RecipeCommentSection from '../components/RecipeCommentSection';
import './CommunityRecipeDetailPage.css';
import '../pages/HomePage.css'; // Import để tái sử dụng style cho card gợi ý

// Helper function để chuyển đổi JSON string từ DB sang mảng objects
const deserializeData = (data) => {
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
};

const CommunityRecipeDetailPage = () => {
    const { id } = useParams();
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [similarRecipes, setSimilarRecipes] = useState([]);

    // Dùng useCallback để hàm không bị tạo lại mỗi lần component re-render
    const fetchRecipeDetails = useCallback(async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            };
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // Gọi API để lấy dữ liệu công thức và các món tương tự cùng lúc
            const [recipeRes, similarRes] = await Promise.all([
                axios.get(`/api/user-recipes/public/${id}`, config),
                axios.get(`/api/user-recipes/public/${id}/similar`)
            ]);

            setRecipe(recipeRes.data);
            setIsSaved(recipeRes.data.user_has_saved);
            setSimilarRecipes(similarRes.data);

        } catch (err) {
            setError('Không thể tải chi tiết công thức.');
        } finally {
            setLoading(false);
        }
    }, [id, token]); // Phụ thuộc vào id và token

    useEffect(() => {
        fetchRecipeDetails();
        // Cuộn lên đầu trang mỗi khi chuyển sang công thức mới
        window.scrollTo(0, 0);
    }, [fetchRecipeDetails]); // Phụ thuộc vào hàm fetch đã được tối ưu


    const handleReaction = async (reactionType) => {
        if (!user) {
            toast.info("Vui lòng đăng nhập để bày tỏ cảm xúc!");
            navigate('/login');
            return;
        }
        const originalRecipe = { ...recipe };
        setRecipe(prevRecipe => {
            const newUserReactions = new Set(prevRecipe.user_reactions || []);
            const newReactions = [...(prevRecipe.reactions || [])];
            let reactionIndex = newReactions.findIndex(r => r.reaction_type === reactionType);

            if (newUserReactions.has(reactionType)) {
                newUserReactions.delete(reactionType);
                if (reactionIndex !== -1) newReactions[reactionIndex].count = String(Math.max(0, Number(newReactions[reactionIndex].count) - 1));
            } else {
                newUserReactions.add(reactionType);
                if (reactionIndex !== -1) newReactions[reactionIndex].count = String(Number(newReactions[reactionIndex].count) + 1);
                else newReactions.push({ reaction_type: reactionType, count: "1" });
            }
            return { ...prevRecipe, user_reactions: Array.from(newUserReactions), reactions: newReactions };
        });
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/user-recipes/${id}/react`, { reactionType }, config);
        } catch (err) {
            toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
            setRecipe(originalRecipe);
        }
    };

    const handleSave = async () => {
        if (!user) {
            toast.info("Vui lòng đăng nhập để lưu món!");
            navigate('/login');
            return;
        }
        const originalSavedState = isSaved;
        setIsSaved(!isSaved);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`/api/user-recipes/${id}/save`, {}, config);
            toast.success(res.data.message);
        } catch (err) {
            setIsSaved(originalSavedState);
            toast.error("Thao tác thất bại, vui lòng thử lại.");
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: recipe.title,
            text: recipe.description || `Xem công thức nấu ăn "${recipe.title}" tại Bếp của Quân!`,
            url: window.location.href,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) { console.error("Lỗi khi chia sẻ:", err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Đã sao chép link công thức vào clipboard!");
        }
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;
    if (!recipe) return <Container><Alert variant="warning">Không tìm thấy công thức.</Alert></Container>;

    const ingredients = deserializeData(recipe.ingredients);
    const instructions = deserializeData(recipe.instructions);

    const getReactionToolbarProps = () => {
        const reactionCounts = {};
        if (Array.isArray(recipe.reactions)) {
            recipe.reactions.forEach(r => { reactionCounts[r.reaction_type] = parseInt(r.count, 10) || 0; });
        }
        const userReactions = Array.isArray(recipe.user_reactions) ? recipe.user_reactions : [];
        return { reactions: reactionCounts, userReactions: userReactions, onReact: handleReaction };
    };

    return (
        <div className="recipe-detail-container">
            <Container>
                <Link to="/community-recipes" className="text-decoration-none mb-4 d-inline-block">&larr; Quay lại danh sách</Link>
                <Row className="justify-content-center">
                    <Col lg={10}>
                        {/* Card nội dung chính */}
                        <Card className="recipe-card-main">
                            <Card.Img variant="top" src={recipe.image_url || '/images/banner4.jpg'} className="recipe-main-image" />
                            <div className="recipe-header">
                                <h1>{recipe.title}</h1>
                                <div className="recipe-author">
                                    <img src="/images/student-avatar.jpg" alt="author" className="author-avatar" />
                                    <span>Đăng bởi <strong>{recipe.author_name}</strong></span>
                                </div>
                                <p className="lead mt-3">{recipe.description}</p>
                            </div>
                            <Card.Body className="recipe-body">
                                <Row>
                                    <Col lg={4}>
                                        <h4 className="section-title"><i className="bi bi-list-stars"></i>Nguyên liệu</h4>
                                        <Card className="ingredients-card">
                                            <ListGroup variant="flush">
                                                {ingredients.map((item, index) => <ListGroup.Item key={index}>{item.text}</ListGroup.Item>)}
                                            </ListGroup>
                                        </Card>
                                    </Col>
                                    <Col lg={8}>
                                        <h4 className="section-title"><i className="bi bi-journal-text"></i>Các bước thực hiện</h4>
                                        {instructions.map((step, index) => (
                                            <div key={index} className="instruction-step">
                                                <div className="step-number">{index + 1}</div>
                                                <div className="step-content">
                                                    <p>{step.text}</p>
                                                    {step.imageUrl && (<img src={step.imageUrl} alt={`Ảnh bước ${index + 1}`} className="step-image" />)}
                                                </div>
                                            </div>
                                        ))}
                                    </Col>
                                </Row>
                            </Card.Body>
                            <Card.Footer className="recipe-footer-actions">
                                <ReactionToolbar {...getReactionToolbarProps()} />
                                <Button variant={isSaved ? "warning" : "outline-warning"} className="save-recipe-btn" onClick={handleSave}>
                                    <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'} me-2`}></i>
                                    {isSaved ? "Đã Lưu" : "Lưu Món"}
                                </Button>
                                <Button variant="link" className="share-btn" onClick={handleShare}>
                                    <i className="bi bi-share me-2"></i> Chia sẻ
                                </Button>
                            </Card.Footer>
                        </Card>

                        {/* Khối Profile Tác giả */}
                        <Card className="author-profile-card my-4">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col xs="auto">
                                        <img src="/images/student-avatar.jpg" alt={recipe.author_name} className="author-avatar-large" />
                                    </Col>
                                    <Col>
                                        <small className="text-muted">Tác giả</small>
                                        <h5 className="mb-1">{recipe.author_name}</h5>
                                        <p className="mb-2 small">Thành viên cộng đồng Bếp Của Quân.</p>
                                        {/* Lưu ý: Link này sẽ cần một trang Profile công khai để hoạt động */}
                                        <Link to={`/user/${recipe.user_id}`}>
                                            <Button variant="outline-primary" size="sm">Xem trang cá nhân</Button>
                                        </Link>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Component Bình luận */}
                        <RecipeCommentSection recipeId={id} />

                        {/* Khu vực Gợi ý Món ăn tương tự */}
                        {similarRecipes.length > 0 && (
                            <div className="similar-recipes-section mt-5">
                                <h3 className="section-title">Các món tương tự</h3>
                                <div className="courses-grid">
                                    {similarRecipes.map(similarRecipe => (
                                        <Link to={`/community-recipes/${similarRecipe.id}`} key={similarRecipe.id} className="course-card-link">
                                            <div className="course-card">
                                                <img
                                                    src={similarRecipe.image_url || '/images/banner4.jpg'}
                                                    alt={similarRecipe.title}
                                                    className="course-card-image"
                                                />
                                                <div className="course-card-body">
                                                    <h5>{similarRecipe.title}</h5>
                                                    <p className="text-muted small">Tác giả: <strong>{similarRecipe.author_name}</strong></p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default CommunityRecipeDetailPage;
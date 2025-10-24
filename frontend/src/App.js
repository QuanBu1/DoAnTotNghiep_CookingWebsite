// src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';

// Import các component layout
import CustomNavbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './routing/ProtectedRoute';
import Footer from './components/Footer';
import './App.css'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill/dist/quill.snow.css';

// Import các pages
import InstructorDashboard from './pages/InstructorDashboard';
import HomePage from './pages/HomePage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AddCoursePage from './pages/AddCoursePage';
import EditCoursePage from './pages/EditCoursePage';
import LessonPlayerPage from './pages/LessonPlayerPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import SearchResultsPage from './pages/SearchResultsPage';
import KitchenToolsPage from './pages/KitchenToolsPage'; 
import ToolDetailPage from './pages/ToolDetailPage';
import ToolCheckoutPage from './pages/ToolCheckoutPage';
import ToolOrderHistoryPage from './pages/ToolOrderHistoryPage';
import UserRecipePage from './pages/UserRecipePage';
import CommunityRecipesPage from './pages/CommunityRecipesPage';
import CommunityRecipeDetailPage from './pages/CommunityRecipeDetailPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PublicProfilePage from './pages/PublicProfilePage';

// Component định tuyến các trang (Không thay đổi)
const AppRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* --- Routes công khai --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/courses" element={<CourseListPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/courses/search" element={<SearchResultsPage />} />
                <Route path="/kitchen-tools" element={<KitchenToolsPage />} />
                <Route path="/kitchen-tools/:id" element={<ToolDetailPage />} />
                <Route path="/community-recipes" element={<CommunityRecipesPage />} />
                <Route path="/community-recipes/:id" element={<CommunityRecipeDetailPage />} />
                <Route path="/user/:userId" element={<PublicProfilePage />} />
                
                {/* --- Routes được bảo vệ --- */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/my-recipes" element={<ProtectedRoute><UserRecipePage /></ProtectedRoute>} />
                <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute><LessonPlayerPage /></ProtectedRoute>} />
                <Route path="/add-course" element={<ProtectedRoute roles={['instructor']}><AddCoursePage /></ProtectedRoute>} />
                <Route path="/courses/:id/edit" element={<ProtectedRoute roles={['instructor', 'admin']}><EditCoursePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/instructor-dashboard" element={<ProtectedRoute roles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
                <Route path="/checkout/:enrollmentId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/tool-checkout/:orderId" element={<ProtectedRoute><ToolCheckoutPage /></ProtectedRoute>} />
                <Route path="/orders/tools/history" element={<ProtectedRoute><ToolOrderHistoryPage /></ProtectedRoute>} />
            </Routes>
        </AnimatePresence>
    );
};

// --- CHỈNH SỬA: TÁCH COMPONENT MAINLAYOUT ĐỂ QUẢN LÝ GIAO DIỆN ---
// Component này sẽ quyết định khi nào hiển thị layout đầy đủ (có Sidebar, Footer)
// và khi nào hiển thị layout tối giản (cho trang đăng nhập/đăng ký).
const MainLayout = () => {
    const location = useLocation();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // CHỈNH SỬA: Xác định các đường dẫn của trang auth
    const authPaths = ['/login', '/register'];
    // CHỈNH SỬA: Biến này sẽ là `false` nếu đang ở trang auth, ngược lại là `true`
    const showFullLayout = !authPaths.includes(location.pathname);

    // CHỈNH SỬA: Hàm xác định className cho layout để điều chỉnh margin khi sidebar thu/mở
    const getLayoutClassName = () => {
        if (!showFullLayout) return 'app-layout'; // Layout cho trang auth, không có sidebar
        return `app-layout ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`;
    };

    return (
        <div className={getLayoutClassName()}>
            {/* CHỈNH SỬA: Chỉ hiển thị Sidebar nếu không phải trang auth */}
            {showFullLayout && (
                <Sidebar 
                    isExpanded={isSidebarExpanded} 
                    setExpanded={setIsSidebarExpanded}
                    isMobileOpen={isMobileSidebarOpen}
                    setMobileOpen={setIsMobileSidebarOpen}
                />
            )}
            <div className="main-content">
                {/* CHỈNH SỬA: Truyền prop `isFullLayout` xuống Navbar */}
                {/* Prop này sẽ báo cho Navbar biết cần hiển thị giao diện nào */}
                <CustomNavbar 
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    isFullLayout={showFullLayout} 
                />
                <main className="page-content">
                    <AppRoutes />
                </main>
                {/* CHỈNH SỬA: Chỉ hiển thị Footer nếu không phải trang auth */}
                {showFullLayout && <Footer />} 
            </div>
        </div>
    );
}

// --- CHỈNH SỬA: GỌN LẠI COMPONENT APP GỐC ---
function App() {
    return (
        <AuthProvider>
            <Router>
                <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
                {/* Component MainLayout sẽ quản lý toàn bộ giao diện */}
                <MainLayout />
            </Router>
        </AuthProvider>
    );
}

export default App;
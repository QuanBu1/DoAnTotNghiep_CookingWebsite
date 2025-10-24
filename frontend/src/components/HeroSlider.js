// src/components/HeroSlider.js
import React from 'react';
import Slider from 'react-slick';
import { Button } from 'react-bootstrap';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './HeroSlider.css';

const HeroSlider = () => {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        fade: true,
    };

    return (
        <div className="hero-slider-container">
            <Slider {...settings}>
                {/* Slide 1 */}
                <div className="hero-slide-item slide-bg-1">
                    <div className="hero-slide-content">
                        <h2>Bếp của Quân trên Youtube</h2>
                        <p>
                            Được nhắc tới ở mọi nơi, ở đâu có hội việc làm cho ngành CNTT và có những con người yêu thích lập trình ở đó.
                        </p>
                        <Button variant="outline-light" className="hero-subscribe-btn">ĐĂNG KÝ KÊNH</Button>
                    </div>
                    <div className="hero-slide-graphics">
                        {/* Bạn có thể thay bằng ảnh đồ họa của riêng mình */}
                        <img src="/images/hero-banner.jpg" alt="Youtube Banner" />
                    </div>
                </div>

                {/* Slide 2 */}
                <div className="hero-slide-item slide-bg-2">
                    <div className="hero-slide-content">
                        <h2>Khóa học Pro Mới Nhất</h2>
                        <p>
                            Khám phá các khóa học chuyên sâu được thiết kế để đưa kỹ năng của bạn lên một tầm cao mới.
                        </p>
                        <Button variant="outline-light" className="hero-subscribe-btn">KHÁM PHÁ NGAY</Button>
                    </div>
                    <div className="hero-slide-graphics">
                        <img src="/images/banner5.jpg" alt="New Courses" />
                    </div>
                </div>
                {/* Silder 3*/}
                <div className="hero-slide-item slide-bg-3">
                    <div className="hero-slide-content">
                        <h2>Khóa học Pro Mới Nhất</h2>
                        <p>
                            Khám phá các khóa học chuyên sâu được thiết kế để đưa kỹ năng của bạn lên một tầm cao mới.
                        </p>
                        <Button variant="outline-light" className="hero-subscribe-btn">KHÁM PHÁ NGAY</Button>
                    </div>
                    <div className="hero-slide-graphics">
                        <img src="/images/banner6.png" alt="New Courses" />
                    </div>
                </div>
            </Slider>
        </div>
    );
};

export default HeroSlider;
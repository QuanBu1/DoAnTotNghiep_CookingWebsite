import React from 'react';
import { Carousel } from 'react-bootstrap';

const CourseCarousel = () => {
    return (
        // Vỏ bọc ngoài cùng để căn giữa và tạo khoảng cách
        <div className="carousel-container">
            <Carousel className="custom-carousel">
                <Carousel.Item>
                    <picture>
                        {/* Cung cấp các phiên bản ảnh khác nhau cho các kích thước màn hình */}
                        <source media="(min-width: 1200px)" srcSet="/images/hero-banner1.jpg" />
                        <source media="(min-width: 800px)" srcSet="/images/hero-banner1.jpg" />
                        {/* <img
                            src="/images/hero-banner1.jpg"
                            className="d-block custom-carousel-img" // Sử dụng class CSS mới
                            alt="Khóa học Món Á"
                        /> */}
                    </picture>
                    <Carousel.Caption>
                        <h3>Khóa học Món Á</h3>
                        <p>Từ sushi đến kim chi, khám phá tinh hoa ẩm thực châu Á.</p>
                    </Carousel.Caption>
                </Carousel.Item>

                <Carousel.Item>
                    <picture>
                        <source media="(min-width: 1200px)" srcSet="/images/banner4.jpg" />
                        <source media="(min-width: 800px)" srcSet="/images/banner4.jpg" />
                        {/* <img
                            src="/images/banner4.jpg"
                            className="d-block custom-carousel-img" // Sử dụng class CSS mới
                            alt="Nghệ thuật làm bánh"
                        /> */}
                    </picture>
                    <Carousel.Caption>
                        <h3>Nghệ thuật làm bánh</h3>
                        <p>Học cách làm các loại bánh mỳ, bánh ngọt tuyệt hảo.</p>
                    </Carousel.Caption>
                </Carousel.Item>
            </Carousel>
        </div>
    );
};

export default CourseCarousel;


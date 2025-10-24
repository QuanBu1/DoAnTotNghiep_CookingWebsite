// src/components/CourseSlider.js
import React from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './CourseSlider.css'; // File CSS tùy chỉnh cho slider

const CourseSlider = ({ courses }) => {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        responsive: [
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                }
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                }
            }
        ]
    };

    return (
        <div className="course-slider-container">
            <Slider {...settings}>
                {courses.map((course) => (
                    <div key={course.id} className="course-slide-item">
                        <Link to={`/courses/${course.id}`} className="course-card-link">
                            <div className="course-card">
                                <img src={course.image_url} alt={course.title} className="course-card-image" />
                                <div className="course-card-body">
                                    <h5>{course.title}</h5>
                                    <p>Giảng viên: {course.instructor_name}</p>
                                    <div className="course-price">
                                        {course.price > 0 ? new Intl.NumberFormat('vi-VN').format(course.price) + ' VND' : 'Miễn phí'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default CourseSlider;
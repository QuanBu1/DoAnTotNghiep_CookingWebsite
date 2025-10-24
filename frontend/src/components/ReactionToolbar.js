// src/components/ReactionToolbar.js
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import './ReactionToolbar.css';

const ReactionToolbar = ({ reactions = {}, userReactions = [], onReact }) => {
    const [isPopoverVisible, setPopoverVisible] = useState(false);
    let popoverTimeout; // Biến để quản lý độ trễ khi ẩn pop-up

    const availableReactions = {
        like: '👍',
        heart: '❤️',
        haha: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😡',
    };

    const handleMouseEnter = () => {
        clearTimeout(popoverTimeout);
        setPopoverVisible(true);
    };

    const handleMouseLeave = () => {
        // Thêm một độ trễ nhỏ trước khi ẩn để người dùng có thể di chuột vào pop-up
        popoverTimeout = setTimeout(() => {
            setPopoverVisible(false);
        }, 300);
    };

    const handleReactionSelect = (reactionType) => {
        onReact(reactionType);
        setPopoverVisible(false);
    };

    // Xác định cảm xúc chính mà người dùng đã chọn (nếu có)
    const primaryUserReaction = userReactions.length > 0 ? userReactions[0] : null;

    return (
        <div className="fb-reaction-container" onMouseLeave={handleMouseLeave}>
            {/* Pop-up chứa các emoji */}
            {isPopoverVisible && (
                <div className="fb-reaction-popover" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {Object.entries(availableReactions).map(([type, emoji]) => (
                        <span key={type} className="popover-emoji" onClick={() => handleReactionSelect(type)}>
                            {emoji}
                        </span>
                    ))}
                </div>
            )}

            {/* Nút "Thích" chính */}
            <Button
                variant="link"
                className={`like-button ${primaryUserReaction ? 'reacted ' + primaryUserReaction : ''}`}
                onMouseEnter={handleMouseEnter}
                onClick={() => handleReactionSelect(primaryUserReaction ? primaryUserReaction : 'like')} // Hành động mặc định: bấm là "like"
            >
                {primaryUserReaction ? (
                    <>
                        <span className="reacted-emoji">{availableReactions[primaryUserReaction]}</span>
                        {/* Viết hoa chữ cái đầu */}
                        {primaryUserReaction.charAt(0).toUpperCase() + primaryUserReaction.slice(1)}
                    </>
                ) : (
                    <>
                        <i className="bi bi-hand-thumbs-up me-2"></i> Thích
                    </>
                )}
            </Button>
        </div>
    );
};

export default ReactionToolbar;
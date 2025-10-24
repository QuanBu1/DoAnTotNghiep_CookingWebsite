// src/components/SlideInPanel.js

import React from 'react';
import './SlideInPanel.css';

const SlideInPanel = ({ title, isOpen, onClose, children }) => {
    return (
        <>
            <div 
                className={`slide-in-panel-overlay ${isOpen ? 'show' : ''}`} 
                onClick={onClose}
            ></div>
            <div className={`slide-in-panel ${isOpen ? 'show' : ''}`}>
                <div className="panel-header">
                    <h4>{title}</h4>
                    <button onClick={onClose} className="panel-close-btn">&times;</button>
                </div>
                <div className="panel-body">
                    {children}
                </div>
            </div>
        </>
    );
};

export default SlideInPanel;
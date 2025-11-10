import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './ConfirmDeleteModal.css'; // <-- 1. IMPORT TỆP CSS MỚI

/**
 * Modal xác nhận xóa (Phiên bản đã làm đẹp)
 */
const ConfirmDeleteModal = ({ show, handleClose, handleConfirm, title, message }) => {
    return (
        <Modal 
            show={show} 
            onHide={handleClose} 
            centered
            dialogClassName="confirm-delete-modal" // <-- 2. ÁP DỤNG CLASS MỚI
        >
            <Modal.Header closeButton>
                <Modal.Title>{title || 'Xác nhận hành động'}</Modal.Title>
            </Modal.Header>
            
            {/* 3. THAY ĐỔI BODY ĐỂ ĐẸP HƠN */}
            <Modal.Body>
                <div className="warning-icon">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div className="warning-message">
                    {message || 'Bạn có chắc chắn muốn thực hiện hành động này?'}
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Hủy
                </Button>
                <Button variant="danger" onClick={handleConfirm}>
                    Xác nhận Xóa
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDeleteModal;
// src/components/QuantityModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Image } from 'react-bootstrap';
import './QuantityModal.css';

const QuantityModal = ({ show, handleClose, product, onSubmit }) => {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (show) {
            setQuantity(1); // Reset số lượng về 1 mỗi khi mở modal
        }
    }, [show]);

    const handleQuantityChange = (amount) => {
        setQuantity(prev => Math.max(1, prev + amount));
    };

    const handleSubmit = () => {
        onSubmit(quantity);
        handleClose();
    };

    if (!product) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Nhập số lượng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="quantity-modal-product">
                    <Image src={product.image_url} alt={product.name} />
                    <h6>{product.name}</h6>
                </div>

                <div className="text-center">
                    <Form.Label className="fw-bold">Bạn muốn mua bao nhiêu sản phẩm?</Form.Label>
                    <div className="quantity-control-wrapper mt-2">
                        <Button 
                            variant="outline-secondary" 
                            className="quantity-control-btn"
                            onClick={() => handleQuantityChange(-1)}
                        >
                            -
                        </Button>
                        <Form.Control 
                            type="number"
                            className="quantity-input"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                        />
                        <Button 
                            variant="outline-secondary" 
                            className="quantity-control-btn"
                            onClick={() => handleQuantityChange(1)}
                        >
                            +
                        </Button>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    Xác nhận
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default QuantityModal;
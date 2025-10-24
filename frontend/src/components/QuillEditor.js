// src/components/QuillEditor.js

import React, { useState, useEffect, forwardRef } from 'react';
import 'react-quill/dist/quill.snow.css'; 

// Cấu hình Modules cho Quill
const modules = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'], 
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],           
        ['link', 'image'],                                      
        ['clean']                                               
    ],
};

// Sử dụng forwardRef để đảm bảo component có thể hoạt động trơn tru
// trong trường hợp các thư viện bên ngoài cần tham chiếu DOM
const QuillEditor = forwardRef(({ value, onChange, placeholder }, ref) => {
    const [ReactQuill, setReactQuill] = useState(null); 
    const [isMounted, setIsMounted] = useState(false); 

    useEffect(() => {
        setIsMounted(true); 
        // Dynamic Import: Đảm bảo ReactQuill chỉ được tải và sử dụng trên client-side
        import('react-quill').then(module => {
            setReactQuill(() => module.default);
        });
    }, []);

    if (!ReactQuill || !isMounted) {
        // Hiển thị một placeholder trong khi đang tải
        return <div style={{ height: '250px', border: '1px solid #ddd', padding: '10px' }}>Đang tải trình soạn thảo...</div>;
    }
    
    // Render ReactQuill khi đã tải xong
    return (
        <ReactQuill
            ref={ref} 
            theme="snow" 
            value={value}
            onChange={onChange}
            modules={modules} 
            placeholder={placeholder}
            style={{ height: '200px', marginBottom: '50px' }} 
        />
    );
});

export default QuillEditor;
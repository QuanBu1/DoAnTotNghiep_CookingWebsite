// src/components/AdminPagination.js
import React from 'react';
import { Pagination } from 'react-bootstrap';

const AdminPagination = ({ currentPage, totalPages, onPageChange }) => {
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    const handlePageClick = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber);
        }
    };

    const renderPageItems = () => {
        const items = [];
        const maxPagesToShow = 5; // Số lượng trang tối đa hiển thị (ví dụ: 1 ... 4 5 6 ... 10)
        const halfMaxPages = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfMaxPages);
        let endPage = Math.min(totalPages, currentPage + halfMaxPages);

        // Adjust if we are near the beginning or end
        if (currentPage <= halfMaxPages) {
            endPage = Math.min(totalPages, maxPagesToShow);
        }
        if (currentPage + halfMaxPages >= totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }

        // Ellipsis at the beginning
        if (startPage > 1) {
            items.push(<Pagination.Item key={1} onClick={() => handlePageClick(1)}>{1}</Pagination.Item>);
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
            }
        }

        // Page numbers
        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => handlePageClick(number)}
                >
                    {number}
                </Pagination.Item>
            );
        }

        // Ellipsis at the end
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
            }
            items.push(<Pagination.Item key={totalPages} onClick={() => handlePageClick(totalPages)}>{totalPages}</Pagination.Item>);
        }

        return items;
    };

    if (totalPages <= 1) {
        return null; // Don't show pagination if there's only one page or less
    }

    return (
        <Pagination className="justify-content-center mt-4">
            <Pagination.Prev onClick={() => handlePageClick(currentPage - 1)} disabled={isFirstPage} />
            {renderPageItems()}
            <Pagination.Next onClick={() => handlePageClick(currentPage + 1)} disabled={isLastPage} />
        </Pagination>
    );
};

export default AdminPagination;
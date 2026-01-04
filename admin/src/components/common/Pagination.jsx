import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import Input from './Input';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const [inputPage, setInputPage] = useState(currentPage);

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === '' || /^\d+$/.test(value)) {
      setInputPage(value === '' ? '' : parseInt(value));
    }
  };

  const handleGoToPage = () => {
    if (inputPage === '' || isNaN(inputPage) || inputPage < 1) {
      setInputPage(currentPage); // Reset to current page if invalid
      return;
    }

    const pageToGo = Math.min(Math.max(1, parseInt(inputPage)), totalPages);
    if (pageToGo !== currentPage) {
      onPageChange(pageToGo);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        icon={ChevronLeft}
      >
        Trước
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Trang</span>
        <Input
          type="text"
          value={inputPage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleGoToPage}
          className="w-16 text-center text-sm py-1 px-2"
          size="sm"
        />
        <span className="text-sm text-gray-600">/ {totalPages}</span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGoToPage}
          disabled={inputPage === '' || isNaN(inputPage) || inputPage < 1 || inputPage > totalPages}
          className="text-xs px-2 py-1"
        >
          Tới
        </Button>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        icon={ChevronRight}
      >
        Sau
      </Button>
    </div>
  );
};

export default Pagination;

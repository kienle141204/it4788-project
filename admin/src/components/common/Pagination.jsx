import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}) => {
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
      <span className="text-sm text-gray-600 px-4">
        Trang {currentPage} / {totalPages}
      </span>
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
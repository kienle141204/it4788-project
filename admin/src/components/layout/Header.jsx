import React from 'react';

const Header = ({ title }) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="bg-white shadow-sm p-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          {title}
        </h1>
        <div className="text-sm text-gray-600">
          {currentDate}
        </div>
      </div>
    </header>
  );
};

export default Header;
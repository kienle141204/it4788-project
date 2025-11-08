import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title, user }) => {
  const { logout } = useAuth();
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
        <div className="flex items-center space-x-4">
          {user && (
            <div className="text-sm text-gray-600">
              Xin chào, <span className="font-medium">{user.full_name || user.email}</span>
            </div>
          )}
          <div className="text-sm text-gray-600">
            {currentDate}
          </div>
          {user && (
            <button 
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
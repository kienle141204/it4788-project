import React from 'react';
import { Users, Package, Utensils, BookOpen, Menu, X, Home, ShoppingCart, Box, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({
  isOpen,
  onToggle,
  user
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from the URL
  const currentPage = location.pathname.slice(1) || 'users';

  const menuItems = [
    { id: 'users', label: 'Người dùng', icon: Users, path: '/users' },
    { id: 'families', label: 'Gia đình', icon: Home, path: '/families' },
    { id: 'foods', label: 'Thực phẩm', icon: Package, path: '/foods' },
    { id: 'recipes', label: 'Công thức', icon: BookOpen, path: '/recipes' },
    { id: 'shopping-lists', label: 'Danh sách mua sắm', icon: ShoppingCart, path: '/shopping-lists' },
    { id: 'refrigerators', label: 'Tủ lạnh', icon: Box, path: '/refrigerators' },
    { id: 'statistics', label: 'Thống kê', icon: BarChart3, path: '/statistics' },
  ];


  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-emerald-800 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-emerald-700">
        {isOpen && <h2 className="text-xl font-bold">Đi Chợ Admin</h2>}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-emerald-700 rounded transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${currentPage === item.id ? 'bg-emerald-600' : 'hover:bg-emerald-700'
              }`}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-medium">{user?.full_name || user?.email || 'Admin User'}</p>
              <p className="text-xs text-emerald-200">{user?.email || 'admin@dicho.com'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

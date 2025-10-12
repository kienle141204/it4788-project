import React from 'react';
import { Users, Package, Utensils, BookOpen, Menu, X } from 'lucide-react';

const Sidebar = ({ 
  currentPage, 
  onPageChange, 
  isOpen, 
  onToggle 
}) => {
  const menuItems = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'foods', label: 'Thực phẩm', icon: Package },
    { id: 'dishes', label: 'Món ăn', icon: Utensils },
    { id: 'recipes', label: 'Công thức', icon: BookOpen },
  ];

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
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
              currentPage === item.id ? 'bg-emerald-600' : 'hover:bg-emerald-700'
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
              A
            </div>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-xs text-emerald-200">admin@dicho.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
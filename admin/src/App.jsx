import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import UsersPage from './pages/UsersPage';
import FoodsPage from './pages/FoodsPage';
import DishesPage from './pages/DishesPage';
import RecipesPage from './pages/RecipesPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const pageConfig = {
    users: { component: UsersPage, title: 'Người dùng' },
    foods: { component: FoodsPage, title: 'Thực phẩm' },
    dishes: { component: DishesPage, title: 'Món ăn' },
    recipes: { component: RecipesPage, title: 'Công thức' },
  };

  const CurrentPageComponent = pageConfig[currentPage]?.component || UsersPage;
  const pageTitle = pageConfig[currentPage]?.title || 'Người dùng';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 overflow-auto">
        <Header title={pageTitle} />
        
        <div className="p-6">
          <CurrentPageComponent />
        </div>
      </main>
    </div>
  );
};

export default App;
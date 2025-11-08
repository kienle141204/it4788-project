import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import FoodsPage from './pages/FoodsPage';
import DishesPage from './pages/DishesPage';
import RecipesPage from './pages/RecipesPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { useAuth } from './contexts/AuthContext';

// Main layout component for authenticated users
const MainLayout = () => {
  const [currentPage, setCurrentPage] = React.useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user } = useAuth();

  const pageConfig = {
    users: { component: UsersPage, title: 'Người dùng' },
    foods: { component: FoodsPage, title: 'Thực phẩm' },
    dishes: { component: DishesPage, title: 'Món ăn' },
    recipes: { component: RecipesPage, title: 'Công thức' },
  };

  // Auto set current page based on route if needed
  React.useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    if (pageConfig[path]) {
      setCurrentPage(path);
    }
  }, []);

  const CurrentPageComponent = pageConfig[currentPage]?.component || UsersPage;
  const pageTitle = pageConfig[currentPage]?.title || 'Người dùng';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
      />

      <main className="flex-1 overflow-auto">
        <Header title={pageTitle} user={user} />

        <div className="p-6">
          <CurrentPageComponent />
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/foods" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dishes" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/recipes" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          />
          {/* Redirect any other route to main page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
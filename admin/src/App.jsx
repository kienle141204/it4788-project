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

// Individual layout pages that match each route
const UsersLayout = () => <LayoutComponent page="users" />;
const FoodsLayout = () => <LayoutComponent page="foods" />;
const DishesLayout = () => <LayoutComponent page="dishes" />;
const RecipesLayout = () => <LayoutComponent page="recipes" />;

// Main layout component with page prop
const LayoutComponent = ({ page }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user } = useAuth();

  const pageConfig = {
    users: { component: UsersPage, title: 'Người dùng' },
    foods: { component: FoodsPage, title: 'Thực phẩm' },
    dishes: { component: DishesPage, title: 'Món ăn' },
    recipes: { component: RecipesPage, title: 'Công thức' },
  };

  const CurrentPageComponent = pageConfig[page]?.component || UsersPage;
  const pageTitle = pageConfig[page]?.title || 'Người dùng';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
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
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UsersLayout />
              </PrivateRoute>
            }
          />
          <Route
            path="/foods"
            element={
              <PrivateRoute>
                <FoodsLayout />
              </PrivateRoute>
            }
          />
          <Route
            path="/dishes"
            element={
              <PrivateRoute>
                <DishesLayout />
              </PrivateRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <PrivateRoute>
                <RecipesLayout />
              </PrivateRoute>
            }
          />
          {/* Redirect any other route to users page */}
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
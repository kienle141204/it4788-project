import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleEmailChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      email: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      password: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(credentials.email, credentials.password);
      
      if (result.success) {
        // Redirect to dashboard or users page after successful login
        window.location.href = '/users';
      } else {
        setError(result.message || 'An error occurred during login');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập hệ thống Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vui lòng đăng nhập với tài khoản admin
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <Input
                label="Email"
                type="email"
                value={credentials.email}
                onChange={handleEmailChange}
                required
                placeholder="Nhập email của bạn"
              />
            </div>
            
            <div>
              <Input
                label="Mật khẩu"
                type="password"
                value={credentials.password}
                onChange={handlePasswordChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
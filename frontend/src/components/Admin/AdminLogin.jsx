import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, LogIn, Shield, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import bg from "../../assets/bg.png";
const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try server-side validation first
      const response = await axios.post('http://localhost:5000/api/admin/login', credentials);
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token || 'admin-authenticated');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('userName', 'Administrator');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      // Fallback to client-side validation if server endpoint doesn't exist
      console.log('Server login failed, using client validation');
      
      // Single admin credentials (in production, use environment variables)
      const ADMIN_USERNAME = 'admin';
      const ADMIN_PASSWORD = 'admin123';
      
      if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
        localStorage.setItem('adminToken', 'admin-authenticated');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('userName', 'Administrator');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
  className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `linear-gradient(rgba(100,100,100,0.1), rgba(255,255,255,0.2)), url(${bg})`,
  }}
>
  <div className="max-w-md w-full">
    {/* Logo and Brand */}
    <div className="text-center mb-8">
  
      <h1 className="text-3xl font-bold text-white">OceanFresh</h1>
      <p className="text-blue-200 mt-2">Administrator Portal</p>
    </div>

    {/* Login Card */}
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <Shield className="w-6 h-6 text-blue-900" />
        <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default credentials: admin / OceanFresh@2024</p>
            <p className="mt-1 text-xs">For demonstration purposes only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
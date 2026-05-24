// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Fish,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Boxes,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Shield,
  X
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSuppliers: 0,
    totalWholesalers: 0,
    totalDistributors: 0,
    totalInventoryItems: 0,
    totalInventoryValue: 0,
    freshItems: 0,
    warningItems: 0,
    spoiledItems: 0
  });

  const userTypes = [
    { value: 'all', label: 'All Users', color: 'blue' },
    { value: 'supplier', label: 'Suppliers', color: 'green' },
    { value: 'wholesaler', label: 'Wholesalers', color: 'purple' },
    { value: 'distributor', label: 'Distributors', color: 'orange' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'inventory', name: 'All Inventory', icon: Package },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ];

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin');
    }
  }, [navigate]);

  // Fetch all users and their inventory
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all users from database (since your endpoints don't exist, we'll fetch from the main users table)
      const usersRes = await axios.get('http://localhost:5000/api/admin/users');
      
      // Also fetch inventory
      const inventoryRes = await axios.get('http://localhost:5000/api/admin/inventory/all');
      
      // If admin endpoints don't exist, we need to create them or fetch differently
      // For now, let's fetch from existing endpoints
      const allUsers = usersRes.data.users || [];
      const allInventory = inventoryRes.data.inventory || [];
      
      setUsers(allUsers);
      setInventory(allInventory);
      
      // Calculate stats
      calculateStats(allUsers, allInventory);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Try fallback method - fetch from users table directly
      try {
        const fallbackRes = await axios.get('http://localhost:5000/api/admin/users-fallback');
        if (fallbackRes.data.success) {
          setUsers(fallbackRes.data.users);
          setInventory(fallbackRes.data.inventory || []);
          calculateStats(fallbackRes.data.users, fallbackRes.data.inventory || []);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Use mock data for development
        useMockData();
      }
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
    // Mock data for development
    const mockUsers = [
      { id: 1, fullName: "ABC Fisheries", email: "abc@fisheries.com", phoneNumber: "9876543210", role: "supplier", is_verified: 1, created_at: "2024-01-15" },
      { id: 2, fullName: "XYZ Seafood", email: "xyz@seafood.com", phoneNumber: "8765432109", role: "supplier", is_verified: 1, created_at: "2024-01-20" },
      { id: 3, fullName: "Fresh Catch Ltd", email: "fresh@catch.com", phoneNumber: "7654321098", role: "wholesaler", is_verified: 1, created_at: "2024-02-01" },
      { id: 4, fullName: "Ocean Distributors", email: "ocean@dist.com", phoneNumber: "6543210987", role: "distributor", is_verified: 1, created_at: "2024-02-10" }
    ];
    
    setUsers(mockUsers);
    setInventory([]);
    calculateStats(mockUsers, []);
  };

  const calculateStats = (users, inventory) => {
    const totalInventoryValue = inventory.reduce((sum, item) => 
      sum + (parseFloat(item.quantity) * parseFloat(item.price) || 0), 0
    );

    const freshItems = inventory.filter(item => 
      calculateQualityStatus(item) === 'Fresh'
    ).length;

    const warningItems = inventory.filter(item => 
      calculateQualityStatus(item) === 'Warning'
    ).length;

    const spoiledItems = inventory.filter(item => 
      calculateQualityStatus(item) === 'Spoiled'
    ).length;

    setStats({
      totalUsers: users.length,
      totalSuppliers: users.filter(u => u.role === 'supplier').length,
      totalWholesalers: users.filter(u => u.role === 'wholesaler').length,
      totalDistributors: users.filter(u => u.role === 'distributor').length,
      totalInventoryItems: inventory.length,
      totalInventoryValue,
      freshItems,
      warningItems,
      spoiledItems
    });
  };

  const calculateQualityStatus = (item) => {
    if (!item) return 'Unknown';
    const { temperature, humidity, ammonia } = item;
    
    if (temperature > 5 || temperature < -25 || ammonia > 3 || humidity > 90 || humidity < 70) {
      return 'Spoiled';
    } else if (temperature > 3 || temperature < -20 || ammonia > 2 || humidity > 85 || humidity < 75) {
      return 'Warning';
    } else {
      return 'Fresh';
    }
  };

  const getQualityStatusColor = (status) => {
    switch (status) {
      case 'Fresh': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Warning': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Spoiled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    navigate('/admin');
  };

  const getUserIcon = (role) => {
    switch (role) {
      case 'supplier': return <Truck className="w-5 h-5 text-green-600" />;
      case 'wholesaler': return <ShoppingCart className="w-5 h-5 text-purple-600" />;
      case 'distributor': return <Package className="w-5 h-5 text-orange-600" />;
      default: return <Users className="w-5 h-5 text-blue-600" />;
    }
  };

  const getUserTypeColor = (role) => {
    switch (role) {
      case 'supplier': return 'bg-green-100 text-green-800';
      case 'wholesaler': return 'bg-purple-100 text-purple-800';
      case 'distributor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedUserType === 'all' || user.role === selectedUserType;
    
    return matchesSearch && matchesType;
  });

  const getUserInventory = (userId) => {
    return inventory.filter(item => item.user_id === parseInt(userId));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-900 rounded-lg">
              <Fish className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900">OceanFresh</h1>
              <p className="text-xs text-blue-700">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-3 flex-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 group rounded-lg mb-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500'
                }`} />
                <span className={`font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-700'}`}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {tabs.find(t => t.id === activeTab)?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, Administrator
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchAllData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-900" />
                  <span className="font-medium text-gray-700">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Users</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-500 opacity-20" />
                      </div>
                      <div className="mt-4 flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">S: {stats.totalSuppliers}</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">W: {stats.totalWholesalers}</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">D: {stats.totalDistributors}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Inventory Items</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.totalInventoryItems}</p>
                        </div>
                        <Package className="w-12 h-12 text-green-500 opacity-20" />
                      </div>
                      <div className="mt-4 text-xs text-gray-600">
                        Across all users
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Inventory Value</p>
                          <p className="text-3xl font-bold text-gray-800">
                            ${stats.totalInventoryValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </p>
                        </div>
                        <DollarSign className="w-12 h-12 text-yellow-500 opacity-20" />
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Total market value</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Quality Overview</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-green-600 font-bold">{stats.freshItems}</span>
                            <span className="text-yellow-600 font-bold">{stats.warningItems}</span>
                            <span className="text-red-600 font-bold">{stats.spoiledItems}</span>
                          </div>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
                      </div>
                      <div className="mt-4 flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Fresh</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Warning</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Spoiled</span>
                      </div>
                    </div>
                  </div>

                  {/* User Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">User Distribution</h3>
                      <div className="space-y-4">
                        {userTypes.filter(t => t.value !== 'all').map(type => {
                          const count = type.value === 'supplier' ? stats.totalSuppliers :
                                       type.value === 'wholesaler' ? stats.totalWholesalers :
                                       stats.totalDistributors;
                          const percentage = stats.totalUsers ? (count / stats.totalUsers * 100).toFixed(1) : 0;
                          
                          return (
                            <div key={type.value}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{type.label}</span>
                                <span className="text-gray-600">{count} users ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-${type.color}-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {inventory.slice(0, 5).map((item, index) => {
                          const user = users.find(u => u.id === item.user_id);
                          return (
                            <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                              <Clock className="w-5 h-5 text-gray-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {item.seafoodType} added by {user?.fullName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${getQualityStatusColor(calculateQualityStatus(item))}`}>
                                {calculateQualityStatus(item)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <select
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {userTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Users Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                      >
                        <div className={`p-4 ${getUserTypeColor(user.role)}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getUserIcon(user.role)}
                              <span className="font-medium">
                                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                              </span>
                            </div>
                            <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 text-lg mb-1">{user.fullName || 'No name'}</h3>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phoneNumber && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Inventory Items</span>
                              <span className="font-bold text-blue-600">
                                {getUserInventory(user.id).length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-600">Joined</span>
                              <span className="text-sm text-gray-800">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-600">Status</span>
                              <span className={`text-sm ${user.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                {user.is_verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No users found matching your criteria</p>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Batch ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Seafood</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expiry</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {inventory.map((item) => {
                          const user = users.find(u => u.id === item.user_id);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-800">{user?.fullName || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{user?.email || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeColor(user?.role)}`}>
                                  {user?.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-mono">{item.batchId || 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800">{item.seafoodType}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p>{item.quantity} {item.unit}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-green-700">${parseFloat(item.price || 0).toFixed(2)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className={`text-sm ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${getQualityStatusColor(calculateQualityStatus(item))}`}>
                                  {calculateQualityStatus(item)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {inventory.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No inventory items found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory by User Type</h3>
                    <div className="space-y-4">
                      {userTypes.filter(t => t.value !== 'all').map(type => {
                        const userTypeItems = inventory.filter(item => {
                          const user = users.find(u => u.id === item.user_id);
                          return user?.role === type.value;
                        });
                        const totalValue = userTypeItems.reduce((sum, item) => 
                          sum + (parseFloat(item.quantity) * parseFloat(item.price) || 0), 0
                        );

                        return (
                          <div key={type.value} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">{type.label}</span>
                              <span className="text-sm text-gray-600">{userTypeItems.length} items</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Total Value:</span>
                              <span className="font-bold text-green-700">${totalValue.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Quality Distribution</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-800">Fresh Items</span>
                          <span className="text-2xl font-bold text-green-800">{stats.freshItems}</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${stats.totalInventoryItems ? (stats.freshItems / stats.totalInventoryItems * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-yellow-800">Warning Items</span>
                          <span className="text-2xl font-bold text-yellow-800">{stats.warningItems}</span>
                        </div>
                        <div className="w-full bg-yellow-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${stats.totalInventoryItems ? (stats.warningItems / stats.totalInventoryItems * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-red-800">Spoiled Items</span>
                          <span className="text-2xl font-bold text-red-800">{stats.spoiledItems}</span>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${stats.totalInventoryItems ? (stats.spoiledItems / stats.totalInventoryItems * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* User Info */}
              <div className={`p-4 rounded-lg ${getUserTypeColor(selectedUser.role)} mb-6`}>
                <div className="flex items-center gap-3 mb-3">
                  {getUserIcon(selectedUser.role)}
                  <span className="font-bold text-lg">
                    {selectedUser.role ? selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1) : 'User'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedUser.fullName || 'No name'}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="font-medium">{selectedUser.phoneNumber || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined</span>
                  </div>
                  <p className="font-medium">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <p className={`font-medium ${selectedUser.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedUser.is_verified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              {/* User's Inventory */}
              <h4 className="font-bold text-gray-800 mb-4">User's Inventory ({getUserInventory(selectedUser.id).length} items)</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Batch ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Seafood</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Expiry</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getUserInventory(selectedUser.id).map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm font-mono">{item.batchId || 'N/A'}</td>
                        <td className="px-4 py-2 font-medium">{item.seafoodType}</td>
                        <td className="px-4 py-2">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-2">${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getQualityStatusColor(calculateQualityStatus(item))}`}>
                            {calculateQualityStatus(item)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getUserInventory(selectedUser.id).length === 0 && (
                  <p className="text-center text-gray-500 py-4">No inventory items for this user</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
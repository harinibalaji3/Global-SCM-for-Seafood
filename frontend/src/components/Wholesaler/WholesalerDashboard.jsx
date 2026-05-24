import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Cog,
  Truck,
  BrainCircuit,
  Bell,
  Clock,
  Package,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Fish,
  TrendingUp,
  Users,
  FileText,
  LogOut,Calendar,AlertCircle 
} from "lucide-react";

// ProfileDropdown Component
const ProfileDropdown = ({ userData, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Get first letter of name or email
  const getInitial = () => {
    if (userData.name && userData.name !== 'Not provided') {
      return userData.name.charAt(0).toUpperCase();
    } else if (userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleEditClick = (field) => {
    setEditingField(field);
    setEditValue(userData[field] === 'Not provided' ? '' : userData[field] || '');
  };

  const handleSave = async (field) => {
    try {
      console.log(`Saving ${field}: ${editValue}`);
      
      // Get user ID
      const getUserDataFromStorage = () => {
        try {
          let userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
          if (!userData) return null;
          return JSON.parse(userData);
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          return null;
        }
      };

      const storedUser = getUserDataFromStorage();
      const API_BASE_URL = 'http://localhost:5000/api';
      
      if (storedUser?.id) {
        // Prepare data based on what's being updated
        const updateData = {
          name: field === 'name' ? editValue : userData.name,
          phone: field === 'phone' ? editValue : userData.phone,
          businessName: field === 'businessName' ? editValue : userData.businessName
        };
        
        // Call API to update user data
        const response = await axios.put(`${API_BASE_URL}/users/${storedUser.id}`, updateData);

        if (response.data && response.data.success) {
          // Update local storage
          const updatedUser = {
            ...storedUser,
            fullName: updateData.name,
            name: updateData.name,
            phoneNumber: updateData.phone,
            phone: updateData.phone,
            businessname: updateData.businessName,
            businessName: updateData.businessName
          };
          
          localStorage.setItem('userData', JSON.stringify(updatedUser));
          
          // Update UI state
          window.location.reload();
          
          alert(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
        } else {
          alert(`❌ Failed to update ${field}`);
        }
      } else {
        alert('User not found. Please login again.');
      }
      
      setEditingField(null);
      setEditValue('');
      
    } catch (error) {
      console.error('❌ Error saving user data:', error);
      alert(`Error saving ${field}: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getPlaceholder = (field) => {
    switch(field) {
      case 'phone': return '+91 XXXXXXXXXX';
      case 'businessName': return 'Your Business Name';
      case 'name': return 'Your Full Name';
      case 'email': return 'email@example.com';
      default: return 'Enter value';
    }
  };

  const getLabel = (field) => {
    switch(field) {
      case 'phone': return 'Mobile Number';
      case 'businessName': return 'Business Name';
      case 'name': return 'Username';
      case 'email': return 'Email Address';
      default: return field;
    }
  };

  const renderField = (field) => {
    const isEditing = editingField === field;
    const label = getLabel(field);
    const value = userData[field];
    const isEmpty = !value || value === 'Not provided';
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 text-sm font-medium">{label}</span>
          {!isEditing && (
            <button
              onClick={() => handleEditClick(field)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              {isEmpty ? 'Add' : 'Edit'}
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <input
              type={field === 'email' ? 'email' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={getPlaceholder(field)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(field)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`text-gray-800 text-sm ${isEmpty ? 'text-gray-500 italic' : ''}`}>
            {isEmpty ? getPlaceholder(field) : value}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-medium text-sm lg:text-base hover:opacity-90 transition-opacity relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
      >
        {getInitial()}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-5 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold text-base">
                    {getInitial()}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">User profile details</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Username */}
              {renderField('name')}
              
              {/* Phone Number */}
              {renderField('phone')}
              
              {/* Email Address */}
              {renderField('email')}
              
              {/* Business Name */}
              {renderField('businessName')}
            </div>

            {/* Footer with Logout */}
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Monthly Revenue Chart Component
const MonthlyRevenueChart = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [180, 220, 195, 245, 280, 320, 350, 310, 275, 290, 330, 350]; // in thousands
  const maxRevenue = Math.max(...revenueData);
  
  // Calculate chart dimensions
  const chartHeight = 150;
  const barWidth = 10;
  const spacing = 4;

  return (
    <div className="relative w-full h-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
        <span>$400K</span>
        <span>$300K</span>
        <span>$200K</span>
        <span>$100K</span>
        <span>$0</span>
      </div>

      {/* Chart area with padding for y-axis */}
      <div className="absolute left-9 right-0 top-0 bottom-0">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {revenueData.map((value, index) => {
            const barHeight = (value / 400) * chartHeight; // 400K is max scale
            return (
              <div key={index} className="flex flex-col items-center" style={{ width: `${barWidth}px` }}>
                <div className="relative group">
                  <div 
                    className="w-4 lg:w-3 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 hover:shadow-lg"
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="font-semibold">${value}K</div>
                      <div className="text-gray-300">{months[index]} 2024</div>
                    </div>
                  </div>
                </div>
                {/* X-axis labels */}
                <span className="text-xs text-gray-600 mt-2">{months[index]}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};


// Order Fulfillment Data
const orderFulfillmentData = [
  { status: 'Completed', orders: 1280, percentage: 85 },
  { status: 'In Progress', orders: 185, percentage: 12 },
  { status: 'Pending', orders: 85, percentage: 5 },
];

const getStatusInfo = (status) => {
  switch(status) {
    case 'Completed':
      return { 
        icon: <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />, 
        color: '#10B981' 
      };
    case 'In Progress':
      return { 
        icon: <Clock className="w-4 h-4 lg:w-5 lg:h-5" />, 
        color: '#3B82F6' 
      };
    case 'Pending':
      return { 
        icon: <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5" />, 
        color: '#F59E0B' 
      };
 
    default:
      return { 
        icon: <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5" />, 
        color: '#6B7280' 
      };
  }
};

const formatCompactNumber = (number) => {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
};


const WholesalerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [iotData, setIotData] = useState(null);
  const [shipmentStatus, setShipmentStatus] = useState('No Active Shipment');
  const [userData, setUserData] = useState({
    name: 'Not provided',
    email: 'Not provided',
    phone: 'Not provided',
    businessName: 'Not provided'
  });

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // KPI Data with updated colors for white theme
  const kpiData = {
    totalRevenue: {
      value: 248500,
      growth: 12,
      label: 'Total Revenue',
      icon: DollarSign,
      color: 'bg-blue-900',
      textColor: 'text-white'
    },
    seafoodProcessed: {
      value: 18200,
      unit: 'kg',
      label: 'Seafood Processed',
      icon: Fish,
      color: 'bg-blue-900',
      textColor: 'text-white'
    },
    pendingOrders: {
      value: 37,
      urgent: 5,
      label: 'Pending Orders',
      icon: Package,
      color: 'bg-blue-900',
      textColor: 'text-white'
    }
  };

  const mockDashboardData = {
    newRequests: [
      { id: 1, wholesaler: "SeaFood Distributors Inc.", product: "Fresh Tuna", quantity: "500kg", status: "pending" },
      { id: 2, wholesaler: "Oceanic Markets", product: "Atlantic Salmon", quantity: "300kg", status: "pending" },
      { id: 3, wholesaler: "Global Seafood Co.", product: "Shrimp (Large)", quantity: "200kg", status: "pending" }
    ],
    processingStatus: [
      { stage: "Cleaning & Gutting", progress: 85, items: 1200 },
      { stage: "Filleting", progress: 60, items: 800 },
      { stage: "Packaging", progress: 30, items: 400 },
      { stage: "Quality Check", progress: 15, items: 200 }
    ],
    inventoryLevels: [
      { product: "Fresh Tuna", current: 1500, unit: "kg", threshold: 200 },
      { product: "Atlantic Salmon", current: 800, unit: "kg", threshold: 150 },
      { product: "Shrimp (Large)", current: 600, unit: "kg", threshold: 100 },
      { product: "Crabs", current: 300, unit: "pieces", threshold: 50 },
      { product: "Lobsters", current: 150, unit: "pieces", threshold: 30 }
    ]
  };

  const mockIotData = {
    temperature: 0,
    humidity: 0,
    ammonia: 0,
    status: 'No Active Shipment'
  };

 const sidebarItems = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, path: "/wholesaler/dashboard" },
  { id: "inventory", name: "Inventory", icon: Boxes, path: "/wholesaler/inventory" },
  { id: "Wholesaler catalog", name: "Wholesaler catalog", icon: ShoppingCart, path: "/wholesaler/catalog" },
  { id: "orders", name: "Order", icon: ShoppingCart, path: "/wholesaler/orders" },
  { id: "ai", name: "AI Module", icon: BrainCircuit, path: "/wholesaler/ai" },
];

  useEffect(() => {
    setIotData(mockIotData);
    
    // Load user data from storage
    const loadUserData = () => {
      try {
        const storedData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData({
            name: parsedData.name || parsedData.fullName || 'Not provided',
            email: parsedData.email || 'Not provided',
            phone: parsedData.phone || parsedData.phoneNumber || 'Not provided',
            businessName: parsedData.businessName || parsedData.businessname || 'Not provided'
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    const currentItem = sidebarItems.find(item => location.pathname === item.path);
    if (currentItem) {
      setActiveModule(currentItem.id);
    }
  }, [location]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const simulateShipmentStart = () => {
    const simulatedData = {
      temperature: 4.2,
      humidity: 65,
      ammonia: 2.1,
      status: 'In Transit - Monitoring Active'
    };
    setIotData(simulatedData);
    setShipmentStatus('In Transit - Monitoring Active');
  };

  const handleLogout = () => {
    // Clear user data from storage
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Navigate to landing page
    navigate('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
  <div className="flex h-screen bg-white">
  {/* Enhanced Sidebar with Navy Blue Cards */}
  <div className="w-64 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col">
    {/* Header */}
    <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-900 rounded-lg">
                  <Fish className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-blue-900">OceanFresh</h1>
                  <p className="text-xs text-blue-700">Wholesaler </p>
                </div>
              </div>
            </div>
    
    {/* Navigation Items */}
    <div className="flex-1 overflow-y-auto">
      <nav className="mt-6 px-3">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 group rounded-lg mb-1 ${
                activeModule === item.id
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-blue-900 hover:bg-blue-50 hover:text-blue-900'
              }`}
            >
              <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeModule === item.id ? 'text-white' : 'text-blue-700'
              }`} />
              <span className={`font-medium ${activeModule === item.id ? 'text-white' : 'text-blue-900'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>

    {/* Logout Button at the bottom */}
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
      {/* Main Content with White Background */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Wholesaler Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">Real-time overview of your seafood operations</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{userData.name}</p>
                  <p className="text-xs text-gray-600">Wholesaler</p>
                </div>
                <ProfileDropdown userData={userData} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 bg-gray-50 min-h-full">
          {/* ROW 1: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(kpiData).map(([key, data]) => {
              const IconComponent = data.icon;
              return (
                <div key={key} className={`${data.color} rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/90 text-sm font-medium">{data.label}</p>
                      <p className="text-3xl font-bold mt-2">
                        {key === 'totalRevenue' ? formatCurrency(data.value) : data.value}
                        {key === 'seafoodProcessed' && <span className="text-lg ml-1">{data.unit}</span>}
                      </p>
                      {key === 'totalRevenue' && (
                        <p className="text-green-200 text-sm mt-1 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +{data.growth}% growth
                        </p>
                      )}
                      {key === 'pendingOrders' && (
                        <p className="text-orange-200 text-sm mt-1">
                          Urgent: {data.urgent} orders
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <IconComponent className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROW 2: Analytics Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Order Fulfillment Rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-800">Order Fulfillment</h3>
                <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Dec 2024</span>
                </div>
              </div>
              
              {/* Total Orders Summary */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm font-medium">Total Orders</span>
                  <span className="text-blue-700 font-bold text-lg">1.4K</span>
                </div>
              </div>
              
              <div className="space-y-4 lg:space-y-5">
                {orderFulfillmentData.map((item, index) => {
                  const statusInfo = getStatusInfo(item.status);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div style={{ color: statusInfo.color }} className="flex-shrink-0">
                            {statusInfo.icon}
                          </div>
                          <span className="text-gray-800 text-sm lg:text-base font-medium">{item.status}</span>
                        </div>
                        <span className="text-gray-800 font-semibold text-base lg:text-lg ml-2 flex-shrink-0">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="text-xs lg:text-sm text-gray-500 pl-7">
                        {formatCompactNumber(item.orders)} orders
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 lg:h-2.5">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: statusInfo.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800">Monthly Revenue</h3>
                  <p className="text-gray-500 text-xs lg:text-sm mt-1">December 2024 Performance</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs lg:text-sm font-medium px-3 py-1 rounded-full border border-green-100">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +15% growth
                </div>
              </div>
              
              {/* Chart Container */}
              <div className="h-40 lg:h-48 mb-4">
                <MonthlyRevenueChart />
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-gray-500 text-xs lg:text-sm mb-1">Current</div>
                  <div className="text-gray-800 font-semibold text-sm lg:text-base">$350K</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs lg:text-sm mb-1">Average</div>
                  <div className="text-gray-800 font-semibold text-sm lg:text-base">$246K</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs lg:text-sm mb-1">Peak</div>
                  <div className="text-green-600 font-semibold text-sm lg:text-base">Dec</div>
                </div>
              </div>
            </div>
          <div>

            {/* IoT Sensor Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Thermometer className="w-5 h-5 mr-2 text-blue-600" />
                    IoT Sensor Overview
                  </h2>
                  <span className={`text-sm px-3 py-1 rounded-full shadow-sm ${
                    shipmentStatus === 'No Active Shipment' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {shipmentStatus}
                  </span>
                </div>
              </div>
              
              {shipmentStatus === 'No Active Shipment' ? (
                <div className="p-6 text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-700 mb-4">
                      No active shipments. IoT monitoring will begin when a shipment is created.
                    </p>
                    <button
                      onClick={simulateShipmentStart}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg"
                    >
                      Simulate Shipment Start
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Temperature</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {iotData?.temperature || 0}°C
                          </p>
                        </div>
                        <Thermometer className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Humidity</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {iotData?.humidity || 0}%
                          </p>
                        </div>
                        <Droplets className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Ammonia</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {iotData?.ammonia || 0} ppm
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesalerDashboard;
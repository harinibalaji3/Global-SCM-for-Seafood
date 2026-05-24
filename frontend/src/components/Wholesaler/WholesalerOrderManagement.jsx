import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  FileText, 
  Mail, 
  Ship, 
  Zap, 
  ShoppingCart,BrainCircuit, 
  LogOut,
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  User,
  Bell,
  ClipboardList,
  Plus,
  Store,
  Users,
  Fish
} from 'lucide-react';
import logo from '../../assets/logo.png';
import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

// ProfileDropdown Component
const ProfileDropdown = ({ userData, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
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
      
      if (storedUser?.id) {
        const updateData = {
          name: field === 'name' ? editValue : userData.name,
          phone: field === 'phone' ? editValue : userData.phone,
          businessName: field === 'businessName' ? editValue : userData.businessName
        };
        
        const response = await axios.put(`${API_BASE_URL}/users/${storedUser.id}`, updateData);

        if (response.data && response.data.success) {
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
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-medium text-sm lg:text-base hover:opacity-90 transition-opacity relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
      >
        {getInitial()}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right 0 top-12 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-5 duration-200">
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

            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {renderField('name')}
              {renderField('phone')}
              {renderField('email')}
              {renderField('businessName')}
            </div>

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

// Simple cn utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Sidebar Component with White and Navy Blue Theme
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
   { icon: Store, label: "Wholesaler Catalog", id: "catalog" },
    { icon: ShoppingCart, label: "Order", id: "orders" },
    { icon:BrainCircuit, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/catalog')) return 'catalog';
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/logistics')) return 'logistics';
    if (path.includes('/suppliers')) return 'suppliers';
    if (path.includes('/ai')) return 'ai';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'orders';
  };

  const activeItem = getActiveItem();

  const handleNavigation = (itemId) => {
    switch(itemId) {
      case 'dashboard':
        navigate('/wholesaler/dashboard');
        break;
      case 'catalog':
        navigate('/wholesaler/catalog');
        break;
      case 'inventory':
        navigate('/wholesaler/inventory');
        break;
      case 'orders':
        navigate('/wholesaler/orders');
        break;
      case 'dispatch':
        navigate('/wholesaler/dispatch');
        break;
      case 'suppliers':
        navigate('/wholesaler/suppliers');
        break;
      case 'ai':
        navigate('/wholesaler/ai');
        break;
      default:
        navigate('/wholesaler/dashboard');
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userToken');
    navigate('/');
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-900 rounded-lg">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-900">OceanFresh</h1>
            <p className="text-xs text-blue-700">Wholesaler</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 group rounded-lg",
                activeItem === item.id
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-blue-900 hover:bg-blue-50 hover:text-blue-900"
              )}
            >
              <IconComponent className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                activeItem === item.id ? "text-white" : "text-blue-700"
              )} />
              <span className={cn(
                "font-medium",
                activeItem === item.id ? "text-white" : "text-blue-900"
              )}>
                {item.label}
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
    </aside>
  );
};// Add these functions in WholesalerOrderManagement.jsx

const verifyDistributorOrder = async (orderId) => {
  try {
    if (!window.confirm('✅ Accept this distributor order?')) return;
    
    console.log(`✅ Accepting distributor order: ${orderId}`);
    
    const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/verify`, {
      status: 'confirmed',
      verified_by: 'wholesaler',
      verified_at: new Date().toISOString(),
      notes: 'Order accepted by wholesaler'
    });
    
    if (response.data.success) {
      alert('✅ Distributor order accepted successfully!');
      fetchOrders(); // Refresh orders
    }
  } catch (error) {
    console.error('❌ Error accepting order:', error);
    alert(`Failed to accept order: ${error.message}`);
  }
};

const rejectDistributorOrder = async (orderId) => {
  try {
    if (!window.confirm('❌ Are you sure you want to reject this distributor order?')) return;
    
    const reason = window.prompt('Please enter reason for rejection (optional):');
    
    console.log(`❌ Rejecting distributor order: ${orderId}`);
    
    const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/reject`, {
      reason: reason || 'Rejected by wholesaler',
      rejected_by: 'wholesaler',
      notes: reason || 'Order rejected by wholesaler'
    });
    
    if (response.data.success) {
      alert('❌ Distributor order rejected');
      fetchOrders(); // Refresh orders
    }
  } catch (error) {
    console.error('❌ Error rejecting order:', error);
    alert(`Failed to reject order: ${error.message}`);
  }
};

// In the WholesalerOrderManagement component, update the state declaration:
const WholesalerOrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add this line
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Not provided',
    email: 'Not provided',
    phone: 'Not provided',
    businessName: 'Not provided'
  });
  const [activeTab, setActiveTab] = useState('all');

  // Get user data
  const getUserData = () => {
    try {
      let userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  };

  // Load user data
  useEffect(() => {
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
  }, []);
const fetchOrders = async () => {
  try {
    setLoading(true);
    setError(null);
    const user = getUserData();
    
    if (!user?.id) {
      console.error('❌ No user ID found');
      navigate('/');
      return;
    }

    console.log('🔍 Fetching orders for WHOLESALER ID:', user.id);
    
    const response = await axios.get(`${API_BASE_URL}/orders`, {
      params: { 
        wholesaler_id: user.id,
        status: statusFilter !== 'all' ? statusFilter : 'all', 
        limit: 100 
      },
      timeout: 10000
    });
    
    console.log('✅ API Response:', response.data);
    
    if (response.data && response.data.success === true) {
      if (response.data.orders && Array.isArray(response.data.orders)) {
        // Process orders to identify source
        const processedOrders = response.data.orders.map(order => ({
          ...order,
          // Determine source: 'supplier' (incoming from wholesaler to supplier) 
          // or 'distributor' (incoming from distributor to wholesaler)
          source: order.distributor_id ? 'distributor' : 'supplier',
          // Set display name based on source
          counterparty_name: order.distributor_id ? order.distributor_name : order.supplier_name,
          counterparty_company: order.distributor_id ? order.distributor_company : order.supplier_company
        }));
        
        setOrders(processedOrders);
        console.log(`📦 Found ${processedOrders.length} orders`);
      }
    } else {
      setOrders([]);
      setError('No orders found');
    }
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    setError(`Failed to load orders: ${error.message}`);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchOrders();
    
    const handleNewOrder = () => {
      console.log('🔄 Refreshing orders due to new order');
      fetchOrders();
    };
    
    window.addEventListener('newOrderPlaced', handleNewOrder);
    
    return () => {
      window.removeEventListener('newOrderPlaced', handleNewOrder);
    };
  }, []);

  // Navigate to create new order
  const handleCreateOrder = () => {
    navigate('/wholesaler/catalog');
  };

  // Get status badge with appropriate styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered':
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'processing':
      case 'shipped':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesTab = activeTab === 'all' || order.order_status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
const viewOrderDetails = async (order) => {
  try {
    console.log('🔍 Viewing order details for:', order);
    
    // Use order.order_id instead of order.id
    const response = await axios.get(`${API_BASE_URL}/orders/by-order-id/${order.order_id}`);
    console.log('✅ Order details fetched:', response.data);
    
    setSelectedOrder(response.data);
    setShowOrderDetails(true);
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    alert(`Failed to fetch order details: ${error.message}`);
  }
};
  // Close order details
  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'cancelled'
      });
      alert('Order cancelled successfully');
      fetchOrders();
      closeOrderDetails();
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    approved: orders.filter(o => o.order_status === 'approved').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    cancelled: orders.filter(o => o.order_status === 'cancelled').length,
    totalRevenue: orders
      .filter(order => order.order_status === 'delivered' || order.order_status === 'confirmed')
      .reduce((sum, order) => {
        const amount = parseFloat(order.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0)
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your seafood orders</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateOrder}
                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Order</span>
              </button>
              
              <div className="relative hidden md:block">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent w-60 lg:w-80 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <ProfileDropdown userData={userData} onLogout={handleLogout} />
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 lg:p-6">
          {/* Tabs for Order Status */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'all' 
                  ? "bg-blue-900 text-white border-blue-900" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'pending' 
                  ? "bg-yellow-600 text-white border-yellow-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'confirmed' 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Confirmed ({stats.confirmed})
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'processing' 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Processing ({stats.processing})
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'delivered' 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Delivered ({stats.delivered})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'cancelled' 
                  ? "bg-red-600 text-white border-red-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Cancelled ({stats.cancelled})
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6 mb-6">
            {/* Total Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 lg:w-5 lg:h-5 text-blue-900" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Total Orders</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
              <p className="text-gray-600 text-xs lg:text-sm">All placed orders</p>
            </div>

            {/* Pending Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Pending</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.pending}</div>
              <p className="text-gray-600 text-xs lg:text-sm">Awaiting confirmation</p>
            </div>

            {/* Active Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Active</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {stats.confirmed + stats.processing + stats.shipped}
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">In progress</p>
            </div>

            {/* Delivered Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Delivered</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.delivered}</div>
              <p className="text-gray-600 text-xs lg:text-sm">Successfully delivered</p>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg font-bold">₹</span>
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Total Revenue</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                From delivered orders
              </p>
            </div>
          </div>
{error && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700 font-medium">Error Loading Orders</p>
      </div>
      <button
        onClick={() => setError(null)}
        className="text-red-600 hover:text-red-800"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <p className="text-red-600 text-sm mt-2">{error}</p>
    <div className="mt-3">
      <button
        onClick={fetchOrders}
        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
)}

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Supplier, or Product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 text-lg">No orders found</p>
                <p className="text-gray-500 mt-1">
                  {searchTerm || statusFilter !== 'all' || activeTab !== 'all'
                    ? 'Try adjusting your search or filter' 
                    : 'You haven\'t placed any orders yet'}
                </p>
                <button
                  onClick={handleCreateOrder}
                  className="mt-4 inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Place Your First Order
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px 6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Delivery Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {order.order_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{order.supplier_name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(order.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.order_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.preferred_delivery_date ? formatDate(order.preferred_delivery_date) : 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
  onClick={() => viewOrderDetails(order)}  // Pass the whole order object
  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors shadow-sm"
>
  <Eye className="w-4 h-4" />
  View
</button>
                              {(order.order_status === 'pending' || order.order_status === 'confirmed') && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors shadow-sm"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredOrders.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredOrders.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                    <p className="text-gray-600 text-sm mt-1">Order ID: {selectedOrder.order_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedOrder.order_status)}
                    <button
                      onClick={closeOrderDetails}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors ml-4"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-600 text-sm">Supplier</p>
                        <p className="text-gray-900">{selectedOrder.supplier_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Order Date</p>
                        <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Preferred Delivery Date</p>
                        <p className="text-gray-900">
                          {selectedOrder.preferred_delivery_date 
                            ? formatDate(selectedOrder.preferred_delivery_date)
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Payment Status</p>
                        <p className={cn(
                          "font-medium",
                          selectedOrder.payment_status === 'completed' ? "text-green-600" : "text-yellow-600"
                        )}>
                          {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-600 text-sm">Delivery Address</p>
                        <p className="text-gray-900">{selectedOrder.delivery_address || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Storage Requirements</p>
                        <p className="text-gray-900">{selectedOrder.storage_requirements || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Payment Mode</p>
                        <p className="text-gray-900">{selectedOrder.payment_mode || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            Product
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            Quantity
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            Unit Price
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            GST %
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            Quality
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {selectedOrder.items && selectedOrder.items.length > 0 ? (
          selectedOrder.items.map((item, index) => {
            const quantity = parseFloat(item.quantity_kg || item.quantity || 0);
            const price = parseFloat(item.unit_price || item.price || 0);
            const gstRate = parseFloat(item.gst_percentage || item.gst || 18);
            const itemSubtotal = quantity * price;
            const itemGST = itemSubtotal * gstRate / 100;
            
            return (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.seafood_type || item.seafoodType || item.product || 'Unknown Product'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {quantity} kg
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatCurrency(price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {gstRate}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                    (item.quality || item.quality_status || 'Fresh').toLowerCase() === 'fresh' 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  )}>
                    {item.quality || item.quality_status || 'Fresh'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatCurrency(itemSubtotal)}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="6" className="px-4 py-3 text-center text-gray-500">
              No items found for this order
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
             
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST</span>
                      <span className="text-gray-900">{formatCurrency(selectedOrder.gst_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-gray-900 font-semibold">Total Amount</span>
                      <span className="text-green-600 font-bold text-lg">
                        {formatCurrency(selectedOrder.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedOrder.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h4>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {(selectedOrder.order_status === 'pending' || selectedOrder.order_status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={closeOrderDetails}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WholesalerOrderManagement;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Package,
  Truck,
  Search,
  Edit,
  Plus,
  Download,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Cog,
  BrainCircuit,
  Eye,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Ship,
  Zap,
  LogOut,
  User,
  Bell,
  ClipboardList,
  Store,
  Users,
  Fish,
  DollarSign,
  X,  
  AlertTriangle,
  ShoppingBag 
} from "lucide-react";
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const API_BASE_URL = 'http://localhost:5000/api';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Notification utility functions (keep as is)
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATE: 'order_update',
  INVENTORY_ALERT: 'inventory_alert',
  SHIPMENT_UPDATE: 'shipment_update',
};

const getNotificationStorageKey = (userId) => `distributor_notifications_${userId}`;

const saveNotificationsToStorage = (userId, notifications) => {
  try {
    if (!userId) return false;
    const limitedNotifications = notifications.slice(0, 100);
    const storageKey = getNotificationStorageKey(userId);
    const data = {
      notifications: limitedNotifications,
      lastUpdated: new Date().toISOString(),
      totalCount: limitedNotifications.length,
      unreadCount: limitedNotifications.filter(n => !n.read).length
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Error saving notifications:', error);
    return false;
  }
};

const loadNotificationsFromStorage = (userId) => {
  try {
    if (!userId) return [];
    const storageKey = getNotificationStorageKey(userId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      return data.notifications || [];
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    return [];
  }
};

// ProfileDropdown Component (keep as is)
const ProfileDropdown = ({ userData, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getInitial = () => {
    if (userData.name && userData.name !== 'Not provided') {
      return userData.name.charAt(0).toUpperCase();
    } else if (userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-medium text-sm lg:text-base hover:opacity-90 transition-opacity"
      >
        {getInitial()}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold">
                  {getInitial()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userData.name}</p>
                  <p className="text-xs text-gray-500">{userData.email}</p>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm"
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

// Sidebar Component (keep as is)
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: ShoppingCart, label: "Distributor Catalog", id: "catalog" },
    { icon: ShoppingCart, label: "My Orders", id: "orders" },
    { icon: FileText, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/catalog')) return 'catalog';
    if (path.includes('/ai')) return 'ai';
    return 'orders';
  };

  const activeItem = getActiveItem();

  const handleNavigation = (itemId) => {
    switch(itemId) {
      case 'dashboard': navigate('/distributor/dashboard'); break;
      case 'inventory': navigate('/distributor/inventory'); break;
      case 'orders': navigate('/distributor/orders'); break;
      case 'catalog': navigate('/distributor/catalog'); break;
      case 'ai': navigate('/distributor/ai'); break;
      default: navigate('/distributor/dashboard');
    }
  };

  const handleLogout = () => {
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
            <p className="text-xs text-blue-700">Distributor</p>
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

// Notification Toast Component
const NotificationToast = ({ notification, onClose, onView }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'order_update': return <Package className="w-5 h-5 text-blue-600" />;
      case 'shipment_update': return <Truck className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-700 text-sm mt-1">{notification.message}</p>
            <div className="flex gap-2 mt-3">
              {notification.type === 'order_update' && (
                <button
                  onClick={() => {
                    onView(notification.data?.order_id);
                    onClose();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded"
                >
                  View Order
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium py-1.5 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// NotificationsDropdown Component
const NotificationsDropdown = ({ notifications, onClear, onMarkAsRead, onViewOrder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newNotificationArrived, setNewNotificationArrived] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (notifications.some(n => !n.read)) {
      setNewNotificationArrived(true);
      const timer = setTimeout(() => setNewNotificationArrived(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order_update': return <Package className="w-5 h-5 text-blue-600" />;
      case 'shipment_update': return <Truck className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
      >
        <Bell size={20} className={`text-gray-700 ${newNotificationArrived ? 'animate-bounce text-blue-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button onClick={onClear} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 hover:bg-gray-100 rounded border border-gray-300">
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div key={notification.id || index} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-300">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <span className="text-gray-500 text-xs">{formatTime(notification.timestamp)}</span>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">{notification.message}</p>
                        {notification.type === 'order_update' && notification.data && (
                          <button
                            onClick={() => {
                              onViewOrder(notification.data.order_id);
                              setIsOpen(false);
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <Eye size={14} />
                            View Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DistributorOrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userData, setUserData] = useState({
    name: 'Not provided',
    email: 'Not provided',
    phone: 'Not provided',
    businessName: 'Not provided'
  });

  // Status options for display only (read-only)
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

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

  // Load notifications
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    if (storedUser?.id) {
      const savedNotifications = loadNotificationsFromStorage(storedUser.id);
      setNotifications(savedNotifications);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    const storedUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    if (!storedUser?.id) {
      console.error('❌ No user ID found');
      navigate('/');
      return;
    }

    // Listen for order updates (status changes from wholesaler)
    socketInstance.on('order_update', (data) => {
      console.log('🔄 Order update received:', data);
      
      // Create notification
      const newNotification = {
        id: `update-${Date.now()}`,
        type: 'order_update',
        title: 'Order Status Updated',
        message: `Order #${data.order_id} is now ${data.status}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: data
      };
      
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveNotificationsToStorage(storedUser.id, updated);
        return updated;
      });
      
      setCurrentToast(newNotification);
      setShowToast(true);
      
      // Refresh orders
      fetchOrders();
    });

    socketInstance.on('connect', () => {
      setSocketConnected(true);
      socketInstance.emit('join-distributor', { 
        distributorId: storedUser.id.toString(),
        type: 'distributor'
      });
    });

    socketInstance.on('connect_error', () => setSocketConnected(false));
    socketInstance.on('disconnect', () => setSocketConnected(false));

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch orders placed by this distributor
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

      console.log('🔍 Fetching orders for DISTRIBUTOR ID:', user.id);
      
      // Try multiple endpoints that might work
      const possibleEndpoints = [
        `${API_BASE_URL}/orders/distributor/${user.id}`,  // Try distributor endpoint first
        `${API_BASE_URL}/orders?distributor_id=${user.id}`,
        `${API_BASE_URL}/orders/user/${user.id}`
      ];
      
      let ordersData = [];
      let success = false;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, { timeout: 5000 });
          
          if (response.data) {
            // Handle different response formats
            if (response.data.success && response.data.orders) {
              ordersData = response.data.orders;
            } else if (Array.isArray(response.data)) {
              ordersData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              ordersData = response.data.data;
            }
            
            if (ordersData.length > 0) {
              console.log(`✅ Found ${ordersData.length} orders at ${endpoint}`);
              success = true;
              break;
            }
          }
        } catch (err) {
          console.log(`⚠️ Endpoint ${endpoint} failed:`, err.message);
        }
      }
      
      if (!success) {
        console.log('📋 No orders found, showing empty state');
        ordersData = [];
      }
      
      // Transform orders to match frontend structure
      const transformedOrders = ordersData.map(order => ({
        id: order.id,
        order_id: order.order_id || `ORD-${order.id}`,
        wholesaler_name: order.wholesaler_name || order.supplier_name || 'Wholesaler',
        wholesaler_company: order.wholesaler_company || '',
        total_amount: parseFloat(order.total_amount || 0),
        order_status: order.order_status || 'pending',
        created_at: order.created_at || new Date().toISOString(),
        preferred_delivery_date: order.preferred_delivery_date,
        items: order.items || [],
        payment_status: order.payment_status || 'pending',
        delivery_address: order.delivery_address,
        storage_requirements: order.storage_requirements,
        payment_mode: order.payment_mode,
        notes: order.notes
      }));
      
      console.log(`✅ Found ${transformedOrders.length} orders placed by you`);
      setOrders(transformedOrders);
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError('Could not load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleClearNotifications = () => {
    const storedUser = getUserData();
    if (storedUser?.id) {
      localStorage.removeItem(`distributor_notifications_${storedUser.id}`);
    }
    setNotifications([]);
  };

  const handleMarkAsRead = (notificationId) => {
    const storedUser = getUserData();
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      if (storedUser?.id) saveNotificationsToStorage(storedUser.id, updated);
      return updated;
    });
  };

  const handleViewOrder = (orderId) => {
    const order = orders.find(o => o.order_id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    setCurrentToast(null);
  };

  const handleToastView = (orderId) => {
    handleViewOrder(orderId);
    handleToastClose();
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    if (socket) socket.disconnect();
    navigate('/');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    const IconComponent = statusOption?.icon || AlertCircle;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusOption?.color || 'bg-gray-100 text-gray-800'} border border-gray-200`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {statusOption?.label || status}
      </span>
    );
  };

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

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    cancelled: orders.filter(o => o.order_status === 'cancelled').length,
    totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
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
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 text-sm mt-1">View all orders you've placed with wholesalers</p>
              {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Socket Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {socketConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              
              {/* Notifications Dropdown */}
              <NotificationsDropdown
                notifications={notifications}
                onClear={handleClearNotifications}
                onMarkAsRead={handleMarkAsRead}
                onViewOrder={handleViewOrder}
              />
              
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
                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <ProfileDropdown userData={userData} onLogout={handleLogout} />
            </div>
          </div>
          
          {/* Mobile Search */}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-900" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-gray-600 text-sm">Total Orders</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <p className="text-gray-600 text-sm">Pending</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.delivered}</div>
              <p className="text-gray-600 text-sm">Delivered</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg font-bold">₹</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</div>
              <p className="text-gray-600 text-sm">Total Spent</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="all">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 text-lg">No orders found</p>
                <p className="text-gray-500 mt-1">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter'
                    : "You haven't placed any orders yet"}
                </p>
                <button
                  onClick={() => navigate('/distributor/catalog')}
                  className="mt-4 inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Browse Catalog
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Wholesaler
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{order.order_id}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {order.items?.length || 0} items
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{order.wholesaler_name}</p>
                            <p className="text-xs text-gray-500">{order.wholesaler_company}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                            <p className="text-xs text-gray-500">{order.payment_mode || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.order_status)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order Details Modal (Read-Only) */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                    >
                      <X size={24} />
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
                        <p className="text-gray-600 text-sm">Wholesaler</p>
                        <p className="text-gray-900">{selectedOrder.wholesaler_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Order Date</p>
                        <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Payment Status</p>
                        <p className="font-medium capitalize">{selectedOrder.payment_status}</p>
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
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">GST</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm text-gray-900">{item.seafood_type}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.quantity_kg} kg</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.gst_percentage}%</td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                                {formatCurrency(item.quantity_kg * item.unit_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h4>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={closeOrderDetails}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && currentToast && (
          <NotificationToast
            notification={currentToast}
            onClose={handleToastClose}
            onView={handleToastView}
          />
        )}
      </div>
    </div>
  );
};

export default DistributorOrdersManagement;
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
  X,  AlertTriangle,
  ShoppingBag 
} from "lucide-react";
// Import socket for real-time updates
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const API_BASE_URL = 'http://localhost:5000/api';

// Simple cn utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');
// Add these notification utility functions at the top of the file, after imports
// Notification utility functions
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATE: 'order_update',
  INVENTORY_ALERT: 'inventory_alert',
  SHIPMENT_UPDATE: 'shipment_update',
  Distributor_ACTION: 'distributor_action'
};

const getNotificationStorageKey = (userId) => {
  return `distributor_notifications_${userId}`;
};

const saveNotificationsToStorage = (userId, notifications) => {
  try {
    if (!userId) {
      console.error('❌ Cannot save notifications: No user ID provided');
      return false;
    }

    // Limit to 100 notifications to prevent localStorage overflow
    const limitedNotifications = notifications.slice(0, 100);
    
    const storageKey = getNotificationStorageKey(userId);
    const data = {
      notifications: limitedNotifications,
      lastUpdated: new Date().toISOString(),
      totalCount: limitedNotifications.length,
      unreadCount: limitedNotifications.filter(n => !n.read).length
    };
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    console.log(`💾 Saved ${limitedNotifications.length} notifications for user ${userId}`);
    console.log(`   Unread: ${data.unreadCount}, Last updated: ${data.lastUpdated}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving notifications to localStorage:', error);
    
    // If localStorage is full, clear old notifications and retry
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded. Clearing old notifications...');
      localStorage.clear();
      
      try {
        const storageKey = getNotificationStorageKey(userId);
        const data = {
          notifications: [],
          lastUpdated: new Date().toISOString(),
          totalCount: 0,
          unreadCount: 0
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
      } catch (retryError) {
        console.error('❌ Failed to clear and retry:', retryError);
      }
    }
    
    return false;
  }
};

const loadNotificationsFromStorage = (userId) => {
  try {
    if (!userId) {
      console.error('❌ Cannot load notifications: No user ID provided');
      return [];
    }

    const storageKey = getNotificationStorageKey(userId);
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      const data = JSON.parse(saved);
      
      // Handle both old format (array) and new format (object)
      let notifications;
      if (Array.isArray(data)) {
        // Old format - migrate to new format
        notifications = data;
        console.log(`📂 Migrating old format for user ${userId}`);
        saveNotificationsToStorage(userId, notifications);
      } else if (data && Array.isArray(data.notifications)) {
        // New format
        notifications = data.notifications;
      } else {
        notifications = [];
      }
      
      console.log(`📂 Loaded ${notifications.length} notifications for user ${userId}`);
      return notifications;
    }
    
    console.log(`📂 No saved notifications found for user ${userId}`);
    return [];
  } catch (error) {
    console.error('❌ Error loading notifications from localStorage:', error);
    return [];
  }
};

const clearNotificationsFromStorage = (userId) => {
  try {
    if (!userId) return;
    
    const storageKey = getNotificationStorageKey(userId);
    localStorage.removeItem(storageKey);
    
    console.log(`🧹 Cleared all notifications for user ${userId}`);
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
};

const markNotificationAsRead = (userId, notificationId) => {
  try {
    if (!userId || !notificationId) {
      console.error('❌ Cannot mark as read: Missing parameters');
      return [];
    }

    const notifications = loadNotificationsFromStorage(userId);
    const updated = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    saveNotificationsToStorage(userId, updated);
    console.log(`✅ Marked notification ${notificationId} as read`);
    
    return updated;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return [];
  }
};

const markAllNotificationsAsRead = (userId) => {
  try {
    if (!userId) return [];
    
    const notifications = loadNotificationsFromStorage(userId);
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    
    saveNotificationsToStorage(userId, updated);
    console.log(`✅ Marked all notifications as read for user ${userId}`);
    
    return updated;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return [];
  }
};

const addNewNotification = (userId, notification) => {
  try {
    if (!userId || !notification) {
      console.error('❌ Cannot add notification: Missing parameters');
      return [];
    }

    // Ensure notification has required fields
    const completeNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || NOTIFICATION_TYPES.NEW_ORDER,
      title: notification.title || 'New Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
      data: notification.data || {}
    };

    const notifications = loadNotificationsFromStorage(userId);
    const newNotifications = [completeNotification, ...notifications];
    
    saveNotificationsToStorage(userId, newNotifications);
    
    console.log(`➕ Added new notification for user ${userId}:`, {
      id: completeNotification.id,
      type: completeNotification.type,
      title: completeNotification.title
    });
    
    return newNotifications;
  } catch (Error) {
    console.error('❌ Error adding new notification:', Error);
    return [];
  }
};

const removeNotification = (userId, notificationId) => {
  try {
    if (!userId || !notificationId) return [];
    
    const notifications = loadNotificationsFromStorage(userId);
    const filtered = notifications.filter(notif => notif.id !== notificationId);
    
    saveNotificationsToStorage(userId, filtered);
    console.log(`🗑️ Removed notification ${notificationId} for user ${userId}`);
    
    return filtered;
  } catch (error) {
    console.error('❌ Error removing notification:', error);
    return [];
  }
};

const getNotificationStats = (userId) => {
  try {
    if (!userId) return { total: 0, unread: 0, lastUpdated: null };
    
    const notifications = loadNotificationsFromStorage(userId);
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      read: notifications.filter(n => n.read).length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return { total: 0, unread: 0, read: 0, lastUpdated: null };
  }
};

const getUnreadNotificationCount = (userId) => {
  try {
    if (!userId) return 0;
    
    const notifications = loadNotificationsFromStorage(userId);
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
};

const filterNotificationsByType = (userId, type) => {
  try {
    if (!userId) return [];
    
    const notifications = loadNotificationsFromStorage(userId);
    return notifications.filter(notif => notif.type === type);
  } catch (error) {
    console.error('❌ Error filtering notifications:', error);
    return [];
  }
};
// ProfileDropdown Component (Updated for white theme)
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
          
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-5 duration-200">
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

// Sidebar Component with White and Navy Blue Theme
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: ShoppingCart, label: "Order Management", id: "orders" },
    { icon: FileText, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/logistics')) return 'logistics';
    if (path.includes('/ai')) return 'ai';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'orders';
  };

  const activeItem = getActiveItem();

  const handleNavigation = (itemId) => {
    switch(itemId) {
      case 'dashboard':
        navigate('/retailer/dashboard');
        break;
      case 'inventory':
        navigate('/retailer/inventory');
        break;
      case 'orders':
        navigate('/retailer/orders');
        break;
      case 'logistics':
        navigate('/retailer/logistics');
        break;
      case 'ai':
        navigate('/retailer/ai');
        break;
      default:
        navigate('/retailer/dashboard');
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
            <p className="text-xs text-blue-700">Retailor</p>
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
};
const RetailerOrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Add notifications state
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  const [processingDetails, setProcessingDetails] = useState({
    startDate: '',
    estimatedCompletion: '',
    assignedTeam: '',
    notes: ''
  });
  
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
  const [activeTab, setActiveTab] = useState('all');

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
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

  // Load notifications from localStorage when component mounts
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    if (storedUser?.id) {
      const savedNotifications = loadNotificationsFromStorage(storedUser.id);
      console.log('📂 Loaded notifications in order management:', savedNotifications.length);
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

// In the socket event handler in distributorOrdersManagement:
socketInstance.on('new_order_for_distributor', (data) => {
  console.log('📦 New order received in order management:', data);
  
  // Create notification with unique ID
  const uniqueId = `socket-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newNotification = {
    id: uniqueId,
    type: 'new_order',
    title: '📦 New Order Received',
    message: `Order #${data.order_id} from ${data.wholesaler_name || 'Wholesaler'}`,
    timestamp: new Date().toISOString(),
    read: false,
    data: data
  };
  
  // Add to notifications list with duplicate check
  setNotifications(prev => {
    const prevArray = Array.isArray(prev) ? prev : [];
    
    // Check for duplicates
    const hasDuplicate = prevArray.some(
      notif => notif.data?.order_id === data.order_id
    );
    
    if (hasDuplicate) {
      console.log('⚠️ Duplicate order in order management, skipping:', data.order_id);
      return prevArray;
    }
    
    const newState = [newNotification, ...prevArray];
    
    // Save to localStorage
    saveNotificationsToStorage(storedUser.id, newState);
    
    // Also auto-refresh orders list
    fetchOrders();
    
    return newState;
  });
  
  // Show toast
  setCurrentToast(newNotification);
  setShowToast(true);
});
    
    // Listen for order updates
    socketInstance.on('orderUpdate', (data) => {
      console.log('🔄 Order update received:', data);
      // Update the specific order
      setOrders(prev => prev.map(order => 
        order.order_id === data.orderId ? { 
          ...order, 
          order_status: data.status 
        } : order
      ));
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

    console.log(`🔍 Fetching orders for distributor: ${user.id}`);
    console.log(`🔍 Using URL: ${API_BASE_URL}/orders/distributor/${user.id}`);
    
    try {
      // Use the exact same parameters as the dashboard
      const response = await axios.get(`${API_BASE_URL}/orders/distributor/${user.id}`, {
        timeout: 10000
        // Don't add params initially - use same as dashboard
      });
      
      console.log('✅ FULL API RESPONSE STRUCTURE:', {
        data: response.data,
        success: response.data?.success,
        orders: response.data?.orders,
        ordersLength: response.data?.orders?.length,
        isArray: Array.isArray(response.data),
        isOrdersArray: Array.isArray(response.data?.orders),
        allKeys: Object.keys(response.data || {})
      });
      
      let distributorOrders = [];
      
      // Method 1: Check if response.data.orders exists (dashboard pattern)
      if (response.data?.orders && Array.isArray(response.data.orders)) {
        console.log('📦 Using response.data.orders');
        distributorOrders = response.data.orders;
      }
      // Method 2: Check if response.data is the array directly
      else if (Array.isArray(response.data)) {
        console.log('📦 Using response.data directly');
        distributorOrders = response.data;
      }
      // Method 3: Check for other patterns
      else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('📦 Using response.data.data');
        distributorOrders = response.data.data;
      }
      // Method 4: Try to find any array in the response
      else if (response.data) {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`📦 Found array in key: "${key}" with ${response.data[key].length} items`);
            distributorOrders = response.data[key];
            break;
          }
        }
      }
      
      console.log(`📊 Final: Found ${distributorOrders.length} orders`);
      
      // If still no orders, check what's actually in the response
      if (distributorOrders.length === 0 && response.data) {
        console.log('⚠️ No orders array found. Response contains:', {
          type: typeof response.data,
          isObject: typeof response.data === 'object',
          keys: Object.keys(response.data),
          fullData: response.data
        });
        
        // Try to extract orders from a different structure
        if (response.data.success && response.data.pagination) {
          console.log('📋 Response has success and pagination, checking for embedded data...');
        }
      }
      
      // Transform orders - SAFE VERSION
      const transformedOrders = distributorOrders.map((order, index) => {
        // Debug each order structure
        if (index === 0) {
          console.log('📝 Sample order structure:', order);
          console.log('📝 Sample order keys:', Object.keys(order || {}));
        }
        
        return {
          id: order?.id || order?._id || order?.order_id || index,
          order_id: order?.order_id || order?.orderId || order?.id || `ORDER-${index}`,
          wholesaler_name: order?.wholesaler_name || order?.wholesalerName || order?.wholesaler?.name || 'Unknown Wholesaler',
          wholesaler_company: order?.wholesaler_company || order?.wholesalerCompany || order?.wholesaler?.company || 'Unknown Company',
          wholesaler_email: order?.wholesaler_email || order?.wholesalerEmail || order?.wholesaler?.email,
          total_amount: order?.total_amount || order?.totalAmount || order?.value || order?.amount || 0,
          order_status: order?.order_status || order?.status || order?.orderStatus || 'pending',
          created_at: order?.created_at || order?.createdAt || order?.date || order?.order_date || new Date().toISOString(),
          preferred_delivery_date: order?.preferred_delivery_date || order?.deliveryDate || order?.delivery_date,
          items: order?.items || order?.orderItems || order?.products || [],
          payment_status: order?.payment_status || order?.paymentStatus,
          delivery_address: order?.delivery_address || order?.deliveryAddress || order?.address,
          wholesaler_id: order?.wholesaler_id || order?.wholesalerId || order?.wholesaler?.id
        };
      });
      
      console.log(`🎯 Transformed ${transformedOrders.length} orders`);
      
      if (transformedOrders.length === 0) {
        // Use mock data temporarily
        console.log('🔄 Using mock data while debugging');
        const mockOrders = getMockOrders();
        setOrders(mockOrders);
        setError('Debug: API returned empty array. Using demo data.');
      } else {
        setOrders(transformedOrders);
        console.log('✅ Successfully loaded orders:', transformedOrders.length);
      }
      
    } catch (error) {
      console.error('❌ API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Use mock data
      const mockOrders = getMockOrders();
      setOrders(mockOrders);
      setError(`API Error: ${error.message}. Using demo data.`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    setOrders(getMockOrders());
    setError('Unexpected error. Using demo data.');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchOrders();
  }, []);
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
      
      // Save to localStorage
      if (storedUser?.id) {
        saveNotificationsToStorage(storedUser.id, updated);
      }
      
      return updated;
    });
  };

  const handleViewOrder = (orderId) => {
    // Navigate to orders page (already there) or view details
    viewOrderDetails(orderId);
    
    // Mark this specific notification as read
    const storedUser = getUserData();
    setNotifications(prev => {
      const updated = prev.map(notif => {
        if (notif.data?.order_id === orderId || notif.data?.orderId === orderId) {
          return { ...notif, read: true };
        }
        return notif;
      });
      
      // Save to localStorage
      if (storedUser?.id) {
        saveNotificationsToStorage(storedUser.id, updated);
      }
      
      return updated;
    });
  };

  // Handle toast close
  const handleToastClose = () => {
    setShowToast(false);
    setCurrentToast(null);
  };
  
  // Handle toast view action
  const handleToastView = (orderId) => {
    handleViewOrder(orderId);
    handleToastClose();
  };

// Notification Toast Component
const NotificationToast = ({ notification, onClose, onView }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'new_order':
        return <ShoppingBag className="w-5 h-5 text-green-600" />;
      case 'order_update':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'inventory_alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'shipment_update':
        return <Truck className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 transform transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-700 text-sm mt-1">{notification.message}</p>
            <div className="flex gap-2 mt-3">
              {notification.type === 'new_order' && (
                <button
                  onClick={() => {
                    onView(notification.data?.order_id);
                    onClose();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded transition-colors"
                >
                  View Order
                </button>
              )}
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium py-1.5 rounded transition-colors"
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
const safeNotifications = Array.isArray(notifications) ? notifications : [];
const NotificationsDropdown = ({ notifications, onClear, onMarkAsRead, onViewOrder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newNotificationArrived, setNewNotificationArrived] = useState(false);
  
  // Track unread count for animation
const unreadCount = safeNotifications.filter(n => !n.read).length;  
  // Play notification sound when new notification arrives
  useEffect(() => {
    const newNotifications = notifications.filter(n => !n.read);
    if (newNotifications.length > 0) {
      // Add animation effect for new notification
      setNewNotificationArrived(true);
      
      // Remove animation after 2 seconds
      const timer = setTimeout(() => {
        setNewNotificationArrived(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications.length]);

  // Debug log
  useEffect(() => {
    console.log('🔔 Notification badge state:', {
      unreadCount,
      total: notifications.length,
      badgeShouldShow: unreadCount > 0
    });
  }, [unreadCount, notifications.length]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_order':
        return <ShoppingBag className="w-5 h-5 text-green-600" />;
      case 'order_update':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'inventory_alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'shipment_update':
        return <Truck className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'new_order': return 'bg-green-50 border-green-200';
      case 'order_update': return 'bg-blue-50 border-blue-200';
      case 'inventory_alert': return 'bg-yellow-50 border-yellow-200';
      case 'shipment_update': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Add this style tag in your NotificationsDropdown component
  const badgeCSS = `
  .notification-badge {
    position: absolute !important;
    top: -5px !important;
    right: -5px !important;
    z-index: 9999 !important;
    font-size: 10px !important;
    line-height: 1 !important;
    min-width: 18px !important;
    height: 18px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: 2px solid white !important;
    box-shadow: 0 0 5px rgba(0,0,0,0.3) !important;
  }
  `;

  return (
    <div className="relative">
      <style>{badgeCSS}</style>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className="flex items-center gap-2">
          <Bell 
            size={20} 
            className={`text-gray-700 transition-all duration-300 ${
              newNotificationArrived ? 'animate-bounce text-blue-600' : ''
            }`}
          />
        </div>
        
        {/* Notification Badge - Fixed positioning */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            {/* Ping animation */}
            {newNotificationArrived && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              </span>
            )}
            
            {/* Badge */}
            <span className={`
              relative inline-flex items-center justify-center 
              ${newNotificationArrived ? 'bg-red-600 animate-pulse' : 'bg-red-500'} 
              text-white text-xs font-bold rounded-full h-5 min-w-5 px-1
              border-2 border-white shadow-lg notification-badge
            `}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-5 duration-200">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 hover:bg-gray-100 rounded border border-gray-300"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Real-time updates will appear here
                  </p>
                </div>
              ) : (
                safeNotifications.map((notification, index) => (
                  <div
                    key={notification.id || index}
                    className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)} border-l-4 ${
                      !notification.read ? 'border-l-blue-500' : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-300">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs whitespace-nowrap">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mt-1 break-words">
                          {notification.message}
                        </p>
                        
                        {notification.type === 'new_order' && notification.data && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600">Order #{notification.data.order_id}</p>
                                <p className="text-sm font-medium">
                                  {notification.data.items?.length || 0} items • ${notification.data.total_amount || 0}
                                </p>
                              </div>
                              <button
                                onClick={() => onViewOrder(notification.data.order_id)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <Eye size={14} />
                                View Order
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-300 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};  
  // Mock data fallback
  const getMockOrders = () => {
    return [
      {
        id: 1,
        order_id: "SEA-001",
        wholesaler_name: "SeaFood Distributors Inc.",
        wholesaler_company: "SeaFood Distributors",
        total_amount: 2500,
        order_status: "pending",
        created_at: "2024-01-15T10:30:00Z",
        items: [
          { seafood_type: "Fresh Tuna", quantity_kg: 50, unit_price: 25 }
        ]
      },
      {
        id: 2,
        order_id: "SEA-002",
        wholesaler_name: "Oceanic Markets",
        wholesaler_company: "Oceanic Markets LLC",
        total_amount: 1800,
        order_status: "processing",
        created_at: "2024-01-14T14:20:00Z",
        items: [
          { seafood_type: "Atlantic Salmon", quantity_kg: 30, unit_price: 30 }
        ]
      },
      {
        id: 3,
        order_id: "SEA-003",
        wholesaler_name: "Coastal Traders",
        wholesaler_company: "Coastal Traders Ltd",
        total_amount: 3200,
        order_status: "confirmed",
        created_at: "2024-01-13T09:15:00Z",
        items: [
          { seafood_type: "King Prawns", quantity_kg: 40, unit_price: 40 }
        ]
      },
      {
        id: 4,
        order_id: "SEA-004",
        wholesaler_name: "Marine Foods",
        wholesaler_company: "Marine Foods Corp",
        total_amount: 4200,
        order_status: "shipped",
        created_at: "2024-01-12T16:45:00Z",
        items: [
          { seafood_type: "Lobster", quantity_kg: 35, unit_price: 60 }
        ]
      },
      {
        id: 5,
        order_id: "SEA-005",
        wholesaler_name: "Fresh Catch Co.",
        wholesaler_company: "Fresh Catch Company",
        total_amount: 2900,
        order_status: "delivered",
        created_at: "2024-01-11T11:20:00Z",
        items: [
          { seafood_type: "Squid", quantity_kg: 58, unit_price: 25 }
        ]
      }
    ];
  };

const getUserData = () => {
  try {
    let userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (!userData) {
      console.error('❌ No user data found in storage');
      return null;
    }
    
    const parsed = JSON.parse(userData);
    console.log('👤 User data retrieved:', {
      id: parsed.id,
      name: parsed.name,
      type: parsed.type
    });
    
    return parsed;
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    return null;
  }
};
  // Get status badge with appropriate styling
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
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_company?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    console.log('🔍 Fetching order details for:', order);
    
    // Try multiple endpoints
    const endpoints = [
      `${API_BASE_URL}/orders/${order.id}`,
      `${API_BASE_URL}/orders/by-id/${order.id}`,
      `${API_BASE_URL}/orders/by-order-id/${order.order_id}`,
      `${API_BASE_URL}/orders/distributor/${getUserData()?.id}/${order.order_id}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        if (response.data) {
          console.log('✅ Order details fetched from:', endpoint);
          setSelectedOrder(response.data);
          setShowOrderDetails(true);
          return;
        }
      } catch (endpointError) {
        console.log(`⚠️ Failed with endpoint ${endpoint}:`, endpointError.message);
        continue;
      }
    }
    
    // If all endpoints fail, use the order data we already have
    console.log('ℹ️ Using existing order data');
    setSelectedOrder(order);
    setShowOrderDetails(true);
    
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    alert('Failed to fetch order details. Using available data.');
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }
};
  // Close order details
  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Accept order with socket notification
  const acceptOrder = async (orderId) => {
    try {
      console.log(`✅ Accepting order: ${orderId}`);
      
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'processing',
        action_by: 'distributor',
        action_timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.order_id === orderId ? { ...order, order_status: 'processing' } : order
        ));
        
        // Get order details for notification
        const order = orders.find(o => o.order_id === orderId);
        
        // Send real-time notification to wholesaler via socket
        if (socket && order) {
          socket.emit('distributor_action', {
            orderId: orderId,
            action: 'accepted',
            status: 'processing',
            distributorId: getUserData()?.id,
            distributorName: getUserData()?.name || getUserData()?.businessName || 'distributor',
            wholesalerId: order.wholesaler_id,
            timestamp: new Date().toISOString(),
            message: `Your order ${orderId} has been accepted by the distributor and is now being processed.`
          });
        }
        
        alert('✅ Order accepted successfully! The Retailer has been notified.');
      }
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  // Reject order with socket notification
  const rejectOrder = async (orderId) => {
    try {
      if (window.confirm('Are you sure you want to reject this order?')) {
        console.log(`❌ Rejecting order: ${orderId}`);
        
        const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
          status: 'cancelled',
          reason: 'rejected_by_distributor',
          action_by: 'distributor',
          action_timestamp: new Date().toISOString()
        });
        
        if (response.data.success) {
          // Get order details before removing
          const order = orders.find(o => o.order_id === orderId);
          
          // Remove from local state
          setOrders(prev => prev.filter(order => order.order_id !== orderId));
          
          // Send real-time notification to wholesaler via socket
          if (socket && order) {
            socket.emit('distributoraction', {
              orderId: orderId,
              action: 'rejected',
              status: 'cancelled',
              distributorId: getUserData()?.id,
              distributorName: getUserData()?.name || getUserData()?.businessName || 'distributor',
              wholesalerId: order.wholesaler_id,
              timestamp: new Date().toISOString(),
              message: `Your order ${orderId} has been rejected by the distributor.`
            });
          }
          
          alert('❌ Order rejected successfully! The wholesaler has been notified.');
        }
      }
    } catch (error) {
      console.error('❌ Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    }
  };

  // Update order status with socket notification
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
      
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus,
        action_by: 'distributor',
        action_timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.order_id === orderId ? { ...order, order_status: newStatus } : order
        ));
        
        // Get order details
        const order = orders.find(o => o.order_id === orderId);
        
        // Send real-time notification to wholesaler via socket
        if (socket && order) {
          let message = '';
          switch(newStatus) {
            case 'processing':
              message = `Your order ${orderId} is now being processed.`;
              break;
            case 'shipped':
              message = `Your order ${orderId} has been shipped.`;
              break;
            case 'delivered':
              message = `Your order ${orderId} has been delivered.`;
              break;
            default:
              message = `Status of your order ${orderId} has been updated to ${newStatus}.`;
          }
          
          socket.emit('distributor_action', {
            orderId: orderId,
            action: 'status_update',
            status: newStatus,
            distributorId: getUserData()?.id,
            distributorName: getUserData()?.name || getUserData()?.businessName || 'distributor',
            wholesalerId: order.wholesaler_id,
            timestamp: new Date().toISOString(),
            message: message
          });
        }
        
        alert(`✅ Order status updated to ${newStatus}! The wholesaler has been notified.`);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  // Open processing modal
  const openProcessingModal = (order) => {
    setSelectedOrder(order);
    setShowProcessingModal(true);
  };

  // Save processing details
  const saveProcessingDetails = () => {
    if (selectedOrder) {
      console.log('Saving processing details:', processingDetails);
      // Here you would call your API to save processing details
      setShowProcessingModal(false);
      setProcessingDetails({
        startDate: '',
        estimatedCompletion: '',
        assignedTeam: '',
        notes: ''
      });
      alert('Processing details saved!');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
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
              <p className="text-gray-600 text-sm mt-1">Manage incoming seafood orders</p>
              {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  ⚠️ {error} (Showing demo data)
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
              All Orders ({stats.total})
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
              <p className="text-gray-600 text-xs lg:text-sm">All incoming orders</p>
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
              <p className="text-gray-600 text-xs lg:text-sm">Awaiting action</p>
            </div>

            {/* Processing Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-4 h-4 lg:w-5 lg:h-5 text-blue-900" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Processing</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.processing}</div>
              <p className="text-gray-600 text-xs lg:text-sm">In production</p>
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

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Wholesaler, or Product..."
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
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 text-lg">No orders found</p>
                <p className="text-gray-500 mt-1">
                  {searchTerm || statusFilter !== 'all' || activeTab !== 'all'
                    ? 'Try adjusting your search or filter' 
                    : 'No incoming orders yet'}
                </p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Orders
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
                          Items & Value
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
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{order.wholesaler_name}</p>
                                  <p className="text-sm text-gray-600">{order.wholesaler_company}</p>
                                  <p className="text-xs text-blue-600">Order ID: {order.order_id}</p>
                                  {order.wholesaler_email && (
                                    <p className="text-xs text-gray-500 mt-1">{order.wholesaler_email}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(order.total_amount)}
                              </p>
                              {order.items && order.items.length > 0 ? (
                                <div className="text-xs text-gray-600">
                                  {order.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="truncate">
                                      {item.seafood_type} • {item.quantity_kg}kg
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <div className="text-blue-600">
                                      +{order.items.length - 2} more items
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No items details</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <p>Created: {formatDate(order.created_at)}</p>
                              {order.preferred_delivery_date && (
                                <p className="text-xs text-gray-500">
                                  Delivery: {formatDate(order.preferred_delivery_date)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.order_status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {order.order_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => acceptOrder(order.order_id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors shadow-md"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => rejectOrder(order.order_id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors shadow-md"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {order.order_status === 'processing' && (
                                <button
                                  onClick={() => openProcessingModal(order)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors shadow-md"
                                >
                                  <Edit className="w-4 h-4" />
                                  Update
                                </button>
                              )}

                              <select
                                value={order.order_status}
                                onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => viewOrderDetails(order.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
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
                        <p className="text-gray-600 text-sm">Wholesaler</p>
                        <p className="text-gray-900">{selectedOrder.wholesaler_name}</p>
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
                {selectedOrder.items && selectedOrder.items.length > 0 && (
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
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.seafood_type}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.quantity_kg} kg
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.gst_percentage}%
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                                  item.quality_status === 'Fresh' 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                )}>
                                  {item.quality_status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
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

                {/* Additional Information */}
                {selectedOrder.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h4>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {selectedOrder.order_status === 'pending' && (
                    <>
                      <button
                        onClick={() => acceptOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => rejectOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                      >
                        Reject Order
                      </button>
                    </>
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

        {/* Processing Details Modal */}
        {showProcessingModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white shadow-2xl rounded-2xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Processing Details</h3>
              <p className="text-sm text-gray-600 mb-4">
                Order: {selectedOrder.order_id} for {selectedOrder.wholesaler_name}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={processingDetails.startDate}
                    onChange={(e) => setProcessingDetails({...processingDetails, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Completion
                  </label>
                  <input
                    type="date"
                    value={processingDetails.estimatedCompletion}
                    onChange={(e) => setProcessingDetails({...processingDetails, estimatedCompletion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Team
                  </label>
                  <input
                    type="text"
                    value={processingDetails.assignedTeam}
                    onChange={(e) => setProcessingDetails({...processingDetails, assignedTeam: e.target.value})}
                    placeholder="Enter team name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={processingDetails.notes}
                    onChange={(e) => setProcessingDetails({...processingDetails, notes: e.target.value})}
                    placeholder="Additional processing notes..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowProcessingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProcessingDetails}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        )}
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
  
export default RetailerOrdersManagement;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client"; 
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Bell,
  Ship, 
  Zap, 
  LogOut, 
  Search,BrainCircuit, 
  Building, 
  MapPin, 
  ArrowLeft,
  Eye,
  Calendar,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Check,
  CheckCircle,
  Clock,
  AlertTriangle,
  Thermometer,
  Droplets,
  Fish,
  Anchor,
  Waves,
  OctagonAlert,
  AlertCircle,
  Scale,
  Filter,
  SortAsc,
  RefreshCw,
  Download
} from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const SOCKET_URL = 'http://localhost:5000';

// ==================== Socket.IO Manager ====================
class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  initialize(userId, role = 'retailer') {
    if (this.socket && this.connected) return this.socket;
    
    this.userId = userId;
    console.log('🔌 Initializing Socket.IO connection for user:', userId);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      query: { userId, role }
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      this.socket.emit('join-wholesaler', this.userId);
      console.log(`👤 Joined wholesaler room: ${this.userId}`);
      
      this.emitToListeners('connect', { userId: this.userId });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.connected = false;
      this.emitToListeners('connect_error', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server. Reason:', reason);
      this.connected = false;
      this.emitToListeners('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.socket) this.socket.connect();
        }, 1000);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.connected = true;
      this.socket.emit('join-wholesaler', this.userId);
      this.emitToListeners('reconnect', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
      this.emitToListeners('reconnect_attempt', { attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed');
      this.emitToListeners('reconnect_failed', {});
    });

    this.socket.on('orderUpdate', (data) => {
      console.log('📦 Order update received:', data);
      this.emitToListeners('orderUpdate', data);
    });

    this.socket.on('inventoryAlert', (data) => {
      console.log('⚠️ Inventory alert received:', data);
      this.emitToListeners('inventoryAlert', data);
    });

    this.socket.on('newOrder', (data) => {
      console.log('🛒 New order notification:', data);
      this.emitToListeners('newOrder', data);
    });

    this.socket.on('qualityAlert', (data) => {
      console.log('🚨 Quality alert received:', data);
      this.emitToListeners('qualityAlert', data);
    });

    this.socket.on('stockUpdate', (data) => {
      console.log('📊 Stock update received:', data);
      this.emitToListeners('stockUpdate', data);
    });

    this.socket.on('priceChange', (data) => {
      console.log('💰 Price change received:', data);
      this.emitToListeners('priceChange', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    if (this.socket && this.connected) {
      this.socket.on(event, callback);
    }
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      console.log('🧹 Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Global socket manager instance
const socketManager = new SocketManager();

// Custom hook for using socket
const useSocket = () => {
  const [connected, setConnected] = useState(socketManager.isConnected());
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = () => setConnected(false);

    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('connect_error', handleConnectError);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.id && !socketManager.isConnected()) {
      socketManager.initialize(userData.id, userData.role || 'retailer');
    }

    return () => {
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('connect_error', handleConnectError);
    };
  }, []);

  const emit = (event, data) => socketManager.emit(event, data);
  const on = (event, callback) => socketManager.on(event, callback);
  const off = (event, callback) => socketManager.off(event, callback);

  return {
    socket: socketManager.getSocket(),
    connected,
    lastEvent,
    emit,
    on,
    off,
    isConnected: socketManager.isConnected,
    disconnect: socketManager.disconnect
  };
};

// ==================== End Socket.IO Manager ====================

// Simple cn utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');
const getImageUrl = (imagePath) => {
  console.log('🖼️ Original imagePath:', imagePath);
  
  // Handle null/undefined/empty cases
  if (!imagePath || 
      imagePath === 'No image' || 
      imagePath === 'NULL' || 
      imagePath === 'null' ||
      imagePath === 'undefined' ||
      imagePath === '') {
    console.log('❌ No valid image path');
    return null;
  }
  
  // If it's already a full URL
  if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
    console.log('✅ Already a full URL:', imagePath);
    return imagePath;
  }
  
  // If it's a blob URL (for new uploads)
  if (imagePath.startsWith('blob:')) {
    console.log('✅ Blob URL:', imagePath);
    return imagePath;
  }
  
  // If it's a base64 string
  if (imagePath.startsWith('data:image')) {
    console.log('✅ Base64 image');
    return imagePath;
  }
  
  // Check if it's a path that includes uploads
  let filename = imagePath;
  
  // Extract filename from path
  if (imagePath.includes('/')) {
    // Get the last part after the last slash
    const parts = imagePath.split('/');
    filename = parts[parts.length - 1];
    console.log('📁 Extracted filename:', filename, 'from path:', imagePath);
  }
  
  // Clean up the filename (remove any URL encoding or query params)
  const cleanFilename = decodeURIComponent(filename.split('?')[0]);
  
  // Construct the URL
  const imageUrl = `http://localhost:5000/uploads/${cleanFilename}`;
  console.log('🔗 Constructed URL:', imageUrl);
  
  return imageUrl;
};

const API_BASE_URL = 'http://localhost:5000/api';

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

// Cart Context
const CartContext = React.createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
// Updated addToCart function in CartProvider
const addToCart = (product, quantity = 1) => {
  const existingItem = cart.find(item => item.id === product.id);
  
  // Get the price from the correct field - product might have price_per_kg or price
  const unitPrice = parseFloat(product.price_per_kg || product.price || product.unit_price || 0);
  
  if (existingItem) {
    setCart(cart.map(item => 
      item.id === product.id 
        ? { 
            ...item, 
            quantity: item.quantity + quantity,
            unit_price: unitPrice,
            price_per_kg: unitPrice // Also store it as price_per_kg for consistency
          }
        : item
    ));
  } else {
    setCart([...cart, {
      ...product,
      quantity: quantity,
      unit_price: unitPrice,
      price_per_kg: unitPrice, // Make sure price_per_kg is set
      cartId: `${product.id}-${Date.now()}`,
      product_name: product.name || product.seafood_type,
      product_id: product.id,
      supplier_id: product.supplier_id
    }]);
  }
};
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateCartQuantity = (cartId, quantity) => {
    if (quantity < 1) {
      removeFromCart(cartId);
      return;
    }
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, quantity: quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedSupplier(null);
  };
const getCartTotals = () => {
  const subtotal = cart.reduce((sum, item) => {
    // Try multiple possible price fields
    const unitPrice = parseFloat(
      item.price_per_kg || 
      item.unit_price || 
      item.price || 
      0
    );
    return sum + (unitPrice * item.quantity);
  }, 0);
  
  const gst = subtotal * 0.18;
  const total = subtotal + gst;
  
  return { 
    subtotal: parseFloat(subtotal.toFixed(2)), 
    gst: parseFloat(gst.toFixed(2)), 
    total: parseFloat(total.toFixed(2)), 
    items: cart.length,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  };
};
  return (
    <CartContext.Provider value={{
      cart,
      selectedSupplier,
      setSelectedSupplier,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotals
    }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Sidebar Component with White and Navy Blue Theme
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: ShoppingCart, label: "Retailer Catalog", id: "catalog" },
    { icon: FileText, label: "Order", id: "orders" },
    {icon: BrainCircuit, label: "AI Module", id: "ai" },
  ];

  const bottomItems = [
    { icon: Bell, label: "Notifications", id: "notifications" },
    { icon: Ship, label: "Shipment", id: "shipment" },
    { icon: Zap, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/catalog')) return 'catalog';
    if (path.includes('/dispatch')) return 'dispatch';
    if (path.includes('/AI Module')) return 'ai';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'catalog';
  };

  const activeItem = getActiveItem();

  const handleNavigation = (itemId) => {
    switch(itemId) {
      case 'dashboard':
        navigate('/Retailer/dashboard');
        break;
      case 'inventory':
        navigate('/Retailer/inventory');
        break;
      case 'catalog':
        navigate('/Retailer/catalog');
        break;
      case 'orders':
        navigate('/Retailer/orders');
        break;
      case 'dispatch':
        navigate('/Retailer/dispatch');
        break;
      case 'ai':
        navigate('/Retailer/ai');
        break;
      default:
        navigate('/Retailer/dashboard');
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
            <p className="text-xs text-blue-700">Retailer</p>
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

      <nav className="px-3 py-4 space-y-1 border-t border-gray-200">
        {bottomItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-900 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <IconComponent className="w-5 h-5 text-blue-700" />
              {item.label}
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

// Product Details Modal Component with White Theme
const ProductDetailsModal = ({ product, onClose, onAddToCart }) => {
  const { addToCart, selectedSupplier } = useCart();
  const [quantity, setQuantity] = useState(1);
  const imageUrl = getImageUrl(product.image);

  const handleAddToCart = () => {
    if (!selectedSupplier) {
      alert("Please select a supplier first!");
      return;
    }
    
    if (quantity > product.stock_qty) {
      alert(`Only ${product.stock_qty} units available!`);
      return;
    }
    
    addToCart(product, quantity);
    alert(`Added ${quantity} ${product.seafood_type} to cart`);
    if (onAddToCart) onAddToCart();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Seafood Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.seafood_type}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Fish className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <span>No Image Available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.seafood_type}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-green-600 font-bold text-2xl">
                    ${parseFloat(product.price_per_kg || product.price || 0).toFixed(2)}/kg
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    product.quantity_kg > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity_kg > 0 ? `${product.quantity_kg} kg in stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-gray-700 font-medium mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600 text-sm">Supplier</label>
                    <p className="text-gray-900">{product.company_name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Category</label>
                    <p className="text-gray-900">{product.category || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Batch Number</label>
                    <p className="text-gray-900">{product.batch_id || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Catch Date</label>
                    <p className="text-gray-900">{product.catch_date || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Expiry Date</label>
                    <p className="text-gray-900">{product.expiry_date || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">GST %</label>
                    <p className="text-gray-900">18%</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Processing Status</label>
                    <p className="text-gray-900">{product.processing_status || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Storage Condition</label>
                    <p className="text-gray-900">{product.storage_condition || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-blue-700 font-medium mb-3 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  IoT Sensor Data
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-600 text-sm">Temperature</label>
                    <p className={`text-lg font-medium ${
                      product.temperature < 0 ? 'text-blue-600' : 
                      product.temperature > 5 ? 'text-red-600' : 
                      'text-green-600'
                    }`}>
                      {product.temperature || 0}°C
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Humidity</label>
                    <p className={`text-lg font-medium ${
                      product.humidity > 80 ? 'text-red-600' : 
                      product.humidity < 70 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {product.humidity || 0}%
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm">Ammonia</label>
                    <p className={`text-lg font-medium ${
                      product.ammonia > 3 ? 'text-red-600' : 
                      product.ammonia > 2 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {product.ammonia || 0} ppm
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-gray-700 font-medium mb-3">Quality Status</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      let quality = "Fresh";
                      let color = "text-green-600";
                      let icon = <CheckCircle className="w-5 h-5" />;
                      
                      if (product.temperature > 5 || product.ammonia > 3) {
                        quality = "Spoiled";
                        color = "text-red-600";
                        icon = <AlertTriangle className="w-5 h-5" />;
                      } else if (product.temperature > 3 || product.ammonia > 2) {
                        quality = "Warning";
                        color = "text-yellow-600";
                        icon = <AlertCircle className="w-5 h-5" />;
                      }
                      
                      return (
                        <>
                          <div className={color}>
                            {icon}
                          </div>
                          <span className={`text-lg font-medium ${color}`}>
                            {quality}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <span className="text-gray-500 text-sm">
                    Last updated: {product.last_updated ? new Date(product.last_updated).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-700 font-medium mb-2 block">Quantity (kg)</label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="px-6 py-2 text-gray-900 font-medium text-lg w-16 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(prev => Math.min(product.quantity_kg, prev + 1))}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSupplier || product.quantity_kg <= 0}
                    className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                      !selectedSupplier || product.quantity_kg <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                  >
                    Add to Cart
                  </button>
                </div>
                
                {!selectedSupplier && (
                  <p className="text-red-600 text-sm mt-2">
                    Please select a supplier first to add items to cart
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const ProductCard = ({ product, onViewDetails }) => {
  const { addToCart, selectedSupplier } = useCart();
  const [quantity, setQuantity] = useState(1);
  const imageUrl = getImageUrl(product.image);
  
  // Add debug logging
  useEffect(() => {
    console.log('🖼️ Product Card Debug:', {
      productId: product.id,
      productName: product.seafood_type,
      originalImage: product.image,
      processedImageUrl: imageUrl,
      hasImage: !!imageUrl
    });
  }, [product, imageUrl]);

  // Fix: Define getQualityStatus function inside the component
  const getQualityStatus = () => {
    const { temperature, ammonia } = product;
    
    if (temperature > 5 || ammonia > 3) {
      return { status: "Spoiled", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-3 h-3" /> };
    } else if (temperature > 3 || ammonia > 2) {
      return { status: "Warning", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-3 h-3" /> };
    } else {
      return { status: "Fresh", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
    }
  };

  const quality = getQualityStatus();

  const handleAddToCart = () => {
    if (!selectedSupplier) {
      alert("Please select a supplier first!");
      return;
    }
    
    if (quantity > product.quantity_kg) {
      alert(`Only ${product.quantity_kg} kg available!`);
      return;
    }
    
    addToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-900 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      <div 
        className="relative h-48 bg-gray-100 cursor-pointer group"
        onClick={() => onViewDetails(product)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.seafood_type}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => console.log(`✅ Image loaded successfully: ${imageUrl}`)}
            onError={(e) => {
              console.error(`❌ Failed to load image: ${imageUrl}`);
              console.error('Image error details:', {
                src: e.target.src,
                product: product.seafood_type,
                originalPath: product.image
              });
              e.target.onerror = null;
              // Show fallback
              e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="%23e5e7eb"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Image Failed</text></svg>`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Fish className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <span className="text-sm">No Image</span>
              {product.image && (
                <p className="text-xs text-gray-400 mt-1">
                  Path: {product.image.substring(0, 30)}...
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${quality.color}`}>
            {quality.icon}
            {quality.status}
          </span>
        </div>
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <div className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Eye size={16} />
              View Details
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.seafood_type}
        </h3>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-green-600 font-bold text-lg">
            ${parseFloat(product.price_per_kg || product.price || 0).toFixed(2)}/kg
          </span>
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${quality.color}`}>
            {quality.icon}
            {quality.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
          <Building size={14} />
          <span className="truncate">{product.company_name || product.supplier_name}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Scale size={14} />
            <span>{product.quantity_kg || product.quantity || 0} kg available</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer size={14} />
            <span>{product.temperature || 0}°C</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Minus size={16} />
            </button>
            <span className="px-3 py-1 text-gray-900 font-medium w-12 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(prev => Math.min(product.quantity_kg || product.quantity || 0, prev + 1))}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!selectedSupplier || !product.quantity_kg || product.quantity_kg <= 0}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              !selectedSupplier || !product.quantity_kg || product.quantity_kg <= 0
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800 text-white'
            }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
// Cart Sidebar Component with White Theme
const CartSidebar = ({ isOpen, onClose, onPlaceOrder }) => {
  const { 
    cart, 
    selectedSupplier, 
    removeFromCart, 
    updateCartQuantity,
    clearCart,
    getCartTotals 
  } = useCart();
  
  const totals = getCartTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {selectedSupplier && (
            <div className="mt-2 text-sm text-gray-600">
              Ordering from: <span className="text-blue-900 font-medium">{selectedSupplier.businessName}</span>
            </div>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-gray-400 text-sm mt-1">
              Add seafood products from the catalog
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              {cart.map(item => (
                <div key={item.cartId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-gray-900 font-medium mb-1">{item.seafood_type}</h4>
                      <p className="text-gray-600 text-sm mb-2">
                        ${(item.price_per_kg || item.unit_price || 0).toFixed(2)} per kg
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.cartId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-gray-900 font-medium w-8 text-center">
                            {item.quantity} kg
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.cartId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">
                            ${((item.price_per_kg || item.unit_price || 0) * item.quantity).toFixed(2)}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartId)}
                            className="text-red-600 hover:text-red-700 text-sm mt-1"
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totals.itemCount} kg)</span>
                  {/* CHANGED: Use totals.subtotal instead of $0.00 */}
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  {/* CHANGED: Use totals.gst instead of $0.00 */}
                  <span>${totals.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-gray-300">
                  <span>Total</span>
                  {/* CHANGED: Use totals.total instead of $0.00 */}
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  onClose();
                  onPlaceOrder();
                }}
                disabled={!selectedSupplier}
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  !selectedSupplier
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <CheckCircle size={18} />
                Proceed to Order Summary ({cart.length} items)
              </button>
              
              {!selectedSupplier && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  Please select a supplier first
                </p>
              )}
              
              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Order Summary Component with White Theme
const OrderSummary = ({ onBack, onSubmit }) => {
  const navigate = useNavigate();
  const { cart, selectedSupplier, clearCart, getCartTotals } = useCart();
  const [loading, setLoading] = useState(false);
  const [wholesalerInfo, setWholesalerInfo] = useState(null);
  const [formData, setFormData] = useState({
    payment_mode: "online",
    delivery_address: "",
    preferred_delivery_date: "",
    notes: "",
    storage_requirements: "chilled"
  });

  const totals = getCartTotals();
  const orderId = `SEA-ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  useEffect(() => {
    const fetchWholesalerInfo = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
          console.log('🔍 Fetching wholesaler info for user:', userData.id);
          const response = await axios.get(`${API_BASE_URL}/wholesalers/user/${userData.id}`);
          
          if (response.data) {
            console.log('✅ Wholesaler info received:', response.data);
            setWholesalerInfo(response.data);
            
            setFormData(prev => ({
              ...prev,
              delivery_address: response.data.warehouseAddress || response.data.businessAddress || ""
            }));
          }
        }
      } catch (error) {
        console.error("❌ Error fetching wholesaler info:", error);
        alert("Could not fetch your warehouse address. Please enter it manually.");
      }
    };
    
    fetchWholesalerInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!userData.id) {
        alert('Please log in again');
        return;
      }

      if (!selectedSupplier || !selectedSupplier.id) {
        alert('Please select a supplier first');
        return;
      }

      const items = cart.map(item => ({
        product_id: item.id,
        seafood_type: item.seafood_type,
        quantity_kg: parseInt(item.quantity),
        unit_price: parseFloat(item.price_per_kg || item.unit_price),
        gst_percentage: 18.00,
        quality_status: item.quality_status || "Fresh"
      }));

      const subtotal = cart.reduce((sum, item) => {
        const unitPrice = parseFloat(item.price_per_kg || item.unit_price) || 0;
        return sum + (item.quantity * unitPrice);
      }, 0);
      
      const gst_amount = subtotal * 0.18;
      const total_amount = subtotal + gst_amount;

      const orderData = {
        wholesaler_id: parseInt(userData.id),
        supplier_id: parseInt(selectedSupplier.id),
        items: items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        gst_amount: parseFloat(gst_amount.toFixed(2)),
        total_amount: parseFloat(total_amount.toFixed(2)),
        delivery_address: formData.delivery_address.trim(),
        storage_requirements: formData.storage_requirements,
        payment_mode: formData.payment_mode,
        preferred_delivery_date: formData.preferred_delivery_date || null,
        notes: formData.notes || "",
        payment_status: 'pending'
      };

      console.log('📤 Sending seafood order:', orderData);

      const response = await axios.post(`${API_BASE_URL}/orders/seafood/multi`, orderData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Order response:', response.data);
      
      if (response.data.success) {
        alert(`✅ Order placed successfully! Order ID: ${response.data.order.order_id}`);
        clearCart();
        navigate('/wholesaler/orders');
      } else {
        throw new Error(response.data.message || 'Order failed');
      }

    } catch (error) {
      console.error('❌ Order submission error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to place order. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Summary</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Order ID</label>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg font-mono border border-gray-300">
                    {orderId}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Supplier ID</label>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300">
                    {selectedSupplier?.id || "Auto"}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Wholesaler ID</label>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300">
                    {JSON.parse(localStorage.getItem('userData') || '{}').id || "Auto"}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">GST %</label>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300">
                    18% (Auto)
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-medium">
                    Delivery Address *
                  </label>
                  {wholesalerInfo?.warehouseAddress && (
                    <span className="text-xs text-blue-900">
                      Auto-filled from your warehouse address
                    </span>
                  )}
                </div>
                <textarea
                  value={formData.delivery_address}
                  onChange={e => setFormData({...formData, delivery_address: e.target.value})}
                  required
                  rows="3"
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter warehouse address for delivery"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Storage Requirements *
                </label>
                <select
                  value={formData.storage_requirements}
                  onChange={e => setFormData({...formData, storage_requirements: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="chilled">Chilled (0-4°C)</option>
                  <option value="frozen">Frozen (-18°C or below)</option>
                  <option value="dry">Dry Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Payment Mode *
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={e => setFormData({...formData, payment_mode: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="online">Online Payment</option>
                  <option value="cash">Cash on Delivery</option>
                  <option value="credit">Credit Terms</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Preferred Delivery Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.preferred_delivery_date}
                  onChange={e => setFormData({...formData, preferred_delivery_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                  placeholder="Any special instructions or handling requirements..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } text-white flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Place Seafood Order ({cart.length} items)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-bold mb-4">Supplier Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                <Fish size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">{selectedSupplier?.businessName}</p>
                <p className="text-gray-600 text-sm">
                  {selectedSupplier?.state}, {selectedSupplier?.country}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  ID: {selectedSupplier?.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-bold mb-4">Order Items ({cart.length})</h3>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.cartId} className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{item.seafood_type}</p>
                    <div className="text-gray-600 text-sm">
                      {item.quantity} kg × ${item.price_per_kg.toFixed(2)}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Quality: {item.quality_status || "Fresh"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 font-medium">
                      ${(item.quantity * item.price_per_kg).toFixed(2)}
                    </div>
                    <div className="text-gray-600 text-xs">
                      GST: ${(item.quantity * item.price_per_kg * 0.18).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 font-bold mb-4">Price Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%)</span>
                <span className="text-yellow-600">${totals.gst.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-bold text-lg">Total</span>
                  <span className="text-green-600 font-bold text-xl">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced RealTimeNotifications Component with white theme
const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { connected, on } = useSocket();

  useEffect(() => {
    const unsubscribers = [
      on('orderUpdate', (data) => {
        addNotification({
          type: 'order',
          title: `Order ${data.status}`,
          message: data.message || `Seafood Order ${data.orderId} is now ${data.status}`,
          timestamp: new Date().toISOString(),
          data
        });
      }),
      
      on('inventoryAlert', (data) => {
        addNotification({
          type: 'alert',
          title: 'Inventory Alert',
          message: data.message || `Low stock alert for ${data.product_name}`,
          timestamp: new Date().toISOString(),
          data
        });
      }),
      
      on('newOrder', (data) => {
        addNotification({
          type: 'new',
          title: 'New Order',
          message: data.message || `New order ${data.orderId} from supplier`,
          timestamp: new Date().toISOString(),
          data
        });
      }),
      
      on('qualityAlert', (data) => {
        addNotification({
          type: 'warning',
          title: 'Quality Alert',
          message: data.message || `Quality issue detected for ${data.product_name}`,
          timestamp: new Date().toISOString(),
          data
        });
      }),
      
      on('stockUpdate', (data) => {
        addNotification({
          type: 'update',
          title: 'Stock Updated',
          message: data.message || `Stock updated for ${data.product_name}`,
          timestamp: new Date().toISOString(),
          data
        });
      }),
      
      on('priceChange', (data) => {
        addNotification({
          type: 'price',
          title: 'Price Change',
          message: data.message || `Price changed for ${data.product_name}`,
          timestamp: new Date().toISOString(),
          data
        });
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub?.());
    };
  }, [on]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: logo
      });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: logo
          });
        }
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order': return <Package size={16} className="text-blue-600" />;
      case 'alert': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'new': return <ShoppingCart size={16} className="text-green-600" />;
      case 'warning': return <OctagonAlert size={16} className="text-red-600" />;
      case 'update': return <RefreshCw size={16} className="text-purple-600" />;
      case 'price': return <DollarSign size={16} className="text-green-600" />;
      default: return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'order': return 'bg-blue-100 border-blue-200';
      case 'alert': return 'bg-yellow-100 border-yellow-200';
      case 'new': return 'bg-green-100 border-green-200';
      case 'warning': return 'bg-red-100 border-red-200';
      case 'update': return 'bg-purple-100 border-purple-200';
      case 'price': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
      >
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-gray-700" />
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </div>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-300 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
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
              notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${getNotificationColor(notif.type)} border-l-4`}
                  onClick={() => {
                    console.log('Notification clicked:', notif);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-300">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 truncate">{notif.title}</h4>
                        <span className="text-gray-500 text-xs whitespace-nowrap ml-2">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mt-1 break-words">{notif.message}</p>
                      {notif.data && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <pre className="text-xs text-gray-500 overflow-x-auto">
                            {JSON.stringify(notif.data, null, 2)}
                          </pre>
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
      )}
    </div>
  );
};

// Main WholesalerSeafoodCatalog Component with White Theme
const RetailerCatalog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("suppliers");
  const [showCart, setShowCart] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    quality: "",
    minPrice: "",
    maxPrice: ""
  });
  const [userData, setUserData] = useState({
    name: 'Not provided',
    email: 'Not provided',
    phone: 'Not provided',
    businessName: 'Not provided'
  });

  const { connected, on, emit } = useSocket();
  
  const { 
    cart, 
    selectedSupplier, 
    setSelectedSupplier,
    clearCart,
    getCartTotals 
  } = useCart();

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

  useEffect(() => {
    const unsubscribe = on('stockUpdate', (data) => {
      console.log('📊 Received stock update:', data);
      
      if (selectedSupplier && data.supplier_id === selectedSupplier.id) {
        fetchSupplierProducts(selectedSupplier.id);
        alert(`Stock updated: ${data.product_name} now has ${data.new_stock} kg available`);
      }
    });

    const unsubscribePrice = on('priceChange', (data) => {
      console.log('💰 Received price change:', data);
      
      if (selectedSupplier && data.supplier_id === selectedSupplier.id) {
        fetchSupplierProducts(selectedSupplier.id);
        alert(`Price changed: ${data.product_name} is now $${data.new_price}/kg`);
      }
    });

    const unsubscribeQuality = on('qualityAlert', (data) => {
      console.log('🚨 Received quality alert:', data);
      
      if (selectedSupplier && data.supplier_id === selectedSupplier.id) {
        fetchSupplierProducts(selectedSupplier.id);
        alert(`⚠️ Quality Alert: ${data.product_name} - ${data.message}`);
      }
    });

    return () => {
      unsubscribe?.();
      unsubscribePrice?.();
      unsubscribeQuality?.();
    };
  }, [selectedSupplier, on]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching suppliers from:", `${API_BASE_URL}/companies?role=supplier`);
      
      const res = await axios.get(`${API_BASE_URL}/companies?role=supplier`);
      
      console.log("✅ Suppliers API response:", res);
      console.log("📋 Suppliers data:", res.data);
      
      if (res.data && Array.isArray(res.data)) {
        console.log(`✅ Found ${res.data.length} suppliers`);
        setSuppliers(res.data);
      } else {
        console.warn("⚠️ Unexpected response format:", res.data);
        setSuppliers([]);
      }
    } catch (error) {
      console.error("❌ Error fetching suppliers:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async (supplierId) => {
    try {
      setLoading(true);
      console.log("🔄 Fetching products for supplier:", supplierId);
      console.log("📞 API URL:", `${API_BASE_URL}/inventory/supplier/${supplierId}`);
      
      const res = await axios.get(`${API_BASE_URL}/inventory/supplier/${supplierId}`);
      
      console.log("✅ Products API response:", res);
      console.log("📋 Products data:", res.data);
      
      if (res.data && Array.isArray(res.data)) {
        console.log(`✅ Found ${res.data.length} products`);
        setProducts(res.data);
      } else {
        console.warn("⚠️ Unexpected response format:", res.data);
        setProducts([]);
      }
      setView("products");
    } catch (error) {
      console.error("❌ Error fetching seafood products:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      setView("products");
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierProducts(supplier.id);
    
    if (connected) {
      emit('join-supplier-room', { 
        supplierId: supplier.id,
        wholesalerId: JSON.parse(localStorage.getItem('userData') || '{}').id 
      });
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setShowCart(false);
    setView("order-summary");
  };

  const handleOrderSuccess = () => {
    clearCart();
    navigate('/wholesaler/orders');
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesQuality = !filters.quality || product.quality_status === filters.quality;
    const price = parseFloat(product.price_per_kg || product.price || 0);
    const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);
    
    return matchesCategory && matchesQuality && matchesMinPrice && matchesMaxPrice;
  });

  const totals = getCartTotals();

  const seafoodCategories = [
    "Fish", "Shellfish", "Crustaceans", "Mollusks", "Cephalopods", "Other"
  ];

  const qualityOptions = [
    "Fresh", "Warning", "Spoiled", "Premium", "Grade A"
  ];

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8 min-h-full">
          {/* Header */}
          <div className="mb-8">
            {view === "suppliers" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <Fish className="text-blue-900" />
                      Seafood Supplier Directory
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Select a supplier to view and order fresh seafood
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <RealTimeNotifications />
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-500">
                        {connected ? 'Live Connected' : 'Disconnected'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setShowCart(true)}
                      className="relative flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                      <ShoppingCart size={20} />
                      Cart
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                    
                    <ProfileDropdown userData={userData} onLogout={handleLogout} />
                  </div>
                </div>
                
                <div className="flex justify-center mb-8">
                  <div className="relative w-full max-w-xl">
                    <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search seafood suppliers by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 bg-white text-gray-900 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {view === "products" && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedSupplier(null);
                    setProducts([]);
                    setView("suppliers");
                  }}
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-800"
                >
                  <ArrowLeft size={20} />
                  Back to Suppliers
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedSupplier?.businessName}'s Seafood Products
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {filteredProducts.length} products available
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowCart(true)}
                    className="relative flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    <ShoppingCart size={18} />
                    View Cart
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {view === "order-summary" && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("products")}
                  className="flex items-center gap-2 text-blue-900 hover:text-blue-800"
                >
                  <ArrowLeft size={20} />
                  Back to Products
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Seafood Order Summary ({cart.length} items)
                </h1>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {/* Suppliers View */}
          {!loading && view === "suppliers" && (
            <>
              {filteredSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSupplierClick(supplier)}
                      className="bg-white shadow-md rounded-xl p-6 border border-gray-200 hover:border-blue-900 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-900 rounded-lg mb-4 mx-auto group-hover:bg-blue-800 transition-colors">
                        <Fish className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
                        {supplier.businessName}
                      </h2>
                      <div className="flex items-center gap-2 text-gray-600 justify-center mb-2">
                        <MapPin size={16} className="text-blue-900" />
                        <span className="text-sm">
                          {supplier.state}, {supplier.country}
                        </span>
                      </div>
                      <div className="text-center text-gray-500 text-sm mb-4">
                        {supplier.role === 'supplier' ? 'Seafood Supplier' : 'Manufacturer'}
                      </div>
                      <div className="pt-3 border-t border-gray-200 mt-4">
                        <span className="text-blue-900 text-sm group-hover:text-blue-800">
                          View Seafood Products →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 bg-white rounded-lg p-8 border border-gray-200">
                  <div className="text-4xl mb-4">🐟</div>
                  <p className="text-lg">No seafood suppliers found</p>
                </div>
              )}
            </>
          )}

          {/* Products View with Filters */}
          {!loading && view === "products" && (
            <>
              <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">All Categories</option>
                        {seafoodCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Quality</label>
                      <select
                        value={filters.quality}
                        onChange={(e) => setFilters({...filters, quality: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">All Qualities</option>
                        {qualityOptions.map(quality => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Min Price ($/kg)</label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Max Price ($/kg)</label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({
                        category: "",
                        quality: "",
                        minPrice: "",
                        maxPrice: ""
                      })}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 border border-gray-300 transition-colors"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => fetchSupplierProducts(selectedSupplier?.id)}
                      className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 bg-white rounded-lg p-8 border border-gray-200">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-lg">No seafood products available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              )}
            </>
          )}

          {/* Order Summary View */}
          {!loading && view === "order-summary" && (
            <OrderSummary
              onBack={() => setView("products")}
              onSubmit={handleOrderSuccess}
            />
          )}

          {/* Product Details Modal */}
          {showProductDetails && selectedProduct && (
            <ProductDetailsModal
              product={selectedProduct}
              onClose={() => {
                setShowProductDetails(false);
                setSelectedProduct(null);
              }}
              onAddToCart={() => {
                setShowProductDetails(false);
                setSelectedProduct(null);
              }}
            />
          )}

          {/* Cart Sidebar */}
          <CartSidebar
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </main>
    </div>
  );
};

// Export the component wrapped with CartProvider
export default function RetailerCatalogwrapper() {
  return (
    <CartProvider>
      <RetailerCatalog />
    </CartProvider>
  );
}
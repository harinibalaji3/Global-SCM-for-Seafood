import React, { useState, useEffect,useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import TestAISTracker from './TestAisTracker'; // This should now work
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
  ShoppingBag,
  MapPin,
  Navigation,
  Compass,
  TrendingUp,
  Target,
  History,
  List,
  Anchor,
  Globe,
  Grid,
  Columns
} from "lucide-react";
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const API_BASE_URL = 'http://localhost:5000/api';

// Simple cn utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');
// =================== UTILITY FUNCTIONS ===================

// Notification utility functions
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATE: 'order_update',
  INVENTORY_ALERT: 'inventory_alert',
  SHIPMENT_UPDATE: 'shipment_update',
  SUPPLIER_ACTION: 'supplier_action'
};

const getNotificationStorageKey = (userId) => {
  return `supplier_notifications_${userId}`;
};

const saveNotificationsToStorage = (userId, notifications) => {
  try {
    if (!userId) {
      console.error('❌ Cannot save notifications: No user ID provided');
      return false;
    }

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
    console.error('❌ Error saving notifications to localStorage:', error);
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
      let notifications;
      if (Array.isArray(data)) {
        notifications = data;
        saveNotificationsToStorage(userId, notifications);
      } else if (data && Array.isArray(data.notifications)) {
        notifications = data.notifications;
      } else {
        notifications = [];
      }
      return notifications;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading notifications from localStorage:', error);
    return [];
  }
};

// Order persistence utilities
const getOrdersStorageKey = (userId) => {
  return `supplier_orders_${userId}`;
};

const saveOrderToLocalStorage = (order) => {
  try {
    const user = getUserData();
    if (!user?.id) return false;
    
    const storageKey = getOrdersStorageKey(user.id);
    const savedOrders = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    savedOrders[order.order_id] = {
      ...order,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(savedOrders));
    return true;
  } catch (error) {
    console.error('❌ Error saving order to localStorage:', error);
    return false;
  }
};

const loadOrdersFromLocalStorage = (userId) => {
  try {
    if (!userId) return {};
    const storageKey = getOrdersStorageKey(userId);
    const savedOrders = localStorage.getItem(storageKey);
    
    if (savedOrders) {
      return JSON.parse(savedOrders);
    }
    return {};
  } catch (error) {
    console.error('❌ Error loading orders from localStorage:', error);
    return {};
  }
};

const removeOrderFromLocalStorage = (orderId) => {
  try {
    const user = getUserData();
    if (!user?.id) return false;
    
    const storageKey = getOrdersStorageKey(user.id);
    const savedOrders = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    delete savedOrders[orderId];
    localStorage.setItem(storageKey, JSON.stringify(savedOrders));
    
    return true;
  } catch (error) {
    console.error('❌ Error removing order from localStorage:', error);
    return false;
  }
};

// User data utility
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
 
// =================== COMPONENTS ===================

// MMSI Tracking Card Component
const MMSITrackingCard = ({ trackingData, onViewLiveMap }) => {
  if (!trackingData) return null;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getTimeRemaining = (eta) => {
    if (!eta) return 'Calculating...';
    const now = new Date();
    const etaDate = new Date(eta);
    const diffMs = etaDate - now;
    
    if (diffMs <= 0) return 'Arrived';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    }
    return `${diffHours}h remaining`;
  };

  const calculateProgress = () => {
    if (!trackingData.distance_traveled || !trackingData.total_distance) return 0;
    return Math.min(100, Math.round((trackingData.distance_traveled / trackingData.total_distance) * 100));
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'loading': return 'bg-blue-100 text-blue-800';
      case 'under_way': return 'bg-green-100 text-green-800';
      case 'at_anchor': return 'bg-yellow-100 text-yellow-800';
      case 'moored': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Container #{trackingData.containerId}</h3>
              <p className="text-blue-100 text-sm">MMSI: {trackingData.mmsi}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-sm">Order #{trackingData.orderId}</p>
            <p className="text-blue-100 text-xs">{trackingData.product || 'Seafood Container'}</p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Position Section */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">POSITION</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg font-bold">
                  {trackingData.latitude?.toFixed(4) || '13.0827'}, {trackingData.longitude?.toFixed(4) || '80.2707'}
                </span>
              </div>
              <button
                onClick={() => onViewLiveMap(trackingData)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Live Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Speed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {trackingData.speed?.toFixed(1) || '17.4'} knots
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Navigation className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Heading</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {trackingData.heading?.toFixed(1) || '40.4'}°
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trackingData.status)}`}>
              {trackingData.status?.replace('_', ' ') || 'Loading'}
            </span>
          </div>
        </div>

        {/* Route Information */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">ROUTE INFORMATION</h4>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-medium text-gray-900">{trackingData.origin || 'Kochi'}</p>
                <p className="text-sm text-gray-600">Origin</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {calculateProgress()}% Complete
                </div>
                <p className="text-sm text-gray-600">
                  {trackingData.distance_traveled?.toFixed(1) || '90.3'} / {trackingData.total_distance?.toFixed(1) || '615.8'} nm
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{trackingData.destination || 'Vishakhapatnam'}</p>
                <p className="text-sm text-gray-600">Destination</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* ETA Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">ESTIMATED ARRIVAL</h4>
              <p className="text-lg font-bold text-gray-900">
                {trackingData.eta ? formatTime(trackingData.eta).split(',')[0] : '5/2/2026, 3:58:28 PM'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {getTimeRemaining(trackingData.eta)}
              </p>
              <p className="text-sm text-gray-600">remaining</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Updated</span>
            </div>
            <span>{formatTime(trackingData.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Live Map Modal Component
const LiveMapModal = ({ trackingData, onClose }) => {
  const [zoom, setZoom] = useState(10);
  const [center, setCenter] = useState({
    lat: trackingData?.latitude || 13.0827,
    lng: trackingData?.longitude || 80.2707
  });

  const formatCoordinate = (coord) => {
    return coord.toFixed(4);
  };

  const getMapMarkers = () => {
    const markers = [];
    
    // Main ship marker
    if (trackingData) {
      markers.push({
        id: 'main-ship',
        lat: trackingData.latitude,
        lng: trackingData.longitude,
        type: 'ship',
        heading: trackingData.heading,
        speed: trackingData.speed
      });
    }
    
    // Add some random nearby ships for realism
    for (let i = 1; i <= 8; i++) {
      markers.push({
        id: `ship-${i}`,
        lat: center.lat + (Math.random() - 0.5) * 0.5,
        lng: center.lng + (Math.random() - 0.5) * 0.5,
        type: Math.random() > 0.7 ? 'container' : 'cargo',
        heading: Math.random() * 360,
        speed: 10 + Math.random() * 15
      });
    }
    
    return markers;
  };

  const markers = getMapMarkers();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Cargo Tracking Map</h2>
              <p className="text-gray-600">
                Container #{trackingData?.containerId} • MMSI: {trackingData?.mmsi}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex">
          {/* Map View */}
          <div className="flex-1 relative">
            <div className="h-[600px] bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
              {/* Ocean Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-blue-300 opacity-50" />
              
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute h-full w-px bg-blue-400" style={{ left: `${i * 5}%` }} />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-blue-400" style={{ top: `${i * 5}%` }} />
                ))}
              </div>
              
              {/* Map Markers */}
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className={`absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 ${
                    marker.id === 'main-ship' ? 'z-10' : 'z-0'
                  }`}
                  style={{
                    left: `${50 + (marker.lng - center.lng) * 1000}%`,
                    top: `${50 - (marker.lat - center.lat) * 1000}%`,
                    transform: `translate(-50%, -50%) rotate(${marker.heading}deg)`
                  }}
                >
                  <div className={`
                    w-full h-full rounded-full flex items-center justify-center text-white font-bold
                    ${marker.id === 'main-ship' 
                      ? 'bg-red-600 animate-pulse border-4 border-red-300 shadow-lg' 
                      : marker.type === 'container'
                      ? 'bg-blue-600 border-2 border-blue-300 shadow-md'
                      : 'bg-gray-600 border-2 border-gray-300 shadow-md'
                    }
                  `}>
                    {marker.id === 'main-ship' ? '⛴️' : marker.type === 'container' ? '📦' : '🚢'}
                  </div>
                  
                  {/* Ship info tooltip for main ship */}
                  {marker.id === 'main-ship' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl p-3 min-w-[200px]">
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        Container #{trackingData?.containerId}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span className="font-medium">{marker.speed?.toFixed(1)} knots</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Heading:</span>
                          <span className="font-medium">{marker.heading?.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Position:</span>
                          <span className="font-medium">
                            {formatCoordinate(marker.lat)}, {formatCoordinate(marker.lng)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Compass */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 mb-2">Heading</div>
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
                    <div 
                      className="absolute left-1/2 top-1/2 w-1 h-12 bg-red-600 origin-bottom"
                      style={{ 
                        transform: `translate(-50%, -100%) rotate(${trackingData?.heading || 40}deg)`
                      }}
                    />
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">N</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">S</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">W</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">E</div>
                  </div>
                  <div className="mt-2 text-lg font-bold text-blue-600">
                    {trackingData?.heading?.toFixed(1) || '40.4'}°
                  </div>
                </div>
              </div>
              
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
                <button 
                  onClick={() => setZoom(prev => Math.min(prev + 1, 20))}
                  className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setZoom(prev => Math.max(prev - 1, 1))}
                  className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Coordinates Display */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Current Position</div>
                  <div className="font-mono">
                    {formatCoordinate(trackingData?.latitude || 13.0827)}° N, 
                    {formatCoordinate(trackingData?.longitude || 80.2707)}° E
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with Tracking Info */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tracking Details</h3>
              
              {/* Ship Info */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Ship className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Container Ship</div>
                    <div className="text-sm text-gray-600">MMSI: {trackingData?.mmsi}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600">Under Way</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed</span>
                    <span className="font-medium">{trackingData?.speed?.toFixed(1) || '17.4'} knots</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course</span>
                    <span className="font-medium">{trackingData?.heading?.toFixed(1) || '40.4'}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Draught</span>
                    <span className="font-medium">12.5 m</span>
                  </div>
                </div>
              </div>
              
              {/* Route Progress */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Route Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance Traveled</span>
                    <span className="font-medium">{trackingData?.distance_traveled?.toFixed(1) || '90.3'} nm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-medium">
                      {((trackingData?.total_distance || 615.8) - (trackingData?.distance_traveled || 90.3)).toFixed(1)} nm
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Distance</span>
                    <span className="font-medium">{trackingData?.total_distance?.toFixed(1) || '615.8'} nm</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, ((trackingData?.distance_traveled || 90.3) / (trackingData?.total_distance || 615.8)) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{trackingData?.origin || 'Kochi'}</span>
                    <span>{trackingData?.destination || 'Vishakhapatnam'}</span>
                  </div>
                </div>
              </div>
              
              {/* ETA Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Estimated Arrival</h4>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {trackingData?.eta 
                    ? new Date(trackingData.eta).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Feb 5, 3:58 PM'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {(() => {
                    if (!trackingData?.eta) return '1d 6h remaining';
                    const now = new Date();
                    const eta = new Date(trackingData.eta);
                    const diffMs = eta - now;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    if (diffDays > 0) {
                      return `${diffDays}d ${diffHours}h remaining`;
                    }
                    return `${diffHours}h remaining`;
                  })()}
                </div>
              </div>
              
              {/* Weather Info */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Weather Conditions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">Wind</div>
                    <div className="font-bold text-gray-900">15.2 knots</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">Waves</div>
                    <div className="font-bold text-gray-900">2.5 m</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">Visibility</div>
                    <div className="font-bold text-gray-900">Good</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">Temp</div>
                    <div className="font-bold text-gray-900">28°C</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Toast Component (keep existing)
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
    { icon: ShoppingCart, label: "Order", id: "orders" },
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
        navigate('/supplier/dashboard');
        break;
      case 'inventory':
        navigate('/supplier/inventory');
        break;
      case 'orders':
        navigate('/supplier/orders');
        break;
      case 'logistics':
        navigate('/supplier/logistics');
        break;
      case 'ai':
        navigate('/supplier/ai');
        break;
      default:
        navigate('/supplier/dashboard');
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
                    <p className="text-xs text-blue-700">Supplier</p>
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

// =================== FIXED MAIN COMPONENT ===================
const SupplierOrdersManagement = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
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
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [selectedTrackingData, setSelectedTrackingData] = useState(null);
  const [processingDetails, setProcessingDetails] = useState({
    startDate: '',
    estimatedCompletion: '',
    assignedTeam: '',
    notes: ''
  });
 
  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
    { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ];
  
  const getOrdersWithMMSI = useCallback(() => {
  return orders.filter(order => order.mmsi_number && order.container_id && order.cargo_data);
}, [orders]);


  const generateCargoData = useCallback((mmsi, containerId, orderId) => {
    if (!mmsi || !containerId) return null;
    
    const indianOceanCoordinates = [
      { lat: 13.0827, lng: 80.2707 },
      { lat: 19.0760, lng: 72.8777 },
      { lat: 22.5726, lng: 88.3639 },
      { lat: 9.9312, lng: 76.2673 },
      { lat: 17.6868, lng: 83.2185 }
    ];
    
    const randomCoord = indianOceanCoordinates[Math.floor(Math.random() * indianOceanCoordinates.length)];
    
    return {
      containerId: containerId,
      mmsi: mmsi,
      orderId: orderId,
      product: 'Seafood Products',
      quantity: '5000 kg',
      status: Math.random() > 0.5 ? 'under_way' : 'loading',
      origin: 'Chennai Port',
      destination: 'Mumbai Port',
      latitude: randomCoord.lat + (Math.random() - 0.5) * 0.5,
      longitude: randomCoord.lng + (Math.random() - 0.5) * 0.5,
      speed: 10 + Math.random() * 10,
      heading: Math.random() * 360,
      timestamp: new Date().toISOString(),
      progress_percent: Math.random() * 100,
      distance_traveled: Math.random() * 300,
      total_distance: 600 + Math.random() * 400,
      eta: new Date(Date.now() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString()
    };
  }, []);

  const showAISTracking = useCallback((order) => {
    console.log('🚀 Showing AIS Tracking for order:', {
      orderId: order.order_id,
      mmsiNumber: order.mmsi_number,
      containerId: order.container_id,
      hasMMSI: !!order.mmsi_number,
      hasContainer: !!order.container_id,
      orderData: order
    });
    
    if (!order.mmsi_number) {
      alert('This order does not have an MMSI number assigned yet. Please accept the order first.');
      return;
    }
    
    setTrackingModalOrder(order);
  }, []);

  const closeAISTracking = useCallback(() => {
    console.log('🗺️ Closing AIS tracking modal');
    setTrackingModalOrder(null);
  }, []);

  const handleViewLiveMap = useCallback((trackingData) => {
    console.log('🗺️ Opening live map for:', trackingData.containerId);
    setSelectedTrackingData(trackingData);
    setShowLiveMap(true);
  }, []);

  const handleCloseLiveMap = useCallback(() => {
    console.log('🗺️ Closing live map');
    setShowLiveMap(false);
    setSelectedTrackingData(null);
  }, []);

  
  // ⚠️ ALSO MOVE THESE useCallback HOOKS HERE
  const updateCargoPosition = useCallback((cargoData) => {
    console.log('📍 Updating cargo position:', cargoData.containerId);
    setOrders(prev => prev.map(order => {
      if (order.container_id === cargoData.containerId) {
        const updatedOrder = {
          ...order,
          cargo_data: {
            ...order.cargo_data,
            ...cargoData,
            timestamp: new Date().toISOString()
          }
        };
        saveOrderToLocalStorage(updatedOrder);
        return updatedOrder;
      }
      return order;
    }));
  }, []);


  const renderTrackingColumn = useCallback((order) => {
    return (
      <div>
        {order.container_id ? (
          <div className="space-y-2">
            {/* Container ID */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Container ID</p>
              <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300 text-gray-800">
                {order.container_id}
              </code>
            </div>
            
            {/* MMSI Number */}
            {order.mmsi_number && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">MMSI</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-800">
                    {order.mmsi_number}
                  </code>
                  
                  {/* AIS Tracking Button */}
                  <button
                    onClick={() => showAISTracking(order)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    title="View AIS Live Tracking"
                  >
                    <Navigation className="w-3 h-3" />
                    AIS Track
                  </button>
                </div>
              </div>
            )}
            
            {/* Tracking Status */}
            {order.cargo_data && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Tracking Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  order.cargo_data.status === 'under_way' ? 'bg-green-100 text-green-800 border border-green-200' :
                  order.cargo_data.status === 'loading' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  order.cargo_data.status === 'at_anchor' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {order.cargo_data.status?.replace('_', ' ') || 'Not tracking'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500 italic">Not assigned</span>
            {order.order_status === 'pending' && (
              <p className="text-xs text-gray-400 mt-1">Accept order to assign</p>
            )}
          </div>
        )}
      </div>
    );
  }, [showAISTracking]);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchOrders...');
      setLoading(true);
      setError(null);
      const user = getUserData();
      
      if (!user?.id) {
        console.error('❌ No user ID found');
        navigate('/');
        setLoading(false);
        return;
      }

      console.log(`🔍 Fetching orders for supplier: ${user.id}`);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/supplier/${user.id}`, {
          timeout: 10000
        });
        
        let supplierOrders = [];
        
        if (response.data?.orders && Array.isArray(response.data.orders)) {
          supplierOrders = response.data.orders;
        } else if (Array.isArray(response.data)) {
          supplierOrders = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          supplierOrders = response.data.data;
        }
        
        console.log(`📊 API returned ${supplierOrders.length} orders`);
        
        const savedOrders = loadOrdersFromLocalStorage(user.id);
        
        const transformedOrders = supplierOrders.map((order, index) => {
          const orderId = order?.order_id || order?.orderId || order?.id || `ORDER-${index}`;
          const savedOrder = savedOrders[orderId];
          
          // Generate cargo data if MMSI exists but no cargo data
          let cargoData = savedOrder?.cargo_data || order?.cargo_data;
          if ((savedOrder?.mmsi_number || order?.mmsi_number) && !cargoData) {
            cargoData = generateCargoData(
              savedOrder?.mmsi_number || order?.mmsi_number,
              savedOrder?.container_id || order?.container_id,
              orderId
            );
          }
          
          return {
            id: order?.id || order?._id || orderId || index,
            order_id: orderId,
            wholesaler_name: order?.wholesaler_name || order?.wholesalerName || order?.wholesaler?.name || 'Unknown Wholesaler',
            wholesaler_company: order?.wholesaler_company || order?.wholesalerCompany || order?.wholesaler?.company || 'Unknown Company',
            wholesaler_email: order?.wholesaler_email || order?.wholesalerEmail || order?.wholesaler?.email,
            total_amount: order?.total_amount || order?.totalAmount || order?.value || order?.amount || 0,
            order_status: savedOrder?.order_status || order?.order_status || order?.status || order?.orderStatus || 'pending',
            created_at: order?.created_at || order?.createdAt || order?.date || order?.order_date || new Date().toISOString(),
            preferred_delivery_date: order?.preferred_delivery_date || order?.deliveryDate || order?.delivery_date,
            items: order?.items || order?.orderItems || order?.products || [],
            payment_status: order?.payment_status || order?.paymentStatus,
            delivery_address: order?.delivery_address || order?.deliveryAddress || order?.address,
            wholesaler_id: order?.wholesaler_id || order?.wholesalerId || order?.wholesaler?.id,
            mmsi_number: savedOrder?.mmsi_number || order?.mmsi_number,
            container_id: savedOrder?.container_id || order?.container_id,
            cargo_data: cargoData
          };
        });
        
        console.log('✅ Successfully loaded and merged orders');
        setOrders(transformedOrders);
        
      } catch (error) {
        console.error('❌ API Error:', error.message);
        const user = getUserData();
        if (user?.id) {
          const savedOrders = loadOrdersFromLocalStorage(user.id);
          const ordersArray = Object.values(savedOrders);
          
          if (ordersArray.length > 0) {
            console.log(`🔄 Using ${ordersArray.length} orders from localStorage`);
            setOrders(ordersArray);
            setError('API unavailable. Using cached orders.');
          } else {
            const mockOrders = getMockOrders();
            setOrders(mockOrders);
            setError('API unavailable. Using demo data.');
          }
        } else {
          const mockOrders = getMockOrders();
          setOrders(mockOrders);
          setError('API unavailable. Using demo data.');
        }
      }
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setOrders(getMockOrders());
      setError('Unexpected error. Using demo data.');
    } finally {
      setLoading(false);
    }
  }, [navigate, generateCargoData]); 
 
  // Load user data - FIXED useEffect
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
  }, []); // Empty dependency array - runs once on mount

  // Load notifications from localStorage - FIXED useEffect
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    if (storedUser?.id) {
      const savedNotifications = loadNotificationsFromStorage(storedUser.id);
      console.log('📂 Loaded notifications in order management:', savedNotifications.length);
      setNotifications(savedNotifications);
    }
  }, []); // Empty dependency array - runs once on mount


  // Initial fetch orders - FIXED useEffect
  useEffect(() => {
    console.log('🔄 Initial fetchOrders effect running');
    fetchOrders();
  }, [fetchOrders]); // Only depends on fetchOrders

  // Initialize socket connection - FIXED useEffect
  useEffect(() => {
    console.log('🔌 Initializing socket connection...');
    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setSocket(socketInstance);

    const storedUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    if (!storedUser?.id) {
      console.error('❌ No user ID found');
      navigate('/');
      return;
    }

    // Socket event handlers
    socketInstance.on('new_order_for_supplier', (data) => {
      console.log('📦 New order received in order management:', data);
      
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
      
      setNotifications(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const hasDuplicate = prevArray.some(
          notif => notif.data?.order_id === data.order_id
        );
        
        if (hasDuplicate) {
          console.log('⚠️ Duplicate order in order management, skipping:', data.order_id);
          return prevArray;
        }
        
        const newState = [newNotification, ...prevArray];
        saveNotificationsToStorage(storedUser.id, newState);
        // Use the fetchOrders callback instead of calling it directly
        fetchOrders();
        return newState;
      });
      
      setCurrentToast(newNotification);
      setShowToast(true);
    });
    
    socketInstance.on('orderUpdate', (data) => {
      console.log('🔄 Order update received:', data);
      setOrders(prev => prev.map(order => 
        order.order_id === data.orderId ? { 
          ...order, 
          order_status: data.status 
        } : order
      ));
    });

    // Listen for cargo position updates
    socketInstance.on('cargo-position-update', (data) => {
      console.log('📍 Cargo position update:', data);
      updateCargoPosition(data);
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setSocketConnected(true);
      socketInstance.emit('join-supplier', { 
        supplierId: storedUser.id.toString(),
        type: 'supplier'
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setSocketConnected(false);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [navigate, fetchOrders]); // Add fetchOrders to dependencies

  // ========== NOW THE CONDITIONAL RETURN ==========
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

// Existing helper functions (keep all your existing functions)
  const handleClearNotifications = () => {
    const storedUser = getUserData();
    if (storedUser?.id) {
      localStorage.removeItem(`supplier_notifications_${storedUser.id}`);
    }
    setNotifications([]);
  };

  const handleMarkAsRead = (notificationId) => {
    const storedUser = getUserData();
    
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      
      if (storedUser?.id) {
        saveNotificationsToStorage(storedUser.id, updated);
      }
      
      return updated;
    });
  };

  const handleViewOrder = (orderId) => {
    const order = orders.find(o => o.order_id === orderId || o.id === orderId);
    if (order) {
      viewOrderDetails(order);
    }
    
    const storedUser = getUserData();
    setNotifications(prev => {
      const updated = prev.map(notif => {
        if (notif.data?.order_id === orderId || notif.data?.orderId === orderId) {
          return { ...notif, read: true };
        }
        return notif;
      });
      
      if (storedUser?.id) {
        saveNotificationsToStorage(storedUser.id, updated);
      }
      
      return updated;
    });
  };

  const handleToastClose = () => {
    setShowToast(false);
    setCurrentToast(null);
  };
  
  const handleToastView = (orderId) => {
    handleViewOrder(orderId);
    handleToastClose();
  };

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wholesaler_company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesTab = activeTab === 'all' || order.order_status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const viewOrderDetails = async (order) => {
    try {
      console.log('🔍 Fetching order details for order:', order);
      
      const localOrder = orders.find(o => o.id === order.id || o.order_id === order.order_id);
      
      if (localOrder) {
        console.log('✅ Found order in local state:', localOrder);
        setSelectedOrder(localOrder);
        setShowOrderDetails(true);
        return;
      }
      
      try {
        const endpoints = [
          `${API_BASE_URL}/orders/${order.id}`,
          `${API_BASE_URL}/orders/by-id/${order.id}`,
          `${API_BASE_URL}/orders/by-order-id/${order.order_id}`,
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying endpoint: ${endpoint}`);
            const response = await axios.get(endpoint);
            if (response.data && (response.data.id || response.data.order_id)) {
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
      } catch (apiError) {
        console.log('⚠️ API fetch failed, using provided order data');
      }
      
      console.log('ℹ️ Using provided order data');
      setSelectedOrder(order);
      setShowOrderDetails(true);
      
    } catch (error) {
      console.error('❌ Error in viewOrderDetails:', error);
      setSelectedOrder(order);
      setShowOrderDetails(true);
      alert('Failed to fetch complete order details. Showing available information.');
    }
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const acceptOrder = async (orderId) => {
    try {
      console.log(`✅ Accepting order: ${orderId}`);
      
      const order = orders.find(o => o.order_id === orderId);
      if (!order) {
        alert('Order not found!');
        return;
      }
      
      const mmsiNumber = `MMSI${Math.floor(100000000 + Math.random() * 900000000)}`;
      const containerId = `CON${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
      
      const initialCargoData = {
        containerId: containerId,
        mmsi: mmsiNumber,
        orderId: orderId,
        product: order.items?.[0]?.seafood_type || 'Seafood Products',
        quantity: order.items?.reduce((sum, item) => sum + (item.quantity_kg || 0), 0) + 'kg',
        status: 'loading',
        origin: 'Supplier Warehouse',
        destination: order.delivery_address || 'Warehouse',
        latitude: 13.0827,
        longitude: 80.2707,
        speed: 0,
        heading: 0,
        timestamp: new Date().toISOString(),
        progress_percent: 0,
        distance_traveled: 0,
        total_distance: 1200,
        eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'processing',
        action_by: 'supplier',
        action_timestamp: new Date().toISOString(),
        mmsi_number: mmsiNumber,
        container_id: containerId,
        shipment_created: true,
        cargo_data: initialCargoData
      });
      
      if (response.data.success) {
        const updatedOrder = { 
          ...order, 
          order_status: 'processing',
          mmsi_number: mmsiNumber,
          container_id: containerId,
          cargo_data: initialCargoData
        };
        
        setOrders(prev => prev.map(order => 
          order.order_id === orderId ? updatedOrder : order
        ));
        
        saveOrderToLocalStorage(updatedOrder);
        
        try {
          await axios.post(`${API_BASE_URL}/cargo/tracking`, initialCargoData);
          console.log('✅ Cargo tracking created:', initialCargoData);
        } catch (cargoError) {
          console.warn('⚠️ Could not create cargo tracking entry:', cargoError.message);
        }
        
        if (socket && order) {
          socket.emit('supplier_action', {
            orderId: orderId,
            action: 'accepted',
            status: 'processing',
            supplierId: getUserData()?.id,
            supplierName: getUserData()?.name || getUserData()?.businessName || 'Supplier',
            wholesalerId: order.wholesaler_id,
            timestamp: new Date().toISOString(),
            mmsi_number: mmsiNumber,
            container_id: containerId,
            cargo_data: initialCargoData,
            message: `Your order ${orderId} has been accepted. Container ${containerId} with MMSI ${mmsiNumber} has been assigned and is now being tracked.`
          });
          
          socket.emit('cargo-position-update', initialCargoData);
        }
        
        if (window.confirm(`✅ Order accepted!\n\nContainer: ${containerId}\nMMSI: ${mmsiNumber}\n\nWould you like to view cargo tracking now?`)) {
          setSelectedTrackingData(initialCargoData);
          setShowLiveMap(true);
        }
      }
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const rejectOrder = async (orderId) => {
    try {
      if (window.confirm('Are you sure you want to reject this order?')) {
        console.log(`❌ Rejecting order: ${orderId}`);
        
        const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
          status: 'cancelled',
          reason: 'rejected_by_supplier',
          action_by: 'supplier',
          action_timestamp: new Date().toISOString()
        });
        
        if (response.data.success) {
          const order = orders.find(o => o.order_id === orderId);
          
          setOrders(prev => prev.filter(order => order.order_id !== orderId));
          removeOrderFromLocalStorage(orderId);
          
          if (socket && order) {
            socket.emit('supplier_action', {
              orderId: orderId,
              action: 'rejected',
              status: 'cancelled',
              supplierId: getUserData()?.id,
              supplierName: getUserData()?.name || getUserData()?.businessName || 'Supplier',
              wholesalerId: order.wholesaler_id,
              timestamp: new Date().toISOString(),
              message: `Your order ${orderId} has been rejected by the supplier.`
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
      
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus,
        action_by: 'supplier',
        action_timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        setOrders(prev => prev.map(order => {
          if (order.order_id === orderId) {
            const updatedOrder = { ...order, order_status: newStatus };
            saveOrderToLocalStorage(updatedOrder);
            return updatedOrder;
          }
          return order;
        }));
        
        const order = orders.find(o => o.order_id === orderId);
        
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
          
          socket.emit('supplier_action', {
            orderId: orderId,
            action: 'status_update',
            status: newStatus,
            supplierId: getUserData()?.id,
            supplierName: getUserData()?.name || getUserData()?.businessName || 'Supplier',
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

  const openProcessingModal = (order) => {
    setSelectedOrder(order);
    setShowProcessingModal(true);
  };

  const saveProcessingDetails = () => {
    if (selectedOrder) {
      console.log('Saving processing details:', processingDetails);
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

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    totalRevenue: orders
      .filter(order => order.order_status === 'delivered' || order.order_status === 'confirmed')
      .reduce((sum, order) => {
        const amount = parseFloat(order.total_amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0),
    tracking: getOrdersWithMMSI().length
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

// Add this function to create a tracking summary table view
const TrackingSummaryView = () => {
  const trackingOrders = orders.filter(order => order.mmsi_number && order.container_id);
  
  if (trackingOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Ship className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No active shipments with tracking</p>
        <p className="text-gray-500 text-sm mt-1">Accepted orders will appear here</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Container ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              MMSI
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Speed/Course
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {trackingOrders.map((order) => (
            <tr key={order.order_id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300">
                  {order.container_id}
                </code>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-800">
                  {order.mmsi_number}
                </code>
              </td>
              <td className="px-4 py-3">
                {order.cargo_data ? (
                  <div>
                    <p className="text-sm font-mono">
                      {order.cargo_data.latitude?.toFixed(4) || '--'}, {order.cargo_data.longitude?.toFixed(4) || '--'}
                    </p>
                    <p className="text-xs text-gray-500">Last updated: {formatDate(order.cargo_data.timestamp)}</p>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No position data</span>
                )}
              </td>
              <td className="px-4 py-3">
                {order.cargo_data ? (
                  <div>
                    <p className="text-sm font-medium">
                      {order.cargo_data.speed?.toFixed(1) || '--'} knots
                    </p>
                    <p className="text-xs text-gray-500">
                      Course: {order.cargo_data.heading?.toFixed(1) || '--'}°
                    </p>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">--</span>
                )}
              </td>
              <td className="px-4 py-3">
                {order.cargo_data ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.cargo_data.status === 'under_way' ? 'bg-green-100 text-green-800 border border-green-200' :
                    order.cargo_data.status === 'loading' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    order.cargo_data.status === 'at_anchor' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {order.cargo_data.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">--</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => showAISTracking(order)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  View Map
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage incoming seafood orders & track shipments</p>
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
              onClick={() => setActiveTab('shipped')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'shipped' 
                  ? "bg-purple-600 text-white border-purple-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Shipped ({stats.shipped})
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 lg:gap-6 mb-6">
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

            {/* Shipped Orders Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-purple-900" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Shipped</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stats.shipped}</div>
              <p className="text-gray-600 text-xs lg:text-sm">In transit</p>
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
                Container/MMSI
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
  {renderTrackingColumn(order)}
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
                      onClick={() => viewOrderDetails(order)}
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

      {/* Pagination (keep this as is) */}
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
</div></div>

        {/* Live Map Modal */}
        {showLiveMap && selectedTrackingData && (
          <LiveMapModal
            trackingData={selectedTrackingData}
            onClose={handleCloseLiveMap}
          />
        )}

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
                      <X className="w-6 h-6" />
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
                        <p className="text-gray-900 font-medium">
                          {selectedOrder.wholesaler_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Order Date</p>
                        <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600 text-sm">Order Status</p>
                        <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Payment Status</p>
                        <p className={cn(
                          "font-medium",
                          selectedOrder.payment_status === 'paid' ? "text-green-600" : 
                          selectedOrder.payment_status === 'processing' ? "text-yellow-600" : 
                          "text-red-600"
                        )}>
                          {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1) || 'Pending'}
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
                            const itemSubtotal = (item.quantity_kg || 0) * (item.unit_price || 0);
                            return (
                              <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {item.seafood_type || item.seafoodType || 'Unknown Product'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {(item.quantity_kg || 0)} kg
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(item.unit_price || 0)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {item.gst_percentage || 18}%
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                                    (item.quality_status || 'Fresh').toLowerCase() === 'fresh' 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  )}>
                                    {item.quality_status || 'Fresh'}
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
                    {(() => {
                      let subtotal = 0;
                      let gstAmount = 0;
                      let total = 0;
                      
                      if (selectedOrder.items && selectedOrder.items.length > 0) {
                        subtotal = selectedOrder.items.reduce((sum, item) => {
                          const quantity = parseFloat(item.quantity_kg || item.quantity || 0);
                          const price = parseFloat(item.unit_price || item.price || 0);
                          return sum + (quantity * price);
                        }, 0);
                        
                        gstAmount = selectedOrder.items.reduce((sum, item) => {
                          const quantity = parseFloat(item.quantity_kg || item.quantity || 0);
                          const price = parseFloat(item.unit_price || item.price || 0);
                          const itemSubtotal = quantity * price;
                          const gstRate = parseFloat(item.gst_percentage || item.gst || 18);
                          return sum + (itemSubtotal * gstRate / 100);
                        }, 0);
                        
                        total = subtotal + gstAmount;
                      } else {
                        total = parseFloat(selectedOrder.total_amount || selectedOrder.amount || 0);
                        if (total > 0) {
                          subtotal = total / 1.18;
                          gstAmount = total - subtotal;
                        }
                      }
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST</span>
                            <span className="text-gray-900">{formatCurrency(gstAmount)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-300 pt-2">
                            <span className="text-gray-900 font-semibold">Total Amount</span>
                            <span className="text-green-600 font-bold text-lg">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
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
{trackingModalOrder && trackingModalOrder.mmsi_number && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AIS Live Ship Tracking</h2>
            <p className="text-gray-600">
              Order #{trackingModalOrder.order_id} • Container: {trackingModalOrder.container_id}
            </p>
          </div>
          <button
            onClick={closeAISTracking}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* AIS Tracking Content - IMPORTANT: Disable auto-refresh */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        <TestAISTracker
          trackingData={[
            {
              mmsi: trackingModalOrder.mmsi_number,
              container_id: trackingModalOrder.container_id,
              order_id: trackingModalOrder.order_id,
              order_status: trackingModalOrder.order_status,
              wholesaler_name: trackingModalOrder.wholesaler_name,
              items: trackingModalOrder.items,
              total_amount: trackingModalOrder.total_amount,
              delivery_address: trackingModalOrder.delivery_address,
              wholesaler_company: trackingModalOrder.wholesaler_company,
              cargo_data: trackingModalOrder.cargo_data
            }
          ]}
          autoRefresh={false} // ⚠️ CRITICAL: Disable auto-refresh in modal
        />
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

        {/* Notification Toast */}
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

// Mock orders function
const getMockOrders = () => {
  const mockCargoData = (orderId, mmsi, containerId) => ({
    containerId: containerId,
    mmsi: mmsi,
    orderId: orderId,
    product: 'Mixed Seafood',
    quantity: '5000 kg',
    status: 'under_way',
    origin: 'Chennai Port',
    destination: 'Mumbai Port',
    latitude: 13.0827 + (Math.random() - 0.5) * 2,
    longitude: 80.2707 + (Math.random() - 0.5) * 2,
    speed: 10 + Math.random() * 10,
    heading: Math.random() * 360,
    timestamp: new Date().toISOString(),
    progress_percent: Math.random() * 100,
    distance_traveled: Math.random() * 300,
    total_distance: 600 + Math.random() * 400,
    eta: new Date(Date.now() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString()
  });

  return [
    {
      id: 1,
      order_id: 'ORD-001',
      wholesaler_name: 'Seafood Distributors Ltd',
      wholesaler_company: 'Ocean Foods',
      total_amount: 25000,
      order_status: 'processing',
      created_at: new Date().toISOString(),
      items: [
        { seafood_type: 'Tuna', quantity_kg: 100, unit_price: 200 },
        { seafood_type: 'Salmon', quantity_kg: 50, unit_price: 300 }
      ],
      mmsi_number: '477307900',
      container_id: 'CON12345',
      cargo_data: mockCargoData('ORD-001', '477307900', 'CON12345')
    },
    {
      id: 2,
      order_id: 'ORD-002',
      wholesaler_name: 'Fresh Catch Co',
      wholesaler_company: 'Marine Harvest',
      total_amount: 18000,
      order_status: 'shipped',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { seafood_type: 'Shrimp', quantity_kg: 200, unit_price: 80 }
      ],
      mmsi_number: '413235000',
      container_id: 'CON67890',
      cargo_data: mockCargoData('ORD-002', '413235000', 'CON67890')
    },
    {
      id: 3,
      order_id: 'ORD-003',
      wholesaler_name: 'Premium Seafood Imports',
      wholesaler_company: 'Aqua Delights',
      total_amount: 35000,
      order_status: 'pending',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { seafood_type: 'Lobster', quantity_kg: 30, unit_price: 800 },
        { seafood_type: 'Crab', quantity_kg: 40, unit_price: 400 }
      ]
    }
  ];
};

// Export NotificationsDropdown (make sure it's included from your original code)
const NotificationsDropdown = ({ notifications, onClear, onMarkAsRead, onViewOrder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newNotificationArrived, setNewNotificationArrived] = useState(false);
  
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;
  
  useEffect(() => {
    const newNotifications = notifications.filter(n => !n.read);
    if (newNotifications.length > 0) {
      setNewNotificationArrived(true);
      const timer = setTimeout(() => {
        setNewNotificationArrived(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications.length]);

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
        
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            {newNotificationArrived && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              </span>
            )}
            
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

export default SupplierOrdersManagement;
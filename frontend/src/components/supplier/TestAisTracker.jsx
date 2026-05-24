import React, { useState, useEffect, useCallback } from 'react';
import { 
  Ship, Navigation, MapPin, Clock, 
  RefreshCw, Anchor, TrendingUp,
  Compass, Target, Globe, Map,
  ChevronRight, ExternalLink, Filter, 
  Search, Download, AlertCircle, CheckCircle,
  Eye, MoreVertical, Calendar, Wind, 
  Waves, Thermometer, X, Maximize2, 
  Minimize2, Package, Truck,
  Plus, Settings, Activity, Home, ClipboardList, ShoppingBag, Users, ShoppingCart, 
  ChevronLeft,
  AlertTriangle, Info,
  Bell,
  ChevronDown,
  LayoutDashboard, FileText, LogOut, 
  Fish, BrainCircuit, Boxes, Cog, Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Simple cn utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');

// =================== SIDEBAR COMPONENT ===================
const SidebarAIS = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: ShoppingCart, label: "Order", id: "orders" },
    { icon: Truck, label: "Dispatch & Tracking", id: "logistics" },
    { icon: FileText, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/logistics')) return 'logistics';
    if (path.includes('/ai')) return 'ai';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'logistics';
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

// =================== MAP MODAL COMPONENT ===================
const MapModal = ({ vessel, onClose, orderData }) => {
  const [zoom, setZoom] = useState(10);
  const [center, setCenter] = useState({
    lat: vessel?.latitude || 13.0827,
    lng: vessel?.longitude || 80.2707
  });

  const formatCoordinate = (coord) => {
    return coord?.toFixed(4) || '0.0000';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Container Tracking Map</h2>
              <p className="text-gray-600">
                Container: {orderData?.container_id} • Order: {orderData?.order_id} • MMSI: {vessel?.mmsi}
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

        <div className="flex">
          <div className="flex-1 relative">
            <div className="h-[600px] bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-blue-300 opacity-50" />
              
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute h-full w-px bg-blue-400" style={{ left: `${i * 5}%` }} />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-blue-400" style={{ top: `${i * 5}%` }} />
                ))}
              </div>
              
              {/* Main Ship Marker */}
              <div
                className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold bg-red-600 animate-pulse border-4 border-red-300 shadow-lg">
                  ⛴️
                </div>
              </div>
              
              {/* Compass */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 mb-2">Heading</div>
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
                    <div 
                      className="absolute left-1/2 top-1/2 w-1 h-12 bg-red-600 origin-bottom"
                      style={{ 
                        transform: `translate(-50%, -100%) rotate(${vessel?.heading || 40}deg)`
                      }}
                    />
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">N</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">S</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">W</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">E</div>
                  </div>
                  <div className="mt-2 text-lg font-bold text-blue-600">
                    {vessel?.heading?.toFixed(1) || '40.4'}°
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Current Position</div>
                  <div className="font-mono">
                    {formatCoordinate(vessel?.latitude)}° N, 
                    {formatCoordinate(vessel?.longitude)}° E
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tracking Details</h3>
              
              {orderData && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID</span>
                      <span className="font-medium">{orderData.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Container ID</span>
                      <span className="font-medium">{orderData.container_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wholesaler</span>
                      <span className="font-medium">{orderData.wholesaler_name}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Ship className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{vessel?.vesselName || 'Container Ship'}</div>
                    <div className="text-sm text-gray-600">MMSI: {vessel?.mmsi}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600 capitalize">
                      {vessel?.status?.replace('_', ' ') || 'Under Way'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed</span>
                    <span className="font-medium">{vessel?.speed?.toFixed(1) || '17.4'} knots</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course</span>
                    <span className="font-medium">{vessel?.heading?.toFixed(1) || '40.4'}°</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Estimated Arrival</h4>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {vessel?.eta 
                    ? new Date(vessel.eta).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Calculating...'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== MAIN COMPONENT ===================
const TestAISTracker = ({ 
  trackingData = []
}) => {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate vessel data from trackingData
  const generateVesselData = useCallback(() => {
    console.log('🔍 Generating vessel data from:', trackingData);
    
    if (!trackingData || trackingData.length === 0) {
      console.log('⚠️ No tracking data provided');
      return [];
    }
    
    return trackingData.map((trackItem, index) => {
      // Generate realistic tracking data based on the order
      const progress = trackItem.order_status === 'shipped' ? 50 + Math.random() * 40 : 
                       trackItem.order_status === 'processing' ? 10 + Math.random() * 30 : 20;
      
      const speed = progress < 20 ? 8 + Math.random() * 4 :
                    progress > 80 ? 10 + Math.random() * 5 : 18 + Math.random() * 8;
      
      const heading = Math.random() * 360;
      
      // Calculate position between Chennai and Mumbai
      const lat = 13.0827 + (19.0760 - 13.0827) * (progress / 100);
      const lng = 80.2707 + (72.8777 - 80.2707) * (progress / 100);
      
      // Calculate ETA
      const hoursRemaining = ((100 - progress) * 48) / 100;
      const eta = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
      
      return {
        mmsi: trackItem.mmsi || `419${Math.floor(1000000 + Math.random() * 9000000)}`,
        containerId: trackItem.container_id || `CONT${trackItem.order_id?.slice(-6) || Date.now().toString().slice(-6)}`,
        orderId: trackItem.order_id || `ORD${index + 1}`,
        vesselName: `${trackItem.wholesaler_name || 'Wholesaler'} Container Ship`,
        wholesalerName: trackItem.wholesaler_name || 'Unknown Wholesaler',
        product: trackItem.items?.[0]?.seafood_type || 'Seafood Products',
        orderStatus: trackItem.order_status || 'processing',
        latitude: lat,
        longitude: lng,
        speed: speed,
        heading: heading,
        status: trackItem.order_status === 'shipped' ? 'under_way' : 
                trackItem.order_status === 'processing' ? 'loading' : 'at_anchor',
        origin: 'Chennai Port',
        destination: 'Mumbai Port',
        currentLocation: lat < 15 ? 'Arabian Sea' : 'Bay of Bengal',
        eta: eta.toISOString(),
        arrivalTime: {
          date: eta.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time: eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          relativeTime: `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m`,
          isOnTime: true
        },
        progress: progress,
        progressPercent: `${Math.round(progress)}%`,
        timestamp: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        originalData: trackItem
      };
    });
  }, [trackingData]);

  // Initialize data
  useEffect(() => {
    console.log('🔄 Initializing with trackingData:', trackingData);
    if (trackingData && trackingData.length > 0) {
      const generatedVessels = generateVesselData();
      console.log('✅ Generated vessels:', generatedVessels);
      setVessels(generatedVessels);
    } else {
      console.log('❌ No tracking data available');
      setVessels([]);
    }
    setLoading(false);
  }, [trackingData, generateVesselData]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const generatedVessels = generateVesselData();
      setVessels(generatedVessels);
      setLoading(false);
    }, 500);
  };

  const handleViewMap = (vessel) => {
    console.log('🗺️ Opening map for:', vessel);
    setSelectedVessel(vessel);
    setShowMapModal(true);
  };

  // Filter vessels based on search
  const filteredData = vessels.filter(vessel => 
    vessel.mmsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.containerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.wholesalerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <SidebarAIS />
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading AIS tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <SidebarAIS />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">AIS Live Container Tracking</h1>
              <p className="text-gray-600 text-sm mt-1">
                {vessels.length > 0 
                  ? `Tracking ${vessels.length} active shipments` 
                  : 'No active shipments to track'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Data from Order Management: {trackingData?.length || 0} orders
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              {/* Debug Info */}
              <div className="text-xs text-gray-500">
                Showing {vessels.length} vessels
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by MMSI, Container ID, Order ID, or Wholesaler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 lg:p-6 space-y-6">          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Active Shipments</div>
                  <div className="text-2xl font-bold text-gray-900">{vessels.length}</div>
                </div>
                <Ship className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Under Way</div>
                  <div className="text-2xl font-bold text-green-600">
                    {vessels.filter(v => v.status?.toLowerCase().includes('under_way') || v.status?.toLowerCase().includes('under way')).length}
                  </div>
                </div>
                <Navigation className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">At Port</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {vessels.filter(v => v.status?.toLowerCase().includes('loading') || v.status?.toLowerCase().includes('moored') || v.status?.toLowerCase().includes('at_anchor')).length}
                  </div>
                </div>
                <Anchor className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Containers</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {vessels.filter(v => v.containerId).length}
                  </div>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Detailed Information Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Tracking Information</h3>
                <div className="text-sm text-gray-600">
                  Showing {filteredData.length} of {vessels.length} shipments
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      MMSI & Container
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Speed & Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Arrival Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((vessel, index) => (
                      <tr key={`${vessel.mmsi}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Ship className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">MMSI: {vessel.mmsi}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <Package className="w-4 h-4" />
                                  {vessel.containerId}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Order:</span>
                                <span className="font-medium text-gray-700">{vessel.orderId}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Product:</span>
                                <span className="font-medium text-gray-700">{vessel.product}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Wholesaler:</span>
                                <span className="font-medium text-gray-700">{vessel.wholesalerName}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <div>
                                <div className="font-medium text-gray-900">{vessel.currentLocation}</div>
                                <div className="text-sm text-gray-600 font-mono">
                                  {vessel.latitude?.toFixed(4)}° N, 
                                  {vessel.longitude?.toFixed(4)}° E
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                  style={{ width: `${vessel.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{vessel.origin?.split(' ')[0] || 'Origin'}</span>
                                <span>{vessel.progressPercent}</span>
                                <span>{vessel.destination?.split(' ')[0] || 'Dest'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Speed</span>
                                <span className="font-medium text-green-600">
                                  {vessel.speed?.toFixed(1)} knots
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Direction</span>
                                <span className="font-medium text-blue-600">
                                  {vessel.heading?.toFixed(1)}°
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {vessel.arrivalTime?.date}
                              </div>
                              <div className="text-sm text-gray-600">
                                {vessel.arrivalTime?.time}
                              </div>
                            </div>
                            
                            <div className="text-xs text-center text-gray-500 mt-1">
                              ETA: {vessel.arrivalTime?.relativeTime}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                              vessel.status === 'under_way' || vessel.status === 'under way'
                                ? 'bg-green-100 text-green-800'
                                : vessel.status === 'loading'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {vessel.status 
                                ? vessel.status.replace('_', ' ').split(' ').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')
                                : 'Under Way'
                              }
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">
                                {new Date(vessel.lastUpdate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleViewMap(vessel)}
                              className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              <Map className="w-4 h-4" />
                              View Map
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <Ship className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments to track</h3>
                        <p className="text-gray-600">
                          {trackingData?.length > 0 
                            ? 'No tracking data found in the provided orders' 
                            : 'No orders with tracking information available'}
                        </p>
                        <button
                          onClick={handleRefresh}
                          className="mt-4 inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh Data
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredData.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMapModal && selectedVessel && (
        <MapModal 
          vessel={selectedVessel}
          orderData={selectedVessel.originalData}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
};

export default TestAISTracker;
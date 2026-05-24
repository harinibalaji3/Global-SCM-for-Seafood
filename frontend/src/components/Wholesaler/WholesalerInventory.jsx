import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  BrainCircuit,
  Search,
  Plus,
  Download,
  Edit,
  Trash2,Fish,
  Eye,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Save,
  X,
  LogOut,
  Calendar,
  MapPin,
  Package,
  RefreshCw,
  Upload,
  Image as ImageIcon
} from "lucide-react";

const getImageUrl = (imagePath) => {
  // Handle null/undefined/empty cases
  if (!imagePath || 
      imagePath === 'No image' || 
      imagePath === 'NULL' || 
      imagePath === 'null' ||
      imagePath === 'undefined' ||
      imagePath === '') {
    return null;
  }
  
  // If it's already a full URL
  if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
    return imagePath;
  }
  
  // If it's a blob URL (for new uploads)
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }
  
  // If it's a base64 string
  if (imagePath.startsWith('data:image')) {
    return imagePath;
  }
  
  // Check if it's a path that includes uploads
  let filename = imagePath;
  
  // Extract filename from path
  if (imagePath.includes('/')) {
    const parts = imagePath.split('/');
    filename = parts[parts.length - 1];
  }
  
  // Clean up the filename (remove any URL encoding or query params)
  const cleanFilename = decodeURIComponent(filename.split('?')[0]);
  
  // Use port 5000 for your backend
  return `http://localhost:5000/uploads/${cleanFilename}`;
};

// Add this validation function
const validateNumberInput = (value, fieldName) => {
  if (!value) return { isValid: true, error: null };
  
  const num = Number(value);
  const maxValue = 100000; // Maximum allowed value
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (num > maxValue) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxValue.toLocaleString()}` };
  }
  
  if (num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }
  
  // Check for decimal places in quantity (if needed)
  if (fieldName === 'Quantity' && num.toString().split('.')[1]?.length > 2) {
    return { isValid: false, error: 'Quantity can have at most 2 decimal places' };
  }
  
  return { isValid: true, error: null };
};

const InventoryManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    seafoodType: '',
    minQuantity: '',
    maxQuantity: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  const [newItem, setNewItem] = useState({
    seafoodType: '',
    quantity: '',
    unit: 'kg',
    price: '',
    processingStatus: 'Raw',
    storageCondition: 'Chilled',
    expiryDate: '',
    batchOrigin: '',
    temperature: 0,
    humidity: 75,
    ammonia: 1.0,
    image: null,
    imageFile: null
  });

  const sidebarItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, path: "/wholesaler/dashboard" },
    { id: "inventory", name: "Inventory", icon: Boxes, path: "/wholesaler/inventory" },
    { id: "catalog", name: "Wholesaler Catalog", icon: ShoppingCart, path: "/wholesaler/catalog" },
    { id: "orders", name: "Order", icon: ShoppingCart, path: "/wholesaler/orders" },
    { id: "ai", name: "AI Module", icon: BrainCircuit, path: "/wholesaler/ai" }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Fresh', label: 'Fresh' },
    { value: 'Warning', label: 'Warning' },
    { value: 'Spoiled', label: 'Spoiled' }
  ];

  const seafoodTypeOptions = [
    'Salmon', 'Tuna', 'Cod', 'Halibut', 'Mackerel', 'Shrimp', 'Crab', 'Lobster',
    'Oysters', 'Mussels', 'Squid', 'Octopus', 'Seaweed', 'Atlantic Salmon',
    'Prawns', 'Sardines', 'Trout', 'Snapper', 'Mahi Mahi', 'Catfish', 'Bass',
    'Herring', 'Anchovies', 'Clams', 'Scallops', 'Crayfish', 'Abalone', 'Eel',
    'Tilapia', 'Barramundi', 'Monkfish', 'Swordfish', 'Bluefin Tuna', 'Yellowtail',
    'Grouper', 'Flounder', 'Sole'
  ];

  const processingStatusOptions = ['Raw', 'Cleaned', 'Cut', 'Frozen', 'Packed'];
  const storageConditionOptions = ['Chilled', 'Frozen'];
  const unitOptions = ['kg', 'pieces', 'boxes'];

  const calculateQualityStatus = (item) => {
    const { temperature, humidity, ammonia } = item;
    
    if (temperature > 5 || temperature < -25 || ammonia > 3 || humidity > 90 || humidity < 70) {
      return 'Spoiled';
    } else if (temperature > 3 || temperature < -20 || ammonia > 2 || humidity > 85 || humidity < 75) {
      return 'Warning';
    } else {
      return 'Fresh';
    }
  };

  const userId = localStorage.getItem('user_id');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/inventory/list/${userId}`);
      
      if (response.data.success) {
        const inventoryData = response.data.data || response.data.inventory || [];
        
        // DEBUG: Log image data for all items
        console.log('📦 Wholesaler Inventory data received:');
        inventoryData.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            id: item.id,
            seafoodType: item.seafoodType,
            image: item.image,
            imageType: typeof item.image,
            hasImage: !!item.image,
            batchId: item.batchId
          });
        });
        
        setInventory(inventoryData);
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Failed to load inventory data');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const generateLiveSensors = () => {
    // Generate realistic sensor data
    const simulatedData = {
      temperature: (Math.random() * 8 - 2).toFixed(1), // Range: -2 to 6°C
      humidity: (Math.random() * 30 + 70).toFixed(1),  // Range: 70-100%
      ammonia: (Math.random() * 2 + 0.5).toFixed(1)    // Range: 0.5-2.5 ppm
    };

    setNewItem((prev) => ({
      ...prev,
      temperature: simulatedData.temperature,
      humidity: simulatedData.humidity,
      ammonia: simulatedData.ammonia
    }));

    // Show success message
    alert('✅ IoT Sensors auto-generated with simulated data!\n' +
          `🌡️ Temperature: ${simulatedData.temperature}°C\n` +
          `💧 Humidity: ${simulatedData.humidity}%\n` +
          `⚠️ Ammonia: ${simulatedData.ammonia}ppm`);
  };

  // Auto-generate sensors when component mounts or when showing modal
  useEffect(() => {
    if (showAddModal) {
      generateLiveSensors();
    }
  }, [showAddModal]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewItem({
          ...newItem,
          image: e.target.result,
          imageFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewItem({
      ...newItem,
      image: null,
      imageFile: null
    });
  };

  const ensureBatchId = (item) => {
    if (item.batchId && item.batchId.trim() !== '' && item.batchId !== 'Generating...') {
      return item.batchId;
    }
    
    const seafoodInitials = (item.seafoodType || 'XXX')
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .padEnd(3, 'X');
    
    const timestamp = item.created_at 
      ? new Date(item.created_at).getTime().toString().slice(-6)
      : Date.now().toString().slice(-6);
    
    return `BATCH-${seafoodInitials}-${item.id.toString().padStart(4, '0')}-${timestamp}`;
  };

  const addInventoryItem = async () => {
    try {
      if (!newItem.seafoodType || !newItem.quantity || !newItem.price || !newItem.expiryDate) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate quantity
      const quantityValidation = validateNumberInput(newItem.quantity, 'Quantity');
      if (!quantityValidation.isValid) {
        alert(quantityValidation.error);
        return;
      }

      // Validate price
      const priceValidation = validateNumberInput(newItem.price, 'Price');
      if (!priceValidation.isValid) {
        alert(priceValidation.error);
        return;
      }

      // Additional check for extremely large numbers
      const quantityNum = Number(newItem.quantity);
      const priceNum = Number(newItem.price);
      
      if (quantityNum > 100000 || priceNum > 100000) {
        alert('Values cannot exceed 1,000,000. Please enter reasonable values.');
        return;
      }

      const userId = localStorage.getItem('user_id');
      const seafoodInitials = newItem.seafoodType
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .padEnd(3, 'X');
      
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 100);
      const batchId = `BATCH-${seafoodInitials}-${timestamp}-${randomNum}`;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('seafoodType', newItem.seafoodType);
      formData.append('quantity', newItem.quantity);
      formData.append('unit', newItem.unit);
      formData.append('price', newItem.price);
      formData.append('processingStatus', newItem.processingStatus);
      formData.append('storageCondition', newItem.storageCondition);
      formData.append('expiryDate', newItem.expiryDate);
      formData.append('batchOrigin', newItem.batchOrigin || '');
      formData.append('temperature', newItem.temperature);
      formData.append('humidity', newItem.humidity);
      formData.append('ammonia', newItem.ammonia);
      formData.append('batchId', batchId);
      formData.append('category', 'Fish'); // Default category
      
      if (newItem.imageFile) {
        formData.append('image', newItem.imageFile);
      }

      const response = await axios.post('http://localhost:5000/api/inventory/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setShowAddModal(false);
        setNewItem({
          seafoodType: '',
          quantity: '',
          unit: 'kg',
          price: '',
          processingStatus: 'Raw',
          storageCondition: 'Chilled',
          expiryDate: '',
          batchOrigin: '',
          temperature: 0,
          humidity: 75,
          ammonia: 1.0,
          image: null,
          imageFile: null
        });
        fetchInventory();
        alert(`Inventory item added successfully!\nBatch ID: ${response.data.batchId}`);
      }
    } catch (error) {
      console.error('Error adding inventory:', error);
      
      // Check for specific database errors
      if (error.response?.data?.message?.includes('out of range') || 
          error.message?.includes('out of range')) {
        alert('Values are too large. Please enter smaller numbers (max 100,000).');
      } else {
        alert('Failed to add inventory item: ' + (error.response?.data?.message || error.message));
      }
    }
  };
  
  const updateInventoryItem = async () => {
    if (!editingItem) return;

    try {
      console.log('🔄 Starting update for item ID:', editingItem.id);
      
      // Validate quantity if it's being updated
      if (editingItem.quantity) {
        const quantityValidation = validateNumberInput(editingItem.quantity, 'Quantity');
        if (!quantityValidation.isValid) {
          alert(quantityValidation.error);
          return;
        }
      }

      // Validate price if it's being updated
      if (editingItem.price) {
        const priceValidation = validateNumberInput(editingItem.price, 'Price');
        if (!priceValidation.isValid) {
          alert(priceValidation.error);
          return;
        }
      }

      // Additional check for extremely large numbers
      if (editingItem.quantity && Number(editingItem.quantity) > 100000) {
        alert('Quantity cannot exceed 1,000,000. Please enter a reasonable value.');
        return;
      }
      
      if (editingItem.price && Number(editingItem.price) > 100000) {
        alert('Price cannot exceed 1,000,000. Please enter a reasonable value.');
        return;
      }
      
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add all text fields from editingItem with proper database field names
      const fieldMapping = {
        'seafoodType': 'seafoodType',
        'quantity': 'quantity',
        'unit': 'unit',
        'price': 'price',
        'processingStatus': 'processingStatus',
        'storageCondition': 'storageCondition',
        'expiryDate': 'expiryDate',
        'batchOrigin': 'batchOrigin',
        'temperature': 'temperature',
        'humidity': 'humidity',
        'ammonia': 'ammonia',
        'batchId': 'batchId'
      };
      
      Object.keys(fieldMapping).forEach(field => {
        if (editingItem[field] !== undefined && editingItem[field] !== null && editingItem[field] !== '') {
          const dbField = fieldMapping[field];
          formData.append(dbField, editingItem[field]);
          console.log(`📄 Added ${dbField}: ${editingItem[field]}`);
        }
      });
      
      // Add user_id
      const userId = localStorage.getItem('user_id');
      if (userId) {
        formData.append('user_id', userId);
        console.log('👤 Added user_id from localStorage:', userId);
      }
      
      // Handle image upload
      if (editingItem.imageFile) {
        formData.append('image', editingItem.imageFile);
        console.log('🖼️ Added new image file:', editingItem.imageFile.name);
      } else if (editingItem.image && editingItem.image.startsWith('data:image')) {
        formData.append('imageBase64', editingItem.image);
        console.log('📸 Added base64 image string');
      } else if (editingItem.image && !editingItem.image.includes('localhost:5000')) {
        formData.append('image', editingItem.image);
        console.log('📁 Added existing image path:', editingItem.image);
      }
      
      // Add userType for backend
      formData.append('userType', 'wholesaler');
      
      console.log('🚀 Sending PUT request...');
      const response = await axios.put(
        `http://localhost:5000/api/inventory/update/${editingItem.id}`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Update response:', response.data);
      
      if (response.data.success) {
        fetchInventory();
        setEditingItem(null);
        setIsEditing(false);
        alert('Inventory item updated successfully!');
      } else {
        alert(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating inventory item:', error);
      
      if (error.code === 'ECONNABORTED') {
        alert('Update timeout. The image might be too large. Try a smaller image.');
      } else if (error.response?.status === 500) {
        const errorMsg = error.response.data?.message || 'Please check server logs';
        alert(`Server error: ${errorMsg}`);
      } else {
        alert('Failed to update inventory item: ' + (error.response?.data?.message || error.message));
      }
    }
  };
  
  const deleteInventoryItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/inventory/delete/${itemId}`);
        if (response.data.success) {
          fetchInventory();
          alert('Inventory item deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        alert('Failed to delete inventory item');
      }
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilters({
      seafoodType: '',
      minQuantity: '',
      maxQuantity: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
    setFilterStatus('all');
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently added';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Recently added';
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return 'Recently added';
    }
  };

  const handleEditClick = (item) => {
    console.log('✏️ Editing item:', item);
    
    // Create a copy of the item for editing
    const editingCopy = { ...item };
    
    // Convert date format for date input
    if (editingCopy.expiryDate) {
      const date = new Date(editingCopy.expiryDate);
      if (!isNaN(date.getTime())) {
        editingCopy.expiryDate = date.toISOString().split('T')[0];
      }
    }
    
    // Ensure numeric fields are numbers
    editingCopy.quantity = parseFloat(editingCopy.quantity) || '';
    editingCopy.price = parseFloat(editingCopy.price) || '';
    editingCopy.temperature = parseFloat(editingCopy.temperature) || 0;
    editingCopy.humidity = parseFloat(editingCopy.humidity) || 75;
    editingCopy.ammonia = parseFloat(editingCopy.ammonia) || 1.0;
    
    // Handle image - ensure it exists and is properly set
    editingCopy.image = editingCopy.image || null;
    editingCopy.imageFile = null;
    
    setEditingItem(editingCopy);
    setIsEditing(true);
    
    console.log('📝 Prepared editing item:', editingCopy);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsEditing(false);
  };

  useEffect(() => {
    const currentItem = sidebarItems.find(item => location.pathname === item.path);
    if (currentItem) {
      setActiveModule(currentItem.id);
    }
    fetchInventory();
  }, [location]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  const getQualityStatusColor = (status) => {
    switch (status) {
      case 'Fresh': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Warning': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Spoiled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const filteredInventory = safeInventory.filter(item => {
    const matchesSearch =
      (item.seafoodType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batchId || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batchOrigin || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      calculateQualityStatus(item) === filterStatus;

    const matchesSeafoodType = !filters.seafoodType || item.seafoodType === filters.seafoodType;
    
    const quantity = parseFloat(item.quantity) || 0;
    const matchesMinQuantity = !filters.minQuantity || quantity >= parseFloat(filters.minQuantity);
    const matchesMaxQuantity = !filters.maxQuantity || quantity <= parseFloat(filters.maxQuantity);
    
    const itemDate = new Date(item.expiryDate || item.created_at);
    const matchesStartDate = !filters.dateRange.start || itemDate >= new Date(filters.dateRange.start);
    const matchesEndDate = !filters.dateRange.end || itemDate <= new Date(filters.dateRange.end);

    return matchesSearch && 
           matchesStatus && 
           matchesSeafoodType && 
           matchesMinQuantity && 
           matchesMaxQuantity &&
           matchesStartDate &&
           matchesEndDate;
  });

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col">
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
        
        <nav className="mt-6 px-3 flex-1">
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
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage seafood inventory and monitor quality metrics</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full lg:w-64 text-gray-800 placeholder-gray-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Batch
                </button>
                
                <button 
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading inventory data...</p>
            </div>
          ) : (
            <>
              {/* Inventory Table */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Batch ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expiry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Origin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quality Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInventory.map((item) => {
                        const qualityStatus = calculateQualityStatus(item);
                        const isItemEditing = editingItem && editingItem.id === item.id;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            {/* Image Cell - Fix for both editing and non-editing states */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {editingItem.image ? (
                                      <div className="relative">
                                        <img 
                                          src={editingItem.image.startsWith('data:image') ? editingItem.image : getImageUrl(editingItem.image)} 
                                          alt="Preview" 
                                          className="w-16 h-16 object-cover rounded-lg border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingItem({...editingItem, image: null, imageFile: null});
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="text-gray-400">No image</div>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                          setEditingItem({
                                            ...editingItem,
                                            image: e.target.result,
                                            imageFile: file
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="w-full text-sm"
                                  />
                                </div>
                              ) : (
                                // Non-editing state - check item.image safely
                                <div>
                                  {item.image ? (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 relative group">
                                      <img 
                                        src={getImageUrl(item.image)} 
                                        alt={item.seafoodType || 'Inventory Item'}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        onLoad={() => console.log(`✅ Image loaded: ${getImageUrl(item.image)}`)}
                                        onError={(e) => {
                                          console.error(`❌ Image failed: ${getImageUrl(item.image)}`);
                                          e.target.onerror = null;
                                          e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23ff6b6b"><path d="M21 5v14H5V5h16m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.5 12h-2v2h2v-2zm0-4h-2v2h2v-2zm-6 4h-2v2h2v-2zm0-4h-2v2h2v-2z"/></svg>`;
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                          View
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                      <span className="text-xs text-gray-500">No image</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Batch ID */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <p className="font-medium text-gray-800 text-sm">
                                  {ensureBatchId(item)}
                                </p>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <select
                                  value={editingItem.seafoodType}
                                  onChange={(e) => setEditingItem({...editingItem, seafoodType: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Type</option>
                                  {seafoodTypeOptions.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <p className="font-medium text-gray-800">{item.seafoodType}</p>
                                </div>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editingItem.quantity}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || Number(value) <= 100000) {
                                        setEditingItem({...editingItem, quantity: value});
                                      }
                                    }}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    max="100000"
                                    step="0.01"
                                    onKeyPress={(e) => {
                                      if (e.key === 'e' || e.key === 'E') {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                  <select
                                    value={editingItem.unit}
                                    onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    {unitOptions.map(unit => (
                                      <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {item.quantity} {item.unit}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Expiry Date */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <input
                                    type="date"
                                    value={editingItem.expiryDate ? editingItem.expiryDate.split('T')[0] : ''}
                                    onChange={(e) => setEditingItem({...editingItem, expiryDate: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <p className={`text-sm font-medium ${
                                    new Date(item.expiryDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                      ? 'text-red-600'
                                      : 'text-gray-800'
                                  }`}>
                                    {formatDate(item.expiryDate)}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Origin */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={editingItem.batchOrigin}
                                    onChange={(e) => setEditingItem({...editingItem, batchOrigin: e.target.value})}
                                    placeholder="e.g., Norway"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <p className="text-sm text-gray-700">{item.batchOrigin || 'N/A'}</p>
                                </div>
                              )}
                            </td>

                            {/* Quality Status */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getQualityStatusColor(qualityStatus)}`}>
                                {qualityStatus === 'Fresh' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {qualityStatus === 'Warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {qualityStatus === 'Spoiled' && <XCircle className="w-3 h-3 mr-1" />}
                                {qualityStatus}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              {isItemEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={updateInventoryItem}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                  >
                                    <Save className="w-4 h-4" />
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                                  >
                                    <X className="w-4 h-4" />
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteInventoryItem(item.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredInventory.length === 0 && (
                    <div className="text-center py-12">
                      <Boxes className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No inventory items found matching your criteria</p>
                      {Object.values(filters).some(filter => filter) && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 shadow p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{filteredInventory.length}</p>
                      <p className="text-sm text-gray-600">Filtered Batches</p>
                    </div>
                    <Boxes className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 shadow p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-800">
                        {filteredInventory.filter(item => calculateQualityStatus(item) === 'Fresh').length}
                      </p>
                      <p className="text-sm text-green-700">Fresh Items</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 shadow p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-800">
                        {filteredInventory.filter(item => calculateQualityStatus(item) === 'Warning').length}
                      </p>
                      <p className="text-sm text-yellow-700">Warning Items</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-red-50 shadow p-4 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-800">
                        {filteredInventory.filter(item => calculateQualityStatus(item) === 'Spoiled').length}
                      </p>
                      <p className="text-sm text-red-700">Spoiled Items</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Inventory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white shadow-2xl rounded-2xl max-w-5xl w-full p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-[#012A4A] mb-6">Add New Inventory Batch</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Seafood Type *</label>
                    <select
                      value={newItem.seafoodType}
                      onChange={(e) => setNewItem({...newItem, seafoodType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A]"
                    >
                      <option value="">Select Seafood Type</option>
                      {seafoodTypeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) <= 100000) {
                            setNewItem({...newItem, quantity: value});
                          }
                        }}
                        placeholder="e.g., 1000"
                        max="100000"
                        step="0.01"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A] placeholder-gray-400"
                        onKeyPress={(e) => {
                          if (e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <select
                        value={newItem.unit}
                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A]"
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Price per Unit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || Number(value) <= 100000) {
                          setNewItem({...newItem, price: value});
                        }
                      }}
                      placeholder="e.g., 12.50"
                      max="100000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A] placeholder-gray-400"
                      onKeyPress={(e) => {
                        if (e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Processing Status</label>
                    <select
                      value={newItem.processingStatus}
                      onChange={(e) => setNewItem({...newItem, processingStatus: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A]"
                    >
                      {processingStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Middle Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Storage Condition</label>
                    <select
                      value={newItem.storageCondition}
                      onChange={(e) => setNewItem({...newItem, storageCondition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A]"
                    >
                      {storageConditionOptions.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Batch Origin</label>
                    <input
                      type="text"
                      value={newItem.batchOrigin}
                      onChange={(e) => setNewItem({...newItem, batchOrigin: e.target.value})}
                      placeholder="e.g., Norway, Japan, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B98E0] focus:border-[#1B98E0] bg-white text-[#012A4A] placeholder-gray-400"
                    />
                  </div>
                  
                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D62] mb-2">Product Image</label>
                    <div className="mt-2">
                      {newItem.image ? (
                        <div className="relative">
                          <img
                            src={newItem.image}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload product image</p>
                          <p className="text-xs text-gray-500 mt-1">JPEG, PNG up to 5MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="mt-3 inline-block px-4 py-2 bg-[#1B98E0] text-white rounded-lg hover:bg-[#0A3D62] transition-colors cursor-pointer text-sm"
                          >
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - IoT Sensors (Auto-generated only) */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-[#0A3D62] mb-4 flex items-center gap-2">
                      <Thermometer className="w-4 h-4" />
                      IoT Sensor Readings (Auto-generated)
                    </h4>
                    
                    {/* Display Only - No Input Fields */}
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#0A3D62]">Temperature:</span>
                          <span className="text-lg font-bold text-[#1B98E0]">{newItem.temperature}°C</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#0A3D62]">Humidity:</span>
                          <span className="text-lg font-bold text-[#1B98E0]">{newItem.humidity}%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#0A3D62]">Ammonia:</span>
                          <span className="text-lg font-bold text-[#1B98E0]">{newItem.ammonia} ppm</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={generateLiveSensors}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1B98E0] text-white px-4 py-3 rounded-lg hover:bg-[#0A3D62] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate Sensor Data
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Sensor data is automatically generated when modal opens
                    </p>
                  </div>
                  
                  {/* Quality Status Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-[#0A3D62] mb-2">Quality Preview</h4>
                    {(() => {
                      const qualityStatus = calculateQualityStatus(newItem);
                      const qualityColor = getQualityStatusColor(qualityStatus);
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#0A3D62]">Estimated Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${qualityColor}`}>
                            {qualityStatus}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-[#0A3D62] rounded-lg hover:bg-gray-50 transition-colors bg-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addInventoryItem}
                  className="flex-1 px-6 py-3 bg-[#1B98E0] text-white rounded-lg hover:bg-[#0A3D62] transition-colors shadow-lg font-medium"
                >
                  Add Batch to Inventory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white shadow-2xl rounded-2xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seafood Type</label>
                  <select
                    value={filters.seafoodType}
                    onChange={(e) => setFilters({...filters, seafoodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                  >
                    <option value="">All Types</option>
                    {seafoodTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minQuantity}
                      onChange={(e) => setFilters({...filters, minQuantity: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxQuantity}
                      onChange={(e) => setFilters({...filters, maxQuantity: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      placeholder="Start Date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters({
                        ...filters, 
                        dateRange: {...filters.dateRange, start: e.target.value}
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters({
                        ...filters, 
                        dateRange: {...filters.dateRange, end: e.target.value}
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
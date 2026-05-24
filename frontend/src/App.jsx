import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/Landingpage'; 
import SupplierDashboard from './components/supplier/supplierDashboard';
import OrdersManagement from './components/supplier/OrdersManagement';
import InventoryManagement from './components/supplier/InventoryManagement';
import TestAISTracker from './components/supplier/TestAisTracker';
import SupplierAIForecastingModule from './components/supplier/AI';

import WholesalerDashboard from './components/Wholesaler/WholesalerDashboard';
import WholesalerInventory from './components/Wholesaler/WholesalerInventory';
import SeafoodCatalog from './components/Wholesaler/SeafoodCatalog';
import WholesalerOrderManagement from './components/Wholesaler/WholesalerOrderManagement';
import RealTimeAIForecastingModule from './components/Wholesaler/AI';

import DistributorDashboard from './components/Distributor/DistributorDashboard';
import DistributorInventory from './components/Distributor/DistributorInventory';
import DistributorOrdersManagement from './components/Distributor/DistributorOrdersManagement';
import DistributorCatalogWrapper from './components/Distributor/Distributorcatalog';
import DistributorAIForecastingModule from './components/Distributor/AI';

import RetailerDashboard from './components/Retailer/RetailerDashboard';
import RetailerInventory from './components/Retailer/RetailerInventory';
import RetailerCatalog from './components/Retailer/RetailerCatalog';
import RetailerOrderManagement from './components/Retailer/RetailerOrderManagement';

// Import Admin Components
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Supplier Routes */}
        <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        <Route path="/supplier/order" element={<OrdersManagement />} />
        <Route path="/supplier/inventory" element={<InventoryManagement />} />
        <Route path="/supplier/logistics" element={<TestAISTracker />} />
        <Route path='/supplier/ai' element={<SupplierAIForecastingModule/>}/>
        
        {/* Wholesaler Routes */}
        <Route path="/wholesaler/dashboard" element={<WholesalerDashboard />} />
        <Route path="/wholesaler/inventory" element={<WholesalerInventory />} />
        <Route path="/wholesaler/catalog" element={<SeafoodCatalog />} />
        <Route path="/wholesaler/orders" element={<WholesalerOrderManagement />} />
        <Route path="/wholesaler/ai" element={< RealTimeAIForecastingModule/>} />

        {/* Distributor Routes */}
        <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
        <Route path="/distributor/inventory" element={<DistributorInventory />} />
        <Route path="/distributor/orders" element={<DistributorOrdersManagement />} />
        <Route path="/distributor/catalog" element={<DistributorCatalogWrapper />} />
        <Route path="/distributor/ai" element={<DistributorAIForecastingModule/>} />

        {/* Retailer Routes */}
        <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
        <Route path="/retailer/inventory" element={<RetailerInventory />} />
        <Route path="/retailer/orders" element={<RetailerOrderManagement />} />
        <Route path="/retailer/catalog" element={<RetailerCatalog />} />

        {/* Fallback route */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
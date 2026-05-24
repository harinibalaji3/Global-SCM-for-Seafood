// =================== ENHANCED AI FORECASTING MODULE WITH REAL-TIME UPDATES ===================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  TrendingUp,
  BarChart,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  Zap,
  LineChart,
  Activity,
  Target,
  ChevronRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  LogOut,
  Search,
  Bell,
  X,
  Fish,
  Users,
  DollarSign,
  Filter,
  Clock,
  CheckCircle,
  PlayCircle,
  Ship,
  Radio,
  Wifi,
  WifiOff,
  Database,
  BellRing,
  TrendingDown,
  Cpu,
  Globe,
  PieChart,
  BarChart2,
  MapPin,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Wind
} from "lucide-react";

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// =================== UTILITY FUNCTIONS ===================
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

const cn = (...classes) => classes.filter(Boolean).join(' ');

// =================== COMPONENTS ===================

// Sidebar Component
const Sidebar = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: Package, label: "Inventory", id: "inventory" },
    { icon: ShoppingCart, label: "Order", id: "orders" },
    { icon: FileText, label: "AI Module", id: "ai" },
  ];

  const getActiveItem = () => {
    const path = location;
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/orders')) return 'order';
    if (path.includes('/ai')) return 'ai';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'order';
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
      case 'order':
        navigate('/supplier/orders');
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

const ProfileDropdown = ({ userData, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getInitial = () => {
    if (userData?.name && userData.name !== 'Not provided') {
      return userData.name.charAt(0).toUpperCase();
    } else if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-medium hover:opacity-90 transition-opacity relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold">
                  {getInitial()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{userData?.name || 'User'}</h4>
                  <p className="text-sm text-gray-600">{userData?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                  <p className="text-gray-900">{userData?.businessName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{userData?.phone || 'Not provided'}</p>
                </div>
              </div>
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

// CSV Data
const CSV_DATA = [
  { month: "Jan-2024", country: "China", seafood_type: "Fish", quantity_kg: 2000 },
  { month: "Feb-2024", country: "USA", seafood_type: "Tuna", quantity_kg: 3050 },
  { month: "Mar-2024", country: "Japan", seafood_type: "Halicut", quantity_kg: 8100 },
  { month: "Apr-2024", country: "South Korea", seafood_type: "oysters", quantity_kg: 3150 },
  { month: "May-2024", country: "Spain", seafood_type: "mussles", quantity_kg: 3200 },
  { month: "Jun-2024", country: "China", seafood_type: "salmon", quantity_kg: 3250 },
  { month: "Jul-2024", country: "USA", seafood_type: "cot", quantity_kg: 3300 },
  { month: "Aug-2024", country: "Japan", seafood_type: "shrimp", quantity_kg: 9350 },
  { month: "Sep-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 3400 },
  { month: "Oct-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 3450 },
  { month: "Nov-2024", country: "China", seafood_type: "Fish", quantity_kg: 8500 },
  { month: "Dec-2024", country: "USA", seafood_type: "Fish", quantity_kg: 8550 },
  { month: "Jan-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 3600 },
  { month: "Feb-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 3650 },
  { month: "Mar-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 9700 },
  { month: "Apr-2024", country: "China", seafood_type: "Fish", quantity_kg: 8750 },
  { month: "May-2024", country: "USA", seafood_type: "Fish", quantity_kg: 8900 },
  { month: "Jun-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 6750 },
  { month: "Jul-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 3900 },
  { month: "Aug-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 3950 },
  { month: "Sep-2024", country: "China", seafood_type: "Fish", quantity_kg: 4000 },
  { month: "Oct-2024", country: "USA", seafood_type: "Fish", quantity_kg: 8050 },
  { month: "Nov-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 9100 },
  { month: "Dec-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 5150 },
  { month: "Jan-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 7200 },
  { month: "Feb-2024", country: "China", seafood_type: "Fish", quantity_kg: 8250 },
  { month: "Mar-2024", country: "USA", seafood_type: "Fish", quantity_kg: 8400 },
  { month: "Apr-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 6950 },
  { month: "May-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 6400 },
  { month: "Jun-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 8450 },
  { month: "Jul-2024", country: "China", seafood_type: "Fish", quantity_kg: 9900 },
  { month: "Aug-2024", country: "USA", seafood_type: "Fish", quantity_kg: 4550 },
  { month: "Sep-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 4600 },
  { month: "Oct-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 4650 },
  { month: "Nov-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 4700 },
  { month: "Dec-2024", country: "China", seafood_type: "Fish", quantity_kg: 7450 },
  { month: "Jan-2024", country: "USA", seafood_type: "Fish", quantity_kg: 9800 },
  { month: "Feb-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 8850 },
  { month: "Mar-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 4900 },
  { month: "Apr-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 4950 },
  { month: "May-2024", country: "China", seafood_type: "Fish", quantity_kg: 7000 },
  { month: "Jun-2024", country: "USA", seafood_type: "Fish", quantity_kg: 5050 },
  { month: "Jul-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 5100 },
  { month: "Aug-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 5150 },
  { month: "Sep-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 5200 },
  { month: "Oct-2024", country: "China", seafood_type: "Fish", quantity_kg: 5250 },
  { month: "Nov-2024", country: "USA", seafood_type: "Fish", quantity_kg: 5300 },
  { month: "Dec-2024", country: "Japan", seafood_type: "Fish", quantity_kg: 5350 },
  { month: "Jan-2024", country: "South Korea", seafood_type: "Fish", quantity_kg: 9400 },
  { month: "Feb-2024", country: "Spain", seafood_type: "Fish", quantity_kg: 8450 }
];

// =================== ENHANCED CSV DATA PROCESSING ===================
const processCSVData = (csvData) => {
  if (!csvData || !Array.isArray(csvData)) return [];
  
  const monthlyData = {};
  
  csvData.forEach(row => {
    const monthYear = row.month; // Format: "Jan-2024"
    const [monthStr, yearStr] = monthYear.split('-');
    
    // Convert month abbreviation to number (1-12)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex(m => 
      m.toLowerCase() === monthStr.toLowerCase().slice(0, 3)
    );
    
    if (monthIndex === -1) return; // Skip if month not recognized
    
    const month = monthIndex + 1;
    const year = parseInt(yearStr);
    
    // Create unique key for each month-year combination
    const key = `${month}-${year}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = {
        demand: 0,
        revenue: 0,
        orders: 0,
        countryCount: new Set(),
        seafoodTypes: new Set(),
        timestamp: new Date(year, month - 1, 15),
        monthlyData: []
      };
    }
    
    // Aggregate data
    monthlyData[key].demand += row.quantity_kg;
    monthlyData[key].revenue += row.quantity_kg * 25; // $25 per kg
    monthlyData[key].orders += 1;
    monthlyData[key].countryCount.add(row.country);
    monthlyData[key].seafoodTypes.add(row.seafood_type);
    monthlyData[key].monthlyData.push({
      country: row.country,
      seafoodType: row.seafood_type,
      quantity_kg: row.quantity_kg
    });
  });
  
  // Convert to array and sort chronologically
  const processedData = Object.entries(monthlyData)
    .map(([key, data], index) => {
      const [month, year] = key.split('-').map(Number);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return {
        id: index + 1,
        month: month,
        year: year,
        period: `${monthNames[month - 1]} ${year}`,
        demand: data.demand,
        revenue: data.revenue,
        orders: data.monthlyData.length,
        averageOrderSize: Math.round(data.demand / data.monthlyData.length),
        timestamp: data.timestamp.toISOString(),
        countryCount: data.countryCount.size,
        seafoodTypes: data.seafoodTypes.size,
        monthlyDetails: data.monthlyData,
        countries: Array.from(data.countryCount)
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  
  console.log(`✅ Processed ${processedData.length} months of data:`, processedData);
  return processedData;
};

// =================== ENHANCED GEOGRAPHICAL ANALYSIS ===================
const analyzeGeographicalPatterns = (csvData) => {
  const countryAnalysis = {};
  const seafoodTypeAnalysis = {};
  const monthlyTrends = {};
  
  csvData.forEach(row => {
    // Country analysis
    if (!countryAnalysis[row.country]) {
      countryAnalysis[row.country] = {
        totalDemand: 0,
        months: new Set(),
        seafoodTypes: new Set(),
        orders: 0
      };
    }
    countryAnalysis[row.country].totalDemand += row.quantity_kg;
    countryAnalysis[row.country].months.add(row.month);
    countryAnalysis[row.country].seafoodTypes.add(row.seafood_type);
    countryAnalysis[row.country].orders += 1;
    
    // Seafood type analysis
    if (!seafoodTypeAnalysis[row.seafood_type]) {
      seafoodTypeAnalysis[row.seafood_type] = {
        totalDemand: 0,
        countries: new Set(),
        orders: 0
      };
    }
    seafoodTypeAnalysis[row.seafood_type].totalDemand += row.quantity_kg;
    seafoodTypeAnalysis[row.seafood_type].countries.add(row.country);
    seafoodTypeAnalysis[row.seafood_type].orders += 1;
    
    // Monthly trends
    const monthYear = row.month;
    if (!monthlyTrends[monthYear]) {
      monthlyTrends[monthYear] = {
        totalDemand: 0,
        orders: 0
      };
    }
    monthlyTrends[monthYear].totalDemand += row.quantity_kg;
    monthlyTrends[monthYear].orders += 1;
  });
  
  // Calculate top countries
  const topCountries = Object.entries(countryAnalysis)
    .map(([country, data]) => ({
      country,
      totalDemand: data.totalDemand,
      monthlyAvg: Math.round(data.totalDemand / data.months.size),
      seafoodTypesCount: data.seafoodTypes.size,
      orders: data.orders,
      marketShare: 0 // Will calculate after total
    }))
    .sort((a, b) => b.totalDemand - a.totalDemand);
  
  // Calculate market share
  const totalDemandAll = topCountries.reduce((sum, c) => sum + c.totalDemand, 0);
  topCountries.forEach(c => {
    c.marketShare = ((c.totalDemand / totalDemandAll) * 100).toFixed(1);
  });
  
  // Calculate top seafood types
  const topSeafoodTypes = Object.entries(seafoodTypeAnalysis)
    .map(([type, data]) => ({
      type,
      totalDemand: data.totalDemand,
      countryCount: data.countries.size,
      orders: data.orders,
      avgOrderSize: Math.round(data.totalDemand / data.orders)
    }))
    .sort((a, b) => b.totalDemand - a.totalDemand);
  
  return {
    topCountries: topCountries.slice(0, 5),
    topSeafoodTypes: topSeafoodTypes.slice(0, 3),
    totalCountries: Object.keys(countryAnalysis).length,
    totalSeafoodTypes: Object.keys(seafoodTypeAnalysis).length,
    allCountries: topCountries,
    monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      demand: data.totalDemand,
      orders: data.orders
    })).sort((a, b) => {
      // Sort by date
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    })
  };
};

// =================== ENHANCED LINEAR REGRESSION MODEL ===================
class EnhancedLinearRegressionModel {
  constructor() {
    this.slope = 0;
    this.intercept = 0;
    this.rSquared = 0;
    this.trained = false;
    this.lastRetrained = null;
    this.retrainThreshold = 3;
    this.newDataPoints = [];
    this.countryModels = new Map();
    this.seasonalFactors = new Array(12).fill(1);
    this.monthlyStats = [];
    this.confidenceIntervals = [];
  }

  addDataPoint(time, demand) {
    this.newDataPoints.push({ time, demand });
    
    if (this.newDataPoints.length >= this.retrainThreshold) {
      return this.incrementalRetrain();
    }
    
    return false;
  }

  incrementalRetrain() {
    if (this.newDataPoints.length === 0) return false;
    
    console.log('🔄 Incremental retraining with', this.newDataPoints.length, 'new points');
    this.lastRetrained = new Date();
    this.newDataPoints = [];
    
    return true;
  }

  train(X, y) {
    if (X.length !== y.length || X.length === 0) {
      throw new Error('Invalid training data');
    }

    const n = X.length;
    const sumX = X.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = X.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = X.reduce((sum, xi) => sum + xi * xi, 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;

    const yMean = sumY / n;
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (this.slope * X[i] + this.intercept), 2), 0);
    this.rSquared = 1 - (ssRes / ssTot);

    // Calculate confidence intervals
    const standardError = Math.sqrt(ssRes / (n - 2));
    const xMean = sumX / n;
    const xVariance = X.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    
    this.confidenceIntervals = X.map((xi, i) => {
      const se = standardError * Math.sqrt(1/n + Math.pow(xi - xMean, 2) / xVariance);
      return {
        lower: y[i] - 1.96 * se,
        upper: y[i] + 1.96 * se
      };
    });

    this.trained = true;
    this.lastRetrained = new Date();
    
    return {
      slope: this.slope,
      intercept: this.intercept,
      rSquared: this.rSquared,
      lastRetrained: this.lastRetrained
    };
  }

  trainWithSeasonality(X, y) {
    if (X.length !== y.length || X.length === 0) {
      throw new Error('Invalid training data');
    }

    if (X.length >= 12) {
      const monthlyAverages = new Array(12).fill(0);
      const monthlyCounts = new Array(12).fill(0);
      
      X.forEach((x, i) => {
        const monthIndex = (x - 1) % 12;
        monthlyAverages[monthIndex] += y[i];
        monthlyCounts[monthIndex]++;
      });
      
      for (let i = 0; i < 12; i++) {
        if (monthlyCounts[i] > 0) {
          monthlyAverages[i] /= monthlyCounts[i];
        }
      }
      
      const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 
        monthlyAverages.filter(avg => avg > 0).length;
      
      this.seasonalFactors = monthlyAverages.map(avg => 
        avg > 0 ? avg / overallAverage : 1
      );
      
      // Store monthly statistics
      this.monthlyStats = monthlyAverages.map((avg, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        averageDemand: Math.round(avg),
        seasonalFactor: this.seasonalFactors[i].toFixed(2),
        impact: this.seasonalFactors[i] > 1.1 ? 'High Season' : 
                this.seasonalFactors[i] < 0.9 ? 'Low Season' : 'Average'
      }));
      
      const yAdjusted = y.map((value, i) => {
        const monthIndex = (X[i] - 1) % 12;
        return value / this.seasonalFactors[monthIndex];
      });
      
      return this.train(X, yAdjusted);
    } else {
      return this.train(X, y);
    }
  }

  predict(X) {
    if (!this.trained) {
      throw new Error('Model not trained');
    }
    return X.map(x => this.slope * x + this.intercept);
  }

  predictWithSeasonality(X) {
    const basePredictions = this.predict(X);
    return basePredictions.map((pred, i) => {
      const monthIndex = (X[i] - 1) % 12;
      return pred * (this.seasonalFactors[monthIndex] || 1);
    });
  }

  predictWithConfidence(X, confidence = 0.95) {
    const predictions = this.predict(X);
    const zScore = confidence === 0.99 ? 2.576 : confidence === 0.95 ? 1.96 : 1.645;
    
    // Calculate prediction intervals based on model accuracy
    const rmse = Math.sqrt((1 - this.rSquared) * Math.pow(predictions[0] - this.intercept, 2));
    
    return predictions.map(pred => ({
      prediction: Math.round(pred),
      lowerBound: Math.max(0, Math.round(pred - zScore * rmse)),
      upperBound: Math.round(pred + zScore * rmse),
      confidence: confidence * 100
    }));
  }

  getStatus() {
    return {
      trained: this.trained,
      lastRetrained: this.lastRetrained,
      pendingUpdates: this.newDataPoints.length,
      accuracy: this.rSquared,
      slope: this.slope,
      intercept: this.intercept,
      dataPoints: this.monthlyStats.length
    };
  }

  getSeasonalInsights() {
    return this.monthlyStats;
  }
}



// =================== MAIN COMPONENT ===================
const RealTimeAIForecastingModule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const [csvData, setCsvData] = useState(CSV_DATA);
  const [predictions, setPredictions] = useState([]);
  const [model] = useState(new EnhancedLinearRegressionModel());
  const [forecastPeriods, setForecastPeriods] = useState(6);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('monthly');
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [autoRetrain, setAutoRetrain] = useState(true);
  const [modelStatus, setModelStatus] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [geographicalInsights, setGeographicalInsights] = useState(null);
  const [seasonalInsights, setSeasonalInsights] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [countryBreakdown, setCountryBreakdown] = useState([]);
  
  const modelRef = useRef(model);
  const historicalDataRef = useRef(historicalData);

  useEffect(() => {
    historicalDataRef.current = historicalData;
  }, [historicalData]);

  useEffect(() => {
    const loadUserData = () => {
      const data = getUserData();
      setUserData(data);
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const loadAndProcessData = () => {
      try {
        const processedData = processCSVData(csvData);
        setHistoricalData(processedData);
        
        const geoInsights = analyzeGeographicalPatterns(csvData);
        setGeographicalInsights(geoInsights);
        
        const breakdown = geoInsights.allCountries.map(country => ({
          name: country.country,
          value: country.totalDemand,
          percentage: (country.totalDemand / geoInsights.allCountries.reduce((sum, c) => sum + c.totalDemand, 0) * 100).toFixed(1)
        }));
        setCountryBreakdown(breakdown);
        
        console.log('✅ Processed CSV data:', processedData.length, 'months');
        
      } catch (error) {
        console.error('Error processing CSV data:', error);
      }
    };
    
    loadAndProcessData();
  }, [csvData]);

  useEffect(() => {
    console.log('🔌 Initializing Socket.IO for AI module...');
    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('✅ AI Module: Socket connected');
      setSocketConnected(true);
      
      const user = getUserData();
      if (user?.id) {
        socketInstance.emit('join-supplier', { 
          supplierId: user.id.toString(),
          type: 'supplier',
          module: 'ai-forecasting'
        });
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ AI Module: Socket connection error:', error);
      setSocketConnected(false);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 AI Module: Socket disconnected');
      setSocketConnected(false);
    });

    socketInstance.on('new_order_for_supplier', (orderData) => {
      console.log('📊 AI Module: New order received:', orderData);
      
      setRealTimeUpdates(prev => [{
        id: Date.now(),
        type: 'new_order',
        timestamp: new Date().toISOString(),
        orderId: orderData.order_id,
        demand: 100,
        message: `New order #${orderData.order_id} received`
      }, ...prev.slice(0, 9)]);
    });

    socketInstance.on('orderUpdate', (updateData) => {
      console.log('🔄 AI Module: Order update:', updateData);
    });

    return () => {
      console.log('🧹 Cleaning up AI module socket connection');
      socketInstance.disconnect();
    };
  }, []);

  const calculateOrderDemand = (orderData) => {
    if (!orderData.items || !Array.isArray(orderData.items)) return 0;
    
    return orderData.items.reduce((total, item) => {
      return total + (item.quantity_kg || item.quantity || 0);
    }, 0);
  };

  const generateDemoHistoricalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthNumber = index + 1;
      const seasonalFactor = 1 + 0.3 * Math.sin((index / 6) * Math.PI);
      const trendFactor = 1000 + (150 * index);
      const randomVariation = Math.random() * 200 - 100;
      
      const demand = Math.round(trendFactor * seasonalFactor + randomVariation);
      
      return {
        id: index + 1,
        month: monthNumber,
        year: currentYear,
        period: `${month} ${currentYear}`,
        demand: demand,
        revenue: demand * 25,
        orders: Math.floor(demand / 100) + 5,
        averageOrderSize: Math.round(demand / (Math.floor(demand / 100) + 5)),
        timestamp: new Date(currentYear, index, 15).toISOString()
      };
    });
  };

  const trainAndPredict = useCallback((data, periods = 6) => {
    if (!data || data.length === 0) {
      setError('No historical data available');
      return;
    }
    
    const X = data.map((_, i) => i + 1);
    const y = data.map(d => d.demand);
    
    try {
      const trainingResult = data.length >= 12 
        ? modelRef.current.trainWithSeasonality(X, y)
        : modelRef.current.train(X, y);
      
      console.log('Model trained:', trainingResult);
      
      const status = modelRef.current.getStatus();
      setModelStatus(status);
      
      if (data.length >= 12) {
        setSeasonalInsights(modelRef.current.getSeasonalInsights());
      }
      
      const futureX = Array.from({ length: periods }, (_, i) => X.length + i + 1);
      const futurePredictions = data.length >= 12
        ? modelRef.current.predictWithSeasonality(futureX).map((pred, i) => ({
            prediction: pred,
            lowerBound: Math.max(0, pred * 0.9),
            upperBound: pred * 1.1,
            confidence: confidenceLevel
          }))
        : modelRef.current.predictWithConfidence(futureX, confidenceLevel);
      
      const futureMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const predictionData = futurePredictions.map((pred, index) => {
        const monthIndex = (currentMonth + index) % 12;
        const year = currentYear + Math.floor((currentMonth + index) / 12);
        
        return {
          id: `pred-${index}`,
          month: futureMonths[monthIndex],
          year: year,
          period: `${futureMonths[monthIndex]} ${year}`,
          predictedDemand: Math.round(pred.prediction),
          lowerBound: Math.round(pred.lowerBound),
          upperBound: Math.round(pred.upperBound),
          confidence: confidenceLevel * 100,
          expectedRevenue: Math.round(pred.prediction * 25),
          growthRate: index === 0 ? 0 : ((pred.prediction - futurePredictions[index-1].prediction) / futurePredictions[index-1].prediction * 100).toFixed(1),
          seasonalityFactor: data.length >= 12 ? modelRef.current.seasonalFactors[monthIndex].toFixed(2) : 1.0
        };
      });
      
      setPredictions(predictionData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error training model:', error);
      setError('Failed to train prediction model');
    }
  }, [confidenceLevel]);

  const retrainModel = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Manual retraining triggered');
      
      if (historicalDataRef.current.length === 0) {
        const newData = processCSVData(csvData);
        setHistoricalData(newData);
        trainAndPredict(newData, forecastPeriods);
      } else {
        trainAndPredict(historicalDataRef.current, forecastPeriods);
      }
      
      setRealTimeUpdates(prev => [{
        id: Date.now(),
        type: 'model_retrained',
        timestamp: new Date().toISOString(),
        message: 'AI model retrained with latest data',
        icon: 'Cpu'
      }, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('Error retraining:', error);
      setError('Failed to retrain model');
    } finally {
      setLoading(false);
    }
  }, [forecastPeriods, csvData, trainAndPredict]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        if (historicalData.length === 0) {
          const data = processCSVData(csvData);
          setHistoricalData(data);
          trainAndPredict(data, forecastPeriods);
        } else {
          trainAndPredict(historicalData, forecastPeriods);
        }
        
        const interval = setInterval(async () => {
          if (autoRetrain && historicalDataRef.current.length > 0) {
            console.log('🔄 Periodic model check...');
            trainAndPredict(historicalDataRef.current, forecastPeriods);
          }
        }, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
        
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [forecastPeriods, trainAndPredict, autoRetrain, csvData, historicalData]);

  useEffect(() => {
    if (modelRef.current.trained && historicalDataRef.current.length > 0) {
      trainAndPredict(historicalDataRef.current, forecastPeriods);
    }
  }, [forecastPeriods, trainAndPredict]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    if (socket) socket.disconnect();
    navigate('/');
  };

  const handleDownloadReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      supplier: userData?.businessName || userData?.name,
      modelStatus: modelStatus,
      historicalData: historicalData,
      predictions: predictions,
      geographicalInsights: geographicalInsights,
      realTimeUpdates: realTimeUpdates,
      settings: {
        forecastPeriods,
        confidenceLevel,
        autoRetrain,
        socketConnected
      }
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ai-forecast-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
const stats = {
  totalHistoricalDemand: historicalData.reduce((sum, d) => sum + d.demand, 0),
  averageMonthlyDemand: historicalData.length > 0 ? 
    Math.round(historicalData.reduce((sum, d) => sum + d.demand, 0) / historicalData.length) : 0,
  peakDemand: historicalData.length > 0 ? Math.max(...historicalData.map(d => d.demand)) : 0,
  peakMonth: historicalData.length > 0 ? 
    historicalData.reduce((max, d) => d.demand > max.demand ? d : max, historicalData[0]).period : 'N/A',
  trendDirection: model.slope > 0 ? 'upward' : model.slope < 0 ? 'downward' : 'stable',
  confidenceScore: Math.round(model.rSquared * 100),
  totalPredictedDemand: predictions.reduce((sum, p) => sum + p.predictedDemand, 0),
  averagePredictedGrowth: predictions.length > 1 ? 
    ((predictions[predictions.length-1].predictedDemand - predictions[0].predictedDemand) / predictions[0].predictedDemand * 100 / (predictions.length-1)).toFixed(1) : 0,
  totalCountries: geographicalInsights?.totalCountries || 0,
  topCountry: geographicalInsights?.topCountries[0]?.country || 'N/A',
  topCountryDemand: geographicalInsights?.topCountries[0]?.totalDemand || 0,
  topSeafoodType: geographicalInsights?.topSeafoodTypes[0]?.type || 'N/A',
  totalOrders: csvData.length, // Total number of orders from CSV
  averageOrderValue: csvData.length > 0 ? 
    Math.round(csvData.reduce((sum, row) => sum + row.quantity_kg * 25, 0) / csvData.length) : 0,
  seasonalVariation: seasonalInsights.length > 0 ? 
    ((Math.max(...seasonalInsights.map(s => parseFloat(s.seasonalFactor))) / 
      Math.min(...seasonalInsights.map(s => parseFloat(s.seasonalFactor))) - 1) * 100).toFixed(1) : 0
};
const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Training AI model...</p>
            <p className="text-sm text-gray-500 mt-2">Learning from {historicalData.length} data points</p>
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
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">AI Demand Forecasting</h1>
              <p className="text-gray-600 text-sm mt-1">
                Real-time predictions with Linear Regression
                {lastUpdate && (
                  <span className="ml-2 text-blue-600">
                    • Updated {formatTimeAgo(lastUpdate)}
                  </span>
                )}
              </p>
              {error && (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {socketConnected ? 'Live Updates' : 'Offline'}
                </span>
              </div>              
              <button
                onClick={retrainModel}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Retrain AI</span>
              </button>
              
              <ProfileDropdown userData={userData} onLogout={handleLogout} />
            </div>
          </div>
          
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 lg:p-6">
          
          {realTimeUpdates.length > 0 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {realTimeUpdates.length} updates
                    </span>
                  </div>
                  <button
                    onClick={() => setRealTimeUpdates([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="flex space-x-3 pb-2">
                    {realTimeUpdates.map(update => (
                      <div
                        key={update.id}
                        className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-3 min-w-[200px] shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {update.type === 'new_order' ? (
                            <Package className="w-4 h-4 text-green-600" />
                          ) : (
                            <Cpu className="w-4 h-4 text-purple-600" />
                          )}
                          <span className="text-xs text-gray-500">{formatTimeAgo(update.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-800">{update.message}</p>
                        {update.demand && (
                          <p className="text-xs text-gray-600 mt-1">
                            +{update.demand}kg demand added
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'overview' 
                  ? "bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-900" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              AI Overview
            </button>
           
            <button
              onClick={() => setActiveTab('model')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'model' 
                  ? "bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-900" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <BarChart className="w-4 h-4 inline mr-2" />
              Model Details
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'insights' 
                  ? "bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-900" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Business Insights
            </button>
            <button
              onClick={() => setActiveTab('geography')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors border",
                activeTab === 'geography' 
                  ? "bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-900" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Geography
            </button>
          </div>

          {/* Real-time Settings Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={autoRetrain}
                        onChange={(e) => setAutoRetrain(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Auto-retrain on new orders</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      Model updates automatically when new data arrives
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forecast Periods: {forecastPeriods} months
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={forecastPeriods}
                      onChange={(e) => setForecastPeriods(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Level: {confidenceLevel * 100}%
                    </label>
                    <select
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    >
                      <option value={0.90}>90% Confidence</option>
                      <option value={0.95}>95% Confidence (Recommended)</option>
                      <option value={0.99}>99% Confidence</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">AI Accuracy</h3>
                </div>
                {modelStatus.lastRetrained && (
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(modelStatus.lastRetrained)}
                  </span>
                )}
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {stats.confidenceScore}%
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                R² = {model.rSquared.toFixed(3)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center ${
                    stats.trendDirection === 'upward' ? 'bg-green-100' :
                    stats.trendDirection === 'downward' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    <TrendingUp className={`w-4 h-4 lg:w-5 lg:h-5 ${
                      stats.trendDirection === 'upward' ? 'text-green-600' :
                      stats.trendDirection === 'downward' ? 'text-red-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Trend</h3>
                </div>
                {socketConnected && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 capitalize">
                {stats.trendDirection}
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                Slope: {model.slope.toFixed(2)} kg/month
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 lg:w-5 lg-h5 text-blue-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Next {forecastPeriods} Months</h3>
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {(stats.totalPredictedDemand / 1000).toFixed(1)} tons
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                {stats.averagePredictedGrowth}% avg growth
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600" />
                  </div>
                  <h3 className="text-gray-900 text-sm lg:text-base font-medium">Countries</h3>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  From CSV
                </span>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {stats.totalCountries}
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                Top: {stats.topCountry}
              </p>
            </div>
          </div>

          {/* Geography Tab */}
          {activeTab === 'geography' && geographicalInsights && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographical Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Top Countries by Demand</h4>
                  <div className="space-y-3">
                    {geographicalInsights.topCountries.map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{country.country}</div>
                            <div className="text-xs text-gray-600">
                              Avg: {(country.monthlyAvg / 1000).toFixed(1)} tons/month
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {(country.totalDemand / 1000).toFixed(1)}t
                          </div>
                          <div className="text-xs text-gray-600">
                            {country.seafoodTypesCount} seafood types
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Country Breakdown</h4>
                  <div className="space-y-3">
                    {countryBreakdown.map((country, index) => (
                      <div key={country.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{country.name}</span>
                          <span className="font-medium">{country.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${country.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model Status Card */}
          {activeTab === 'model' && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Model Performance & Status</h3>
                {modelStatus.lastRetrained && (
                  <span className="text-sm text-gray-500">
                    Last trained: {formatTimeAgo(modelStatus.lastRetrained)}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Equation</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-gray-900 font-mono">
                          Y = {model.slope.toFixed(2)}X + {model.intercept.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Demand (kg) = Slope × Month + Base</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Real-time Impact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">New orders today:</span>
                        <span className="font-medium">
                          {realTimeUpdates.filter(u => 
                            u.type === 'new_order' && 
                            new Date(u.timestamp).toDateString() === new Date().toDateString()
                          ).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Pending retrain:</span>
                        <span className="font-medium">
                          {modelStatus.pendingUpdates || 0} data points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Next auto-retrain:</span>
                        <span className="font-medium">
                          {autoRetrain ? 'On next order' : 'Manual only'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">Accuracy (R²)</span>
                          <span className="text-sm font-medium">{model.rSquared.toFixed(3)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${model.rSquared * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">Mean Absolute Error</span>
                          <span className="text-sm font-medium">
                            {(() => {
                              if (historicalData.length === 0) return '0 kg';
                              const mae = historicalData.reduce((sum, d, i) => {
                                const predicted = model.slope * (i + 1) + model.intercept;
                                return sum + Math.abs(d.demand - predicted);
                              }, 0) / historicalData.length;
                              return Math.round(mae).toLocaleString() + ' kg';
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: '85%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Data Quality</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Data points:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          historicalData.length > 6 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {historicalData.length} months
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Recent updates:</span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {realTimeUpdates.length} today
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Training frequency:</span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {autoRetrain ? 'Real-time' : 'Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Historical Demand</h3>
                  <p className="text-sm text-gray-600">Based on {historicalData.length} months of data</p>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              
              <div className="h-64 flex items-end space-x-2 overflow-x-auto pb-4">
                {historicalData.map((month, index) => {
                  const maxDemand = Math.max(...historicalData.map(d => d.demand));
                  const height = (month.demand / maxDemand) * 200;
                  
                  return (
                    <div key={month.id} className="flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-1">{month.month}</div>
                      <div 
                        className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 hover:opacity-90 relative group"
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {month.period}: {month.demand.toLocaleString()}kg
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 mt-1 font-medium">
                        {(month.demand / 1000).toFixed(0)}k
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">{historicalData.length}</span> data points
                  </span>
                  {realTimeUpdates.length > 0 && (
                    <span className="text-green-600 font-medium">
                      +{realTimeUpdates.length} recent updates
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Predictions</h3>
                  <p className="text-sm text-gray-600">
                    Next {predictions.length} months with {confidenceLevel * 100}% confidence
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Real-time
                </span>
              </div>
              
              <div className="h-64 flex items-end space-x-2 overflow-x-auto pb-4">
                {predictions.map((prediction, index) => {
                  const maxPrediction = Math.max(...predictions.map(p => p.predictedDemand));
                  const height = (prediction.predictedDemand / maxPrediction) * 200;
                  const confidenceHeight = ((prediction.upperBound - prediction.lowerBound) / maxPrediction) * 200;
                  
                  return (
                    <div key={prediction.id} className="flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-1">{prediction.month}</div>
                      <div className="relative w-8">
                        <div 
                          className="absolute w-full bg-blue-100 rounded opacity-50"
                          style={{ 
                            height: `${confidenceHeight}px`,
                            bottom: `${(prediction.lowerBound / maxPrediction) * 200}px`
                          }}
                        />
                        <div 
                          className="relative w-8 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg transition-all duration-300 hover:opacity-90 z-10 group"
                          style={{ height: `${height}px` }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {prediction.period}: {prediction.predictedDemand.toLocaleString()}kg
                            <br />
                            Range: {prediction.lowerBound.toLocaleString()} - {prediction.upperBound.toLocaleString()}kg
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 mt-1 font-medium">
                        {(prediction.predictedDemand / 1000).toFixed(0)}k
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">{predictions.length}</span> month forecast
                  </span>
                  <span className={`font-medium ${
                    stats.trendDirection === 'upward' ? 'text-green-600' :
                    stats.trendDirection === 'downward' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stats.trendDirection} trend
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUpIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Increase Production</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Demand is trending upward by {model.slope.toFixed(2)}kg/month. 
                          Consider increasing inventory by {(model.slope * 2).toFixed(0)}kg for next month.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Seasonal Planning</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {seasonalInsights.length > 0 ? 
                            `Peak season detected in ${seasonalInsights.filter(s => parseFloat(s.factor) > 1.1).map(s => s.month).join(', ')}. Plan accordingly.` :
                            'Collect more data for seasonal analysis.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Data Variability</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Model accuracy is {stats.confidenceScore}%. 
                          {stats.confidenceScore < 80 && ' Consider collecting more data for better predictions.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Wind className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Market Trends</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Current growth rate: {stats.averagePredictedGrowth}% per month. 
                          {stats.averagePredictedGrowth > 5 ? ' Strong market demand detected.' : ' Stable market conditions.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

         
        </div>
      </div>
    </div>
  );
};

export default RealTimeAIForecastingModule;
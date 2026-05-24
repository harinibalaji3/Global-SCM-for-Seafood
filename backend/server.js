// server.js - Main server file
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
// Fix the Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Your React app URL
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'], // Explicitly specify transports
  allowEIO3: true // Allow Engine.IO v3 compatibility
});

app.use(express.json());
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/uploads', (req, res, next) => {
  console.log(`📁 Serving file: ${req.url}`);
  next();
}, express.static('uploads'));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "harini2005",
  database: process.env.DB_NAME || "seafood"
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Error:", err);
    process.exit(1);
  } else {
    console.log("✅ Database Connected");
  }
});

// ========== MULTER CONFIGURATION ==========
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
// ========== SIMULATED AIS TRACKING - NO API NEEDED ==========

// Indian ports database
const indianPorts = [
  { code: 'INBOM', name: 'Mumbai', lat: 18.96, lon: 72.96, country: 'India' },
  { code: 'INCCU', name: 'Kolkata', lat: 22.57, lon: 88.36, country: 'India' },
  { code: 'INMAA', name: 'Chennai', lat: 13.08, lon: 80.28, country: 'India' },
  { code: 'INCOK', name: 'Kochi', lat: 9.96, lon: 76.26, country: 'India' },
  { code: 'INVTZ', name: 'Vishakhapatnam', lat: 17.68, lon: 83.22, country: 'India' },
  { code: 'INJNP', name: 'Jawaharlal Nehru', lat: 18.95, lon: 72.95, country: 'India' },
  { code: 'INMRM', name: 'Marmagao (Goa)', lat: 15.41, lon: 73.80, country: 'India' },
  { code: 'INDIU', name: 'Diu', lat: 20.71, lon: 70.98, country: 'India' },
  { code: 'INTUT', name: 'Tuticorin', lat: 8.73, lon: 78.23, country: 'India' },
  { code: 'INPNQ', name: 'Pune', lat: 18.52, lon: 73.85, country: 'India' }
];

// Ship types
const shipTypes = [
  { type: 'Container', speed_range: [15, 25], icon: '📦' },
  { type: 'Bulk Carrier', speed_range: [12, 18], icon: '🚢' },
  { type: 'Tanker', speed_range: [10, 16], icon: '🛢️' },
  { type: 'Cargo', speed_range: [14, 20], icon: '📦' },
  { type: 'Fishing', speed_range: [8, 14], icon: '🎣' },
  { type: 'Reefer', speed_range: [14, 20], icon: '❄️' }, // Refrigerated cargo
  { type: 'Tug', speed_range: [6, 12], icon: '🚤' },
  { type: 'Passenger', speed_range: [16, 22], icon: '🛳️' }
];

// Ship statuses
const shipStatuses = [
  'under_way', 'at_anchor', 'moored', 'engaged_in_fishing',
  'restricted_maneuverability', 'aground'
];

// Calculate distance between coordinates (nautical miles)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3440; // Earth's radius in nautical miles
  const toRad = (deg) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate heading between coordinates
const calculateHeading = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * Math.PI / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const heading = Math.atan2(y, x) * 180 / Math.PI;
  return (heading + 360) % 360;
};

// Store ship journeys for consistent simulation
const shipJourneys = new Map();

// Generate realistic ship position
const generateShipPosition = (mmsi) => {
  // Get or create ship journey
  if (!shipJourneys.has(mmsi)) {
    // Create new journey for this ship
    const origin = indianPorts[Math.floor(Math.random() * indianPorts.length)];
    let destination;
    do {
      destination = indianPorts[Math.floor(Math.random() * indianPorts.length)];
    } while (destination.code === origin.code);
    
    const shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    const totalDistance = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
    const avgSpeed = (shipType.speed_range[0] + shipType.speed_range[1]) / 2;
    const totalHours = totalDistance / avgSpeed;
    
    shipJourneys.set(mmsi, {
      origin,
      destination,
      shipType,
      totalDistance,
      avgSpeed,
      totalHours,
      startTime: new Date(),
      progress: 0.1 + Math.random() * 0.1, // Start 10-20% complete
      status: 'under_way'
    });
  }
  
  const journey = shipJourneys.get(mmsi);
  
  // Update progress (simulate movement)
  const hoursElapsed = (new Date() - journey.startTime) / 3600000;
  journey.progress = Math.min(0.95, journey.progress + (0.0001 * journey.avgSpeed));
  
  // Occasionally change status
  if (Math.random() < 0.05) {
    journey.status = shipStatuses[Math.floor(Math.random() * shipStatuses.length)];
  }
  
  // Calculate current position
  const currentLat = journey.origin.lat + 
    (journey.destination.lat - journey.origin.lat) * journey.progress;
  const currentLon = journey.origin.lon + 
    (journey.destination.lon - journey.origin.lon) * journey.progress;
  
  // Add some realistic variation
  const latVariation = (Math.random() - 0.5) * 0.05;
  const lonVariation = (Math.random() - 0.5) * 0.05;
  
  // Calculate speed (vary a bit)
  const currentSpeed = journey.shipType.speed_range[0] + 
    Math.random() * (journey.shipType.speed_range[1] - journey.shipType.speed_range[0]);
  
  // Calculate ETA
  const remainingDistance = journey.totalDistance * (1 - journey.progress);
  const remainingHours = remainingDistance / currentSpeed;
  const eta = new Date(Date.now() + remainingHours * 3600000);
  
  return {
    mmsi,
    latitude: parseFloat((currentLat + latVariation).toFixed(6)),
    longitude: parseFloat((currentLon + lonVariation).toFixed(6)),
    timestamp: new Date(),
    speed: parseFloat(currentSpeed.toFixed(1)),
    heading: parseFloat(calculateHeading(
      journey.origin.lat, journey.origin.lon,
      journey.destination.lat, journey.destination.lon
    ).toFixed(1)),
    source: 'simulation',
    status: journey.status,
    ship_type: journey.shipType.type,
    ship_icon: journey.shipType.icon,
    origin: journey.origin.name,
    origin_code: journey.origin.code,
    destination: journey.destination.name,
    destination_code: journey.destination.code,
    eta: eta.toISOString(),
    progress_percent: parseFloat((journey.progress * 100).toFixed(1)),
    distance_traveled: parseFloat((journey.totalDistance * journey.progress).toFixed(1)),
    distance_remaining: parseFloat((journey.totalDistance * (1 - journey.progress)).toFixed(1)),
    total_distance: parseFloat(journey.totalDistance.toFixed(1)),
    estimated_hours_remaining: parseFloat(remainingHours.toFixed(1))
  };
};

// Get AIS data - always use simulation
const getAisData = async (mmsi) => {
  return generateShipPosition(mmsi);
};
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document and image files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// ========== EMAIL CONFIGURATION ==========
console.log("🔧 Setting up email system...");

// Check if email credentials are available
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

let transporter;

if (emailUser && emailPassword) {
  console.log("📧 Email credentials found, setting up SMTP...");
  
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Email setup failed:", error.message);
      console.log("⚠️ Falling back to development mode...");
      setupDevEmail();
    } else {
      console.log("✅ Email server connected successfully");
    }
  });
} else {
  console.log("⚠️ Email credentials not found in .env file");
  console.log("💡 To enable real emails, add to .env:");
  console.log("   EMAIL_USER=your-email@gmail.com");
  console.log("   EMAIL_PASSWORD=your-app-password");
  setupDevEmail();
}

function setupDevEmail() {
  console.log("🔄 Setting up development email mode...");
  
  transporter = {
    sendMail: async function(mailOptions) {
      console.log("\n📧 ========== SIMULATED EMAIL ==========");
      console.log("📧 To:", mailOptions.to);
      console.log("📧 Subject:", mailOptions.subject);
      
      // Extract OTP
      const otpMatch = mailOptions.html?.match(/\d{6}/);
      if (otpMatch) {
        console.log("📧 🔐 TEST OTP:", otpMatch[0]);
      }
      
      console.log("📧 =====================================\n");
      return Promise.resolve({ messageId: 'dev-' + Date.now() });
    }
  };
  
  console.log("✅ Development email mode ready");
}

// Make db, io, upload, and transporter available to routes
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  req.upload = upload;
  req.transporter = transporter;
  next();
});

// ========== INVENTORY ROUTES ==========
import createInventoryRouter from "./routes/inventory.js";
app.use('/api/inventory', createInventoryRouter(upload));
// ========== SOCKET.IO CONFIGURATION ==========
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('joinRoom', (data) => {
    const { userId, userType, role } = data || {};
    
    if (role === 'manufacturer') {
      socket.join('manufacturers');
      socket.join(`manufacturer_${userId}`);
      console.log(`🏭 Manufacturer ${userId} joined manufacturer rooms`);
      socket.join('all_suppliers');
    }
    
    if (role === 'supplier') {
      socket.join(`supplier_${userId}`);
      socket.join('all_suppliers');
      console.log(`🐟 Supplier ${userId} joined room`);
    }
    
    if (role === 'wholesaler') {
      socket.join(`wholesaler_${userId}`);
      console.log(`👤 Wholesaler ${userId} joined room`);
    }
  });

  socket.on('join-manufacturer', (manufacturerId) => {
    socket.join(`manufacturer-${manufacturerId}`);
    console.log(`🏭 Manufacturer ${manufacturerId} joined room (legacy)`);
  });

  socket.on('join-wholesaler', (wholesalerId) => {
    socket.join(`wholesaler-${wholesalerId}`);
    console.log(`👤 Wholesaler ${wholesalerId} joined room (legacy)`);
  });

  socket.on('join-supplier-room', ({ supplierId, wholesalerId }) => {
    const roomName = `supplier-${supplierId}`;
    socket.join(roomName);
    console.log(`🛒 Wholesaler ${wholesalerId} joined supplier ${supplierId} room`);
  });

  socket.on('orderUpdate', (data) => {
    console.log('🔄 Order update received:', data);
    if (data.targetWholesalerId) {
      io.to(`wholesaler-${data.targetWholesalerId}`).emit('orderUpdate', data);
    }
  });

  socket.on('newOrderNotification', (data) => {
    console.log('📦 New order notification:', data);
    if (data.manufacturerId) {
      io.to(`manufacturer-${data.manufacturerId}`).emit('newOrderReceived', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } else {
      io.to('manufacturers').emit('newOrderBroadcast', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }); // Join supplier room (update this handler)
  socket.on('join-supplier', (data) => {
    if (data.supplierId) {
      socket.join(`supplier-${data.supplierId}`);
      console.log(`🏭 Supplier ${data.supplierId} joined room`);
    }
  });
  
  // Listen for order creation (from your order creation endpoint)
  socket.on('order_created', (orderData) => {
    console.log('🛒 Order created event:', orderData);
    
    // Emit to the specific supplier
    if (orderData.supplier_id) {
      io.to(`supplier-${orderData.supplier_id}`).emit('new_order_for_supplier', {
        order_id: orderData.order_id,
        supplier_id: orderData.supplier_id,
        wholesaler_id: orderData.wholesaler_id,
        wholesaler_name: orderData.wholesaler_name || 'Wholesaler',
        wholesaler_company: orderData.wholesaler_company || 'Unknown Company',
        total_amount: orderData.total_amount,
        items: orderData.items || [],
        status: orderData.order_status || 'pending',
        message: `New order ${orderData.order_id} received from ${orderData.wholesaler_name || 'wholesaler'}`,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📤 Sent new order notification to supplier ${orderData.supplier_id}`);
    }
  });
  // In your io.on('connection', ...) section, add:

// Ship tracking
socket.on('join-ship-tracking', (data) => {
  const { mmsi, userId, role } = data || {};
  
  if (mmsi) {
    socket.join(`ship-${mmsi}`);
    console.log(`🚢 Client joined ship ${mmsi} tracking`);
    
    // Send initial position
    const positionData = generateShipPosition(mmsi);
    socket.emit('ship-position', positionData);
  }
  
  if (role === 'wholesaler' && userId) {
    socket.join(`wholesaler-ships-${userId}`);
  }
  
  if (role === 'supplier' && userId) {
    socket.join(`supplier-ships-${userId}`);
  }
});

// Request position update
socket.on('request-ship-update', (data) => {
  const { mmsi } = data;
  
  if (!mmsi) return;
  
  const positionData = generateShipPosition(mmsi);
  
  // Save to database
  const sql = `
    INSERT INTO ais_positions (mmsi, latitude, longitude, timestamp_utc)
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(sql, [
    positionData.mmsi,
    positionData.latitude,
    positionData.longitude,
    positionData.timestamp
  ], (err) => {
    if (!err) {
      // Broadcast to all tracking this ship
      io.to(`ship-${mmsi}`).emit('ship-position-update', {
        ...positionData,
        timestamp: new Date().toISOString()
      });
    }
  });
});
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} Reason: ${reason}`);
  });
});
// Auto-update positions every 30 seconds for active rooms
setInterval(() => {
  const rooms = io.sockets.adapter.rooms;
  
  rooms.forEach((sockets, roomName) => {
    if (roomName.startsWith('ship-')) {
      const mmsi = roomName.replace('ship-', '');
      const positionData = generateShipPosition(mmsi);
      
      io.to(roomName).emit('ship-position-update', {
        ...positionData,
        timestamp: new Date().toISOString()
      });
    }
  });
}, 30000); // Every 30 seconds
// Helper functions
const emitToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
  console.log(`📢 Emitted ${event} to room: ${room}`);
};

const emitToManufacturers = (event, data) => {
  io.to('manufacturers').emit(event, data);
  const manufacturerRoom = io.sockets.adapter.rooms.get('manufacturers');
  const manufacturerCount = manufacturerRoom ? Array.from(manufacturerRoom).length : 0;
  console.log(`🏭 Emitted ${event} to ${manufacturerCount} manufacturers`);
};

// ========== API ROUTES ==========
// Register User
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const validRoles = ["supplier", "wholesaler", "distributor", "retailer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role provided" });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.query(
        "INSERT INTO users (fullName, email, phoneNumber, password, role, is_verified) VALUES (?, ?, ?, ?, ?, 0)",
        [fullName, email, phoneNumber, hashedPassword, role],
        (err, result) => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ success: false, message: "Failed to create user" });
          }

          res.json({ 
            success: true, 
            message: "Registration successful! Please login to continue." 
          });
        }
      );
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login User
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: "User not found" });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      
      if (!match) {
        return res.status(400).json({ success: false, message: "Invalid password" });
      }

      const { password: _, ...userData } = user;

      if (user.is_verified === 1) {
        res.json({
          success: true,
          message: "Login successful",
          user: userData,
          nextStep: "dashboard"
        });
      } else {
        res.json({
          success: true,
          message: "Login successful",
          user: userData,
          nextStep: "company-verification"
        });
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Company Verification
app.post("/api/verify-company", 
  upload.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "businessIdProof", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const {
        email,
        businessname,
        cinGstin,
        panGstNumber,
        businessAddress,
        state,
        country,
        zipCode,
        website
      } = req.body;

      if (!email || !businessname || !panGstNumber || !businessAddress) {
        return res.status(400).json({
          success: false,
          message: "Email, Business Name, PAN/GST Number, and Business Address are required"
        });
      }

      if (!req.files?.registrationCertificate || !req.files?.businessIdProof) {
        return res.status(400).json({
          success: false,
          message: "Both documents are required"
        });
      }

      const registrationCertificate = req.files.registrationCertificate[0].filename;
      const businessIdProof = req.files.businessIdProof[0].filename;

      const query = `
        INSERT INTO company_verification 
        (email, businessname, cinGstin, panGstNumber, businessAddress, state, country, zipCode, website, registrationCertificate, businessIdProof) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        email, 
        businessname,
        cinGstin || null, 
        panGstNumber, 
        businessAddress,
        state || null, 
        country || null, 
        zipCode || null, 
        website || null, 
        registrationCertificate, 
        businessIdProof
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Company verification error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to save company details: " + err.message
          });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        db.query(
          "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?",
          [otp, otpExpiry, email],
          async (err) => {
            if (err) {
              console.error("OTP save error:", err);
              return res.status(500).json({
                success: false,
                message: "Failed to generate OTP"
              });
            }

            try {
              await transporter.sendMail({
                to: email,
                subject: "OceanFresh - Verification OTP",
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">OceanFresh Chain</h2>
                    <p>Your company details have been verified!</p>
                    <p>Your verification code is:</p>
                    <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                  </div>
                `
              });

              res.json({
                success: true,
                message: "Company verification successful! OTP sent to your email.",
                nextStep: "otp"
              });
            } catch (mailError) {
              console.error("Email error:", mailError);
              res.status(500).json({
                success: false,
                message: "Company details saved but failed to send OTP email"
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("Company verification error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// OTP Verification
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = rows[0];
    const now = new Date();

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date(user.otp_expiry) < now) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    db.query(
      "UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE email = ?",
      [email],
      (err) => {
        if (err) {
          console.error("Verification update error:", err);
          return res.status(500).json({ success: false, message: "Failed to verify user" });
        }

        res.json({
          success: true,
          message: "Verification successful!",
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            is_verified: 1
          }
        });
      }
    );
  });
});

// Get user dashboard data
app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;

  db.query("SELECT id, fullName, email, role, is_verified FROM users WHERE id = ?", [userId], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: rows[0] });
  });
});
// Get all companies based on role (supplier OR wholesaler)
app.get("/api/companies", (req, res) => {
  const { role } = req.query;
  
  console.log("🔍 GET /api/companies called with role:", role);

  // Validate role
  if (!role || !['supplier', 'wholesaler'].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid or missing role parameter. Must be 'supplier' or 'wholesaler'" 
    });
  }

  const sql = `
    SELECT cv.*, u.role as user_role, u.id as user_id
    FROM company_verification cv
    INNER JOIN users u ON cv.email = u.email
    WHERE u.role = ?
    ORDER BY cv.created_at DESC
  `;
  
  console.log("📝 SQL Query:", sql, "with role:", role);

  db.query(sql, [role], (err, results) => {
    if (err) {
      console.error("❌ Error fetching companies:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    console.log(`✅ Found ${results.length} companies with role: ${role}`);
    
    const companies = results.map(company => ({
      id: company.id,
      businessName: company.businessname || company.businessName,
      panGstNumber: company.panGstNumber,
      businessAddress: company.businessAddress,
      state: company.state,
      country: company.country,
      zipCode: company.zipCode,
      website: company.website,
      cinGstin: company.cinGstin,
      role: company.user_role || role,
      email: company.email,
      user_id: company.user_id,
      created_at: company.created_at
    }));

    console.log(`📤 Sending formatted ${role}s:`, companies.length);
    res.json(companies);
  });
});
// ========== ADMIN ROUTES ==========

// Get all users for admin
app.get("/api/admin/users", (req, res) => {
  console.log("🔍 Admin fetching all users");
  
  const sql = `
    SELECT id, fullName, email, phoneNumber, role, is_verified, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching users for admin:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      users: results
    });
  });
});

// Get all inventory for admin
app.get("/api/admin/inventory/all", (req, res) => {
  console.log("🔍 Admin fetching all inventory");
  
  const sql = `
    SELECT i.*, u.fullName as user_name, u.role as user_role 
    FROM inventory i 
    LEFT JOIN users u ON i.user_id = u.id 
    ORDER BY i.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching all inventory for admin:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      inventory: results
    });
  });
});

// Fallback endpoint that combines data from multiple sources
app.get("/api/admin/users-fallback", (req, res) => {
  console.log("🔍 Admin fallback - fetching users and inventory");
  
  // Get all users
  const userSql = "SELECT id, fullName, email, phoneNumber, role, is_verified, created_at FROM users";
  
  db.query(userSql, (err, users) => {
    if (err) {
      console.error("❌ Error in fallback users query:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // Get all inventory
    const inventorySql = "SELECT * FROM inventory ORDER BY created_at DESC";
    
    db.query(inventorySql, (err, inventory) => {
      if (err) {
        console.error("❌ Error in fallback inventory query:", err);
        inventory = [];
      }
      
      res.json({
        success: true,
        users: users || [],
        inventory: inventory || []
      });
    });
  });
});

// Get all suppliers
app.get("/api/admin/suppliers", (req, res) => {
  const sql = "SELECT id, fullName, email, phoneNumber, is_verified, created_at FROM users WHERE role = 'supplier'";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching suppliers:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      users: results
    });
  });
});

// Get all wholesalers
app.get("/api/admin/wholesalers", (req, res) => {
  const sql = "SELECT id, fullName, email, phoneNumber, is_verified, created_at FROM users WHERE role = 'wholesaler'";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching wholesalers:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      users: results
    });
  });
});

// Get all distributors
app.get("/api/admin/distributors", (req, res) => {
  const sql = "SELECT id, fullName, email, phoneNumber, is_verified, created_at FROM users WHERE role = 'distributor'";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching distributors:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      users: results
    });
  });
});

// Get user details with company verification info
app.get("/api/admin/user/:userId", (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT u.*, cv.businessname, cv.businessAddress, cv.panGstNumber, cv.state, cv.country, cv.zipCode
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ?
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user details:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({
      success: true,
      user: results[0]
    });
  });
});

// Get inventory for specific user
app.get("/api/admin/user/:userId/inventory", (req, res) => {
  const { userId } = req.params;
  
  const sql = "SELECT * FROM inventory WHERE user_id = ? ORDER BY created_at DESC";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user inventory:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      inventory: results
    });
  });
});

// Admin login endpoint (optional - if you want server-side validation)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded admin credentials (in production, store in environment variables)
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OceanFresh@2024';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      message: "Login successful",
      token: "admin-token-" + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
});
// Get inventory by supplier
app.get("/api/inventory/supplier/:supplierId", (req, res) => {
  const { supplierId } = req.params;

  console.log("🔍 GET /api/inventory/supplier/", supplierId);

  const sql = "SELECT * FROM inventory WHERE quantity > 0";
  
  db.query(sql, (err, inventoryRows) => {
    if (err) {
      console.error("❌ Error fetching inventory:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    console.log("📦 Inventory rows found:", inventoryRows.length);

    const supplierSql = "SELECT businessname FROM company_verification WHERE id = ?";
    db.query(supplierSql, [supplierId], (err, supplierRows) => {
      const supplierName = supplierRows[0]?.businessname || "Supplier";
      
      const products = inventoryRows.map(product => ({
        id: product.id,
        seafood_type: product.seafoodType,
        quantity_kg: parseFloat(product.quantity) || 0,
        price_per_kg: parseFloat(product.price) || 0,
        price: parseFloat(product.price) || 0,
        unit: product.unit || 'kg',
        processing_status: product.processingStatus || 'Raw',
        storage_condition: product.storageCondition || 'Chilled',
        expiry_date: product.expiryDate,
        batch_id: product.batchId,
        category: product.category || 'Fish',
        supplier_id: supplierId,
        company_name: supplierName,
        image: product.image,
        temperature: parseFloat(product.temperature) || 0,
        humidity: parseFloat(product.humidity) || 0,
        ammonia: parseFloat(product.ammonia) || 0,
        quality_status: product.status || 'Fresh',
        stock_qty: parseFloat(product.quantity) || 0
      }));

      console.log("📤 Sending formatted products:", products.length);
      res.json(products);
    });
  });
});
// Get inventory by wholesaler ID (FIXED VERSION)
app.get("/api/inventory/wholesaler/:wholesalerId", (req, res) => {
  const { wholesalerId } = req.params;

  console.log("🔍 GET /api/inventory/wholesaler/", wholesalerId);

  // First, get the user_id from the wholesaler's company_verification
  const getUserSql = `
    SELECT u.id as user_id, u.fullName, cv.businessname
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ? OR cv.id = ?
  `;
  
  db.query(getUserSql, [wholesalerId, wholesalerId], (userErr, userRows) => {
    if (userErr) {
      console.error("❌ Error finding user:", userErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // Check if user exists
    if (!userRows || userRows.length === 0) {
      console.log("❌ No user found with ID:", wholesalerId);
      return res.status(404).json({ 
        success: false, 
        message: "Wholesaler not found" 
      });
    }

    const userId = userRows[0]?.user_id || wholesalerId;
    const wholesalerName = userRows[0]?.businessname || userRows[0]?.fullName || "Wholesaler";

    console.log("✅ Found user:", { userId, wholesalerName });

    // Now get inventory for that user_id
    const sql = "SELECT * FROM inventory WHERE user_id = ? AND quantity > 0";
    
    db.query(sql, [userId], (err, inventoryRows) => {
      if (err) {
        console.error("❌ Error fetching inventory:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      console.log("📦 Inventory rows found:", inventoryRows.length);
      
      const products = inventoryRows.map(product => ({
        id: product.id,
        seafood_type: product.seafoodType,
        quantity_kg: parseFloat(product.quantity) || 0,
        price_per_kg: parseFloat(product.price) || 0,
        price: parseFloat(product.price) || 0,
        unit: product.unit || 'kg',
        processing_status: product.processingStatus || 'Raw',
        storage_condition: product.storageCondition || 'Chilled',
        expiry_date: product.expiryDate,
        batch_id: product.batchId,
        category: product.category || 'Fish',
        wholesaler_id: parseInt(wholesalerId),
        wholesaler_name: wholesalerName,
        company_name: wholesalerName,
        image: product.image,
        temperature: parseFloat(product.temperature) || 0,
        humidity: parseFloat(product.humidity) || 0,
        ammonia: parseFloat(product.ammonia) || 0,
        quality_status: product.status || 'Fresh',
        stock_qty: parseFloat(product.quantity) || 0,
        created_at: product.created_at
      }));

      console.log("📤 Sending formatted products:", products.length);
      res.json(products);
    });
  });
});

// Debug endpoint to check company verification data
app.get("/api/debug/wholesaler/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT u.id as user_id, u.fullName, u.email, u.role,
           cv.id as cv_id, cv.businessname, cv.businessAddress
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ? OR cv.id = ?
  `;
  
  db.query(sql, [id, id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      requested_id: id,
      results: rows,
      count: rows.length
    });
  });
});
// Create seafood order (multiple items)
app.post("/api/orders/seafood/multi", (req, res) => {
  try {
    const {
      wholesaler_id,
      supplier_id,
      items,
      subtotal,
      gst_amount,
      total_amount,
      delivery_address,
      storage_requirements,
      payment_mode,
      preferred_delivery_date,
      notes,
      payment_status = 'pending'
    } = req.body;

    console.log('📦 Creating seafood order:', {
      wholesaler_id,
      supplier_id,
      item_count: items?.length
    });

    if (!wholesaler_id || !supplier_id || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const orderId = `SEA-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    db.beginTransaction((err) => {
      if (err) {
        console.error("❌ Transaction error:", err);
        return res.status(500).json({ success: false, message: "Transaction error" });
      }

      const orderSql = `
        INSERT INTO orders 
        (order_id, wholesaler_id, supplier_id, subtotal, gst_amount, total_amount, 
         delivery_address, storage_requirements, payment_mode, payment_status, 
         preferred_delivery_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderValues = [
        orderId,
        wholesaler_id,
        supplier_id,
        subtotal,
        gst_amount,
        total_amount,
        delivery_address,
        storage_requirements,
        payment_mode,
        payment_status,
        preferred_delivery_date || null,
        notes || ''
      ];

      db.query(orderSql, orderValues, (err, orderResult) => {
        if (err) {
          console.error("❌ Order creation error:", err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: "Failed to create order" });
          });
        }

        const orderInsertId = orderResult.insertId;

        const itemPromises = items.map((item) => {
          return new Promise((resolve, reject) => {
            const itemSql = `
              INSERT INTO order_items 
              (order_id, product_id, seafood_type, quantity_kg, unit_price, gst_percentage, quality_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const itemValues = [
              orderInsertId,
              item.product_id,
              item.seafood_type,
              item.quantity_kg,
              item.unit_price,
              item.gst_percentage || 18.00,
              item.quality_status || 'Fresh'
            ];

            db.query(itemSql, itemValues, (err, itemResult) => {
              if (err) {
                reject(err);
              } else {
                const updateStockSql = `
                  UPDATE inventory 
                  SET quantity = quantity - ? 
                  WHERE id = ? AND quantity >= ?
                `;

                db.query(updateStockSql, [item.quantity_kg, item.product_id, item.quantity_kg], (updateErr) => {
                  if (updateErr) {
                    reject(updateErr);
                  } else {
                    resolve(itemResult);
                  }
                });
              }
            });
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            db.commit((commitErr) => {
              if (commitErr) {
                console.error("❌ Commit error:", commitErr);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: "Transaction failed" });
                });
              }

              const getOrderSql = `SELECT o.* FROM orders o WHERE o.id = ?`;

              db.query(getOrderSql, [orderInsertId], (err, orderRows) => {
                if (err) {
                  console.error("❌ Error fetching order details:", err);
                }

                const order = orderRows[0] || { order_id: orderId };

                const getItemsSql = `SELECT * FROM order_items WHERE order_id = ?`;

                db.query(getItemsSql, [orderInsertId], (err, itemRows) => {
                  if (err) {
                    console.error("❌ Error fetching order items:", err);
                  }
                  
                  emitToManufacturers('new-seafood-order', {
                    type: 'MANUFACTURER_ORDER_ALERT',
                    orderId: orderId,
                    wholesalerId: wholesaler_id,
                    wholesalerName: order.wholesaler_name,
                    supplierId: supplier_id,
                    supplierName: order.supplier_name,
                    totalAmount: total_amount,
                    itemCount: items.length,
                    items: itemRows.map(item => ({
                      seafood_type: item.seafood_type,
                      quantity: item.quantity_kg,
                      batch_id: item.batchId,
                      quality_status: item.quality_status
                    })),
                    message: `🏭 NEW ORDER: Order ${orderId} placed by ${order.wholesaler_name} with ${order.supplier_name}`,
                    timestamp: new Date().toISOString(),
                    priority: 'HIGH',
                    requiresProcessing: true
                  });

                  emitToRoom(`supplier-${supplier_id}`, 'newOrder', {
                    orderId: orderId,
                    wholesalerId: wholesaler_id,
                    totalAmount: total_amount,
                    itemCount: items.length,
                    message: `New order ${orderId} received from wholesaler`
                  });

                  emitToRoom(`wholesaler-${wholesaler_id}`, 'orderUpdate', {
                    orderId: orderId,
                    status: 'pending',
                    message: `Order ${orderId} placed successfully`
                  });

                  // ADD THIS SOCKET EMISSION FOR SUPPLIER NOTIFICATIONS
                  if (req.io) {
                    // Fetch wholesaler details for the notification
                    const getWholesalerSql = `SELECT fullName FROM users WHERE id = ?`;
                    db.query(getWholesalerSql, [wholesaler_id], (wholesalerErr, wholesalerRows) => {
                      const wholesalerName = wholesalerRows[0]?.fullName || 'Wholesaler';
                      
                      req.io.emit('order_created', {
                        order_id: orderId,
                        supplier_id: supplier_id,
                        wholesaler_id: wholesaler_id,
                        wholesaler_name: wholesalerName,
                        total_amount: total_amount,
                        items: items.map(item => ({
                          seafood_type: item.seafood_type,
                          quantity_kg: item.quantity_kg,
                          unit_price: item.unit_price
                        })),
                        order_status: 'pending',
                        timestamp: new Date().toISOString()
                      });
                      
                      // Also emit directly to supplier room
                      req.io.to(`supplier-${supplier_id}`).emit('new_order_for_supplier', {
                        order_id: orderId,
                        supplier_id: supplier_id,
                        wholesaler_id: wholesaler_id,
                        wholesaler_name: wholesalerName,
                        total_amount: total_amount,
                        items: items,
                        status: 'pending',
                        message: `New order ${orderId} received from ${wholesalerName}`,
                        timestamp: new Date().toISOString()
                      });
                    });
                  }

                  console.log(`✅ Order ${orderId} created successfully`);

                  res.json({
                    success: true,
                    message: "Order placed successfully",
                    order: {
                      ...order,
                      items: itemRows || []
                    }
                  });
                });
              });
            });
          })
          .catch((error) => {
            console.error("❌ Order items error:", error);
            db.rollback(() => {
              res.status(500).json({ 
                success: false, 
                message: "Failed to process order items" 
              });
            });
          });
      });
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});
// ========== SUPPLIER ORDERS ENDPOINT ==========
// Get orders for a specific supplier
app.get("/api/orders/supplier/:supplierId", (req, res) => {
  const { supplierId } = req.params;
  const { status, limit = 20, page = 1 } = req.query;
  
  console.log(`📋 Fetching orders for supplier: ${supplierId}`);
  
  // Base query
  let sql = `
    SELECT o.*, 
           w.fullName as wholesaler_name,
           cv.businessname as wholesaler_company,
           w.email as wholesaler_email,
           w.phoneNumber as wholesaler_phone
    FROM orders o
    JOIN users w ON o.wholesaler_id = w.id
    LEFT JOIN company_verification cv ON w.email = cv.email
    WHERE o.supplier_id = ?
  `;
  
  const params = [supplierId];
  
  if (status) {
    sql += " AND o.order_status = ?";
    params.push(status);
  }
  
  sql += " ORDER BY o.created_at DESC";
  
  // Count total
  const countSql = `
    SELECT COUNT(*) as total 
    FROM orders o 
    WHERE o.supplier_id = ?
    ${status ? "AND o.order_status = ?" : ""}
  `;
  
  const countParams = [supplierId];
  if (status) countParams.push(status);
  
  db.query(countSql, countParams, (countErr, countResults) => {
    if (countErr) {
      console.error("❌ Error counting supplier orders:", countErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    const total = countResults[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Add pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);
    
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("❌ Error fetching supplier orders:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      console.log(`✅ Found ${results.length} orders for supplier ${supplierId}`);
      
      if (results.length > 0) {
        const orderIds = results.map(order => order.id);
        
        // Get order items with inventory data
        const itemsSql = `
          SELECT oi.*, 
                 i.seafoodType as seafood_type,
                 i.batchId as batch_id,
                 i.image as product_image
          FROM order_items oi
          LEFT JOIN inventory i ON oi.product_id = i.id
          WHERE oi.order_id IN (?)
          ORDER BY oi.order_id
        `;
        
        db.query(itemsSql, [orderIds], (itemsErr, items) => {
          if (itemsErr) {
            console.error("❌ Error fetching order items:", itemsErr);
            return processSupplierOrderData(results, orderIds, total, page, limit, []);
          }
          
          processSupplierOrderData(results, orderIds, total, page, limit, items);
        });
      } else {
        res.json({
          success: true,
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    });
  });
  
  // Helper function to process supplier order data
  function processSupplierOrderData(orders, orderIds, total, page, limit, items) {
    // Get item counts and totals
    const summarySql = `
      SELECT 
        order_id,
        COUNT(*) as items_count,
        SUM(quantity_kg) as total_quantity,
        SUM(quantity_kg * unit_price) as items_subtotal
      FROM order_items 
      WHERE order_id IN (?)
      GROUP BY order_id
    `;
    
    db.query(summarySql, [orderIds], (summaryErr, summaries) => {
      if (summaryErr) {
        console.error("❌ Error fetching order summaries:", summaryErr);
      }
      
      // Group items by order_id
      const itemsByOrder = {};
      items.forEach(item => {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item);
      });
      
      // Create summary map
      const summaryMap = {};
      summaries?.forEach(summary => {
        summaryMap[summary.order_id] = {
          items_count: summary.items_count,
          total_quantity: summary.total_quantity,
          items_subtotal: summary.items_subtotal
        };
      });
      
      // Combine all data
      const ordersWithData = orders.map(order => ({
        id: order.id,
        order_id: order.order_id,
        wholesaler_id: order.wholesaler_id,
        wholesaler_name: order.wholesaler_name,
        wholesaler_company: order.wholesaler_company,
        wholesaler_email: order.wholesaler_email,
        wholesaler_phone: order.wholesaler_phone,
        supplier_id: order.supplier_id,
        subtotal: order.subtotal,
        gst_amount: order.gst_amount,
        total_amount: order.total_amount,
        delivery_address: order.delivery_address,
        storage_requirements: order.storage_requirements,
        payment_mode: order.payment_mode,
        payment_status: order.payment_status,
        order_status: order.order_status || 'pending',
        preferred_delivery_date: order.preferred_delivery_date,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items_count: summaryMap[order.id]?.items_count || 0,
        total_quantity: summaryMap[order.id]?.total_quantity || 0,
        items_subtotal: summaryMap[order.id]?.items_subtotal || 0,
        items: itemsByOrder[order.id] || []
      }));
      
      res.json({
        success: true,
        orders: ordersWithData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    });
  }
});

// ========== MANUFACTURER ENDPOINTS ==========
app.get("/api/manufacturer/:manufacturerId/dashboard", (req, res) => {
  const { manufacturerId } = req.params;
  
  console.log(`📊 Fetching dashboard for manufacturer ${manufacturerId}`);

  const today = new Date().toISOString().split('T')[0];
  
  const queries = {
    totalOrders: `
      SELECT COUNT(*) as count FROM orders 
      WHERE supplier_id IN (
        SELECT id FROM users WHERE role = 'supplier'
      )
    `,
    pendingOrders: `
      SELECT COUNT(*) as count FROM orders 
      WHERE order_status = 'pending'
    `,
    todayOrders: `
      SELECT COUNT(*) as count FROM orders 
      WHERE DATE(created_at) = ?
    `,
    totalRevenue: `
      SELECT SUM(total_amount) as total FROM orders 
      WHERE order_status = 'delivered' AND payment_status = 'paid'
    `,
    activeSuppliers: `
      SELECT COUNT(DISTINCT supplier_id) as count FROM orders 
      WHERE DATE(created_at) = ?
    `,
    recentOrders: `
      SELECT 
        o.*,
        w.fullName as wholesaler_name,
        s.fullName as supplier_name,
        cv_s.businessname as supplier_company,
        cv_w.businessname as wholesaler_company
      FROM orders o
      JOIN users w ON o.wholesaler_id = w.id
      JOIN users s ON o.supplier_id = s.id
      LEFT JOIN company_verification cv_s ON s.email = cv_s.email
      LEFT JOIN company_verification cv_w ON w.email = cv_w.email
      ORDER BY o.created_at DESC
      LIMIT 10
    `,
    topSuppliers: `
      SELECT 
        s.fullName as supplier_name,
        cv.businessname as supplier_company,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue
      FROM orders o
      JOIN users s ON o.supplier_id = s.id
      LEFT JOIN company_verification cv ON s.email = cv.email
      WHERE DATE(o.created_at) = ?
      GROUP BY o.supplier_id
      ORDER BY order_count DESC
      LIMIT 5
    `
  };
  
  const promises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      db.query(query, 
        key === 'todayOrders' || key === 'activeSuppliers' || key === 'topSuppliers' 
          ? [today] : [], 
        (err, results) => {
          if (err) {
            console.error(`❌ Error in ${key} query:`, err);
            reject(err);
          } else {
            resolve({ key, results: results[0] || results });
          }
        }
      );
    });
  });
  
  Promise.all(promises)
    .then(results => {
      const data = results.reduce((acc, { key, results }) => {
        acc[key] = results;
        return acc;
      }, {});
      
      res.json({
        success: true,
        stats: {
          total_orders: data.totalOrders?.count || 0,
          pending_orders: data.pendingOrders?.count || 0,
          today_orders: data.todayOrders?.count || 0,
          total_revenue: data.totalRevenue?.total || 0,
          active_suppliers: data.activeSuppliers?.count || 0
        },
        recent_orders: data.recentOrders || [],
        top_suppliers: data.topSuppliers || []
      });
    })
    .catch(err => {
      console.error("❌ Error fetching manufacturer dashboard:", err);
      res.status(500).json({ 
        success: false, 
        message: "Database error" 
      });
    });
});

// Get wholesaler by user ID
app.get("/api/wholesalers/user/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`🔍 Fetching wholesaler info for user ${userId}`);
  
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.role,
      cv.businessname,
      cv.businessAddress,
      cv.panGstNumber,
      cv.state,
      cv.country,
      cv.zipCode
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ? AND u.role = 'wholesaler'
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching wholesaler:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Wholesaler not found" });
    }
    
    console.log(`✅ Found wholesaler: ${results[0].fullName}`);
    res.json(results[0]);
  });
});// Get orders for distributor - FIXED (using distributor_id column)
app.get("/api/orders/distributor/:distributorId", (req, res) => {
  const { distributorId } = req.params;
  const { status, limit = 20, page = 1 } = req.query;
  
  console.log(`📋 Fetching orders for distributor: ${distributorId}`);
  
  let sql = `
    SELECT o.*, 
           w.fullName as wholesaler_name,
           cv.businessname as wholesaler_company,
           w.email as wholesaler_email,
           w.phoneNumber as wholesaler_phone
    FROM orders o
    LEFT JOIN users w ON o.wholesaler_id = w.id
    LEFT JOIN company_verification cv ON w.email = cv.email
    WHERE o.distributor_id = ?
  `;
  
  const params = [distributorId];
  
  if (status && status !== 'all') {
    sql += " AND o.order_status = ?";
    params.push(status);
  }
  
  // Count total for pagination
  const countSql = `SELECT COUNT(*) as total FROM orders WHERE distributor_id = ? ${
    status && status !== 'all' ? "AND order_status = ?" : ""
  }`;
  
  const countParams = [distributorId];
  if (status && status !== 'all') countParams.push(status);
  
  db.query(countSql, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Error counting distributor orders:", countErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    const total = countResult[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Add pagination
    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);
    
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("❌ Error fetching distributor orders:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (results.length > 0) {
        const orderIds = results.map(order => order.id);
        
        const itemsSql = "SELECT * FROM order_items WHERE order_id IN (?)";
        db.query(itemsSql, [orderIds], (itemsErr, items) => {
          if (itemsErr) {
            console.error("❌ Error fetching items:", itemsErr);
            items = [];
          }
          
          const itemsByOrder = {};
          items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });
          
          const ordersWithItems = results.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
          }));
          
          res.json({
            success: true,
            orders: ordersWithItems,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              totalPages: Math.ceil(total / parseInt(limit))
            }
          });
        });
      } else {
        res.json({
          success: true,
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    });
  });
});
// Get pending distributor orders for wholesaler
app.get("/api/orders/wholesaler/:wholesalerId/pending-distributor", (req, res) => {
  const { wholesalerId } = req.params;
  
  console.log(`📋 Fetching pending distributor orders for wholesaler: ${wholesalerId}`);
  
  // Check if distributor_id column exists
  const checkColumnsSql = "SHOW COLUMNS FROM orders";
  db.query(checkColumnsSql, (colErr, columns) => {
    if (colErr) {
      console.error("❌ Error checking columns:", colErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    const columnNames = columns.map(col => col.Field);
    const hasDistributorId = columnNames.includes('distributor_id');
    
    if (!hasDistributorId) {
      return res.json({
        success: true,
        orders: [],
        message: "Distributor orders not supported in current schema"
      });
    }
    
    const sql = `
      SELECT o.*, 
             d.fullName as distributor_name,
             cv_d.businessname as distributor_company,
             d.email as distributor_email,
             d.phoneNumber as distributor_phone
      FROM orders o
      LEFT JOIN users d ON o.distributor_id = d.id
      LEFT JOIN company_verification cv_d ON d.email = cv_d.email
      WHERE o.wholesaler_id = ? 
        AND o.distributor_id IS NOT NULL
        AND o.order_status = 'pending'
      ORDER BY o.created_at DESC
    `;
    
    db.query(sql, [wholesalerId], (err, results) => {
      if (err) {
        console.error("❌ Error fetching pending distributor orders:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      console.log(`✅ Found ${results.length} pending distributor orders`);
      
      if (results.length > 0) {
        const orderIds = results.map(order => order.id);
        
        const itemsSql = "SELECT * FROM order_items WHERE order_id IN (?)";
        db.query(itemsSql, [orderIds], (itemsErr, items) => {
          if (itemsErr) {
            console.error("❌ Error fetching items:", itemsErr);
            items = [];
          }
          
          const itemsByOrder = {};
          items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });
          
          const ordersWithItems = results.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
          }));
          
          res.json({
            success: true,
            orders: ordersWithItems
          });
        });
      } else {
        res.json({
          success: true,
          orders: []
        });
      }
    });
  });
});
// ========== USER ENDPOINTS ==========

// Get user by ID (fixes 404 for /api/users/6)
app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  
  console.log(`🔍 Fetching user with ID: ${id}`);
  
  const sql = "SELECT id, fullName, email, phoneNumber, role, is_verified FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({
      success: true,
      id: results[0].id,
      name: results[0].fullName,
      fullName: results[0].fullName,
      email: results[0].email,
      phone: results[0].phoneNumber,
      phoneNumber: results[0].phoneNumber,
      role: results[0].role,
      is_verified: results[0].is_verified
    });
  });
});

// Update user
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, businessName } = req.body;
  
  console.log(`🔄 Updating user ${id}:`, { name, phone, businessName });
  
  // Update users table
  let sql = "UPDATE users SET ";
  const updates = [];
  const values = [];
  
  if (name) {
    updates.push("fullName = ?");
    values.push(name);
  }
  
  if (phone) {
    updates.push("phoneNumber = ?");
    values.push(phone);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update" });
  }
  
  sql += updates.join(", ") + " WHERE id = ?";
  values.push(id);
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error updating user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // Also update company_verification if businessName provided
    if (businessName) {
      const companySql = "UPDATE company_verification SET businessname = ? WHERE email = (SELECT email FROM users WHERE id = ?)";
      db.query(companySql, [businessName, id], (companyErr) => {
        if (companyErr) {
          console.error("⚠️ Error updating company:", companyErr);
        }
      });
    }
    
    res.json({
      success: true,
      message: "User updated successfully"
    });
  });
});

// ========== COMPANY ENDPOINTS ==========

// Get company by user ID (fixes 404 for /api/companies/user/6)
app.get("/api/companies/user/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`🔍 Fetching company for user ID: ${userId}`);
  
  const sql = `
    SELECT cv.*, u.fullName, u.email, u.role
    FROM company_verification cv
    JOIN users u ON cv.email = u.email
    WHERE u.id = ?
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching company:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    
    const company = results[0];
    res.json({
      id: company.id,
      businessName: company.businessname,
      businessAddress: company.businessAddress,
      state: company.state,
      country: company.country,
      zipCode: company.zipCode,
      panGstNumber: company.panGstNumber,
      cinGstin: company.cinGstin,
      website: company.website,
      email: company.email,
      fullName: company.fullName,
      role: company.role
    });
  });
});

// Get all companies
app.get("/api/companies", (req, res) => {
  const { role } = req.query;
  
  console.log("🔍 GET /api/companies called with role:", role);
  
  let sql = `
    SELECT cv.*, u.role as user_role, u.id as user_id, u.fullName
    FROM company_verification cv
    INNER JOIN users u ON cv.email = u.email
  `;
  
  const params = [];
  
  if (role) {
    sql += " WHERE u.role = ?";
    params.push(role);
  }
  
  sql += " ORDER BY cv.created_at DESC";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching companies:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    const companies = results.map(company => ({
      id: company.id,
      businessName: company.businessname,
      panGstNumber: company.panGstNumber,
      businessAddress: company.businessAddress,
      state: company.state,
      country: company.country,
      zipCode: company.zipCode,
      website: company.website,
      cinGstin: company.cinGstin,
      role: company.user_role,
      email: company.email,
      user_id: company.user_id,
      fullName: company.fullName,
      created_at: company.created_at
    }));
    
    res.json(companies);
  });
});

// ========== DISTRIBUTOR ENDPOINTS ==========

// Get distributor by user ID
app.get("/api/distributors/user/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`🔍 Fetching distributor info for user ${userId}`);
  
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.role,
      cv.businessname as businessName,
      cv.businessAddress as warehouseAddress,
      cv.panGstNumber,
      cv.state,
      cv.country,
      cv.zipCode
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ? AND u.role = 'distributor'
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching distributor:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      // Return default data
      return res.json({
        id: parseInt(userId),
        fullName: "Distributor",
        businessName: "Distributor Business",
        warehouseAddress: "Warehouse Address",
        state: "State",
        country: "India",
        zipCode: "123456"
      });
    }
    
    res.json(results[0]);
  });
});

// Create distributor order (distributor orders from wholesaler)
app.post("/api/orders/distributor/multi", (req, res) => {
  try {
    const {
      distributor_id,
      wholesaler_id,
      items,
      subtotal,
      gst_amount,
      total_amount,
      delivery_address,
      storage_requirements,
      payment_mode,
      preferred_delivery_date,
      notes,
      payment_status = 'pending'
    } = req.body;

    console.log('📦 Creating distributor order:', {
      distributor_id,
      wholesaler_id,
      item_count: items?.length
    });

    if (!distributor_id || !wholesaler_id || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const orderId = `DIST-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    db.beginTransaction((err) => {
      if (err) {
        console.error("❌ Transaction error:", err);
        return res.status(500).json({ success: false, message: "Transaction error" });
      }

      // For distributor orders, supplier_id is NULL and distributor_id is set
      const orderSql = `
        INSERT INTO orders 
        (order_id, wholesaler_id, supplier_id, distributor_id, subtotal, gst_amount, total_amount, 
         delivery_address, storage_requirements, payment_mode, payment_status, order_status,
         preferred_delivery_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())
      `;

      const orderValues = [
        orderId,
        wholesaler_id,
        null, // supplier_id is NULL for distributor orders
        distributor_id, // Now using the new distributor_id column
        subtotal,
        gst_amount,
        total_amount,
        delivery_address,
        storage_requirements,
        payment_mode,
        payment_status,
        preferred_delivery_date || null,
        notes || '' // No need to store distributor_id in notes anymore
      ];

      console.log("📝 Insert SQL:", orderSql);
      console.log("📝 Insert Values:", orderValues);

      db.query(orderSql, orderValues, (err, orderResult) => {
        if (err) {
          console.error("❌ Order creation error:", err);
          return db.rollback(() => {
            res.status(500).json({ 
              success: false, 
              message: "Failed to create order",
              error: err.message
            });
          });
        }

        const orderInsertId = orderResult.insertId;

        const itemPromises = items.map((item) => {
          return new Promise((resolve, reject) => {
            const itemSql = `
              INSERT INTO order_items 
              (order_id, product_id, seafood_type, quantity_kg, unit_price, gst_percentage, quality_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const itemValues = [
              orderInsertId,
              item.product_id,
              item.seafood_type,
              item.quantity_kg,
              item.unit_price,
              item.gst_percentage || 18.00,
              item.quality_status || 'Fresh'
            ];

            db.query(itemSql, itemValues, (err, itemResult) => {
              if (err) {
                reject(err);
              } else {
                // Update wholesaler's inventory stock
                const updateStockSql = `
                  UPDATE inventory 
                  SET quantity = quantity - ? 
                  WHERE id = ? AND quantity >= ?
                `;

                db.query(updateStockSql, [item.quantity_kg, item.product_id, item.quantity_kg], (updateErr) => {
                  if (updateErr) {
                    reject(updateErr);
                  } else {
                    resolve(itemResult);
                  }
                });
              }
            });
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            db.commit((commitErr) => {
              if (commitErr) {
                console.error("❌ Commit error:", commitErr);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: "Transaction failed" });
                });
              }

              console.log(`✅ Distributor order ${orderId} created successfully`);

              // Notify wholesaler via socket
              if (req.io) {
                req.io.to(`wholesaler-${wholesaler_id}`).emit('new_distributor_order', {
                  order_id: orderId,
                  distributor_id: distributor_id,
                  wholesaler_id: wholesaler_id,
                  total_amount: total_amount,
                  items_count: items.length,
                  message: `New order from distributor`,
                  timestamp: new Date().toISOString()
                });
              }

              res.json({
                success: true,
                message: "Order placed successfully",
                order: {
                  order_id: orderId,
                  id: orderInsertId
                }
              });
            });
          })
          .catch((error) => {
            console.error("❌ Order items error:", error);
            db.rollback(() => {
              res.status(500).json({ 
                success: false, 
                message: "Failed to process order items" 
              });
            });
          });
      });
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Get orders by user ID - FIXED for your schema
app.get("/api/orders/user/:userId", (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;
  
  console.log(`📋 Fetching orders for user ${userId} with role ${role}`);
  
  let sql;
  let params = [];
  
  if (role === 'distributor') {
    sql = `
      SELECT o.*, 
             w.fullName as wholesaler_name,
             cv.businessname as wholesaler_company
      FROM orders o
      LEFT JOIN users w ON o.wholesaler_id = w.id
      LEFT JOIN company_verification cv ON w.email = cv.email
      WHERE o.notes LIKE ? AND o.supplier_id IS NULL
    `;
    params.push(`%[Distributor ID: ${userId}]%`);
  } else {
    return res.status(400).json({ success: false, message: "Role is required" });
  }
  
  sql += " ORDER BY o.created_at DESC LIMIT 20";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching user orders:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      orders: results
    });
  });
});

// Get order by order_id
app.get("/api/orders/by-order-id/:orderId", (req, res) => {
  const { orderId } = req.params;
  
  console.log(`🔍 Fetching order by ID: ${orderId}`);
  
  const sql = `
    SELECT o.*, 
           w.fullName as wholesaler_name,
           w.email as wholesaler_email,
           w.phoneNumber as wholesaler_phone,
           s.fullName as supplier_name,
           s.email as supplier_email,
           s.phoneNumber as supplier_phone,
           d.fullName as distributor_name,
           d.email as distributor_email,
           d.phoneNumber as distributor_phone,
           cv_w.businessname as wholesaler_company,
           cv_s.businessname as supplier_company,
           cv_d.businessname as distributor_company
    FROM orders o
    LEFT JOIN users w ON o.wholesaler_id = w.id
    LEFT JOIN users s ON o.supplier_id = s.id
    LEFT JOIN users d ON o.distributor_id = d.id
    LEFT JOIN company_verification cv_w ON w.email = cv_w.email
    LEFT JOIN company_verification cv_s ON s.email = cv_s.email
    LEFT JOIN company_verification cv_d ON d.email = cv_d.email
    WHERE o.order_id = ?
  `;
  
  db.query(sql, [orderId], (err, orderRows) => {
    if (err) {
      console.error("❌ Error fetching order:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    const order = orderRows[0];
    
    const itemsSql = "SELECT * FROM order_items WHERE order_id = ?";
    db.query(itemsSql, [order.id], (itemsErr, items) => {
      if (itemsErr) {
        console.error("❌ Error fetching items:", itemsErr);
        items = [];
      }
      
      res.json({
        ...order,
        items
      });
    });
  });
});

// Update order status
app.put("/api/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }
  
  const isNumericId = !isNaN(orderId) && !isNaN(parseFloat(orderId));
  
  let sql;
  let params;
  
  if (isNumericId) {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?";
    params = [status, parseInt(orderId)];
  } else {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?";
    params = [status, orderId];
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error updating order status:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  });
});
// Verify/Accept distributor order (wholesaler accepts order from distributor)
app.put("/api/orders/:orderId/verify", (req, res) => {
  const { orderId } = req.params;
  const { status = 'confirmed' } = req.body;
  
  console.log(`✅ Verifying order: ${orderId}`);
  
  const isNumericId = !isNaN(orderId) && !isNaN(parseFloat(orderId));
  
  let sql;
  let params;
  
  if (isNumericId) {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?";
    params = [status, parseInt(orderId)];
  } else {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?";
    params = [status, orderId];
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error verifying order:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Get order details for notification
    const getOrderSql = `
      SELECT o.*, 
             d.id as distributor_id,
             d.fullName as distributor_name,
             w.id as wholesaler_id,
             w.fullName as wholesaler_name
      FROM orders o
      LEFT JOIN users d ON o.distributor_id = d.id
      LEFT JOIN users w ON o.wholesaler_id = w.id
      WHERE ${isNumericId ? 'o.id = ?' : 'o.order_id = ?'}
    `;
    
    db.query(getOrderSql, [orderId], (orderErr, orderRows) => {
      if (!orderErr && orderRows.length > 0 && req.io) {
        const order = orderRows[0];
        
        // Notify distributor that order is confirmed
        if (order.distributor_id) {
          req.io.to(`distributor-${order.distributor_id}`).emit('orderVerified', {
            orderId: order.order_id,
            status: 'confirmed',
            message: `Your order has been confirmed by the wholesaler`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    res.json({
      success: true,
      message: "Order verified successfully",
      data: { order_id: orderId, status: status }
    });
  });
});
// Reject order
app.put("/api/orders/:orderId/reject", (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  
  console.log(`❌ Rejecting order: ${orderId} - Reason: ${reason || 'Not specified'}`);
  
  const isNumericId = !isNaN(orderId) && !isNaN(parseFloat(orderId));
  
  let sql;
  let params;
  
  if (isNumericId) {
    sql = "UPDATE orders SET order_status = 'rejected', updated_at = NOW() WHERE id = ?";
    params = [parseInt(orderId)];
  } else {
    sql = "UPDATE orders SET order_status = 'rejected', updated_at = NOW() WHERE order_id = ?";
    params = [orderId];
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error rejecting order:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({
      success: true,
      message: "Order rejected successfully"
    });
  });
});
// Get orders for wholesaler (includes both supplier and distributor orders)
app.get("/api/orders", (req, res) => {
  const { wholesaler_id, status, limit = 20, page = 1 } = req.query;
  
  console.log(`📋 Fetching orders for wholesaler: ${wholesaler_id}`);
  
  if (!wholesaler_id) {
    return res.status(400).json({ success: false, message: "Wholesaler ID is required" });
  }
  
  let sql = `
    SELECT o.*, 
           s.fullName as supplier_name,
           cv_s.businessname as supplier_company,
           w.fullName as wholesaler_name,
           cv_w.businessname as wholesaler_company,
           d.fullName as distributor_name,
           cv_d.businessname as distributor_company,
           CASE 
             WHEN o.supplier_id IS NOT NULL THEN 'supplier'
             WHEN o.distributor_id IS NOT NULL THEN 'distributor'
             ELSE 'unknown'
           END as source
    FROM orders o
    LEFT JOIN users s ON o.supplier_id = s.id
    LEFT JOIN company_verification cv_s ON s.email = cv_s.email
    LEFT JOIN users w ON o.wholesaler_id = w.id
    LEFT JOIN company_verification cv_w ON w.email = cv_w.email
    LEFT JOIN users d ON o.distributor_id = d.id
    LEFT JOIN company_verification cv_d ON d.email = cv_d.email
    WHERE o.wholesaler_id = ?
  `;
  
  const params = [wholesaler_id];
  
  if (status && status !== 'all') {
    sql += " AND o.order_status = ?";
    params.push(status);
  }
  
  sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  console.log("📋 Final SQL:", sql);
  console.log("📋 Params:", params);
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching orders:", err);
      return res.status(500).json({ success: false, message: "Database error: " + err.message });
    }
    
    console.log(`✅ Found ${results.length} orders`);
    
    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM orders WHERE wholesaler_id = ? ${
      status && status !== 'all' ? "AND order_status = ?" : ""
    }`;
    const countParams = [wholesaler_id];
    if (status && status !== 'all') countParams.push(status);
    
    db.query(countSql, countParams, (countErr, countResult) => {
      const total = countErr ? results.length : (countResult[0]?.total || 0);
      
      if (results.length > 0) {
        const orderIds = results.map(order => order.id);
        
        // Get order items
        const itemsSql = `SELECT * FROM order_items WHERE order_id IN (?)`;
        
        db.query(itemsSql, [orderIds], (itemsErr, items) => {
          if (itemsErr) {
            console.error("❌ Error fetching items:", itemsErr);
            items = [];
          }
          
          // Group items by order_id
          const itemsByOrder = {};
          items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });
          
          const ordersWithData = results.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
          }));
          
          res.json({
            success: true,
            orders: ordersWithData,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              totalPages: Math.ceil(total / parseInt(limit))
            }
          });
        });
      } else {
        res.json({
          success: true,
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    });
  });
});
// Get pending distributor orders for wholesaler (to handle/verify)
app.get("/api/orders/wholesaler/:wholesalerId/pending-distributor", (req, res) => {
  const { wholesalerId } = req.params;
  
  console.log(`📋 Fetching pending distributor orders for wholesaler: ${wholesalerId}`);
  
  const sql = `
    SELECT o.*, 
           d.fullName as distributor_name,
           cv_d.businessname as distributor_company,
           d.email as distributor_email,
           d.phoneNumber as distributor_phone
    FROM orders o
    LEFT JOIN users d ON o.distributor_id = d.id
    LEFT JOIN company_verification cv_d ON d.email = cv_d.email
    WHERE o.wholesaler_id = ? 
      AND o.distributor_id IS NOT NULL
      AND o.order_status = 'pending'
    ORDER BY o.created_at DESC
  `;
  
  db.query(sql, [wholesalerId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching pending distributor orders:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    console.log(`✅ Found ${results.length} pending distributor orders`);
    
    if (results.length > 0) {
      const orderIds = results.map(order => order.id);
      
      const itemsSql = "SELECT * FROM order_items WHERE order_id IN (?)";
      db.query(itemsSql, [orderIds], (itemsErr, items) => {
        if (itemsErr) {
          console.error("❌ Error fetching items:", itemsErr);
          items = [];
        }
        
        const itemsByOrder = {};
        items.forEach(item => {
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
          }
          itemsByOrder[item.order_id].push(item);
        });
        
        const ordersWithItems = results.map(order => ({
          ...order,
          items: itemsByOrder[order.id] || []
        }));
        
        res.json({
          success: true,
          orders: ordersWithItems
        });
      });
    } else {
      res.json({
        success: true,
        orders: []
      });
    }
  });
});

// Update order status (for both supplier and distributor orders)
app.put("/api/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status, action_by, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  
  // Check if orderId is numeric (id) or alphanumeric (order_id)
  const isNumericId = !isNaN(orderId) && !isNaN(parseFloat(orderId));
  
  let sql;
  let params;
  
  if (isNumericId) {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?";
    params = [status, parseInt(orderId)];
  } else {
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?";
    params = [status, orderId];
  }
  
  console.log(`🔄 Updating order status: ${sql}, params: ${params}`);
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error updating order status:", err);
      return res.status(500).json({ success: false, message: "Database error: " + err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Get the full order details for socket notification
    const getOrderSql = `
      SELECT o.*, 
             w.fullName as wholesaler_name, 
             w.id as wholesaler_id,
             s.fullName as supplier_name,
             s.id as supplier_id,
             d.fullName as distributor_name,
             d.id as distributor_id
      FROM orders o
      JOIN users w ON o.wholesaler_id = w.id
      LEFT JOIN users s ON o.supplier_id = s.id
      LEFT JOIN users d ON o.distributor_id = d.id
      WHERE ${isNumericId ? 'o.id = ?' : 'o.order_id = ?'}
    `;
    
    db.query(getOrderSql, [orderId], (orderErr, orderRows) => {
      if (!orderErr && orderRows.length > 0) {
        const order = orderRows[0];
        
        // Emit socket notifications
        if (req.io) {
          // Notify relevant parties
          if (order.supplier_id) {
            req.io.to(`supplier-${order.supplier_id}`).emit('orderUpdate', {
              orderId: order.order_id,
              status: status,
              message: `Order status updated to ${status}`,
              timestamp: new Date().toISOString()
            });
          }
          
          if (order.distributor_id) {
            req.io.to(`distributor-${order.distributor_id}`).emit('orderUpdate', {
              orderId: order.order_id,
              status: status,
              message: `Order status updated to ${status}`,
              timestamp: new Date().toISOString()
            });
          }
          
          // Always notify wholesaler
          req.io.to(`wholesaler-${order.wholesaler_id}`).emit('orderUpdate', {
            orderId: order.order_id,
            status: status,
            message: `Order status updated to ${status}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: orderRows[0] || null
      });
    });
  });
});

// ========== DISTRIBUTOR ENDPOINTS ==========

// Get distributor info by user ID
app.get("/api/distributors/user/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`🔍 Fetching distributor info for user ${userId}`);
  
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.role,
      cv.businessname as businessName,
      cv.businessAddress as warehouseAddress,
      cv.panGstNumber,
      cv.state,
      cv.country,
      cv.zipCode
    FROM users u
    LEFT JOIN company_verification cv ON u.email = cv.email
    WHERE u.id = ? AND u.role = 'distributor'
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching distributor:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      // Return default data instead of 404
      return res.json({
        id: parseInt(userId),
        fullName: "Distributor",
        businessName: "Distributor Business",
        warehouseAddress: "Warehouse Address",
        state: "State",
        country: "India",
        zipCode: "123456"
      });
    }
    
    console.log(`✅ Found distributor: ${results[0].fullName}`);
    res.json(results[0]);
  });
});// Get orders with query params - FIXED for your schema
app.get("/api/orders", (req, res) => {
  const { distributor_id, status, limit = 20 } = req.query;
  
  console.log("📋 GET /api/orders with query:", req.query);
  
  let sql;
  let params = [];
  
  if (distributor_id) {
    // Extract from notes
    sql = `
      SELECT o.*, 
             w.fullName as wholesaler_name,
             cv.businessname as wholesaler_company
      FROM orders o
      LEFT JOIN users w ON o.wholesaler_id = w.id
      LEFT JOIN company_verification cv ON w.email = cv.email
      WHERE o.notes LIKE ? AND o.supplier_id IS NULL
    `;
    params.push(`%[Distributor ID: ${distributor_id}]%`);
  } else {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid query parameters" 
    });
  }
  
  if (status && status !== 'all') {
    sql += " AND o.order_status = ?";
    params.push(status);
  }
  
  sql += " ORDER BY o.created_at DESC LIMIT ?";
  params.push(parseInt(limit));
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching orders:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    res.json({
      success: true,
      orders: results
    });
  });
});
// Update order status - FIXED VERSION
app.put("/api/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  
  // Check if orderId is numeric (id) or alphanumeric (order_id)
  const isNumericId = !isNaN(orderId) && !isNaN(parseFloat(orderId));
  
  let sql;
  let params;
  
  if (isNumericId) {
    // If orderId is a number, use the id column
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?";
    params = [status, parseInt(orderId)];
  } else {
    // If orderId is a string (like 'SEA-001'), use the order_id column
    sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?";
    params = [status, orderId];
  }
  
  console.log(`🔄 Updating order status: ${sql}, params: ${params}`);
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error updating order status:", err);
      return res.status(500).json({ success: false, message: "Database error: " + err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Get the full order details for socket notification
    const getOrderSql = `
      SELECT o.*, 
             w.fullName as wholesaler_name, 
             w.id as wholesaler_id,
             s.fullName as supplier_name,
             s.id as supplier_id
      FROM orders o
      JOIN users w ON o.wholesaler_id = w.id
      JOIN users s ON o.supplier_id = s.id
      WHERE ${isNumericId ? 'o.id = ?' : 'o.order_id = ?'}
    `;
    
    db.query(getOrderSql, [orderId], (orderErr, orderRows) => {
      if (!orderErr && orderRows.length > 0) {
        const order = orderRows[0];
        
        // Emit socket notifications
        if (req.io) {
          // Notify wholesaler
          req.io.to(`wholesaler-${order.wholesaler_id}`).emit('orderUpdate', {
            orderId: order.order_id,
            status: status,
            message: `Order status updated to ${status}`,
            timestamp: new Date().toISOString()
          });
          
          // Notify supplier
          req.io.to(`supplier-${order.supplier_id}`).emit('orderUpdate', {
            orderId: order.order_id,
            status: status,
            message: `Order status updated to ${status}`,
            timestamp: new Date().toISOString()
          });
          
          // For supplier actions, emit a specific event
          if (req.body.action_by === 'supplier') {
            req.io.to(`wholesaler-${order.wholesaler_id}`).emit('supplier_action', {
              orderId: order.order_id,
              action: req.body.action || 'status_update',
              status: status,
              supplierId: order.supplier_id,
              supplierName: order.supplier_name,
              timestamp: new Date().toISOString(),
              message: req.body.message || `Your order ${order.order_id} status has been updated to ${status} by the supplier.`
            });
          }
        }
      }
      
      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: orderRows[0] || null
      });
    });
  });
});
// Get order by order_id (string like 'SEA-001')
app.get("/api/orders/by-order-id/:orderId", (req, res) => {
  const { orderId } = req.params;
  
  const sql = `
    SELECT o.*, 
           w.fullName as wholesaler_name,
           w.email as wholesaler_email,
           w.phoneNumber as wholesaler_phone,
           s.fullName as supplier_name,
           s.email as supplier_email,
           s.phoneNumber as supplier_phone,
           cv_w.businessname as wholesaler_company,
           cv_s.businessname as supplier_company
    FROM orders o
    JOIN users w ON o.wholesaler_id = w.id
    JOIN users s ON o.supplier_id = s.id
    LEFT JOIN company_verification cv_w ON w.email = cv_w.email
    LEFT JOIN company_verification cv_s ON s.email = cv_s.email
    WHERE o.order_id = ?
  `;
  
  db.query(sql, [orderId], (err, orderRows) => {
    if (err) {
      console.error("❌ Error fetching order by order_id:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    const order = orderRows[0];
    
    // Get order items
    const itemsSql = `
      SELECT oi.*, 
             i.seafoodType,
             i.batchId,
             i.image
      FROM order_items oi
      LEFT JOIN inventory i ON oi.product_id = i.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `;
    
    db.query(itemsSql, [order.id], (itemsErr, items) => {
      if (itemsErr) {
        console.error("❌ Error fetching order items:", itemsErr);
      }
      
      res.json({
        ...order,
        items: items || []
      });
    });
  });
});

// GET /api/orders/wholesaler/incoming/:wholesalerId
app.get('/wholesaler/incoming/:wholesalerId', async (req, res) => {
  try {
    const { wholesalerId } = req.params;
    
    const query = `
      SELECT 
        o.*,
        d.name as distributor_name,
        d.business_name as distributor_company,
        d.email as distributor_email,
        d.phone as distributor_phone
      FROM orders o
      LEFT JOIN distributors d ON o.distributor_id = d.user_id
      WHERE o.wholesaler_id = $1 
        AND o.order_type = 'distributor'
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [wholesalerId]);
    
    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching incoming distributor orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incoming orders',
      error: error.message
    });
  }
});
// ========== AIS SHIP TRACKING ROUTES ==========

// Track a vessel (creates/saves position)
app.get("/api/ais/track/:mmsi", async (req, res) => {
  try {
    const { mmsi } = req.params;
    
    if (!mmsi || mmsi.length < 9) {
      return res.status(400).json({
        success: false,
        message: "Valid MMSI (9 digits) required"
      });
    }

    // Generate simulated position
    const positionData = generateShipPosition(mmsi);
    
    // Save to database
    const sql = `
      INSERT INTO ais_positions (mmsi, latitude, longitude, timestamp_utc)
      VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [
      positionData.mmsi,
      positionData.latitude,
      positionData.longitude,
      positionData.timestamp
    ], (err, result) => {
      if (err) {
        console.error("❌ Error saving AIS position:", err);
        // Still return data even if save fails
        return res.json({
          success: true,
          position: positionData,
          note: "Using simulated ship tracking data"
        });
      }

      // Check if vessel exists, create if not
      const checkVesselSql = "SELECT * FROM vessels WHERE mmsi = ?";
      db.query(checkVesselSql, [mmsi], (err, rows) => {
        if (err) console.error("❌ Error checking vessel:", err);
        
        if (!rows || rows.length === 0) {
          const createVesselSql = `
            INSERT INTO vessels (mmsi, vessel_name)
            VALUES (?, ?)
          `;
          db.query(createVesselSql, [
            mmsi, 
            `${positionData.ship_icon} ${positionData.ship_type}-${mmsi.slice(-4)}`
          ], (err) => {
            if (err) console.error("❌ Error creating vessel:", err);
          });
        }
      });

      res.json({
        success: true,
        position: {
          id: result.insertId,
          ...positionData
        }
      });
    });
  } catch (error) {
    console.error("❌ AIS track error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get latest position
app.get("/api/ais/position/:mmsi/latest", (req, res) => {
  const { mmsi } = req.params;
  
  const sql = `
    SELECT ap.*, v.vessel_name 
    FROM ais_positions ap
    LEFT JOIN vessels v ON ap.mmsi = v.mmsi
    WHERE ap.mmsi = ?
    ORDER BY ap.timestamp_utc DESC
    LIMIT 1
  `;
  
  db.query(sql, [mmsi], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching latest position:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (rows.length === 0) {
      // No saved data, generate new
      const positionData = generateShipPosition(mmsi);
      return res.json({
        success: true,
        position: positionData,
        note: "Generated new position"
      });
    }
    
    res.json({
      success: true,
      position: rows[0]
    });
  });
});

// Get position history
app.get("/api/ais/position/:mmsi/history", (req, res) => {
  const { mmsi } = req.params;
  const limit = req.query.limit || 50;
  
  const sql = `
    SELECT * FROM ais_positions 
    WHERE mmsi = ? 
    ORDER BY timestamp_utc DESC 
    LIMIT ?
  `;
  
  db.query(sql, [mmsi, parseInt(limit)], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching position history:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // If no history, generate some sample points
    if (rows.length === 0) {
      const positions = [];
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        const time = new Date(now.getTime() - (i * 3600000)); // Each hour back
        const posData = generateShipPosition(mmsi);
        positions.push({
          ...posData,
          timestamp_utc: time,
          received_at: time
        });
      }
      rows = positions;
    }
    
    res.json({
      success: true,
      positions: rows,
      count: rows.length
    });
  });
});
// Get AIS position data (single endpoint for frontend)
app.get("/api/ais/position/:mmsi", async (req, res) => {
  try {
    const { mmsi } = req.params;
    
    if (!mmsi || mmsi.length < 9) {
      return res.status(400).json({
        success: false,
        message: "Valid MMSI (9 digits) required"
      });
    }

    // Generate simulated position data
    const positionData = generateShipPosition(mmsi);
    
    // Create response in the format expected by frontend
    const responseData = {
      success: true,
      mmsi: positionData.mmsi,
      name: `${positionData.ship_icon} ${positionData.ship_type}-${mmsi.slice(-4)}`,
      latitude: positionData.latitude,
      longitude: positionData.longitude,
      speed: positionData.speed,
      heading: positionData.heading,
      course: positionData.heading, // Use heading as course
      destination: positionData.destination || 'Port of Destination',
      eta: positionData.eta,
      status: positionData.status,
      lastUpdate: new Date().toISOString(),
      distanceTraveled: positionData.distance_traveled,
      totalDistance: positionData.total_distance,
      draught: 12.5, // Default value
      type: positionData.ship_type,
      callsign: `CALL${Math.floor(Math.random() * 1000)}`,
      imo: `IMO${Math.floor(9000000 + Math.random() * 1000000)}`
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error in AIS position endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// Get all ships positions (fleet view)
app.get("/api/ais/fleet/positions", (req, res) => {
  // Get from database first
  const sql = `
    SELECT ap.*, v.vessel_name, v.supplier_id, u.fullName as supplier_name
    FROM ais_positions ap
    INNER JOIN (
      SELECT mmsi, MAX(timestamp_utc) as latest_time
      FROM ais_positions 
      GROUP BY mmsi
    ) latest ON ap.mmsi = latest.mmsi AND ap.timestamp_utc = latest.latest_time
    LEFT JOIN vessels v ON ap.mmsi = v.mmsi
    LEFT JOIN users u ON v.supplier_id = u.id
    ORDER BY ap.timestamp_utc DESC
    LIMIT 20
  `;
  
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching fleet positions:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // If no ships in DB, generate sample fleet
    if (rows.length === 0) {
      const sampleMMSIs = [
        "477307900", "413235000", "311040700", 
        "636015874", "244123456", "367123456"
      ];
      
      rows = sampleMMSIs.map(mmsi => {
        const pos = generateShipPosition(mmsi);
        return {
          mmsi: pos.mmsi,
          latitude: pos.latitude,
          longitude: pos.longitude,
          timestamp_utc: pos.timestamp,
          vessel_name: `${pos.ship_icon} ${pos.ship_type}-${mmsi.slice(-4)}`,
          ship_type: pos.ship_type,
          status: pos.status,
          speed: pos.speed,
          heading: pos.heading
        };
      });
    }
    
    res.json({
      success: true,
      positions: rows,
      count: rows.length,
      source: 'simulated',
      note: "Using simulated ship tracking data"
    });
  });
});

// Add a vessel
app.post("/api/ais/vessels", (req, res) => {
  const { mmsi, vessel_name, supplier_id } = req.body;
  
  if (!mmsi) {
    return res.status(400).json({
      success: false,
      message: "MMSI is required"
    });
  }
  
  const checkSql = "SELECT * FROM vessels WHERE mmsi = ?";
  db.query(checkSql, [mmsi], (err, rows) => {
    if (err) {
      console.error("❌ Error checking vessel:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (rows && rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vessel already exists"
      });
    }
    
    const insertSql = `
      INSERT INTO vessels (mmsi, vessel_name, supplier_id)
      VALUES (?, ?, ?)
    `;
    
    const finalVesselName = vessel_name || `🚢 Ship-${mmsi.slice(-4)}`;
    
    db.query(insertSql, [mmsi, finalVesselName, supplier_id], (err, result) => {
      if (err) {
        console.error("❌ Error adding vessel:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      res.json({
        success: true,
        message: "Vessel added successfully",
        vessel: {
          id: result.insertId,
          mmsi,
          vessel_name: finalVesselName,
          supplier_id
        }
      });
    });
  });
});

// Get all vessels
app.get("/api/ais/vessels", (req, res) => {
  const { supplier_id } = req.query;
  
  let sql = `
    SELECT v.*, u.fullName as supplier_name
    FROM vessels v
    LEFT JOIN users u ON v.supplier_id = u.id
  `;
  
  const params = [];
  
  if (supplier_id) {
    sql += " WHERE v.supplier_id = ?";
    params.push(supplier_id);
  }
  
  sql += " ORDER BY v.created_at DESC";
  
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching vessels:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    // If no vessels, create some sample ones
    if (rows.length === 0) {
      const sampleVessels = [
        { mmsi: "477307900", vessel_name: "📦 Container Express", supplier_id: null },
        { mmsi: "413235000", vessel_name: "🚢 Ocean Trader", supplier_id: null },
        { mmsi: "311040700", vessel_name: "🛢️ Oil Tanker Alpha", supplier_id: null },
        { mmsi: "636015874", vessel_name: "🎣 Fishing Vessel-1", supplier_id: null }
      ];
      
      // Insert sample vessels
      const insertPromises = sampleVessels.map(vessel => {
        return new Promise((resolve) => {
          const insertSql = `
            INSERT INTO vessels (mmsi, vessel_name, supplier_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE vessel_name = VALUES(vessel_name)
          `;
          db.query(insertSql, [vessel.mmsi, vessel.vessel_name, vessel.supplier_id], () => {
            resolve(vessel);
          });
        });
      });
      
      Promise.all(insertPromises).then(() => {
        // Fetch again
        db.query(sql, params, (err, newRows) => {
          res.json({
            success: true,
            vessels: newRows || sampleVessels,
            count: (newRows || sampleVessels).length,
            note: "Sample vessels generated"
          });
        });
      });
    } else {
      res.json({
        success: true,
        vessels: rows,
        count: rows.length
      });
    }
  });
});

// Get ship info with current position
app.get("/api/ais/ship/:mmsi", (req, res) => {
  const { mmsi } = req.params;
  
  // Get vessel info
  const vesselSql = `
    SELECT v.*, u.fullName as supplier_name
    FROM vessels v
    LEFT JOIN users u ON v.supplier_id = u.id
    WHERE v.mmsi = ?
  `;
  
  db.query(vesselSql, [mmsi], (err, vesselRows) => {
    if (err) {
      console.error("❌ Error fetching vessel:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    let vessel = vesselRows[0];
    
    // If vessel doesn't exist, create a simulated one
    if (!vessel) {
      const posData = generateShipPosition(mmsi);
      vessel = {
        mmsi,
        vessel_name: `${posData.ship_icon} ${posData.ship_type}-${mmsi.slice(-4)}`,
        supplier_id: null,
        supplier_name: null
      };
    }
    
    // Get current position
    const positionData = generateShipPosition(mmsi);
    
    res.json({
      success: true,
      ship: vessel,
      position: positionData,
      source: 'simulated'
    });
  });
});

// Test AIS endpoint
app.get("/api/ais/test", (req, res) => {
  const testMMSI = "477307900";
  const positionData = generateShipPosition(testMMSI);
  
  res.json({
    success: true,
    message: "AIS Simulation is working!",
    test_position: positionData,
    available_endpoints: {
      track: "GET /api/ais/track/:mmsi",
      latest: "GET /api/ais/position/:mmsi/latest",
      history: "GET /api/ais/position/:mmsi/history",
      fleet: "GET /api/ais/fleet/positions",
      vessels: "GET /api/ais/vessels",
      ship_info: "GET /api/ais/ship/:mmsi",
      add_vessel: "POST /api/ais/vessels"
    },
    note: "Using simulated ship tracking - no API key needed"
  });
});
// ========== HEALTH CHECK ==========
app.get("/api/health", (req, res) => {
  const manufacturerRoom = io.sockets.adapter.rooms.get('manufacturers');
  const manufacturerCount = manufacturerRoom ? Array.from(manufacturerRoom).length : 0;
  
  res.json({ 
    success: true, 
    message: "Server is running", 
    timestamp: new Date().toISOString(),
    socket: {
      total: io.engine.clientsCount,
      manufacturers: manufacturerCount
    }
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.IO server ready`);
  console.log(`🏭 Manufacturer endpoints enabled`);
});
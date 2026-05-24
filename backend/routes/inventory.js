// routes/inventory.js - Inventory routes
import express from "express";

// Export a function that receives upload middleware
export default function createInventoryRouter(upload) {
  const router = express.Router();

  /* ============================================================
    IoT SENSOR GENERATOR
  ============================================================ */
  function generateSensors() {
    return {
      temperature: Number((Math.random() * 15 + 5).toFixed(1)),
      humidity: Math.floor(Math.random() * 40 + 60),
      ammonia: Number((Math.random() * 10).toFixed(1))
    };
  }

  /* ============================================================
     LIVE SENSOR ENDPOINT
  ============================================================ */
  router.get("/live", (req, res) => {
    const sensors = generateSensors();
    res.json({ success: true, sensors });
  });

/* ============================================================
     ADD INVENTORY ITEM - CORRECTED VERSION
  ============================================================ */
router.post("/add", upload.single('image'), (req, res) => {
  const db = req.db;
  
  console.log("🟦 ADD INVENTORY REQUEST RECEIVED");
  console.log("📦 File received:", req.file ? "YES" : "NO");
  
  if (req.file) {
    console.log("📁 File details:", {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }
  const {
    userId,
    seafoodType,
    quantity,
    unit = "kg",
    price,
    processingStatus = "Raw",
    storageCondition = "Chilled",
    expiryDate,
    batchOrigin = "",
    temperature = 0,
    humidity = 75,
    ammonia = 1.0,
    batchId
  } = req.body;

  // Get the uploaded image filename
  const image = req.file ? req.file.filename : null;

  if (!userId || !seafoodType || !quantity || !price || !batchId) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields (userId, seafoodType, quantity, price, or batchId)" 
    });
  }

  let status = "Fresh";
  if (temperature > 20 || ammonia > 15) status = "Spoiled";
  else if (temperature > 10 || humidity > 90 || ammonia > 5) status = "Warning";

  // CORRECT SQL QUERY - matches your actual table structure
  const sql = `
    INSERT INTO inventory 
    (user_id, seafoodType, quantity, unit, price,
     processingStatus, storageCondition, expiryDate, batchOrigin,
     temperature, humidity, ammonia, status, lastUpdated, batchId, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
  `;

  const values = [
    userId, seafoodType, quantity, unit, price,          // 5 values
    processingStatus, storageCondition, expiryDate, batchOrigin, // 4 more = 9
    temperature, humidity, ammonia, status,              // 4 more = 13
    batchId, image                                       // 2 more = 15 total
  ];

  console.log("📝 Executing SQL:", sql);
  console.log("📝 Values:", values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "DB Error", 
        error: err.message,
        sql: sql,
        values: values
      });
    }

    // Notify manufacturers about new inventory
    if (req.io) {
      req.io.to('manufacturers').emit('new-inventory', {
        type: 'NEW_INVENTORY',
        inventoryId: result.insertId,
        seafoodType: seafoodType,
        quantity: quantity,
        supplierId: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      success: true, 
      message: "Inventory added successfully", 
      insertId: result.insertId,
      batchId: batchId,
      image: image ? `uploads/${image}` : null
    });
  });
});
 /* ============================================================
     GET INVENTORY BY USER ID - FIXED VERSION
  ============================================================ */
router.get("/list/:userId", (req, res) => {
  const db = req.db;
  const { userId } = req.params;

  const sql = `SELECT * FROM inventory WHERE user_id = ? ORDER BY id DESC`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ DB Error in GET:", err);
      return res.status(500).json({ success: false, message: "DB Error" });
    }

    console.log(`📊 Found ${results.length} inventory items for user ${userId}`);
    
    const formattedResults = results.map(item => {
      let batchId = item.batchId;
      if (!batchId || batchId.trim() === '') {
        const seafoodInitials = (item.seafoodType || 'XXX')
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .padEnd(3, 'X');
        
        const timestamp = item.created_at 
          ? new Date(item.created_at).getTime().toString().slice(-6)
          : Date.now().toString().slice(-6);
        
        batchId = `BATCH-${seafoodInitials}-${item.id.toString().padStart(4, '0')}-${timestamp}`;
        
        const updateSql = `UPDATE inventory SET batchId = ? WHERE id = ?`;
        db.query(updateSql, [batchId, item.id], (updateErr) => {
          if (updateErr) {
            console.error("❌ Failed to update batchId for item", item.id, updateErr);
          }
        });
      }

      // FIX: Build correct image URL
      let imageUrl = null;
      if (item.image) {
        // Remove any 'uploads/' prefix if already present
        const cleanImageName = item.image.replace(/^uploads\//, '');
        imageUrl = `http://localhost:5000/uploads/${cleanImageName}`;
        
        // Log for debugging
        console.log(`🖼️ Item ${item.id}: image field = "${item.image}", URL = "${imageUrl}"`);
      }

      return {
        ...item,
        batchId: batchId,
        qualityStatus: item.status || 'Fresh',
        image: imageUrl, // Use the constructed URL
        lastUpdated: item.lastUpdated 
          ? new Date(item.lastUpdated).toISOString()
          : item.created_at 
            ? new Date(item.created_at).toISOString()
            : new Date().toISOString()
      };
    });

    console.log("✅ Returning formatted results with batchIds");
    console.log("📸 Items with images:", formattedResults.filter(item => item.image).length);
    
    res.json({ success: true, data: formattedResults });
  });
});
/* ============================================================
     UPDATE INVENTORY ITEM - MULTIPART/FORM-DATA VERSION
  ============================================================ */
router.put("/update/:id", upload.single('image'), (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log("🟦 UPDATE INVENTORY REQUEST RECEIVED");
  console.log("📦 Multipart form data received");
  console.log("📁 File received:", req.file ? `YES - ${req.file.filename}` : "NO");
  console.log("📝 Text fields:", req.body);
  
  // First, check if the item exists
  const checkSql = `SELECT * FROM inventory WHERE id = ?`;
  db.query(checkSql, [id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("❌ Error checking inventory item:", checkErr);
      return res.status(500).json({ 
        success: false, 
        message: "Database error checking item" 
      });
    }
    
    if (checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Inventory item with ID ${id} not found`
      });
    }
    
    console.log("✅ Item found:", checkResults[0]);
    
    // Prepare update object
    const updates = {};
    
    // Map frontend field names to database column names
    const fieldMapping = {
      // Frontend field -> Database column
      'userId': 'user_id',            // This is the fix!
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
      'batchId': 'batchId',
      'userType': 'userType' // We'll remove this later
    };
    
    // Add text fields from req.body with proper mapping
    Object.keys(req.body).forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        // Use mapped field name if available, otherwise use original
        const dbField = fieldMapping[field] || field;
        
        // Skip fields that shouldn't go to database
        if (field === 'userType' || field === 'imageBase64') {
          return;
        }
        
        updates[dbField] = req.body[field];
      }
    });
    
    // Handle image upload if present
    if (req.file) {
      updates.image = req.file.filename;
      console.log("🖼️ New image filename:", req.file.filename);
    } else if (req.body.imageBase64 && req.body.imageBase64.startsWith('data:image')) {
      // Handle base64 image string
      console.log("📸 Base64 image string received (truncated):", req.body.imageBase64.substring(0, 100) + "...");
      // For now, store as base64 (not ideal for large images)
      updates.image = req.body.imageBase64;
    }
    
    // Calculate quality status based on sensor data
    const temperature = parseFloat(updates.temperature || checkResults[0].temperature) || 0;
    const ammonia = parseFloat(updates.ammonia || checkResults[0].ammonia) || 1.0;
    const humidity = parseFloat(updates.humidity || checkResults[0].humidity) || 75;
    
    let status = "Fresh";
    if (temperature > 20 || ammonia > 15) status = "Spoiled";
    else if (temperature > 10 || humidity > 90 || ammonia > 5) status = "Warning";
    
    updates.status = status;
    updates.lastUpdated = new Date();
    
    // Ensure we have at least one field to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No updates provided" 
      });
    }
    
    console.log("📊 Final updates to database:", updates);
    console.log("📝 SQL will be: UPDATE inventory SET ? WHERE id = ?");
    
    // Update the inventory item
    const updateSql = `UPDATE inventory SET ? WHERE id = ?`;
    
    db.query(updateSql, [updates, id], (err, result) => {
      if (err) {
        console.error("❌ DB Error in UPDATE:", err);
        console.error("❌ SQL Error code:", err.code);
        console.error("❌ SQL Error message:", err.sqlMessage);
        console.error("❌ Full error:", err);
        
        return res.status(500).json({ 
          success: false, 
          message: "Database update failed",
          error: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code
        });
      }

      console.log(`✅ Inventory item ${id} updated successfully`);
      console.log(`📊 Rows affected: ${result.affectedRows}`);
      
      // If no rows were affected, the item might not exist
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found or no changes made"
        });
      }
      
      // Get the updated item to return
      const getUpdatedSql = `SELECT * FROM inventory WHERE id = ?`;
      db.query(getUpdatedSql, [id], (getErr, updatedRows) => {
        if (getErr) {
          console.error("❌ Error fetching updated item:", getErr);
        }
        
        res.json({ 
          success: true, 
          message: "Inventory updated successfully",
          affectedRows: result.affectedRows,
          data: updatedRows[0] || null
        });
      });
    });
  });
});
  /* ============================================================
     DELETE INVENTORY ITEM
  ============================================================ */
  router.delete("/delete/:id", (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const sql = `DELETE FROM inventory WHERE id = ?`;

    db.query(sql, [id], (err) => {
      if (err) {
        console.error("❌ DB Error in DELETE:", err);
        return res.status(500).json({ success: false, message: "DB Error", error: err });
      }

      res.json({ success: true, message: "Inventory deleted successfully" });
    });
  });

  /* ============================================================
     GET ALL INVENTORY (FOR MANUFACTURERS)
  ============================================================ */
  router.get("/all", (req, res) => {
    const db = req.db;
    
    const sql = `
      SELECT i.*, 
             u.fullName as supplier_name,
             cv.businessname as company_name,
             u.email as supplier_email
      FROM inventory i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN company_verification cv ON u.email = cv.email
      WHERE i.quantity > 0
      ORDER BY i.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("❌ Error fetching all inventory:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      // Add full image URLs
      const resultsWithImages = results.map(item => ({
        ...item,
        image: item.image ? `http://localhost:5000/${item.image}` : null
      }));
      
      res.json(resultsWithImages);
    });
  });

  return router;
}
import express from 'express';
import path from 'path';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { Firestore } from '@google-cloud/firestore';

const { Pool } = pg;

const app = express();
app.use(express.json());

const PORT = 3000;

// Setup PG Pool with the user's connection string
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:439d68190093d536ff83b285f519219f@86w7fr79.ap-southeast.database.insforge.app:5432/insforge?sslmode=require";

// Load Firebase Config & Initialize Admin SDK for backend-to-frontend live sync
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let adminDb: Firestore | null = null;

if (fs.existsSync(configPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    adminDb = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    });
    console.log('[FirebaseAdmin] Server-side Firestore Client successfully initialized.');
  } catch (err) {
    console.error('[FirebaseAdmin] Error initializing server-side Firestore:', err);
  }
}

// Automatically mirror PG table state to real-time Firestore collections
async function syncPostgresToFirestore() {
  if (!adminDb) {
    console.log('[Sync] Cannot sync: adminDb not initialized.');
    return;
  }
  console.log('[Sync] Starting PG to Firestore sync mirror...');
  const client = await pool.connect();
  try {
    // 1. Fetch products from PG
    const productsRes = await client.query('SELECT id, name, category, price, description, stock, images FROM products');
    const pgProductsMap = new Map();
    for (const r of productsRes.rows) {
      let parsedImages = r.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch { parsedImages = []; }
      }
      pgProductsMap.set(r.id, {
        id: r.id,
        name: r.name,
        category: r.category,
        price: Number(r.price) || 0,
        description: r.description || '',
        stock: Number(r.stock) || 0,
        images: Array.isArray(parsedImages) ? parsedImages : []
      });
    }

    // 2. Fetch trade-in prices from PG
    const tradeInPricesRes = await client.query('SELECT id, device_name as "deviceName", prices FROM trade_in_prices');
    const pgTradeInMap = new Map();
    for (const r of tradeInPricesRes.rows) {
      let parsedPrices = r.prices;
      if (typeof parsedPrices === 'string') {
        try { parsedPrices = JSON.parse(parsedPrices); } catch { parsedPrices = {}; }
      }
      pgTradeInMap.set(r.id, {
        id: r.id,
        deviceName: r.deviceName,
        prices: parsedPrices || {}
      });
    }

    // 3. Fetch repair prices from PG
    const repairPricesRes = await client.query('SELECT id, device_name as "deviceName", prices FROM repair_prices');
    const pgRepairMap = new Map();
    for (const r of repairPricesRes.rows) {
      let parsedPrices = r.prices;
      if (typeof parsedPrices === 'string') {
        try { parsedPrices = JSON.parse(parsedPrices); } catch { parsedPrices = {}; }
      }
      pgRepairMap.set(r.id, {
        id: r.id,
        deviceName: r.deviceName,
        prices: parsedPrices || {}
      });
    }

    // A. Sync Products
    const productsColl = adminDb.collection('products');
    for (const [id, prod] of pgProductsMap) {
      await productsColl.doc(id).set(prod);
    }
    const fsProducts = await productsColl.get();
    for (const docSnap of fsProducts.docs) {
      if (!pgProductsMap.has(docSnap.id)) {
        await productsColl.doc(docSnap.id).delete();
        console.log(`[Sync] Pruned Firestore product: ${docSnap.id}`);
      }
    }

    // B. Sync Trade-In Prices
    const tradeInColl = adminDb.collection('tradeInPrices');
    for (const [id, tp] of pgTradeInMap) {
      await tradeInColl.doc(id).set(tp);
    }
    const fsTradeIn = await tradeInColl.get();
    for (const docSnap of fsTradeIn.docs) {
      if (!pgTradeInMap.has(docSnap.id)) {
        await tradeInColl.doc(docSnap.id).delete();
        console.log(`[Sync] Pruned Firestore trade-in price: ${docSnap.id}`);
      }
    }

    // C. Sync Repair Prices
    const repairColl = adminDb.collection('repairPrices');
    for (const [id, rp] of pgRepairMap) {
      await repairColl.doc(id).set(rp);
    }
    const fsRepairPrices = await repairColl.get();
    for (const docSnap of fsRepairPrices.docs) {
      if (!pgRepairMap.has(docSnap.id)) {
        await repairColl.doc(docSnap.id).delete();
        console.log(`[Sync] Pruned Firestore repair price: ${docSnap.id}`);
      }
    }

    console.log('[Sync] Mirror sync from PG to Firestore completed.');
  } catch (error) {
    console.error('[Sync] Sync failed:', error);
  } finally {
    client.release();
  }
}


console.log('Connecting to PostgreSQL database at:', connectionString.split('@')[1] || connectionString);

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') || connectionString.includes('ssl=true') 
    ? { rejectUnauthorized: false } 
    : false
});

// Initialize DB schema
async function initializeSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create status table
    await client.query(`
      CREATE TABLE IF NOT EXISTS insforge_sync_status (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT,
        stock INT DEFAULT 10,
        images JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trade-in prices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_in_prices (
        id VARCHAR(100) PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        prices JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create repair prices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS repair_prices (
        id VARCHAR(100) PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        prices JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create repair orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS repair_orders (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        device_type VARCHAR(255) DEFAULT '',
        problem TEXT DEFAULT '',
        status VARCHAR(100) DEFAULT '',
        estimated_cost NUMERIC,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await client.query('ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS data JSONB');
    } catch (_) {}

    // Create sell orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS sell_orders (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        device_type VARCHAR(255) DEFAULT '',
        condition VARCHAR(100) DEFAULT '',
        status VARCHAR(100) DEFAULT '',
        offer_price NUMERIC,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await client.query('ALTER TABLE sell_orders ADD COLUMN IF NOT EXISTS data JSONB');
    } catch (_) {}

    // Create app_config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert schema seed meta element if not exists
    await client.query(`
      INSERT INTO insforge_sync_status (key, value, updated_at)
      VALUES ('schema_version', '1.0.0', CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `);

    // Auto-seed product catalog
    const curatedProductsOnStart = [
      {
        id: 'iphone-16-pro-max',
        name: 'iPhone 16 Pro Max',
        category: 'iPhone',
        price: 144900,
        description: 'Featuring a stunning titanium design, the new Camera Control, and the powerful A18 Pro chip. Built for Apple Intelligence.',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d25fa?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'iphone-16-pro',
        name: 'iPhone 16 Pro',
        category: 'iPhone',
        price: 119900,
        description: 'A massive leap in battery life, stunning titanium finishes, and advanced professional camera systems with Camera Control.',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'iphone-16',
        name: 'iPhone 16',
        category: 'iPhone',
        price: 79900,
        description: 'With the all-new Action button, Camera Control, A18 chip, and stunning new color-infused glass back finishes.',
        stock: 45,
        images: ['https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'iphone-15-pro-max',
        name: 'iPhone 15 Pro Max',
        category: 'iPhone',
        price: 134900,
        description: 'The ultimate Pro. Precision titanium chassis, 5x Telephoto optical zoom camera, customizable Action button.',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'iphone-15',
        name: 'iPhone 15',
        category: 'iPhone',
        price: 69900,
        description: 'Dynamic Island comes to iPhone 15. High-resolution 48MP main camera and modern frosted glass design.',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d25fa?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'macbook-pro-16-m4-max',
        name: 'MacBook Pro 16" (M4 Max)',
        category: 'MacBook',
        price: 349900,
        description: 'Designed for extreme workflows. Up to 128GB unified memory support, Liquid Retina XDR screen, and the industry-redefining M4 Max chip.',
        stock: 10,
        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'macbook-pro-14-m4',
        name: 'MacBook Pro 14" (M4)',
        category: 'MacBook',
        price: 169900,
        description: 'The standard of performance. A brilliant Liquid Retina XDR display, up to 24 hours of battery life, and high bandwidth M4 power.',
        stock: 20,
        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'macbook-air-13-m3',
        name: 'MacBook Air 13-inch (M3)',
        category: 'MacBook',
        price: 114900,
        description: 'Incredibly thin and fast. The world’s most popular laptop, powered by the cutting-edge 3nm M3 chip.',
        stock: 40,
        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'ipad-pro-13-m4',
        name: 'iPad Pro 13" (M4)',
        category: 'iPad',
        price: 129900,
        description: 'Thinpossible. Groundbreaking Tandem OLED display, blistering performance from the next-generation M4 chip.',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'ipad-air-m2',
        name: 'iPad Air 11" (M2)',
        category: 'iPad',
        price: 59900,
        description: 'Light. Bright. Full of might. Perfect for student work, graphics rendering, and everyday multimedia with Apple Pencil support.',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'apple-watch-ultra-2',
        name: 'Apple Watch Ultra 2',
        category: 'Watch',
        price: 89900,
        description: 'The ultimate sports and adventure watch. Featuring a majestic titanium casing, 3000-nits screen, and dual-frequency GPS.',
        stock: 12,
        images: ['https://images.unsplash.com/photo-1546868881-be0c937448b9?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'apple-watch-series-10',
        name: 'Apple Watch Series 10',
        category: 'Watch',
        price: 46900,
        description: 'Our thinnest design yet, with our biggest display ever. Advanced health tracking, and fast-charge technology.',
        stock: 35,
        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'airpods-pro-2',
        name: 'AirPods Pro 2 (USB-C)',
        category: 'AirPods',
        price: 24900,
        description: 'Intelligent noise cancellation. Immersive Adaptive Audio environment. Re-engineered acoustics with pristine crisp sounds.',
        stock: 80,
        images: ['https://images.unsplash.com/photo-1588423770574-9169244fd57b?q=80&w=600&auto=format&fit=crop']
      },
      {
        id: 'airpods-max-usb-c',
        name: 'AirPods Max (USB-C)',
        category: 'AirPods',
        price: 59900,
        description: 'High-fidelity sensory dome over-ear audio experience. Optimal Active Noise Cancellation with Transparency mode.',
        stock: 20,
        images: ['https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600&auto=format&fit=crop']
      }
    ];

    const tradeInPricesOnStart = [
      {
        id: 'iphone-15-pro-max',
        deviceName: 'iPhone 15 Pro Max',
        prices: { Flawless: 65000, Good: 55000, Fair: 45000, Broken: 25000 }
      },
      {
        id: 'iphone-15-pro',
        deviceName: 'iPhone 15 Pro',
        prices: { Flawless: 55000, Good: 45000, Fair: 35000, Broken: 20000 }
      },
      {
        id: 'iphone-15',
        deviceName: 'iPhone 15',
        prices: { Flawless: 42000, Good: 35000, Fair: 28000, Broken: 15000 }
      },
      {
        id: 'iphone-14-pro-max',
        deviceName: 'iPhone 14 Pro Max',
        prices: { Flawless: 50000, Good: 42000, Fair: 32000, Broken: 18000 }
      },
      {
        id: 'iphone-14',
        deviceName: 'iPhone 14',
        prices: { Flawless: 32000, Good: 26000, Fair: 20000, Broken: 10000 }
      }
    ];

    const repairPricesOnStart = [
      {
        id: 'iphone-15-pro-max',
        deviceName: 'iPhone 15 Pro Max',
        prices: { "Screen Replacement": 29900, "Battery Replacement": 8900, "Camera Repair": 15900, "Charging Port": 5900 }
      },
      {
        id: 'iphone-15',
        deviceName: 'iPhone 15',
        prices: { "Screen Replacement": 19900, "Battery Replacement": 7900, "Camera Repair": 11900, "Charging Port": 4900 }
      },
      {
        id: 'macbook-air-m2',
        deviceName: 'MacBook Air M2',
        prices: { "Screen Replacement": 39900, "Battery Replacement": 12900, "Liquid Damage Service": 25000 }
      }
    ];

    // Seed/upsert products
    for (const p of curatedProductsOnStart) {
      await client.query(`
        INSERT INTO products (id, name, category, price, description, stock, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) 
        DO UPDATE SET name = $2, category = $3, price = $4, description = $5, stock = $6, images = $7
      `, [p.id, p.name, p.category, p.price, p.description, p.stock, JSON.stringify(p.images)]);
    }

    // Seed/upsert trade in pricing
    for (const t of tradeInPricesOnStart) {
      await client.query(`
        INSERT INTO trade_in_prices (id, device_name, prices)
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3
      `, [t.id, t.deviceName, JSON.stringify(t.prices)]);
    }

    // Seed/upsert repair pricing
    for (const r of repairPricesOnStart) {
      await client.query(`
        INSERT INTO repair_prices (id, device_name, prices)
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3
      `, [r.id, r.deviceName, JSON.stringify(r.prices)]);
    }

    console.log(`Successfully seeded/upserted ${curatedProductsOnStart.length} products, ${tradeInPricesOnStart.length} trade-in matrix items, and ${repairPricesOnStart.length} repair catalog items to Postgres.`);

    await client.query('COMMIT');
    console.log('PostgreSQL schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize PostgreSQL schema:', error);
  } finally {
    client.release();
  }
}

// Perform schema initialization after 2 seconds to make sure application is running
setTimeout(() => {
  initializeSchema().catch(err => console.error('Delayed schema init failed:', err));
}, 2000);

// --- API routes first ---

// 1. Connection status endpoint
app.get('/api/insforge/connection-status', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT current_database(), current_user, version()');
      const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const statsRes = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM products) as products_count,
          (SELECT COUNT(*) FROM repair_orders) as repairs_count,
          (SELECT COUNT(*) FROM sell_orders) as sells_count,
          (SELECT COUNT(*) FROM trade_in_prices) as tradein_prices_count,
          (SELECT COUNT(*) FROM repair_prices) as repair_prices_count
      `);

      res.json({
        connected: true,
        database: dbRes.rows[0].current_database,
        user: dbRes.rows[0].current_user,
        postgresVersion: dbRes.rows[0].version,
        tables: tableRes.rows.map(r => r.table_name),
        counts: statsRes.rows[0] || {
          products_count: 0,
          repairs_count: 0,
          sells_count: 0,
          tradein_prices_count: 0,
          repair_prices_count: 0
        },
        connectionUrl: connectionString.replace(/:([^:@]+)@/, ':********@') // Mask password
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      connected: false,
      error: error?.message || 'Failed to connect to the PostgreSQL database.',
      connectionUrl: connectionString.replace(/:([^:@]+)@/, ':********@')
    });
  }
});

// 2. Synchronization endpoint - inserts batch records from Firestore client representation to SQL tables
app.post('/api/insforge/sync', async (req, res) => {
  const { products, repairOrders, sellOrders, tradeInPrices, repairPrices } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sync products
    if (Array.isArray(products)) {
      for (const p of products) {
        if (!p.id || !p.name) continue;
        await client.query(`
          INSERT INTO products (id, name, category, price, description, stock, images, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) 
          DO UPDATE SET name = $2, category = $3, price = $4, description = $5, stock = $6, images = $7
        `, [
          p.id, 
          p.name, 
          p.category || 'iPhone', 
          Number(p.price) || 0, 
          p.description || '', 
          Number(p.stock) || 10, 
          JSON.stringify(p.images || []),
          p.createdAt || new Date().toISOString()
        ]);
      }
    }

    // Sync repairOrders
    if (Array.isArray(repairOrders)) {
      for (const ro of repairOrders) {
        if (!ro.id || !ro.userId) continue;
        await client.query(`
          INSERT INTO repair_orders (id, user_id, device_type, problem, status, estimated_cost, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id)
          DO UPDATE SET status = $5, estimated_cost = $6, updated_at = $8
        `, [
          ro.id,
          ro.userId,
          ro.deviceType || 'iPhone',
          ro.problem || '',
          ro.status || 'Received',
          ro.estimatedCost ? Number(ro.estimatedCost) : null,
          ro.createdAt || new Date().toISOString(),
          ro.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // Sync sellOrders
    if (Array.isArray(sellOrders)) {
      for (const so of sellOrders) {
        if (!so.id || !so.userId) continue;
        await client.query(`
          INSERT INTO sell_orders (id, user_id, device_type, condition, status, offer_price, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id)
          DO UPDATE SET status = $5, offer_price = $6, updated_at = $8
        `, [
          so.id,
          so.userId,
          so.deviceType || 'iPhone',
          so.condition || 'Good',
          so.status || 'Pending Review',
          so.estimate ? Number(so.estimate) : (so.offerPrice ? Number(so.offerPrice) : null),
          so.createdAt || new Date().toISOString(),
          so.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // Sync tradeInPrices
    if (Array.isArray(tradeInPrices)) {
      for (const tp of tradeInPrices) {
        if (!tp.id || !tp.deviceName) continue;
        await client.query(`
          INSERT INTO trade_in_prices (id, device_name, prices, updated_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id)
          DO UPDATE SET device_name = $2, prices = $3, updated_at = $4
        `, [
          tp.id,
          tp.deviceName,
          JSON.stringify(tp.prices || {}),
          tp.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // Sync repairPrices
    if (Array.isArray(repairPrices)) {
      for (const rp of repairPrices) {
        if (!rp.id || !rp.deviceName) continue;
        await client.query(`
          INSERT INTO repair_prices (id, device_name, prices, updated_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id)
          DO UPDATE SET device_name = $2, prices = $3, updated_at = $4
        `, [
          rp.id,
          rp.deviceName,
          JSON.stringify(rp.prices || {}),
          rp.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // Update sync stats
    await client.query(`
      INSERT INTO insforge_sync_status (key, value, updated_at)
      VALUES ('last_sync_timestamp', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
    `, [new Date().toISOString()]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'All tables synced to PostgreSQL successfully.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Synchronization failed:', error);
    res.status(500).json({ success: false, error: error?.message || 'Sync operation failed.' });
  } finally {
    client.release();
  }
});

// Sync from Firestore back to Postgres on demand
app.post('/api/insforge/sync-from-firestore', async (req, res) => {
  if (!adminDb) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized on server.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch & Sync Products
    const productsColl = adminDb.collection('products');
    const fsProducts = await productsColl.get();
    for (const docSnap of fsProducts.docs) {
      const p = { id: docSnap.id, ...docSnap.data() } as any;
      await client.query(`
        INSERT INTO products (id, name, category, price, description, stock, images, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) 
        DO UPDATE SET name = $2, category = $3, price = $4, description = $5, stock = $6, images = $7
      `, [
        p.id, 
        p.name || '', 
        p.category || 'iPhone', 
        Number(p.price) || 0, 
        p.description || '', 
        Number(p.stock) || 10, 
        JSON.stringify(p.images || []),
        p.createdAt || new Date().toISOString()
      ]);
    }

    // 2. Fetch & Sync Trade-in prices
    const tradeInColl = adminDb.collection('tradeInPrices');
    const fsTradeIn = await tradeInColl.get();
    for (const docSnap of fsTradeIn.docs) {
      const tp = { id: docSnap.id, ...docSnap.data() } as any;
      await client.query(`
        INSERT INTO trade_in_prices (id, device_name, prices, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3, updated_at = $4
      `, [
        tp.id,
        tp.deviceName || '',
        JSON.stringify(tp.prices || {}),
        tp.updatedAt || new Date().toISOString()
      ]);
    }

    // 3. Fetch & Sync Repair prices
    const repairColl = adminDb.collection('repairPrices');
    const fsRepairPrices = await repairColl.get();
    for (const docSnap of fsRepairPrices.docs) {
      const rp = { id: docSnap.id, ...docSnap.data() } as any;
      await client.query(`
        INSERT INTO repair_prices (id, device_name, prices, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3, updated_at = $4
      `, [
        rp.id,
        rp.deviceName || '',
        JSON.stringify(rp.prices || {}),
        rp.updatedAt || new Date().toISOString()
      ]);
    }

    // Commit
    await client.query('COMMIT');
    res.json({ success: true, message: 'PostgreSQL synchronized from Firestore successfully.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Sync] Sync from Firestore to PG failed:', error);
    res.status(500).json({ success: false, error: error?.message || 'Sync failed.' });
  } finally {
    client.release();
  }
});

// 3. Simple Safe Query Runner (primarily for Admin browser utility)
app.post('/api/insforge/query', async (req, res) => {
  const { sql, params } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL query must be provided.' });
  }

  // Basic security pre-check to prevent drop database or dangerous commands unless designed
  const sanitizedSql = sql.trim().toLowerCase();
  if (sanitizedSql.includes('drop database') || sanitizedSql.includes('alter database') || sanitizedSql.includes('truncate table')) {
    return res.status(403).json({ error: 'Dangerous DDL operations are barred.' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      
      // If the query performs a write command (INSERT, UPDATE, DELETE), trigger Firestore sync
      if (result.command && result.command !== 'SELECT') {
        console.log(`[Sync Trigger] Mutating DB query executed (${result.command}), initiating real-time Firestore sync.`);
        syncPostgresToFirestore().catch(err => {
          console.error('[Sync Trigger] Background sync failed:', err);
        });
      }

      res.json({
        success: true,
        command: result.command,
        rowCount: result.rowCount,
        rows: result.rows,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeId: f.dataTypeID }))
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message || 'Error executing SQL query.' });
  }
});


// -------------------------------------------------------------
// Core Postgres CRUD Endpoints (Replacing Firestore Completely)
// -------------------------------------------------------------

// Active App Config
app.get('/api/config', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query("SELECT data FROM app_config WHERE id = 'app_config'");
      if (dbRes.rows.length > 0) {
        let parsedData = dbRes.rows[0].data;
        if (typeof parsedData === 'string') {
          try { parsedData = JSON.parse(parsedData); } catch { parsedData = {}; }
        }
        return res.json(parsedData);
      }
      res.json({ storeName: 'iResell', hiddenSections: [] });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Config] Error loading config:', error);
    res.json({ storeName: 'iResell', hiddenSections: [] });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO app_config (id, data, updated_at)
        VALUES ('app_config', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(req.body)]);
      res.json({ success: true, message: 'Config updated successfully.' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Config] Error saving config:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to save config.' });
  }
});

// Products CRUD
app.get('/api/products', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT * FROM products ORDER BY id DESC');
      const products = dbRes.rows.map(r => {
        let parsedImages = r.images;
        if (typeof parsedImages === 'string') {
          try { parsedImages = JSON.parse(parsedImages); } catch { parsedImages = []; }
        }
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          price: Number(r.price) || 0,
          description: r.description || '',
          stock: Number(r.stock) || 0,
          images: Array.isArray(parsedImages) ? parsedImages : []
        };
      });
      res.json(products);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Products] Error listing:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch products.' });
  }
});

app.post('/api/products', async (req, res) => {
  const p = req.body;
  if (!p.id || !p.name) {
    return res.status(400).json({ error: 'id and name are required.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO products (id, name, category, price, description, stock, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) 
        DO UPDATE SET name = $2, category = $3, price = $4, description = $5, stock = $6, images = $7
      `, [
        p.id, 
        p.name, 
        p.category || 'iPhone', 
        Number(p.price) || 0, 
        p.description || '', 
        Number(p.stock) || 0, 
        JSON.stringify(p.images || [])
      ]);
      res.json({ success: true, message: 'Product saved successfully.' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Products] Error saving:', error);
    res.status(500).json({ error: error?.message || 'Failed to save product.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      res.json({ success: true, message: 'Product deleted.' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Products] Error deleting:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete product.' });
  }
});

// Trade-In Prices
app.get('/api/trade-in-prices', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT * FROM trade_in_prices ORDER BY id ASC');
      const data = dbRes.rows.map(r => {
        let parsedPrices = r.prices;
        if (typeof parsedPrices === 'string') {
          try { parsedPrices = JSON.parse(parsedPrices); } catch { parsedPrices = {}; }
        }
        return {
          id: r.id,
          deviceName: r.device_name,
          prices: parsedPrices || {}
        };
      });
      res.json(data);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Trade-In] Error listing:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch trade-in prices.' });
  }
});

app.post('/api/trade-in-prices', async (req, res) => {
  const tp = req.body;
  if (!tp.id || !tp.deviceName) {
    return res.status(400).json({ error: 'id and deviceName are required.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO trade_in_prices (id, device_name, prices, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3, updated_at = CURRENT_TIMESTAMP
      `, [
        tp.id,
        tp.deviceName,
        JSON.stringify(tp.prices || {})
      ]);
      res.json({ success: true, message: 'Trade-in price updated.' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Trade-In] Error saving:', error);
    res.status(500).json({ error: error?.message || 'Failed to save trade-in price.' });
  }
});

// Repair Prices Catalog
app.get('/api/repair-prices', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT * FROM repair_prices ORDER BY id ASC');
      const data = dbRes.rows.map(r => {
        let parsedPrices = r.prices;
        if (typeof parsedPrices === 'string') {
          try { parsedPrices = JSON.parse(parsedPrices); } catch { parsedPrices = {}; }
        }
        return {
          id: r.id,
          deviceName: r.device_name,
          prices: parsedPrices || {}
        };
      });
      res.json(data);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Repair-Prices] Error listing:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch repair prices.' });
  }
});

app.post('/api/repair-prices', async (req, res) => {
  const rp = req.body;
  if (!rp.id || !rp.deviceName) {
    return res.status(400).json({ error: 'id and deviceName are required.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO repair_prices (id, device_name, prices, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (id)
        DO UPDATE SET device_name = $2, prices = $3, updated_at = CURRENT_TIMESTAMP
      `, [
        rp.id,
        rp.deviceName,
        JSON.stringify(rp.prices || {})
      ]);
      res.json({ success: true, message: 'Repair price updated.' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Repair-Prices] Error saving:', error);
    res.status(500).json({ error: error?.message || 'Failed to save repair price.' });
  }
});

// Repair Orders Endpoints
app.get('/api/repair-orders', async (req, res) => {
  const { userId } = req.query;
  try {
    const client = await pool.connect();
    try {
      let queryStr = 'SELECT * FROM repair_orders';
      const params: any[] = [];
      if (userId) {
        queryStr += ' WHERE user_id = $1';
        params.push(userId);
      }
      queryStr += ' ORDER BY created_at DESC';
      const dbRes = await client.query(queryStr, params);
      const orders = dbRes.rows.map(r => {
        let parsedData = r.data;
        if (typeof parsedData === 'string') {
          try { parsedData = JSON.parse(parsedData); } catch { parsedData = {}; }
        }
        return {
          id: r.id,
          userId: r.user_id,
          ...parsedData
        };
      });
      res.json(orders);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Repair Orders] Error listing:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch repair orders.' });
  }
});

app.post('/api/repair-orders', async (req, res) => {
  const o = req.body;
  if (!o.userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const id = o.id || 'rep-' + Math.random().toString(36).substr(2, 9);
  
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO repair_orders (id, user_id, device_type, problem, status, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET data = $6, updated_at = CURRENT_TIMESTAMP
      `, [id, o.userId, o.deviceType || '', o.problem || '', o.status || 'Device Received', JSON.stringify({ ...o, id })]);
      res.json({ success: true, id });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Repair Orders] Error creation:', error);
    res.status(500).json({ error: error?.message || 'Failed to schedule repair order.' });
  }
});

app.put('/api/repair-orders/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT * FROM repair_orders WHERE id = $1', [id]);
      if (dbRes.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      
      const existingRow = dbRes.rows[0];
      let existingData = existingRow.data;
      if (typeof existingData === 'string') {
        try { existingData = JSON.parse(existingData); } catch { existingData = {}; }
      }
      
      const mergedData = {
        ...existingData,
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };
      
      await client.query(`
        UPDATE repair_orders 
        SET status = $1, data = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3
      `, [updates.status || existingRow.status, JSON.stringify(mergedData), id]);
      
      res.json({ success: true, message: 'Order updated successfully.', data: mergedData });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Repair Orders] Error update:', error);
    res.status(500).json({ error: error?.message || 'Failed to update repair order.' });
  }
});

// Sell Orders Endpoints
app.get('/api/sell-orders', async (req, res) => {
  const { userId } = req.query;
  try {
    const client = await pool.connect();
    try {
      let queryStr = 'SELECT * FROM sell_orders';
      const params: any[] = [];
      if (userId) {
        queryStr += ' WHERE user_id = $1';
        params.push(userId);
      }
      queryStr += ' ORDER BY created_at DESC';
      const dbRes = await client.query(queryStr, params);
      const orders = dbRes.rows.map(r => {
        let parsedData = r.data;
        if (typeof parsedData === 'string') {
          try { parsedData = JSON.parse(parsedData); } catch { parsedData = {}; }
        }
        return {
          id: r.id,
          userId: r.user_id,
          ...parsedData
        };
      });
      res.json(orders);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Sell Orders] Error listing:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch sell orders.' });
  }
});

app.post('/api/sell-orders', async (req, res) => {
  const o = req.body;
  if (!o.userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const id = o.id || 'sel-' + Math.random().toString(36).substr(2, 9);
  
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO sell_orders (id, user_id, device_type, condition, status, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET data = $6, updated_at = CURRENT_TIMESTAMP
      `, [id, o.userId, o.deviceType || '', o.condition || 'Good', o.status || 'Estimate Submitted', JSON.stringify({ ...o, id })]);
      res.json({ success: true, id });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Sell Orders] Error creation:', error);
    res.status(500).json({ error: error?.message || 'Failed to submit sell order.' });
  }
});

app.put('/api/sell-orders/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query('SELECT * FROM sell_orders WHERE id = $1', [id]);
      if (dbRes.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      
      const existingRow = dbRes.rows[0];
      let existingData = existingRow.data;
      if (typeof existingData === 'string') {
        try { existingData = JSON.parse(existingData); } catch { existingData = {}; }
      }
      
      const mergedData = {
        ...existingData,
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };
      
      await client.query(`
        UPDATE sell_orders 
        SET status = $1, data = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3
      `, [updates.status || existingRow.status, JSON.stringify(mergedData), id]);
      
      res.json({ success: true, message: 'Order updated successfully.', data: mergedData });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[API Sell Orders] Error update:', error);
    res.status(500).json({ error: error?.message || 'Failed to update sell order.' });
  }
});


// --- Vite Dev server or Production static serving ---

startServer();

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

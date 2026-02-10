/* ============================================
   RANČ LIPANJ 850 - Backend Server
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 10000;



// Database setup
let db;
const DB_PATH = path.join(__dirname, 'database.sqlite');

async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }
    
    // Create tables if they don't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            duration TEXT,
            price INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT NOT NULL,
            guests INTEGER DEFAULT 1,
            message TEXT,
            service_id TEXT,
            service_name TEXT,
            service_price INTEGER,
            date TEXT NOT NULL,
            end_date TEXT,
            time_slot_id INTEGER,
            time_slot_time TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS riding_slots (
            id INTEGER PRIMARY KEY,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            slots INTEGER NOT NULL DEFAULT 3
        );
        
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY,
            src TEXT NOT NULL,
            title TEXT,
            alt TEXT,
            category TEXT DEFAULT 'ostalo',
            visible INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    saveDatabase();
    console.log('📦 Baza podataka inicijalizirana');
}

function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// Helper function to execute queries
function dbAll(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (error) {
        console.error('DB Error:', error);
        return [];
    }
}

function dbGet(sql, params = []) {
    const results = dbAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

function dbRun(sql, params = []) {
    try {
        db.run(sql, params);
        saveDatabase();
        return { changes: db.getRowsModified(), lastID: dbGet('SELECT last_insert_rowid() as id')?.id };
    } catch (error) {
        console.error('DB Error:', error);
        return { changes: 0, lastID: 0 };
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Samo slike su dozvoljene!'));
    }
});

// ============================================
// REZERVACIJE API
// ============================================

app.get("/", (req, res) => {
    res.send("API is running 🚀");
  });

app.get('/api/reservations', (req, res) => {
    try {
        const { status, service } = req.query;
        let query = 'SELECT * FROM reservations';
        const params = [];
        const conditions = [];

        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }
        if (service && service !== 'all') {
            conditions.push('service_id = ?');
            params.push(service);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';

        const reservations = dbAll(query, params);
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju rezervacija' });
    }
});

app.get('/api/reservations/:id', (req, res) => {
    try {
        const reservation = dbGet('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
        if (!reservation) {
            return res.status(404).json({ error: 'Rezervacija nije pronađena' });
        }
        res.json(reservation);
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju rezervacije' });
    }
});

app.post('/api/reservations', (req, res) => {
    try {
        const {
            name, email, phone, guests, message,
            service_id, service_name, service_price,
            date, end_date, time_slot_id, time_slot_time, status
        } = req.body;

        const id = Date.now();
        dbRun(`
            INSERT INTO reservations (
                id, name, email, phone, guests, message,
                service_id, service_name, service_price,
                date, end_date, time_slot_id, time_slot_time,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            id, name, email || '', phone, guests || 1, message || '',
            service_id, service_name, service_price,
            date, end_date || null, time_slot_id || null, time_slot_time || null,
            status || 'pending'
        ]);

        const newReservation = dbGet('SELECT * FROM reservations WHERE id = ?', [id]);
        res.status(201).json(newReservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Greška pri kreiranju rezervacije' });
    }
});

app.put('/api/reservations/:id', (req, res) => {
    try {
        const { status } = req.body;
        
        if (status) {
            dbRun('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);
        }

        const updated = dbGet('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
        if (!updated) {
            return res.status(404).json({ error: 'Rezervacija nije pronađena' });
        }
        res.json(updated);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Greška pri ažuriranju rezervacije' });
    }
});

app.delete('/api/reservations/:id', (req, res) => {
    try {
        const result = dbRun('DELETE FROM reservations WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rezervacija nije pronađena' });
        }
        
        res.json({ message: 'Rezervacija uspješno obrisana' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ error: 'Greška pri brisanju rezervacije' });
    }
});

// ============================================
// TERMINI JAHANJA API
// ============================================

app.get('/api/riding-slots', (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM riding_slots';
        const params = [];

        if (date) {
            query += ' WHERE date = ?';
            params.push(date);
        }
        query += ' ORDER BY date, time';

        const slots = dbAll(query, params);
        res.json(slots);
    } catch (error) {
        console.error('Error fetching riding slots:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju termina' });
    }
});

app.post('/api/riding-slots', (req, res) => {
    try {
        const { date, time, slots } = req.body;
        const id = Date.now();
        
        dbRun('INSERT INTO riding_slots (id, date, time, slots) VALUES (?, ?, ?, ?)', [id, date, time, slots]);

        const newSlot = dbGet('SELECT * FROM riding_slots WHERE id = ?', [id]);
        res.status(201).json(newSlot);
    } catch (error) {
        console.error('Error creating riding slot:', error);
        res.status(500).json({ error: 'Greška pri kreiranju termina' });
    }
});

app.delete('/api/riding-slots/:id', (req, res) => {
    try {
        const result = dbRun('DELETE FROM riding_slots WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Termin nije pronađen' });
        }
        
        res.json({ message: 'Termin uspješno obrisan' });
    } catch (error) {
        console.error('Error deleting riding slot:', error);
        res.status(500).json({ error: 'Greška pri brisanju termina' });
    }
});

// ============================================
// GALERIJA API
// ============================================

app.get('/api/images', (req, res) => {
    try {
        const { category, visible } = req.query;
        let query = 'SELECT * FROM images';
        const params = [];
        const conditions = [];

        if (category && category !== 'all') {
            conditions.push('category = ?');
            params.push(category);
        }
        if (visible !== undefined) {
            conditions.push('visible = ?');
            params.push(visible === 'true' ? 1 : 0);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY sort_order, id';

        const images = dbAll(query, params);
        res.json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju slika' });
    }
});

app.post('/api/images', upload.single('image'), (req, res) => {
    try {
        const { title, alt, category, visible } = req.body;
        const id = Date.now();
        
        let src = req.file ? `/uploads/${req.file.filename}` : req.body.src;
        
        if (!src) {
            return res.status(400).json({ error: 'Slika je obavezna' });
        }

        const maxOrder = dbGet('SELECT COALESCE(MAX(sort_order), 0) as max FROM images');
        dbRun(`
            INSERT INTO images (id, src, title, alt, category, visible, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [id, src, title || '', alt || '', category || 'ostalo', visible !== 'false' ? 1 : 0, (maxOrder?.max || 0) + 1]);

        const newImage = dbGet('SELECT * FROM images WHERE id = ?', [id]);
        res.status(201).json(newImage);
    } catch (error) {
        console.error('Error creating image:', error);
        res.status(500).json({ error: 'Greška pri dodavanju slike' });
    }
});

app.put('/api/images/:id', (req, res) => {
    try {
        const { title, alt, category, visible, sort_order } = req.body;
        
        dbRun(`
            UPDATE images SET title = ?, alt = ?, category = ?, visible = ?, sort_order = ?
            WHERE id = ?
        `, [title, alt, category, visible ? 1 : 0, sort_order || 0, req.params.id]);

        const updated = dbGet('SELECT * FROM images WHERE id = ?', [req.params.id]);
        if (!updated) {
            return res.status(404).json({ error: 'Slika nije pronađena' });
        }
        res.json(updated);
    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).json({ error: 'Greška pri ažuriranju slike' });
    }
});

app.delete('/api/images/:id', (req, res) => {
    try {
        const result = dbRun('DELETE FROM images WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Slika nije pronađena' });
        }
        
        res.json({ message: 'Slika uspješno obrisana' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Greška pri brisanju slike' });
    }
});

// ============================================
// USLUGE API
// ============================================

app.get('/api/services', (req, res) => {
    try {
        const services = dbAll('SELECT * FROM services ORDER BY id');
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju usluga' });
    }
});

app.post('/api/services', (req, res) => {
    try {
        const { name, description, duration, price, active } = req.body;
        
        const result = dbRun(`
            INSERT INTO services (name, description, duration, price, active)
            VALUES (?, ?, ?, ?, ?)
        `, [name, description || '', duration || '', price, active !== false ? 1 : 0]);

        const newService = dbGet('SELECT * FROM services WHERE id = ?', [result.lastID]);
        res.status(201).json(newService);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Greška pri kreiranju usluge' });
    }
});

app.put('/api/services/:id', (req, res) => {
    try {
        const { name, description, duration, price, active } = req.body;
        
        dbRun(`
            UPDATE services SET name = ?, description = ?, duration = ?, price = ?, active = ?
            WHERE id = ?
        `, [name, description, duration, price, active ? 1 : 0, req.params.id]);

        const updated = dbGet('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (!updated) {
            return res.status(404).json({ error: 'Usluga nije pronađena' });
        }
        res.json(updated);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Greška pri ažuriranju usluge' });
    }
});

app.delete('/api/services/:id', (req, res) => {
    try {
        const result = dbRun('DELETE FROM services WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Usluga nije pronađena' });
        }
        
        res.json({ message: 'Usluga uspješno obrisana' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Greška pri brisanju usluge' });
    }
});

// ============================================
// ADMIN AUTH
// ============================================

app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = dbGet('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
        
        if (!admin) {
            return res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka' });
        }

        res.json({ 
            success: true, 
            user: { id: admin.id, username: admin.username, name: admin.name }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Greška pri prijavi' });
    }
});

// ============================================
// STATISTIKE
// ============================================

app.get('/api/stats', (req, res) => {
    try {
        const totalReservations = dbGet('SELECT COUNT(*) as count FROM reservations')?.count || 0;
        const pendingReservations = dbGet("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'")?.count || 0;
        const activeServices = dbGet('SELECT COUNT(*) as count FROM services WHERE active = 1')?.count || 0;
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyRevenue = dbGet(`
            SELECT COALESCE(SUM(service_price), 0) as revenue 
            FROM reservations 
            WHERE status = 'confirmed' AND date LIKE ?
        `, [currentMonth + '%'])?.revenue || 0;

        res.json({
            totalReservations,
            pendingReservations,
            activeServices,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Greška pri dohvatanju statistike' });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`🐴 Ranč Lipanj 850 server pokrenut na http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);



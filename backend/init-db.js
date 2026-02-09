/* ============================================
   RANČ LIPANJ 850 - Database Initialization
   ============================================ */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

async function initializeDatabase() {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Kreiran uploads folder');
    }

    // Initialize SQL.js
    const SQL = await initSqlJs();
    const DB_PATH = path.join(__dirname, 'database.sqlite');
    
    // Create new database
    const db = new SQL.Database();

    console.log('🗄️  Inicijalizacija baze podataka...\n');

    // Create tables
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

    console.log('✅ Tabele kreirane');

    // Insert default admin
    db.run('INSERT INTO admins (username, password, name) VALUES (?, ?, ?)', ['admin', 'ranc850', 'Administrator']);
    console.log('👤 Kreiran admin korisnik (username: admin, password: ranc850)');

    // Insert default services
    db.run('INSERT INTO services (id, name, description, duration, price, active) VALUES (?, ?, ?, ?, ?, ?)', 
        [1, 'Rekreativno jahanje', 'Uživajte u dvosatnom jahanju kroz prelijepe planinske staze sa iskusnim vodičima. Idealno za opuštanje i uživanje u prirodi.', '2 sata', 50, 1]);
    db.run('INSERT INTO services (id, name, description, duration, price, active) VALUES (?, ?, ?, ?, ?, ?)', 
        [2, 'Jahanje + Prenoćište', 'Kompletno iskustvo koje uključuje rekreativno jahanje (2h) i noćenje u našem A-Frame bungalovu sa domaćim doručkom.', '1 noć + 2h', 150, 1]);
    db.run('INSERT INTO services (id, name, description, duration, price, active) VALUES (?, ?, ?, ?, ?, ?)', 
        [3, 'Prenoćište u bungalovu', 'A-Frame bungalov sa panoramskim pogledom na planine, grijanjem na drva i domaćim doručkom. Savršeno za bijeg od svakodnevice.', '1 noć', 100, 1]);
    console.log('📋 Kreirane podrazumijevane usluge');

    // Insert gallery images
    const defaultImages = [
        [1, 'img/image00001.jpg', 'Jahanje na zalasku sunca', 'Dvoje jahača na konjima pri zalasku sunca', 'jahanje', 1, 1],
        [2, 'img/image00002.jpg', 'Panoramsko jahanje', 'Jahačica uživa u panoramskom pogledu', 'jahanje', 1, 2],
        [3, 'img/image00003.jpg', 'Mir sa konjem', 'Čovjek sjedi u travi pored konja', 'jahanje', 1, 3],
        [4, 'img/image00004.jpg', 'Logorska vatra', 'Logorska vatra sa pogledom na planine', 'priroda', 1, 4],
        [5, 'img/image00005.jpg', 'Grupno jahanje', 'Grupa jahača na izletu', 'jahanje', 1, 5],
        [6, 'img/image00006.jpg', 'Tura kroz prirodu', 'Jahači prolaze kroz zelenu prirodu', 'jahanje', 1, 6],
        [7, 'img/image00007.jpg', 'A-frame bungalov - pogled', 'Unutrašnjost A-frame bungalova sa pogledom', 'smjestaj', 1, 7],
        [8, 'img/image00008.jpg', 'A-frame bungalov - spavaća', 'Rustična spavaća soba u A-frame bungalovu', 'smjestaj', 1, 8],
        [9, 'img/image00009.jpg', 'Bungalov iznad oblaka', 'A-frame bungalov sa pogledom iznad oblaka', 'smjestaj', 1, 9],
        [10, 'img/image000010.jpg', 'Domaća pita ispod sača', 'Tradicionalna bosanska pita ispod sača', 'hrana', 1, 10],
        [11, 'img/image00011.jpeg', 'Ranč Lipanj', 'Pogled na ranč Lipanj', 'priroda', 1, 11],
        [12, 'img/image00012.jpeg', 'Konji na ranču', 'Konji na ranču Lipanj', 'jahanje', 1, 12],
        [13, 'img/image00013.jpeg', 'Planinski pejzaž', 'Planinski pejzaž u okolini ranča', 'priroda', 1, 13],
        [14, 'img/image00014.jpeg', 'Jahanje kroz šumu', 'Jahanje kroz šumu', 'jahanje', 1, 14],
        [15, 'img/image00015.jpeg', 'Panorama ranča', 'Panoramski pogled na ranč', 'priroda', 1, 15],
        [16, 'img/image00016.jpeg', 'Konji na ispaši', 'Konji na ispaši', 'jahanje', 1, 16],
        [17, 'img/image00017.jpeg', 'Zalazak sunca', 'Zalazak sunca na ranču', 'priroda', 1, 17],
        [18, 'img/image00018.jpeg', 'Ranč u prirodi', 'Ranč okružen prirodom', 'priroda', 1, 18],
        [19, 'img/image00019.jpeg', 'Avantura na konjima', 'Avanturistički izlet na konjima', 'jahanje', 1, 19],
        [20, 'img/image00020.jpeg', 'Planinska staza', 'Planinska staza za jahanje', 'jahanje', 1, 20]
    ];

    defaultImages.forEach(img => {
        db.run('INSERT INTO images (id, src, title, alt, category, visible, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)', img);
    });
    console.log('🖼️  Dodane slike u galeriju');

    // Add demo reservations
    db.run(`INSERT INTO reservations (id, name, email, phone, guests, message, service_id, service_name, service_price, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1001, 'Marko Petrović', 'marko@email.com', '+387 65 123 456', 4, 'Dolazimo sa porodicom, 4 osobe.', '1', 'Rekreativno jahanje', 50, '2026-02-15', 'confirmed', '2026-02-01T10:00:00Z']);
    db.run(`INSERT INTO reservations (id, name, email, phone, guests, message, service_id, service_name, service_price, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1002, 'Ana Jovanović', 'ana.j@email.com', '+387 66 789 012', 2, 'Prvo iskustvo sa jahanjem, veselimo se!', '2', 'Jahanje + Prenoćište', 150, '2026-02-16', 'pending', '2026-02-02T14:30:00Z']);
    db.run(`INSERT INTO reservations (id, name, email, phone, guests, message, service_id, service_name, service_price, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1003, 'Ivan Nikolić', 'ivan@email.com', '+387 65 555 444', 2, 'Godišnjica braka, tražimo romantičan bijeg.', '3', 'Prenoćište u bungalovu', 100, '2026-02-20', 'pending', '2026-02-05T09:15:00Z']);
    console.log('📅 Dodane demo rezervacije');

    // Add riding slots for next 2 weeks
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Morning slot
        db.run('INSERT INTO riding_slots (id, date, time, slots) VALUES (?, ?, ?, ?)', [Date.now() + i * 2, dateStr, '10:00', 4]);
        // Afternoon slot
        db.run('INSERT INTO riding_slots (id, date, time, slots) VALUES (?, ?, ?, ?)', [Date.now() + i * 2 + 1, dateStr, '15:00', 4]);
    }
    console.log('🐴 Dodani termini jahanja za sljedeća 2 tjedna');

    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log('\n✅ Baza podataka uspješno inicijalizirana!');
    console.log('📍 Lokacija: backend/database.sqlite');
    console.log('\n🚀 Pokrenite server sa: cd backend && npm start');
    console.log('🔐 Admin pristup: admin / ranc850');

    db.close();
}

initializeDatabase().catch(console.error);

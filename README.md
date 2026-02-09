<<<<<<< HEAD
<<<<<<< HEAD
# 🐴 Ranč Lipanj 850

Službena web stranica za **Ranč Lipanj 850** - jahanje i smještaj u prirodi na 850m nadmorske visine u selu Sekovići kod Zvornika, BiH.

## 📋 Sadržaj

- [Pregled](#pregled)
- [Značajke](#značajke)
- [Instalacija](#instalacija)
- [Pokretanje](#pokretanje)
- [Struktura projekta](#struktura-projekta)
- [API Dokumentacija](#api-dokumentacija)
- [Deployment](#deployment)

## 🏔️ Pregled

Web stranica uključuje:
- **Prezentacijska stranica** - O ranču, uslugama, galerija slika
- **Sistem rezervacija** - Online rezervacije s kalendarom
- **Admin panel** - Upravljanje rezervacijama, uslugama i galerijom
- **Backend s bazom podataka** - SQLite baza za trajno čuvanje podataka

## ✨ Značajke

### Za posjetitelje:
- Pregled usluga (jahanje, smještaj, paketi)
- Online rezervacije s odabirom datuma
- Galerija fotografija
- Kontakt informacije

### Za administratore:
- Dashboard sa statistikama
- Upravljanje rezervacijama (potvrda, otkazivanje)
- Kalendar s pregledom zauzetosti
- Upravljanje terminima jahanja
- Upravljanje galerijom slika
- Upravljanje uslugama

## 🛠️ Instalacija

### Preduvjeti
- [Node.js](https://nodejs.org/) v18 ili noviji
- npm (dolazi s Node.js)

### Koraci

1. **Kloniraj ili preuzmi projekt**

2. **Instaliraj dependencies za backend**
```bash
cd backend
npm install
```

3. **Inicijaliziraj bazu podataka**
```bash
npm run init-db
```

Ovo će kreirati SQLite bazu s:
- Admin korisnikom (username: `admin`, password: `ranc850`)
- Podrazumijevanim uslugama
- Demo rezervacijama
- Terminima jahanja za sljedećih 2 tjedna
- Slikama za galeriju

## 🚀 Pokretanje

### Development mode
```bash
cd backend
npm run dev
```

### Production mode
```bash
cd backend
npm start
```

Server će biti dostupan na: **http://localhost:3000**

### Stranice:
- **Početna**: http://localhost:3000/
- **Rezervacije**: http://localhost:3000/rezervacije.html
- **Admin Login**: http://localhost:3000/login.html
- **Admin Panel**: http://localhost:3000/admin.html

## 📁 Struktura projekta

```
Ranc Lipanj/
├── backend/
│   ├── server.js          # Express server
│   ├── init-db.js         # Skripta za inicijalizaciju baze
│   ├── database.sqlite    # SQLite baza (kreira se automatski)
│   ├── uploads/           # Folder za uploadane slike
│   └── package.json
├── img/                   # Slike za stranicu
│   ├── homevideo.mp4
│   ├── image00001.jpg
│   └── ...
├── index.html             # Glavna stranica
├── rezervacije.html       # Stranica za rezervacije
├── login.html             # Admin login
├── admin.html             # Admin panel
├── style.css              # Glavni CSS
├── booking.css            # CSS za rezervacije
├── admin.css              # CSS za admin panel
├── script.js              # Glavni JavaScript
├── booking.js             # JS za rezervacije
├── admin.js               # JS za admin panel
├── api.js                 # API klijent
└── README.md
```

## 📡 API Dokumentacija

### Baza URL
```
http://localhost:3000/api
```

### Endpointi

#### Rezervacije
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/reservations` | Dohvati sve rezervacije |
| GET | `/api/reservations/:id` | Dohvati jednu rezervaciju |
| POST | `/api/reservations` | Kreiraj novu rezervaciju |
| PUT | `/api/reservations/:id` | Ažuriraj rezervaciju |
| DELETE | `/api/reservations/:id` | Obriši rezervaciju |

#### Termini jahanja
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/riding-slots` | Dohvati sve termine |
| POST | `/api/riding-slots` | Kreiraj novi termin |
| DELETE | `/api/riding-slots/:id` | Obriši termin |

#### Galerija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/images` | Dohvati sve slike |
| POST | `/api/images` | Upload nove slike |
| PUT | `/api/images/:id` | Ažuriraj metapodatke slike |
| DELETE | `/api/images/:id` | Obriši sliku |

#### Usluge
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/services` | Dohvati sve usluge |
| POST | `/api/services` | Kreiraj novu uslugu |
| PUT | `/api/services/:id` | Ažuriraj uslugu |
| DELETE | `/api/services/:id` | Obriši uslugu |

#### Autentifikacija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/login` | Admin prijava |

#### Statistike
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/stats` | Dohvati dashboard statistike |

## 🌐 Deployment

### Opcija 1: VPS/Cloud Server (preporučeno)

1. **Kopiraj sve datoteke na server**

2. **Instaliraj Node.js na serveru**

3. **Instaliraj PM2 za proces management**
```bash
npm install -g pm2
```

4. **Pokreni aplikaciju**
```bash
cd backend
npm install
npm run init-db
pm2 start server.js --name "ranc-lipanj"
pm2 save
pm2 startup
```

5. **Konfiguriši Nginx kao reverse proxy**
```nginx
server {
    listen 80;
    server_name vasa-domena.ba;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opcija 2: Render.com (besplatno)

1. Kreiraj račun na [render.com](https://render.com)
2. Kreiraj novi "Web Service"
3. Poveži s Git repozitorijem
4. Postavi:
   - Build Command: `cd backend && npm install && npm run init-db`
   - Start Command: `cd backend && npm start`

### Opcija 3: Railway.app

1. Kreiraj račun na [railway.app](https://railway.app)
2. Kreiraj novi projekt
3. Dodaj service iz Git repozitorija
4. Railway će automatski detektirati Node.js projekt

## 🔐 Sigurnost

⚠️ **Važno za produkciju:**

1. **Promijeni admin lozinku** - U `init-db.js` ili direktno u bazi
2. **Koristi HTTPS** - Konfiguriši SSL certifikat
3. **Postavi environment varijable** - Za osjetljive podatke
4. **Backup baze** - Redovito backupiraj `database.sqlite`

## 📞 Kontakt

**Ranč Lipanj 850**
- Lokacija: Sekovići, Zvornik, BiH
- Email: info@ranclipanj.ba
- Telefon: +387 65 XXX XXX

---

© 2026 Ranč Lipanj 850. Sva prava zadržana.

=======
# 🐴 Ranč Lipanj 850

Službena web stranica za **Ranč Lipanj 850** - jahanje i smještaj u prirodi na 850m nadmorske visine u selu Sekovići kod Zvornika, BiH.

## 📋 Sadržaj

- [Pregled](#pregled)
- [Značajke](#značajke)
- [Instalacija](#instalacija)
- [Pokretanje](#pokretanje)
- [Struktura projekta](#struktura-projekta)
- [API Dokumentacija](#api-dokumentacija)
- [Deployment](#deployment)

## 🏔️ Pregled

Web stranica uključuje:
- **Prezentacijska stranica** - O ranču, uslugama, galerija slika
- **Sistem rezervacija** - Online rezervacije s kalendarom
- **Admin panel** - Upravljanje rezervacijama, uslugama i galerijom
- **Backend s bazom podataka** - SQLite baza za trajno čuvanje podataka

## ✨ Značajke

### Za posjetitelje:
- Pregled usluga (jahanje, smještaj, paketi)
- Online rezervacije s odabirom datuma
- Galerija fotografija
- Kontakt informacije

### Za administratore:
- Dashboard sa statistikama
- Upravljanje rezervacijama (potvrda, otkazivanje)
- Kalendar s pregledom zauzetosti
- Upravljanje terminima jahanja
- Upravljanje galerijom slika
- Upravljanje uslugama

## 🛠️ Instalacija

### Preduvjeti
- [Node.js](https://nodejs.org/) v18 ili noviji
- npm (dolazi s Node.js)

### Koraci

1. **Kloniraj ili preuzmi projekt**

2. **Instaliraj dependencies za backend**
```bash
cd backend
npm install
```

3. **Inicijaliziraj bazu podataka**
```bash
npm run init-db
```

Ovo će kreirati SQLite bazu s:
- Admin korisnikom (username: `admin`, password: `ranc850`)
- Podrazumijevanim uslugama
- Demo rezervacijama
- Terminima jahanja za sljedećih 2 tjedna
- Slikama za galeriju

## 🚀 Pokretanje

### Development mode
```bash
cd backend
npm run dev
```

### Production mode
```bash
cd backend
npm start
```

Server će biti dostupan na: **http://localhost:3000**

### Stranice:
- **Početna**: http://localhost:3000/
- **Rezervacije**: http://localhost:3000/rezervacije.html
- **Admin Login**: http://localhost:3000/login.html
- **Admin Panel**: http://localhost:3000/admin.html

## 📁 Struktura projekta

```
Ranc Lipanj/
├── backend/
│   ├── server.js          # Express server
│   ├── init-db.js         # Skripta za inicijalizaciju baze
│   ├── database.sqlite    # SQLite baza (kreira se automatski)
│   ├── uploads/           # Folder za uploadane slike
│   └── package.json
├── img/                   # Slike za stranicu
│   ├── homevideo.mp4
│   ├── image00001.jpg
│   └── ...
├── index.html             # Glavna stranica
├── rezervacije.html       # Stranica za rezervacije
├── login.html             # Admin login
├── admin.html             # Admin panel
├── style.css              # Glavni CSS
├── booking.css            # CSS za rezervacije
├── admin.css              # CSS za admin panel
├── script.js              # Glavni JavaScript
├── booking.js             # JS za rezervacije
├── admin.js               # JS za admin panel
├── api.js                 # API klijent
└── README.md
```

## 📡 API Dokumentacija

### Baza URL
```
http://localhost:3000/api
```

### Endpointi

#### Rezervacije
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/reservations` | Dohvati sve rezervacije |
| GET | `/api/reservations/:id` | Dohvati jednu rezervaciju |
| POST | `/api/reservations` | Kreiraj novu rezervaciju |
| PUT | `/api/reservations/:id` | Ažuriraj rezervaciju |
| DELETE | `/api/reservations/:id` | Obriši rezervaciju |

#### Termini jahanja
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/riding-slots` | Dohvati sve termine |
| POST | `/api/riding-slots` | Kreiraj novi termin |
| DELETE | `/api/riding-slots/:id` | Obriši termin |

#### Galerija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/images` | Dohvati sve slike |
| POST | `/api/images` | Upload nove slike |
| PUT | `/api/images/:id` | Ažuriraj metapodatke slike |
| DELETE | `/api/images/:id` | Obriši sliku |

#### Usluge
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/services` | Dohvati sve usluge |
| POST | `/api/services` | Kreiraj novu uslugu |
| PUT | `/api/services/:id` | Ažuriraj uslugu |
| DELETE | `/api/services/:id` | Obriši uslugu |

#### Autentifikacija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/login` | Admin prijava |

#### Statistike
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/stats` | Dohvati dashboard statistike |

## 🌐 Deployment

### Opcija 1: VPS/Cloud Server (preporučeno)

1. **Kopiraj sve datoteke na server**

2. **Instaliraj Node.js na serveru**

3. **Instaliraj PM2 za proces management**
```bash
npm install -g pm2
```

4. **Pokreni aplikaciju**
```bash
cd backend
npm install
npm run init-db
pm2 start server.js --name "ranc-lipanj"
pm2 save
pm2 startup
```

5. **Konfiguriši Nginx kao reverse proxy**
```nginx
server {
    listen 80;
    server_name vasa-domena.ba;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opcija 2: Render.com (besplatno)

1. Kreiraj račun na [render.com](https://render.com)
2. Kreiraj novi "Web Service"
3. Poveži s Git repozitorijem
4. Postavi:
   - Build Command: `cd backend && npm install && npm run init-db`
   - Start Command: `cd backend && npm start`

### Opcija 3: Railway.app

1. Kreiraj račun na [railway.app](https://railway.app)
2. Kreiraj novi projekt
3. Dodaj service iz Git repozitorija
4. Railway će automatski detektirati Node.js projekt

## 🔐 Sigurnost

⚠️ **Važno za produkciju:**

1. **Promijeni admin lozinku** - U `init-db.js` ili direktno u bazi
2. **Koristi HTTPS** - Konfiguriši SSL certifikat
3. **Postavi environment varijable** - Za osjetljive podatke
4. **Backup baze** - Redovito backupiraj `database.sqlite`

## 📞 Kontakt

**Ranč Lipanj 850**
- Lokacija: Sekovići, Zvornik, BiH
- Email: info@ranclipanj.ba
- Telefon: +387 65 XXX XXX

---

© 2026 Ranč Lipanj 850. Sva prava zadržana.

>>>>>>> 7af4f1026498e1dff10f5dc1130fce15aec1ea72
=======
# 🐴 Ranč Lipanj 850

Službena web stranica za **Ranč Lipanj 850** - jahanje i smještaj u prirodi na 850m nadmorske visine u selu Sekovići kod Zvornika, BiH.

## 📋 Sadržaj

- [Pregled](#pregled)
- [Značajke](#značajke)
- [Instalacija](#instalacija)
- [Pokretanje](#pokretanje)
- [Struktura projekta](#struktura-projekta)
- [API Dokumentacija](#api-dokumentacija)
- [Deployment](#deployment)

## 🏔️ Pregled

Web stranica uključuje:
- **Prezentacijska stranica** - O ranču, uslugama, galerija slika
- **Sistem rezervacija** - Online rezervacije s kalendarom
- **Admin panel** - Upravljanje rezervacijama, uslugama i galerijom
- **Backend s bazom podataka** - SQLite baza za trajno čuvanje podataka

## ✨ Značajke

### Za posjetitelje:
- Pregled usluga (jahanje, smještaj, paketi)
- Online rezervacije s odabirom datuma
- Galerija fotografija
- Kontakt informacije

### Za administratore:
- Dashboard sa statistikama
- Upravljanje rezervacijama (potvrda, otkazivanje)
- Kalendar s pregledom zauzetosti
- Upravljanje terminima jahanja
- Upravljanje galerijom slika
- Upravljanje uslugama

## 🛠️ Instalacija

### Preduvjeti
- [Node.js](https://nodejs.org/) v18 ili noviji
- npm (dolazi s Node.js)

### Koraci

1. **Kloniraj ili preuzmi projekt**

2. **Instaliraj dependencies za backend**
```bash
cd backend
npm install
```

3. **Inicijaliziraj bazu podataka**
```bash
npm run init-db
```

Ovo će kreirati SQLite bazu s:
- Admin korisnikom (username: `admin`, password: `ranc850`)
- Podrazumijevanim uslugama
- Demo rezervacijama
- Terminima jahanja za sljedećih 2 tjedna
- Slikama za galeriju

## 🚀 Pokretanje

### Development mode
```bash
cd backend
npm run dev
```

### Production mode
```bash
cd backend
npm start
```

Server će biti dostupan na: **http://localhost:3000**

### Stranice:
- **Početna**: http://localhost:3000/
- **Rezervacije**: http://localhost:3000/rezervacije.html
- **Admin Login**: http://localhost:3000/login.html
- **Admin Panel**: http://localhost:3000/admin.html

## 📁 Struktura projekta

```
Ranc Lipanj/
├── backend/
│   ├── server.js          # Express server
│   ├── init-db.js         # Skripta za inicijalizaciju baze
│   ├── database.sqlite    # SQLite baza (kreira se automatski)
│   ├── uploads/           # Folder za uploadane slike
│   └── package.json
├── img/                   # Slike za stranicu
│   ├── homevideo.mp4
│   ├── image00001.jpg
│   └── ...
├── index.html             # Glavna stranica
├── rezervacije.html       # Stranica za rezervacije
├── login.html             # Admin login
├── admin.html             # Admin panel
├── style.css              # Glavni CSS
├── booking.css            # CSS za rezervacije
├── admin.css              # CSS za admin panel
├── script.js              # Glavni JavaScript
├── booking.js             # JS za rezervacije
├── admin.js               # JS za admin panel
├── api.js                 # API klijent
└── README.md
```

## 📡 API Dokumentacija

### Baza URL
```
http://localhost:3000/api
```

### Endpointi

#### Rezervacije
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/reservations` | Dohvati sve rezervacije |
| GET | `/api/reservations/:id` | Dohvati jednu rezervaciju |
| POST | `/api/reservations` | Kreiraj novu rezervaciju |
| PUT | `/api/reservations/:id` | Ažuriraj rezervaciju |
| DELETE | `/api/reservations/:id` | Obriši rezervaciju |

#### Termini jahanja
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/riding-slots` | Dohvati sve termine |
| POST | `/api/riding-slots` | Kreiraj novi termin |
| DELETE | `/api/riding-slots/:id` | Obriši termin |

#### Galerija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/images` | Dohvati sve slike |
| POST | `/api/images` | Upload nove slike |
| PUT | `/api/images/:id` | Ažuriraj metapodatke slike |
| DELETE | `/api/images/:id` | Obriši sliku |

#### Usluge
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/services` | Dohvati sve usluge |
| POST | `/api/services` | Kreiraj novu uslugu |
| PUT | `/api/services/:id` | Ažuriraj uslugu |
| DELETE | `/api/services/:id` | Obriši uslugu |

#### Autentifikacija
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/login` | Admin prijava |

#### Statistike
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/stats` | Dohvati dashboard statistike |

## 🌐 Deployment

### Opcija 1: VPS/Cloud Server (preporučeno)

1. **Kopiraj sve datoteke na server**

2. **Instaliraj Node.js na serveru**

3. **Instaliraj PM2 za proces management**
```bash
npm install -g pm2
```

4. **Pokreni aplikaciju**
```bash
cd backend
npm install
npm run init-db
pm2 start server.js --name "ranc-lipanj"
pm2 save
pm2 startup
```

5. **Konfiguriši Nginx kao reverse proxy**
```nginx
server {
    listen 80;
    server_name vasa-domena.ba;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opcija 2: Render.com (besplatno)

1. Kreiraj račun na [render.com](https://render.com)
2. Kreiraj novi "Web Service"
3. Poveži s Git repozitorijem
4. Postavi:
   - Build Command: `cd backend && npm install && npm run init-db`
   - Start Command: `cd backend && npm start`

### Opcija 3: Railway.app

1. Kreiraj račun na [railway.app](https://railway.app)
2. Kreiraj novi projekt
3. Dodaj service iz Git repozitorija
4. Railway će automatski detektirati Node.js projekt

## 🔐 Sigurnost

⚠️ **Važno za produkciju:**

1. **Promijeni admin lozinku** - U `init-db.js` ili direktno u bazi
2. **Koristi HTTPS** - Konfiguriši SSL certifikat
3. **Postavi environment varijable** - Za osjetljive podatke
4. **Backup baze** - Redovito backupiraj `database.sqlite`

## 📞 Kontakt

**Ranč Lipanj 850**
- Lokacija: Sekovići, Zvornik, BiH
- Email: info@ranclipanj.ba
- Telefon: +387 65 XXX XXX

---

© 2026 Ranč Lipanj 850. Sva prava zadržana.

>>>>>>> 7af4f1026498e1dff10f5dc1130fce15aec1ea72

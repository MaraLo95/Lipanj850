/* ============================================
   RANČ LIPANJ 850 - Admin Panel JavaScript
   ============================================ */

// Provjera autentifikacije
(function checkAuth() {
    const isLoggedIn = localStorage.getItem('ranc_admin_logged_in');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
})();

// ============================================
// DATA STORE (API podaci s fallback na localStorage)
// ============================================

let ridingSlots = [];
let services = [];
let reservations = [];
let galleryImages = [];

// Učitaj sve podatke iz API-ja
async function loadAllData() {
    try {
        // Paralelno učitaj sve podatke
        const [slotsData, servicesData, reservationsData, imagesData] = await Promise.all([
            window.RancAPI.getRidingSlots(),
            window.RancAPI.getServices(),
            window.RancAPI.getReservations(),
            window.RancAPI.getImages()
        ]);
        
        ridingSlots = slotsData;
        services = servicesData.map(s => ({...s, active: s.active === 1}));
        reservations = normalizeReservations(reservationsData);
        galleryImages = imagesData.map(img => ({...img, visible: img.visible === 1}));
        
        console.log('Data loaded from API');
    } catch (error) {
        console.error('Error loading data from API, using localStorage:', error);
        // Fallback to localStorage
        ridingSlots = JSON.parse(localStorage.getItem('ranc_riding_slots')) || [];
        services = getDefaultServices();
        reservations = loadReservationsFromStorage();
    }
}

// Normaliziraj rezervacije iz API-ja za kompatibilnost
function normalizeReservations(apiReservations) {
    return apiReservations.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        guests: r.guests,
        message: r.message,
        serviceId: r.service_id,
        serviceName: r.service_name,
        servicePrice: r.service_price,
        price: r.service_price,
        date: r.date,
        endDate: r.end_date,
        timeSlotId: r.time_slot_id,
        timeSlotTime: r.time_slot_time,
        status: r.status,
        createdAt: r.created_at
    }));
}

function getDefaultServices() {
    return [
        { id: 1, name: 'Rekreativno jahanje', description: 'Dvosatno jahanje kroz planinske staze', duration: '2 sata', price: 50, active: true },
        { id: 2, name: 'Jahanje + Prenoćište', description: 'Jahanje i noćenje u A-Frame bungalovu', duration: '1 noć + 2h', price: 150, active: true },
        { id: 3, name: 'Prenoćište u bungalovu', description: 'A-Frame bungalov sa doručkom', duration: '1 noć', price: 100, active: true }
    ];
}

function loadReservationsFromStorage() {
    const stored = localStorage.getItem('ranc_reservations');
    return stored ? JSON.parse(stored) : [];
}

// Async funkcije za spremanje
async function saveRidingSlots() {
    try {
        // Slots se spremaju pojedinačno kroz API
        localStorage.setItem('ranc_riding_slots', JSON.stringify(ridingSlots));
    } catch (error) {
        console.error('Error saving riding slots:', error);
    }
}

async function saveReservations() {
    localStorage.setItem('ranc_reservations', JSON.stringify(reservations));
}

// ============================================
// DOM ELEMENTS
// ============================================
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const menuToggle = document.getElementById('menuToggle');
const navItems = document.querySelectorAll('.nav-item[data-section]');
const pageTitle = document.getElementById('pageTitle');
const logoutBtn = document.getElementById('logoutBtn');

// Modals
const serviceModal = document.getElementById('serviceModal');
const reservationModal = document.getElementById('reservationModal');
const imageModal = document.getElementById('imageModal');

// ============================================
// SIDEBAR & NAVIGATION
// ============================================
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
});

sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Navigacija između sekcija
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        switchSection(section);
        sidebar.classList.remove('active');
    });
});

// View all linkovi
document.querySelectorAll('.view-all').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        switchSection(section);
    });
});

function switchSection(sectionId) {
    // Update navigation
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        usluge: 'Usluge',
        kalendar: 'Kalendar',
        rezervacije: 'Rezervacije',
        galerija: 'Galerija'
    };
    pageTitle.textContent = titles[sectionId] || 'Dashboard';
    
    // Update URL hash
    window.location.hash = sectionId;
}

// Handle URL hash on load
window.addEventListener('load', () => {
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'usluge', 'kalendar', 'rezervacije', 'galerija'].includes(hash)) {
        switchSection(hash);
    }
});

// ============================================
// LOGOUT
// ============================================
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('ranc_admin_logged_in');
    localStorage.removeItem('ranc_admin_user');
    window.location.href = 'login.html';
});

// Set username
const userName = localStorage.getItem('ranc_admin_user');
if (userName) {
    document.getElementById('userName').textContent = userName;
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    // Update stats
    document.getElementById('totalReservations').textContent = reservations.length;
    document.getElementById('pendingReservations').textContent = 
        reservations.filter(r => r.status === 'pending').length;
    document.getElementById('activeServices').textContent = 
        services.filter(s => s.active).length;
    
    // Recent reservations
    const recentTable = document.getElementById('recentReservationsTable');
    const recent = [...reservations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    recentTable.innerHTML = recent.map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${r.serviceName}</td>
            <td>${formatDate(r.date)}</td>
            <td><strong style="color: var(--color-success);">${r.price ? r.price + ' KM' : '-'}</strong></td>
            <td><span class="status-badge ${r.status}">${getStatusText(r.status)}</span></td>
        </tr>
    `).join('');
    
    // Upcoming events
    const upcomingEvents = document.getElementById('upcomingEvents');
    const upcoming = reservations
        .filter(r => new Date(r.date) >= new Date() && r.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);
    
    upcomingEvents.innerHTML = upcoming.map(r => {
        const date = new Date(r.date);
        return `
            <div class="event-item">
                <div class="event-date">
                    <span class="day">${date.getDate()}</span>
                    <span class="month">${getMonthShort(date.getMonth())}</span>
                </div>
                <div class="event-info">
                    <h4>${r.serviceName} ${r.price ? `<span style="color: var(--color-success); font-size: 0.8rem;">${r.price} KM</span>` : ''}</h4>
                    <p>${r.name}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// SERVICES (USLUGE)
// ============================================
let editingServiceId = null;

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    
    grid.innerHTML = services.map(service => `
        <div class="service-card" data-id="${service.id}">
            <div class="service-card-header">
                <h3>${service.name}</h3>
                <span class="service-status ${service.active ? 'active' : 'inactive'}">
                    ${service.active ? 'Aktivna' : 'Neaktivna'}
                </span>
            </div>
            <p>${service.description}</p>
            <div class="service-card-meta">
                <div class="service-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>${service.duration}</span>
                </div>
                <div class="service-price">${service.price} <small>KM</small></div>
            </div>
            <div class="service-card-actions">
                <button class="btn btn-secondary edit-service-btn" data-id="${service.id}">Uredi</button>
                <button class="btn btn-danger delete-service-btn" data-id="${service.id}">Obriši</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', () => editService(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteService(parseInt(btn.dataset.id)));
    });
}

document.getElementById('addServiceBtn').addEventListener('click', () => {
    editingServiceId = null;
    document.getElementById('serviceModalTitle').textContent = 'Dodaj novu uslugu';
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceActive').checked = true;
    serviceModal.classList.add('active');
});

function editService(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    editingServiceId = id;
    document.getElementById('serviceModalTitle').textContent = 'Uredi uslugu';
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceDescription').value = service.description;
    document.getElementById('serviceDuration').value = service.duration;
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceActive').checked = service.active;
    
    serviceModal.classList.add('active');
}

function deleteService(id) {
    if (confirm('Da li ste sigurni da želite obrisati ovu uslugu?')) {
        services = services.filter(s => s.id !== id);
        renderServices();
        updateDashboard();
    }
}

document.getElementById('serviceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const serviceData = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        duration: document.getElementById('serviceDuration').value,
        price: parseInt(document.getElementById('servicePrice').value),
        active: document.getElementById('serviceActive').checked
    };
    
    if (editingServiceId) {
        // Update existing
        const index = services.findIndex(s => s.id === editingServiceId);
        if (index !== -1) {
            services[index] = { ...services[index], ...serviceData };
        }
    } else {
        // Add new
        const newId = Math.max(...services.map(s => s.id)) + 1;
        services.push({ id: newId, ...serviceData });
    }
    
    serviceModal.classList.remove('active');
    renderServices();
    updateDashboard();
});

document.getElementById('closeServiceModal').addEventListener('click', () => {
    serviceModal.classList.remove('active');
});

document.getElementById('cancelServiceBtn').addEventListener('click', () => {
    serviceModal.classList.remove('active');
});

// ============================================
// CALENDAR (KALENDAR)
// ============================================
let currentDate = new Date();
let selectedCalendarDate = null;

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 
                        'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get starting day (0 = Sunday, adjust for Monday start)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;
    
    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let html = '';
    let dayCount = 1;
    let nextMonthDay = 1;
    
    // Calculate total cells needed (6 rows max)
    const totalCells = Math.ceil((startingDay + totalDays) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
        let dayNumber, isOtherMonth = false, dateStr;
        
        if (i < startingDay) {
            // Previous month
            dayNumber = prevMonthLastDay - startingDay + i + 1;
            isOtherMonth = true;
            dateStr = formatDateISO(new Date(year, month - 1, dayNumber));
        } else if (dayCount > totalDays) {
            // Next month
            dayNumber = nextMonthDay++;
            isOtherMonth = true;
            dateStr = formatDateISO(new Date(year, month + 1, dayNumber));
        } else {
            // Current month
            dayNumber = dayCount++;
            dateStr = formatDateISO(new Date(year, month, dayNumber));
        }
        
        const isToday = !isOtherMonth && 
            new Date().getDate() === dayNumber && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;
        
        // Get events for this day
        const dayEvents = reservations.filter(r => r.date === dateStr);
        
        // Get riding slots for this day
        const daySlots = ridingSlots.filter(s => s.date === dateStr);
        const hasRidingSlot = daySlots.length > 0;
        const totalSlots = daySlots.reduce((sum, s) => sum + s.slots, 0);
        
        html += `
            <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasRidingSlot ? 'has-slots' : ''}" data-date="${dateStr}">
                <div class="day-header">
                    <span class="day-number">${dayNumber}</span>
                    <div class="day-actions">
                        <button class="add-slot-btn" onclick="event.stopPropagation(); openAddSlotModal('${dateStr}')" title="Dodaj termin jahanja">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                            </svg>
                        </button>
                        <button class="add-event-btn" onclick="event.stopPropagation(); openAddReservationModal('${dateStr}')" title="Dodaj rezervaciju">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="day-events">
                    ${hasRidingSlot ? `
                        <div class="day-event riding-slot" onclick="event.stopPropagation(); showSlotDetails('${dateStr}')">
                            🐴 ${totalSlots} ${totalSlots === 1 ? 'termin' : 'termina'}
                        </div>
                    ` : ''}
                    ${dayEvents.slice(0, hasRidingSlot ? 2 : 3).map(e => `
                        <div class="day-event ${e.status}" onclick="event.stopPropagation(); showReservation(${e.id})" title="${e.name} - ${e.serviceName}${e.price ? ' - ' + e.price + ' KM' : ''}">
                            ${e.name.split(' ')[0]}${e.price ? ` <span class="event-price">${e.price} KM</span>` : ''}
                        </div>
                    `).join('')}
                    ${dayEvents.length > (hasRidingSlot ? 2 : 3) ? `<div class="day-event more-events">+${dayEvents.length - (hasRidingSlot ? 2 : 3)} više</div>` : ''}
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

// ============================================
// RIDING SLOTS (TERMINI JAHANJA)
// ============================================
window.openAddSlotModal = function(dateStr) {
    const modal = document.getElementById('addSlotModal');
    document.getElementById('slotDate').value = dateStr;
    document.getElementById('slotDateDisplay').textContent = formatDate(dateStr);
    document.getElementById('slotCount').value = 3;
    document.getElementById('slotTime').value = '10:00';
    modal.classList.add('active');
};

window.showSlotDetails = function(dateStr) {
    const daySlots = ridingSlots.filter(s => s.date === dateStr);
    if (daySlots.length === 0) return;
    
    let html = `<h4>Termini za ${formatDate(dateStr)}</h4><ul class="slot-list">`;
    daySlots.forEach(slot => {
        html += `
            <li>
                <span>${slot.time} - ${slot.slots} ${slot.slots === 1 ? 'mjesto' : 'mjesta'}</span>
                <button class="btn-delete-slot" onclick="deleteSlot(${slot.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </li>
        `;
    });
    html += '</ul>';
    
    document.getElementById('slotDetailsContent').innerHTML = html;
    document.getElementById('slotDetailsModal').classList.add('active');
};

window.deleteSlot = async function(slotId) {
    if (confirm('Da li ste sigurni da želite obrisati ovaj termin?')) {
        try {
            await window.RancAPI.deleteRidingSlot(slotId);
        } catch (error) {
            console.error('Error deleting slot:', error);
        }
        ridingSlots = ridingSlots.filter(s => s.id !== slotId);
        saveRidingSlots();
        renderCalendar();
        document.getElementById('slotDetailsModal').classList.remove('active');
    }
};

// Add Slot Form Submit
document.getElementById('addSlotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newSlot = {
        date: document.getElementById('slotDate').value,
        time: document.getElementById('slotTime').value,
        slots: parseInt(document.getElementById('slotCount').value)
    };
    
    try {
        const savedSlot = await window.RancAPI.createRidingSlot(newSlot);
        ridingSlots.push(savedSlot);
    } catch (error) {
        console.error('Error creating slot:', error);
        newSlot.id = Date.now();
        ridingSlots.push(newSlot);
        saveRidingSlots();
    }
    
    document.getElementById('addSlotModal').classList.remove('active');
    renderCalendar();
});

document.getElementById('closeSlotModal')?.addEventListener('click', () => {
    document.getElementById('addSlotModal').classList.remove('active');
});

document.getElementById('cancelSlotBtn')?.addEventListener('click', () => {
    document.getElementById('addSlotModal').classList.remove('active');
});

document.getElementById('closeSlotDetailsModal')?.addEventListener('click', () => {
    document.getElementById('slotDetailsModal').classList.remove('active');
});

// Open modal to add reservation from calendar
window.openAddReservationModal = function(dateStr) {
    selectedCalendarDate = dateStr;
    const addReservationModal = document.getElementById('addReservationModal');
    
    // Reset form
    document.getElementById('addReservationForm').reset();
    document.getElementById('reservationStartDate').value = dateStr;
    
    // Set end date to next day by default
    const startDate = new Date(dateStr);
    startDate.setDate(startDate.getDate() + 1);
    document.getElementById('reservationEndDate').value = startDate.toISOString().split('T')[0];
    
    // Populate services dropdown
    const serviceSelect = document.getElementById('reservationService');
    serviceSelect.innerHTML = services.filter(s => s.active).map(s => 
        `<option value="${s.id}">${s.name} - ${s.price} KM</option>`
    ).join('');
    
    addReservationModal.classList.add('active');
};

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// ============================================
// RESERVATIONS (REZERVACIJE)
// ============================================
let selectedReservationId = null;

function renderReservations(filter = {}) {
    const table = document.getElementById('reservationsTable');
    
    // Koristi već učitane rezervacije iz API-ja
    let filtered = [...reservations];
    
    if (filter.status && filter.status !== 'all') {
        filtered = filtered.filter(r => r.status === filter.status);
    }
    
    if (filter.service && filter.service !== 'all') {
        filtered = filtered.filter(r => r.serviceId === filter.service || r.serviceName === filter.service);
    }
    
    // Sort by date (newest first), then by createdAt
    filtered.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    Nema rezervacija za prikaz
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = filtered.map(r => `
        <tr class="${r.status === 'pending' ? 'pending-row' : ''}">
            <td>#${r.id}</td>
            <td>
                <strong>${r.name}</strong>
                ${r.guests > 1 ? `<br><small style="color: var(--text-muted);">${r.guests} osoba</small>` : ''}
            </td>
            <td>${r.email || '-'}</td>
            <td>${r.phone || '-'}</td>
            <td>${r.serviceName}</td>
            <td>
                ${formatDate(r.date)}
                ${r.endDate ? `<br><small style="color: var(--text-muted);">do ${formatDate(r.endDate)}</small>` : ''}
            </td>
            <td><strong style="color: var(--color-success);">${r.price ? r.price + ' KM' : '-'}</strong></td>
            <td><span class="status-badge ${r.status}">${getStatusText(r.status)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view-reservation-btn" data-id="${r.id}" title="Pregled">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="action-btn delete delete-reservation-btn" data-id="${r.id}" title="Obriši">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.view-reservation-btn').forEach(btn => {
        btn.addEventListener('click', () => showReservation(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.delete-reservation-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteReservation(parseInt(btn.dataset.id)));
    });
}

// Make showReservation global for calendar clicks
window.showReservation = function(id) {
    // Koristi već učitane rezervacije iz API-ja
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    
    selectedReservationId = id;
    
    const details = document.getElementById('reservationDetails');
    const createdDate = reservation.createdAt ? new Date(reservation.createdAt).toLocaleString('sr-Latn-BA') : '-';
    
    details.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">ID rezervacije</span>
            <span class="detail-value">#${reservation.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Ime gosta</span>
            <span class="detail-value">${reservation.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Broj osoba</span>
            <span class="detail-value">${reservation.guests || 1}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${reservation.email || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Telefon</span>
            <span class="detail-value">${reservation.phone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Usluga</span>
            <span class="detail-value">${reservation.serviceName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cijena</span>
            <span class="detail-value">${reservation.servicePrice || '-'} KM</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Datum</span>
            <span class="detail-value">${formatDate(reservation.date)}</span>
        </div>
        ${reservation.timeSlotTime ? `
        <div class="detail-row">
            <span class="detail-label">Termin</span>
            <span class="detail-value">${reservation.timeSlotTime}h</span>
        </div>
        ` : ''}
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge ${reservation.status}">${getStatusText(reservation.status)}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Primljeno</span>
            <span class="detail-value">${createdDate}</span>
        </div>
        ${reservation.message ? `
        <div class="detail-row" style="flex-direction: column; gap: 0.5rem;">
            <span class="detail-label">Poruka</span>
            <span class="detail-value" style="font-weight: 400;">${reservation.message}</span>
        </div>
        ` : ''}
    `;
    
    // Show/hide buttons based on status
    const confirmBtn = document.getElementById('confirmReservationBtn');
    const cancelBtn = document.getElementById('cancelReservationBtn');
    
    confirmBtn.style.display = reservation.status === 'pending' ? 'block' : 'none';
    cancelBtn.style.display = reservation.status !== 'cancelled' ? 'block' : 'none';
    
    reservationModal.classList.add('active');
};

async function deleteReservation(id) {
    if (confirm('Da li ste sigurni da želite obrisati ovu rezervaciju?')) {
        try {
            await window.RancAPI.deleteReservation(id);
        } catch (error) {
            console.error('Error deleting reservation:', error);
        }
        reservations = reservations.filter(r => r.id !== id);
        saveReservations();
        renderReservations();
        renderCalendar();
        updateDashboard();
    }
}

document.getElementById('closeReservationModal').addEventListener('click', () => {
    reservationModal.classList.remove('active');
});

document.getElementById('confirmReservationBtn').addEventListener('click', async () => {
    if (selectedReservationId) {
        const reservation = reservations.find(r => r.id === selectedReservationId);
        if (reservation) {
            try {
                await window.RancAPI.updateReservation(selectedReservationId, { status: 'confirmed' });
            } catch (error) {
                console.error('Error updating reservation:', error);
            }
            reservation.status = 'confirmed';
            saveReservations();
            reservationModal.classList.remove('active');
            renderReservations();
            renderCalendar();
            updateDashboard();
        }
    }
});

document.getElementById('cancelReservationBtn').addEventListener('click', async () => {
    if (selectedReservationId) {
        const reservation = reservations.find(r => r.id === selectedReservationId);
        if (reservation) {
            try {
                await window.RancAPI.updateReservation(selectedReservationId, { status: 'cancelled' });
            } catch (error) {
                console.error('Error updating reservation:', error);
            }
            reservation.status = 'cancelled';
            saveReservations();
            reservationModal.classList.remove('active');
            renderReservations();
            renderCalendar();
            updateDashboard();
        }
    }
});

// Filters
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('serviceFilter').addEventListener('change', applyFilters);

function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const service = document.getElementById('serviceFilter').value;
    renderReservations({ status, service });
}

// Add Reservation Modal
const addReservationModal = document.getElementById('addReservationModal');

document.getElementById('closeAddReservationModal').addEventListener('click', () => {
    addReservationModal.classList.remove('active');
});

document.getElementById('cancelAddReservationBtn').addEventListener('click', () => {
    addReservationModal.classList.remove('active');
});

document.getElementById('addReservationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const serviceId = parseInt(document.getElementById('reservationService').value);
    const service = services.find(s => s.id === serviceId);
    
    const startDate = document.getElementById('reservationStartDate').value;
    const endDate = document.getElementById('reservationEndDate').value;
    
    // Validate that end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
        alert('Datum kraja mora biti nakon datuma početka!');
        return;
    }
    
    // Izračunaj broj noćenja za usluge prenoćišta
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    
    // Izračunaj ukupnu cijenu
    let totalPrice = service.price;
    if (service.name.toLowerCase().includes('prenoćište') || service.name.toLowerCase().includes('jahanje + prenoćište')) {
        totalPrice = service.price * nights;
    }
    
    const newReservation = {
        id: Math.max(...reservations.map(r => r.id), 1000) + 1,
        name: document.getElementById('reservationName').value,
        email: document.getElementById('reservationEmail').value || '',
        phone: document.getElementById('reservationPhone').value || '',
        service: service.name.toLowerCase().replace(/\s+/g, '-'),
        serviceName: service.name,
        date: startDate,
        startDate: startDate,
        endDate: endDate,
        nights: nights,
        price: totalPrice,
        status: document.getElementById('reservationStatus').value,
        message: document.getElementById('reservationMessage').value || ''
    };
    
    reservations.push(newReservation);
    saveReservations();
    
    addReservationModal.classList.remove('active');
    renderCalendar();
    renderReservations();
    updateDashboard();
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sr-Latn-BA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function getStatusText(status) {
    const texts = {
        pending: 'Na čekanju',
        confirmed: 'Potvrđeno',
        cancelled: 'Otkazano'
    };
    return texts[status] || status;
}

function getMonthShort(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    return months[month];
}

// Close modals on outside click
[serviceModal, reservationModal, imageModal, addReservationModal].forEach(modal => {
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        serviceModal.classList.remove('active');
        reservationModal.classList.remove('active');
        if (imageModal) imageModal.classList.remove('active');
        if (addReservationModal) addReservationModal.classList.remove('active');
    }
});

// ============================================
// GALLERY (GALERIJA)
// ============================================
// galleryImages se učitava iz API-ja u loadAllData()
const defaultGalleryImages = [
    {
        id: 1,
        src: 'img/image00001.jpg',
        title: 'Jahanje na zalasku sunca',
        alt: 'Dvoje jahača na konjima pri zalasku sunca',
        category: 'jahanje',
        visible: true
    },
    {
        id: 2,
        src: 'img/image00002.jpg',
        title: 'Panoramsko jahanje',
        alt: 'Jahačica uživa u panoramskom pogledu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 3,
        src: 'img/image00003.jpg',
        title: 'Mir sa konjem',
        alt: 'Čovjek sjedi u travi pored konja',
        category: 'jahanje',
        visible: true
    },
    {
        id: 4,
        src: 'img/image00004.jpg',
        title: 'Logorska vatra',
        alt: 'Logorska vatra sa pogledom na planine',
        category: 'priroda',
        visible: true
    },
    {
        id: 5,
        src: 'img/image00005.jpg',
        title: 'Grupno jahanje',
        alt: 'Grupa jahača na izletu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 6,
        src: 'img/image00006.jpg',
        title: 'Tura kroz prirodu',
        alt: 'Jahači prolaze kroz zelenu prirodu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 7,
        src: 'img/image00007.jpg',
        title: 'A-frame bungalov - pogled',
        alt: 'Unutrašnjost A-frame bungalova sa pogledom',
        category: 'smjestaj',
        visible: true
    },
    {
        id: 8,
        src: 'img/image00008.jpg',
        title: 'A-frame bungalov - spavaća',
        alt: 'Rustična spavaća soba u A-frame bungalovu',
        category: 'smjestaj',
        visible: true
    },
    {
        id: 9,
        src: 'img/image00009.jpg',
        title: 'Bungalov iznad oblaka',
        alt: 'A-frame bungalov sa pogledom iznad oblaka',
        category: 'smjestaj',
        visible: true
    },
    {
        id: 10,
        src: 'img/image000010.jpg',
        title: 'Domaća pita ispod sača',
        alt: 'Tradicionalna bosanska pita ispod sača',
        category: 'hrana',
        visible: true
    },
    {
        id: 11,
        src: 'img/image00011.jpeg',
        title: 'Ranč Lipanj',
        alt: 'Pogled na ranč Lipanj',
        category: 'priroda',
        visible: true
    },
    {
        id: 12,
        src: 'img/image00012.jpeg',
        title: 'Konji na ranču',
        alt: 'Konji na ranču Lipanj',
        category: 'jahanje',
        visible: true
    },
    {
        id: 13,
        src: 'img/image00013.jpeg',
        title: 'Planinski pejzaž',
        alt: 'Planinski pejzaž u okolini ranča',
        category: 'priroda',
        visible: true
    },
    {
        id: 14,
        src: 'img/image00014.jpeg',
        title: 'Jahanje kroz šumu',
        alt: 'Jahanje kroz šumu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 15,
        src: 'img/image00015.jpeg',
        title: 'Panorama ranča',
        alt: 'Panoramski pogled na ranč',
        category: 'priroda',
        visible: true
    },
    {
        id: 16,
        src: 'img/image00016.jpeg',
        title: 'Konji na ispaši',
        alt: 'Konji na ispaši',
        category: 'jahanje',
        visible: true
    },
    {
        id: 17,
        src: 'img/image00017.jpeg',
        title: 'Zalazak sunca',
        alt: 'Zalazak sunca na ranču',
        category: 'priroda',
        visible: true
    },
    {
        id: 18,
        src: 'img/image00018.jpeg',
        title: 'Ranč u prirodi',
        alt: 'Ranč okružen prirodom',
        category: 'priroda',
        visible: true
    },
    {
        id: 19,
        src: 'img/image00019.jpeg',
        title: 'Avantura na konjima',
        alt: 'Avanturistički izlet na konjima',
        category: 'jahanje',
        visible: true
    },
    {
        id: 20,
        src: 'img/image00020.jpeg',
        title: 'Planinska staza',
        alt: 'Planinska staza za jahanje',
        category: 'jahanje',
        visible: true
    },
    {
        id: 21,
        src: 'img/image00021.jpeg',
        title: 'Prirodni ambijent',
        alt: 'Prirodni ambijent ranča',
        category: 'priroda',
        visible: true
    },
    {
        id: 22,
        src: 'img/image00022.jpeg',
        title: 'Ranč Lipanj pogled',
        alt: 'Pogled sa ranča Lipanj',
        category: 'priroda',
        visible: true
    },
    {
        id: 23,
        src: 'img/image00023.jpeg',
        title: 'Jahači na turi',
        alt: 'Jahači na turi kroz prirodu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 24,
        src: 'img/image00024.jpeg',
        title: 'Bungalov spolja',
        alt: 'Eksterijer A-frame bungalova',
        category: 'smjestaj',
        visible: true
    },
    {
        id: 25,
        src: 'img/image00025.jpeg',
        title: 'Pogled sa terena',
        alt: 'Pogled sa terena ranča',
        category: 'priroda',
        visible: true
    },
    {
        id: 26,
        src: 'img/image00026.jpeg',
        title: 'Konji u prirodi',
        alt: 'Konji u prirodnom okruženju',
        category: 'jahanje',
        visible: true
    },
    {
        id: 27,
        src: 'img/image00027.jpeg',
        title: 'Planinska priroda',
        alt: 'Planinska priroda oko ranča',
        category: 'priroda',
        visible: true
    },
    {
        id: 28,
        src: 'img/image00028.jpeg',
        title: 'Ranč iz daljine',
        alt: 'Ranč Lipanj iz daljine',
        category: 'priroda',
        visible: true
    },
    {
        id: 30,
        src: 'img/image00030.jpeg',
        title: 'Jezero u blizini',
        alt: 'Jezero u blizini ranča',
        category: 'priroda',
        visible: true
    },
    {
        id: 32,
        src: 'img/image00032.jpeg',
        title: 'Šumska staza',
        alt: 'Staza kroz šumu',
        category: 'priroda',
        visible: true
    },
    {
        id: 33,
        src: 'img/image00033.jpeg',
        title: 'Konj na livadi',
        alt: 'Konj na livadi',
        category: 'jahanje',
        visible: true
    },
    {
        id: 34,
        src: 'img/image00034.jpeg',
        title: 'Planinski vrh',
        alt: 'Pogled na planinski vrh',
        category: 'priroda',
        visible: true
    },
    {
        id: 35,
        src: 'img/image00035.jpeg',
        title: 'Izlet na konjima',
        alt: 'Izlet na konjima kroz prirodu',
        category: 'jahanje',
        visible: true
    },
    {
        id: 36,
        src: 'img/image00036.jpeg',
        title: 'Ranč Lipanj ljeto',
        alt: 'Ranč Lipanj ljeti',
        category: 'priroda',
        visible: true
    },
    {
        id: 37,
        src: 'img/image00037.jpeg',
        title: 'Domaćinstvo',
        alt: 'Domaćinstvo na ranču',
        category: 'hrana',
        visible: true
    },
    {
        id: 38,
        src: 'img/image00038.jpeg',
        title: 'Jahanje pri zalasku',
        alt: 'Jahanje pri zalasku sunca',
        category: 'jahanje',
        visible: true
    },
    {
        id: 39,
        src: 'img/image00039.jpeg',
        title: 'Ranč panorama',
        alt: 'Panoramski pogled na ranč',
        category: 'priroda',
        visible: true
    },
    {
        id: 40,
        src: 'img/image00040.jpeg',
        title: 'Priroda i konji',
        alt: 'Konji u prekrasnoj prirodi',
        category: 'jahanje',
        visible: true
    }
];

let editingImageId = null;

function renderGallery() {
    const grid = document.getElementById('adminGalleryGrid');
    
    if (galleryImages.length === 0) {
        grid.innerHTML = `
            <div class="empty-gallery" style="grid-column: 1 / -1;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <h3>Nema slika u galeriji</h3>
                <p>Dodajte prvu sliku da biste započeli sa galerijom</p>
                <button class="btn btn-primary" onclick="document.getElementById('addImageBtn').click()">
                    Dodaj prvu sliku
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = galleryImages.map(img => `
        <div class="gallery-card" data-id="${img.id}">
            <div class="gallery-card-image">
                <img src="${img.src}" alt="${img.alt}">
                <div class="gallery-card-overlay">
                    <button class="action-btn edit-image-btn" data-id="${img.id}" title="Uredi">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="action-btn delete delete-image-btn" data-id="${img.id}" title="Obriši">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="gallery-card-content">
                <h4>${img.title || 'Bez naslova'}</h4>
                <div class="gallery-card-meta">
                    <span class="gallery-card-category">${img.category}</span>
                    <span class="gallery-card-status">
                        <span class="status-dot ${img.visible ? 'visible' : 'hidden'}"></span>
                        ${img.visible ? 'Vidljiva' : 'Skrivena'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.edit-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editImage(parseInt(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.delete-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteImage(parseInt(btn.dataset.id));
        });
    });
}

// Add Image Button
document.getElementById('addImageBtn').addEventListener('click', () => {
    editingImageId = null;
    document.getElementById('imageModalTitle').textContent = 'Dodaj novu sliku';
    document.getElementById('imageForm').reset();
    document.getElementById('imagePreview').classList.remove('show');
    document.getElementById('imagePreview').src = '';
    document.getElementById('imageUploadArea').classList.remove('has-image');
    document.getElementById('imageVisible').checked = true;
    imageModal.classList.add('active');
});

function editImage(id) {
    const image = galleryImages.find(img => img.id === id);
    if (!image) return;
    
    editingImageId = id;
    document.getElementById('imageModalTitle').textContent = 'Uredi sliku';
    document.getElementById('imageTitle').value = image.title || '';
    document.getElementById('imageAlt').value = image.alt || '';
    document.getElementById('imageCategory').value = image.category || 'ostalo';
    document.getElementById('imageVisible').checked = image.visible;
    
    // Show preview
    document.getElementById('imagePreview').src = image.src;
    document.getElementById('imagePreview').classList.add('show');
    document.getElementById('imageUploadArea').classList.add('has-image');
    
    imageModal.classList.add('active');
}

function deleteImage(id) {
    if (confirm('Da li ste sigurni da želite obrisati ovu sliku?')) {
        galleryImages = galleryImages.filter(img => img.id !== id);
        renderGallery();
    }
}

// Image Upload Area
const imageUploadArea = document.getElementById('imageUploadArea');
const imageFileInput = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');

imageUploadArea.addEventListener('click', () => {
    imageFileInput.click();
});

imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('dragover');
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.classList.remove('dragover');
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
    }
});

imageFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

function handleImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        alert('Slika je prevelika. Maksimalna veličina je 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.add('show');
        imageUploadArea.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// Image Form Submit
document.getElementById('imageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const imageData = {
        title: document.getElementById('imageTitle').value,
        alt: document.getElementById('imageAlt').value,
        category: document.getElementById('imageCategory').value,
        visible: document.getElementById('imageVisible').checked
    };
    
    if (editingImageId) {
        // Update existing
        const index = galleryImages.findIndex(img => img.id === editingImageId);
        if (index !== -1) {
            galleryImages[index] = { ...galleryImages[index], ...imageData };
            
            // If new image was uploaded
            if (imagePreview.src && !imagePreview.src.startsWith('img/')) {
                galleryImages[index].src = imagePreview.src;
            }
        }
    } else {
        // Add new
        if (!imagePreview.src || imagePreview.src === window.location.href) {
            alert('Molimo odaberite sliku.');
            return;
        }
        
        const newId = Math.max(...galleryImages.map(img => img.id), 0) + 1;
        galleryImages.push({
            id: newId,
            src: imagePreview.src,
            ...imageData
        });
    }
    
    imageModal.classList.remove('active');
    renderGallery();
});

document.getElementById('closeImageModal').addEventListener('click', () => {
    imageModal.classList.remove('active');
});

document.getElementById('cancelImageBtn').addEventListener('click', () => {
    imageModal.classList.remove('active');
});

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Učitaj sve podatke iz API-ja
    await loadAllData();
    
    updateDashboard();
    renderServices();
    renderCalendar();
    renderReservations();
    renderGallery();
});


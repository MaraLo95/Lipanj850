/* ============================================
   RANČ LIPANJ 850 - Booking Page JavaScript
   ============================================ */

// ============================================
// API FUNCTIONS (koristi RancAPI iz api.js)
// ============================================

// Cache za termine i rezervacije
let cachedRidingSlots = [];
let cachedReservations = [];

// Učitaj termine jahanja
async function loadRidingSlots() {
    try {
        cachedRidingSlots = await window.RancAPI.getRidingSlots();
    } catch (error) {
        console.error('Error loading riding slots:', error);
        cachedRidingSlots = JSON.parse(localStorage.getItem('ranc_riding_slots')) || [];
    }
    return cachedRidingSlots;
}

// Učitaj sve rezervacije
async function loadReservations() {
    try {
        cachedReservations = await window.RancAPI.getReservations();
    } catch (error) {
        console.error('Error loading reservations:', error);
        cachedReservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
    }
    return cachedReservations;
}

// Sinkrone verzije za kompatibilnost
function getRidingSlots() {
    return cachedRidingSlots;
}

function getReservations() {
    return cachedReservations;
}

// Sačuvaj novu rezervaciju
async function saveReservation(reservation) {
    try {
        // Pripremi podatke za API
        const apiReservation = {
            name: reservation.name,
            email: reservation.email || '',
            phone: reservation.phone,
            guests: reservation.guests || 1,
            message: reservation.message || '',
            service_id: reservation.serviceId,
            service_name: reservation.serviceName,
            service_price: reservation.servicePrice,
            date: reservation.date,
            end_date: reservation.endDate || null,
            time_slot_id: reservation.timeSlotId || null,
            time_slot_time: reservation.timeSlotTime || null,
            status: reservation.status || 'pending'
        };
        
        const saved = await window.RancAPI.createReservation(apiReservation);
        cachedReservations.push(saved);
        return saved;
    } catch (error) {
        console.error('Error saving reservation:', error);
        // Fallback to localStorage
        const reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        reservation.id = Date.now();
        reservation.createdAt = new Date().toISOString();
        reservations.push(reservation);
        localStorage.setItem('ranc_reservations', JSON.stringify(reservations));
        return reservation;
    }
}

// Provjeri da li je datum zauzet za noćenje (usluge 2 i 3)
function isAccommodationBooked(dateStr) {
    const reservations = getReservations();
    // Provjeri potvrđene i pending rezervacije za noćenje
    return reservations.some(r => 
        r.date === dateStr && 
        (r.serviceId === '2' || r.serviceId === '3' || r.serviceId === 2 || r.serviceId === 3) &&
        (r.status === 'confirmed' || r.status === 'pending')
    );
}

// Dobij dostupnost za određeni datum i uslugu
function getAvailability(dateStr, serviceId) {
    const ridingSlots = getRidingSlots();
    const reservations = getReservations();
    
    // Za rekreativno jahanje (id=1) - prikazuj samo datume koje je admin unio
    if (serviceId === '1' || serviceId === 1) {
        const daySlots = ridingSlots.filter(s => s.date === dateStr);
        if (daySlots.length === 0) {
            return { available: 0, booked: 0, noSlots: true };
        }
        
        // Prebroj koliko je rezervacija za ovaj datum za jahanje
        const bookedCount = reservations.filter(r => 
            r.date === dateStr && 
            (r.serviceId === '1' || r.serviceId === 1) &&
            (r.status === 'confirmed' || r.status === 'pending')
        ).reduce((sum, r) => sum + (parseInt(r.guests) || 1), 0);
        
        const totalSlots = daySlots.reduce((sum, s) => sum + s.slots, 0);
        const available = Math.max(0, totalSlots - bookedCount);
        
        return { available: available, booked: bookedCount, slots: daySlots };
    }
    
    // Za Jahanje + Prenoćište (id=2) i Prenoćište (id=3) - provjeri da li je datum zauzet
    if (serviceId === '2' || serviceId === '3' || serviceId === 2 || serviceId === 3) {
        if (isAccommodationBooked(dateStr)) {
            return { available: 0, booked: 1, isBooked: true };
        }
        return { available: 1, booked: 0 };
    }
    
    return { available: 3, booked: 0 };
}

// State
let currentDate = new Date();
let selectedService = null;
let selectedDate = null;
let selectedTimeSlot = null; // { id, time, slots }

// DOM Elements
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthEl = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const serviceOptions = document.querySelectorAll('input[name="selectedService"]');
const bookingForm = document.getElementById('bookingForm');
const selectedInfoEl = document.getElementById('selectedInfo');
const successModal = document.getElementById('successModal');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Učitaj podatke iz API-ja
    await Promise.all([loadRidingSlots(), loadReservations()]);
    
    renderCalendar();
    setupEventListeners();
    setupNavigation();
});

// Setup navigation (hamburger menu)
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Service selection
    serviceOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            selectedService = {
                id: e.target.value,
                name: e.target.dataset.name,
                price: parseInt(e.target.dataset.price),
                duration: e.target.dataset.duration
            };
            
            // Reset selected date and time slot when changing service
            selectedDate = null;
            selectedTimeSlot = null;
            
            // Hide time slots
            hideTimeSlots();
            
            updateSelectedInfo();
            enableFormIfReady();
            
            // Re-render calendar with new availability
            renderCalendar();
        });
    });
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Form submission
    bookingForm.addEventListener('submit', handleFormSubmit);
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 
                        'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get starting day (0 = Sunday, adjust for Monday start)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;
    
    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '';
    let dayCount = 1;
    let nextMonthDay = 1;
    
    // Calculate total cells needed (6 rows max)
    const totalCells = Math.ceil((startingDay + totalDays) / 7) * 7;
    
    // Determine which service is selected
    const serviceId = selectedService ? selectedService.id : null;
    
    for (let i = 0; i < totalCells; i++) {
        let dayNumber, isOtherMonth = false, dateStr, dateObj;
        
        if (i < startingDay) {
            // Previous month
            dayNumber = prevMonthLastDay - startingDay + i + 1;
            isOtherMonth = true;
            dateObj = new Date(year, month - 1, dayNumber);
            dateStr = formatDateISO(dateObj);
        } else if (dayCount > totalDays) {
            // Next month
            dayNumber = nextMonthDay++;
            isOtherMonth = true;
            dateObj = new Date(year, month + 1, dayNumber);
            dateStr = formatDateISO(dateObj);
        } else {
            // Current month
            dayNumber = dayCount++;
            dateObj = new Date(year, month, dayNumber);
            dateStr = formatDateISO(dateObj);
        }
        
        const isPast = dateObj < today;
        const isToday = dateObj.getTime() === today.getTime();
        const isSelected = selectedDate === dateStr;
        
        // Get availability based on selected service
        let availabilityClass = '';
        let tooltipText = '';
        
        if (!isOtherMonth && !isPast) {
            if (serviceId) {
                const dayAvailability = getAvailability(dateStr, serviceId);
                
                if (dayAvailability.noSlots) {
                    // Nema unetih termina za ovaj datum
                    availabilityClass = 'unavailable';
                    tooltipText = 'Nema termina';
                } else if (dayAvailability.available >= 2) {
                    availabilityClass = 'available';
                    if (serviceId === '1' || serviceId === 1) {
                        tooltipText = `${dayAvailability.available} mjesta`;
                    }
                } else if (dayAvailability.available === 1) {
                    availabilityClass = 'limited';
                    tooltipText = '1 mjesto';
                } else {
                    availabilityClass = 'unavailable';
                    tooltipText = 'Popunjeno';
                }
            } else {
                // Ako nije odabrana usluga, prikaži neutralno
                availabilityClass = '';
            }
        }
        
        const classes = [
            'cal-day',
            isOtherMonth ? 'other-month' : '',
            isPast && !isOtherMonth ? 'past' : '',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            availabilityClass
        ].filter(Boolean).join(' ');
        
        const isClickable = !isOtherMonth && !isPast && availabilityClass !== 'unavailable' && serviceId;
        
        html += `
            <div class="${classes}" 
                 data-date="${dateStr}" 
                 ${tooltipText ? `title="${tooltipText}"` : ''}
                 ${isClickable ? 'onclick="selectDate(\'' + dateStr + '\')"' : ''}>
                ${dayNumber}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = html;
    
    // Show message if no service selected
    updateCalendarMessage();
}

function updateCalendarMessage() {
    const existingMsg = document.querySelector('.calendar-message');
    if (existingMsg) existingMsg.remove();
    
    if (!selectedService) {
        const msg = document.createElement('div');
        msg.className = 'calendar-message';
        msg.innerHTML = '<p>Prvo odaberite uslugu da biste vidjeli dostupne termine</p>';
        document.querySelector('.calendar-wrapper').appendChild(msg);
    } else if (selectedService.id === '1' || selectedService.id === 1) {
        // Check if there are any riding slots
        const ridingSlots = getRidingSlots();
        if (ridingSlots.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'calendar-message warning';
            msg.innerHTML = '<p>Trenutno nema dostupnih termina za jahanje. Molimo kontaktirajte nas telefonom.</p>';
            document.querySelector('.calendar-wrapper').appendChild(msg);
        }
    }
}

// Select date
window.selectDate = function(dateStr) {
    if (!selectedService) return;
    
    // Check if date is available
    const dayAvailability = getAvailability(dateStr, selectedService.id);
    if (dayAvailability.available === 0 || dayAvailability.noSlots || dayAvailability.isBooked) {
        return; // Can't select unavailable date
    }
    
    selectedDate = dateStr;
    selectedTimeSlot = null; // Reset time slot when changing date
    
    // Update calendar UI
    document.querySelectorAll('.cal-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateStr) {
            day.classList.add('selected');
        }
    });
    
    // Show time slots if it's "Rekreativno jahanje"
    if (selectedService.id === '1' || selectedService.id === 1) {
        showTimeSlots(dateStr);
    } else {
        hideTimeSlots();
    }
    
    updateSelectedInfo();
    enableFormIfReady();
};

// Show available time slots for a date
function showTimeSlots(dateStr) {
    const ridingSlots = getRidingSlots();
    const reservations = getReservations();
    const daySlots = ridingSlots.filter(s => s.date === dateStr);
    
    const wrapper = document.getElementById('timeSlotsWrapper');
    const container = document.getElementById('timeSlots');
    
    if (daySlots.length === 0) {
        wrapper.style.display = 'none';
        return;
    }
    
    // Sort by time
    daySlots.sort((a, b) => a.time.localeCompare(b.time));
    
    let html = '';
    
    if (daySlots.length === 1) {
        // Samo jedan termin - automatski ga odaberi
        const slot = daySlots[0];
        const bookedCount = reservations.filter(r => 
            r.date === dateStr && 
            r.timeSlotId === slot.id &&
            (r.status === 'confirmed' || r.status === 'pending')
        ).reduce((sum, r) => sum + (parseInt(r.guests) || 1), 0);
        
        const available = Math.max(0, slot.slots - bookedCount);
        
        if (available > 0) {
            selectedTimeSlot = slot;
            document.getElementById('bookingTimeSlot').value = slot.id;
        }
        
        wrapper.style.display = 'none';
        updateSelectedInfo();
        enableFormIfReady();
        return;
    }
    
    // Više termina - prikaži opcije
    daySlots.forEach(slot => {
        // Prebroj koliko je rezervacija za ovaj termin
        const bookedCount = reservations.filter(r => 
            r.date === dateStr && 
            r.timeSlotId === slot.id &&
            (r.status === 'confirmed' || r.status === 'pending')
        ).reduce((sum, r) => sum + (parseInt(r.guests) || 1), 0);
        
        const available = Math.max(0, slot.slots - bookedCount);
        const isUnavailable = available === 0;
        
        html += `
            <div class="time-slot ${isUnavailable ? 'unavailable' : ''}" 
                 data-slot-id="${slot.id}"
                 data-slot-time="${slot.time}"
                 data-slot-available="${available}"
                 ${!isUnavailable ? `onclick="selectTimeSlot(${slot.id}, '${slot.time}', ${slot.slots})"` : ''}>
                <span class="slot-time">${formatTime(slot.time)}</span>
                <span class="slot-available">${isUnavailable ? 'Popunjeno' : available + ' mjesta'}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    wrapper.style.display = 'block';
}

// Hide time slots
function hideTimeSlots() {
    const wrapper = document.getElementById('timeSlotsWrapper');
    if (wrapper) {
        wrapper.style.display = 'none';
    }
    selectedTimeSlot = null;
    document.getElementById('bookingTimeSlot').value = '';
}

// Select time slot
window.selectTimeSlot = function(slotId, slotTime, slotCapacity) {
    selectedTimeSlot = { id: slotId, time: slotTime, slots: slotCapacity };
    document.getElementById('bookingTimeSlot').value = slotId;
    
    // Update UI
    document.querySelectorAll('.time-slot').forEach(el => {
        el.classList.remove('selected');
        if (parseInt(el.dataset.slotId) === slotId) {
            el.classList.add('selected');
        }
    });
    
    updateSelectedInfo();
    enableFormIfReady();
};

// Format time for display (24h to readable)
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}h`;
}

// Update selected info display
function updateSelectedInfo() {
    if (!selectedService && !selectedDate) {
        selectedInfoEl.innerHTML = '<p class="no-selection">Molimo odaberite uslugu i datum iz kalendara</p>';
        selectedInfoEl.classList.remove('active');
        return;
    }
    
    let html = '<div class="selection-details">';
    
    if (selectedService) {
        html += `
            <div class="selection-row">
                <span class="selection-label">Usluga:</span>
                <span class="selection-value">${selectedService.name}</span>
            </div>
            <div class="selection-row">
                <span class="selection-label">Trajanje:</span>
                <span class="selection-value">${selectedService.duration}</span>
            </div>
        `;
    }
    
    if (selectedDate) {
        html += `
            <div class="selection-row">
                <span class="selection-label">Datum:</span>
                <span class="selection-value">${formatDateDisplay(selectedDate)}</span>
            </div>
        `;
    }
    
    // Prikaži vrijeme termina ako je odabrano (za jahanje)
    if (selectedTimeSlot && (selectedService.id === '1' || selectedService.id === 1)) {
        html += `
            <div class="selection-row">
                <span class="selection-label">Termin:</span>
                <span class="selection-value">${formatTime(selectedTimeSlot.time)}</span>
            </div>
        `;
    }
    
    if (selectedService) {
        html += `
            <div class="selection-row selection-total">
                <span class="selection-label">Cijena:</span>
                <span class="selection-value">${selectedService.price} KM</span>
            </div>
        `;
    }
    
    html += '</div>';
    
    selectedInfoEl.innerHTML = html;
    selectedInfoEl.classList.add('active');
    
    // Update hidden form fields
    if (selectedService) {
        document.getElementById('bookingService').value = selectedService.name;
    }
    if (selectedDate) {
        document.getElementById('bookingDate').value = selectedDate;
    }
}

// Enable form when service and date are selected
function enableFormIfReady() {
    const formInputs = bookingForm.querySelectorAll('input, textarea');
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    
    // Za rekreativno jahanje, potreban je i odabir termina
    const needsTimeSlot = selectedService && (selectedService.id === '1' || selectedService.id === 1);
    const hasRequiredTimeSlot = !needsTimeSlot || selectedTimeSlot;
    
    if (selectedService && selectedDate && hasRequiredTimeSlot) {
        formInputs.forEach(input => {
            if (input.type !== 'hidden') {
                input.disabled = false;
            }
        });
        submitBtn.disabled = false;
    } else {
        formInputs.forEach(input => {
            if (input.type !== 'hidden') {
                input.disabled = true;
            }
        });
        submitBtn.disabled = true;
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('bookingName').value.trim();
    const phone = document.getElementById('bookingPhone').value.trim();
    const guests = document.getElementById('bookingGuests').value;
    
    // Validacija obaveznih polja
    if (!name) {
        alert('Molimo unesite ime i prezime.');
        return;
    }
    if (!phone) {
        alert('Molimo unesite broj telefona.');
        return;
    }
    if (!guests || guests < 1) {
        alert('Molimo unesite broj osoba.');
        return;
    }
    
    // Disable submit button
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Šaljem...</span>';
    
    // Kreiraj rezervaciju
    const reservation = {
        id: Date.now(),
        name: name,
        email: document.getElementById('bookingEmail').value.trim() || '',
        phone: phone,
        guests: parseInt(guests),
        message: document.getElementById('bookingMessage').value.trim() || '',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: selectedDate,
        timeSlotId: selectedTimeSlot ? selectedTimeSlot.id : null,
        timeSlotTime: selectedTimeSlot ? selectedTimeSlot.time : null,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    try {
        // Sačuvaj rezervaciju putem API-ja
        await saveReservation(reservation);
        
        console.log('Reservation saved:', reservation);
        
        // Show success modal
        successModal.classList.add('active');
        
        // Reset form
        bookingForm.reset();
        selectedService = null;
        selectedDate = null;
        selectedTimeSlot = null;
        
        // Uncheck service options
        serviceOptions.forEach(option => option.checked = false);
        
        // Hide time slots
        hideTimeSlots();
        
        // Reload data and update UI
        await loadReservations();
        updateSelectedInfo();
        enableFormIfReady();
        renderCalendar();
    } catch (error) {
        console.error('Error saving reservation:', error);
        alert('Greška pri slanju rezervacije. Molimo pokušajte ponovo.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Pošalji rezervaciju</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    }
}

// Close success modal
window.closeSuccessModal = function() {
    successModal.classList.remove('active');
};

// Helper functions
function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('sr-Latn-BA', options);
}



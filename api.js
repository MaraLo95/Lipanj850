/* ============================================
   RANČ LIPANJ 850 - API Client
   Koristi se za komunikaciju sa backendom
   ============================================ */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://localhost:3000/api` 
    : '/api';

// ============================================
// REZERVACIJE
// ============================================

async function getReservations(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.service) params.append('service', filters.service);
        
        const response = await fetch(`${API_BASE}/reservations?${params}`);
        if (!response.ok) throw new Error('Greška pri dohvatanju rezervacija');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('ranc_reservations')) || [];
    }
}

async function getReservation(id) {
    try {
        const response = await fetch(`${API_BASE}/reservations/${id}`);
        if (!response.ok) throw new Error('Rezervacija nije pronađena');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        const reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        return reservations.find(r => r.id === id);
    }
}

async function createReservation(reservation) {
    try {
        const response = await fetch(`${API_BASE}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        });
        if (!response.ok) throw new Error('Greška pri kreiranju rezervacije');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback: save to localStorage
        const reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        reservation.id = Date.now();
        reservation.created_at = new Date().toISOString();
        reservations.push(reservation);
        localStorage.setItem('ranc_reservations', JSON.stringify(reservations));
        return reservation;
    }
}

async function updateReservation(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/reservations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Greška pri ažuriranju rezervacije');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        const reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        const index = reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            reservations[index] = { ...reservations[index], ...updates };
            localStorage.setItem('ranc_reservations', JSON.stringify(reservations));
            return reservations[index];
        }
        throw error;
    }
}

async function deleteReservation(id) {
    try {
        const response = await fetch(`${API_BASE}/reservations/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Greška pri brisanju rezervacije');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        let reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        reservations = reservations.filter(r => r.id !== id);
        localStorage.setItem('ranc_reservations', JSON.stringify(reservations));
        return { success: true };
    }
}

// ============================================
// TERMINI JAHANJA
// ============================================

async function getRidingSlots(date = null) {
    try {
        const params = date ? `?date=${date}` : '';
        const response = await fetch(`${API_BASE}/riding-slots${params}`);
        if (!response.ok) throw new Error('Greška pri dohvatanju termina');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        const slots = JSON.parse(localStorage.getItem('ranc_riding_slots')) || [];
        return date ? slots.filter(s => s.date === date) : slots;
    }
}

async function createRidingSlot(slot) {
    try {
        const response = await fetch(`${API_BASE}/riding-slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slot)
        });
        if (!response.ok) throw new Error('Greška pri kreiranju termina');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        const slots = JSON.parse(localStorage.getItem('ranc_riding_slots')) || [];
        slot.id = Date.now();
        slots.push(slot);
        localStorage.setItem('ranc_riding_slots', JSON.stringify(slots));
        return slot;
    }
}

async function deleteRidingSlot(id) {
    try {
        const response = await fetch(`${API_BASE}/riding-slots/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Greška pri brisanju termina');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage
        let slots = JSON.parse(localStorage.getItem('ranc_riding_slots')) || [];
        slots = slots.filter(s => s.id !== id);
        localStorage.setItem('ranc_riding_slots', JSON.stringify(slots));
        return { success: true };
    }
}

// ============================================
// GALERIJA
// ============================================

async function getImages(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.visible !== undefined) params.append('visible', filters.visible);
        
        const response = await fetch(`${API_BASE}/images?${params}`);
        if (!response.ok) throw new Error('Greška pri dohvatanju slika');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Return empty array as there's no localStorage fallback for images
        return [];
    }
}

async function uploadImage(formData) {
    try {
        const response = await fetch(`${API_BASE}/images`, {
            method: 'POST',
            body: formData // FormData for file upload
        });
        if (!response.ok) throw new Error('Greška pri uploadu slike');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function updateImage(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/images/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Greška pri ažuriranju slike');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function deleteImage(id) {
    try {
        const response = await fetch(`${API_BASE}/images/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Greška pri brisanju slike');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// USLUGE
// ============================================

async function getServices() {
    try {
        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) throw new Error('Greška pri dohvatanju usluga');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Return default services
        return [
            { id: 1, name: 'Rekreativno jahanje', description: 'Dvosatno jahanje kroz planinske staze', duration: '2 sata', price: 50, active: 1 },
            { id: 2, name: 'Jahanje + Prenoćište', description: 'Jahanje i noćenje u A-Frame bungalovu', duration: '1 noć + 2h', price: 150, active: 1 },
            { id: 3, name: 'Prenoćište u bungalovu', description: 'A-Frame bungalov sa doručkom', duration: '1 noć', price: 100, active: 1 }
        ];
    }
}

async function createService(service) {
    try {
        const response = await fetch(`${API_BASE}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });
        if (!response.ok) throw new Error('Greška pri kreiranju usluge');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function updateService(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Greška pri ažuriranju usluge');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function deleteService(id) {
    try {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Greška pri brisanju usluge');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTH
// ============================================

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Greška pri prijavi');
        }
        
        // Store login state
        localStorage.setItem('ranc_admin_logged_in', 'true');
        localStorage.setItem('ranc_admin_user', data.user.name);
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        // Fallback: check hardcoded credentials
        if (username === 'admin' && password === 'ranc850') {
            localStorage.setItem('ranc_admin_logged_in', 'true');
            localStorage.setItem('ranc_admin_user', 'Administrator');
            return { success: true, user: { name: 'Administrator' } };
        }
        throw error;
    }
}

// ============================================
// STATISTIKE
// ============================================

async function getStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error('Greška pri dohvatanju statistike');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Calculate from localStorage
        const reservations = JSON.parse(localStorage.getItem('ranc_reservations')) || [];
        return {
            totalReservations: reservations.length,
            pendingReservations: reservations.filter(r => r.status === 'pending').length,
            activeServices: 3,
            monthlyRevenue: 0
        };
    }
}

// Export for use in other files
window.RancAPI = {
    // Rezervacije
    getReservations,
    getReservation,
    createReservation,
    updateReservation,
    deleteReservation,
    
    // Termini
    getRidingSlots,
    createRidingSlot,
    deleteRidingSlot,
    
    // Galerija
    getImages,
    uploadImage,
    updateImage,
    deleteImage,
    
    // Usluge
    getServices,
    createService,
    updateService,
    deleteService,
    
    // Auth
    login,
    
    // Stats
    getStats
};


/* ============================================
   RANČ LIPANJ 850 - JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('a');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const contactForm = document.getElementById('contactForm');
    
    let currentImageIndex = 0;
    let galleryImages = [];

    // ============================================
    // NAVBAR
    // ============================================
    
    // Scroll effect
    const handleScroll = () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // ============================================
    // SMOOTH SCROLL
    // ============================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // LIGHTBOX GALLERY
    // ============================================
    
    // Collect gallery images
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        galleryImages.push({
            src: img.src,
            alt: img.alt
        });
        
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });
    
    function openLightbox(index) {
        currentImageIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function updateLightboxImage() {
        const image = galleryImages[currentImageIndex];
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
    }
    
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        updateLightboxImage();
    }
    
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    }
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
        }
    });
    
    // ============================================
    // INTERSECTION OBSERVER - Fade in animations
    // ============================================
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to elements
    const fadeElements = document.querySelectorAll(
        '.about-content, .about-images, .service-card, .section-header, ' +
        '.accommodation-grid > *, .food-content, .food-image, ' +
        '.contact-info, .contact-form-wrapper'
    );
    
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
    
    // Add CSS for fade-in animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .service-card.fade-in {
            transition-delay: calc(var(--card-index, 0) * 0.1s);
        }
    `;
    document.head.appendChild(style);
    
    // Add stagger delay to service cards
    document.querySelectorAll('.service-card').forEach((card, index) => {
        card.style.setProperty('--card-index', index);
    });
    
    // ============================================
    // CONTACT FORM
    // ============================================
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Simple validation
            if (!data.name || !data.email || !data.message) {
                showNotification('Molimo popunite sva obavezna polja.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Molimo unesite ispravnu email adresu.', 'error');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('.form-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Šaljem...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                showNotification('Hvala na upitu! Javićemo vam se uskoro.', 'success');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
    
    // Notification helper
    function showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const notificationStyle = document.createElement('style');
        notificationStyle.textContent = `
            .notification {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                padding: 1rem 2rem;
                border-radius: 4px;
                font-size: 0.9rem;
                font-weight: 500;
                color: white;
                z-index: 3000;
                animation: notificationSlide 0.3s ease forwards;
            }
            .notification.success {
                background: #2D5A27;
            }
            .notification.error {
                background: #8B2635;
            }
            @keyframes notificationSlide {
                to {
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(notificationStyle);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'notificationSlide 0.3s ease reverse forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // ============================================
    // PARALLAX EFFECT (subtle)
    // ============================================
    
    const parallaxElements = document.querySelectorAll('.hero-image, .experience-bg img');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const parent = el.closest('section, header');
            if (!parent) return;
            
            const parentTop = parent.offsetTop;
            const parentHeight = parent.offsetHeight;
            
            if (scrolled > parentTop - window.innerHeight && scrolled < parentTop + parentHeight) {
                const yPos = (scrolled - parentTop) * 0.3;
                el.style.transform = `translateY(${yPos}px) scale(1.1)`;
            }
        });
    });
    
    // ============================================
    // ACTIVE NAV LINK ON SCROLL
    // ============================================
    
    const sections = document.querySelectorAll('section[id], header[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Add active link style
    const activeLinkStyle = document.createElement('style');
    activeLinkStyle.textContent = `
        .nav-menu a.active::after {
            width: 100%;
        }
    `;
    document.head.appendChild(activeLinkStyle);

    // ============================================
    // DATE RANGE PICKER FOR ACCOMMODATION
    // ============================================
    
    const serviceSelect = document.getElementById('service');
    const datePickerContainer = document.getElementById('datePickerContainer');
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const dateSummary = document.getElementById('dateSummary');
    const checkInDateEl = document.getElementById('checkInDate');
    const checkOutDateEl = document.getElementById('checkOutDate');
    const nightsCountEl = document.getElementById('nightsCount');
    const totalPriceEl = document.getElementById('totalPrice');
    const clearDatesBtn = document.getElementById('clearDates');
    const dateSelectionHint = document.getElementById('dateSelectionHint');
    
    // Date picker state
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let startDate = null;
    let endDate = null;
    let pricePerNight = 0;
    let isSelectingEndDate = false;
    
    // Month names in Serbian
    const monthNames = [
        'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
        'Jul', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ];
    
    // Show/hide date picker based on service selection
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const requiresNights = selectedOption.dataset.nights === 'true';
            pricePerNight = parseInt(selectedOption.dataset.price) || 0;
            
            if (requiresNights) {
                datePickerContainer.style.display = 'block';
                renderCalendar();
            } else {
                datePickerContainer.style.display = 'none';
                resetDateSelection();
            }
        });
    }
    
    // Render calendar
    function renderCalendar() {
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week (0 = Sunday, we want Monday = 0)
        let startingDay = firstDay.getDay() - 1;
        if (startingDay < 0) startingDay = 6;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Add empty cells for days before the first day
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(currentYear, currentMonth, day);
            dayDate.setHours(0, 0, 0, 0);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
            dayEl.dataset.date = dayDate.toISOString();
            
            // Check if this date is in the past
            if (dayDate < today) {
                dayEl.classList.add('disabled');
            } else {
                // Check if this is start date
                if (startDate && dayDate.getTime() === startDate.getTime()) {
                    dayEl.classList.add('start-date');
                }
                
                // Check if this is end date
                if (endDate && dayDate.getTime() === endDate.getTime()) {
                    dayEl.classList.add('end-date');
                }
                
                // Check if this date is in range
                if (startDate && endDate && dayDate > startDate && dayDate < endDate) {
                    dayEl.classList.add('in-range');
                }
                
                // Add hover effect when selecting end date
                if (startDate && !endDate && dayDate > startDate) {
                    dayEl.classList.add('selectable');
                }
                
                // Click handler
                dayEl.addEventListener('click', () => handleDateClick(dayDate));
            }
            
            calendarDays.appendChild(dayEl);
        }
    }
    
    // Handle date click
    function handleDateClick(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) return;
        
        if (!startDate || (startDate && endDate)) {
            // First click or reset - set start date
            startDate = date;
            endDate = null;
            isSelectingEndDate = true;
            dateSelectionHint.textContent = 'Sada kliknite na datum odlaska';
            dateSummary.style.display = 'none';
        } else if (isSelectingEndDate) {
            // Second click - set end date
            if (date <= startDate) {
                // If clicked date is before or equal to start date, reset to this as start
                startDate = date;
                endDate = null;
                dateSelectionHint.textContent = 'Sada kliknite na datum odlaska';
            } else {
                endDate = date;
                isSelectingEndDate = false;
                dateSelectionHint.textContent = 'Datumi odabrani';
                updateDateSummary();
            }
        }
        
        renderCalendar();
    }
    
    // Update date summary
    function updateDateSummary() {
        if (startDate && endDate) {
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            checkInDateEl.textContent = startDate.toLocaleDateString('sr-Latn', options);
            checkOutDateEl.textContent = endDate.toLocaleDateString('sr-Latn', options);
            
            // Calculate nights
            const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
            nightsCountEl.textContent = nights === 1 ? '1 noćenje' : `${nights} noćenja`;
            
            // Calculate total price
            const totalPrice = nights * pricePerNight;
            totalPriceEl.textContent = `${totalPrice} KM`;
            
            dateSummary.style.display = 'block';
        }
    }
    
    // Reset date selection
    function resetDateSelection() {
        startDate = null;
        endDate = null;
        isSelectingEndDate = false;
        if (dateSelectionHint) dateSelectionHint.textContent = 'Kliknite na datum dolaska';
        if (dateSummary) dateSummary.style.display = 'none';
        renderCalendar();
    }
    
    // Navigation handlers
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }
    
    // Clear dates handler
    if (clearDatesBtn) {
        clearDatesBtn.addEventListener('click', resetDateSelection);
    }
});


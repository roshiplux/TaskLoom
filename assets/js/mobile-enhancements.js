/**
 * TaskLoom Mobile Enhancement JavaScript
 * Handles mobile-specific interactions and navigation
 */

class MobileEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileNavigation();
        this.setupTouchInteractions();
        this.setupViewportHandling();
        this.setupFormEnhancements();
        this.setupSwipeGestures();
    }

    /**
     * Setup mobile navigation toggle
     */
    setupMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.classList.toggle('active');
                mobileToggle.setAttribute('aria-expanded', 
                    navLinks.classList.contains('active').toString());
                
                // Change icon
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });

            // Close mobile menu when clicking on links
            const navItems = navLinks.querySelectorAll('a');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
            });
        }
    }

    /**
     * Setup touch interactions for better mobile UX
     */
    setupTouchInteractions() {
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('button, .btn, .cta-button');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
            });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            });
        });

        // Prevent double-tap zoom on buttons
        buttons.forEach(button => {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.click();
            });
        });
    }

    /**
     * Handle viewport changes and orientation
     */
    setupViewportHandling() {
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            // Prevent zoom on orientation change
            setTimeout(() => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                    setTimeout(() => {
                        viewport.content = 'width=device-width, initial-scale=1.0';
                    }, 500);
                }
            }, 100);
        });

        // Handle safe area for iOS devices
        this.handleSafeArea();
    }

    /**
     * Handle iOS safe area insets
     */
    handleSafeArea() {
        if (CSS.supports('padding: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
            document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
            document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
        }
    }

    /**
     * Enhance forms for mobile
     */
    setupFormEnhancements() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Prevent zoom on focus for iOS
            if (input.type !== 'file') {
                const fontSize = window.getComputedStyle(input).fontSize;
                if (parseFloat(fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            }

            // Add focus/blur handlers for better UX
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement?.classList.remove('focused');
            });
        });
    }

    /**
     * Setup swipe gestures for calendar and other components
     */
    setupSwipeGestures() {
        const calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) return;

        let startX = 0;
        let startY = 0;
        let isScrolling = false;

        calendarContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isScrolling = false;
        }, { passive: true });

        calendarContainer.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const touch = e.touches[0];
            const diffX = startX - touch.clientX;
            const diffY = startY - touch.clientY;

            if (!isScrolling) {
                // Determine if this is a horizontal swipe
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    isScrolling = false;
                    e.preventDefault(); // Prevent scrolling for horizontal swipes
                } else {
                    isScrolling = true; // Allow vertical scrolling
                }
            }
        }, { passive: false });

        calendarContainer.addEventListener('touchend', (e) => {
            if (!startX || !startY || isScrolling) {
                startX = 0;
                startY = 0;
                return;
            }

            const touch = e.changedTouches[0];
            const diffX = startX - touch.clientX;
            const diffY = startY - touch.clientY;

            // Check if it's a horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next month/week/day
                    this.triggerNavigation('next');
                } else {
                    // Swipe right - previous month/week/day
                    this.triggerNavigation('prev');
                }
            }

            startX = 0;
            startY = 0;
        }, { passive: true });
    }

    /**
     * Trigger navigation based on swipe direction
     */
    triggerNavigation(direction) {
        const prevBtn = document.querySelector('#prevBtn, .calendar-nav button:first-child');
        const nextBtn = document.querySelector('#nextBtn, .calendar-nav button:last-child');

        if (direction === 'prev' && prevBtn) {
            prevBtn.click();
            this.addSwipeAnimation(direction);
        } else if (direction === 'next' && nextBtn) {
            nextBtn.click();
            this.addSwipeAnimation(direction);
        }
    }

    /**
     * Add visual feedback for swipe actions
     */
    addSwipeAnimation(direction) {
        const calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) return;

        calendarContainer.style.transform = direction === 'prev' ? 'translateX(10px)' : 'translateX(-10px)';
        calendarContainer.style.transition = 'transform 0.2s ease';

        setTimeout(() => {
            calendarContainer.style.transform = '';
            setTimeout(() => {
                calendarContainer.style.transition = '';
            }, 200);
        }, 100);
    }

    /**
     * Optimize calendar for mobile viewing
     */
    setupCalendarOptimizations() {
        const calendarDays = document.querySelectorAll('.calendar-day');
        
        calendarDays.forEach(day => {
            // Truncate long task names on mobile
            if (window.innerWidth <= 768) {
                const tasks = day.querySelectorAll('.calendar-task, .calendar-event-ext');
                tasks.forEach(task => {
                    if (task.textContent.length > 15) {
                        task.title = task.textContent; // Store full text in title
                        task.textContent = task.textContent.substring(0, 12) + '...';
                    }
                });
            }
        });
    }

    /**
     * Setup better task input for mobile
     */
    setupMobileTaskInput() {
        const taskInputs = document.querySelectorAll('.task-input, #monthlyTaskInput');
        
        taskInputs.forEach(input => {
            // Add mobile-friendly placeholder
            if (window.innerWidth <= 768) {
                const originalPlaceholder = input.placeholder;
                input.placeholder = originalPlaceholder.length > 25 
                    ? originalPlaceholder.substring(0, 22) + '...'
                    : originalPlaceholder;
            }

            // Auto-expand textarea on mobile
            if (input.tagName.toLowerCase() === 'textarea') {
                input.addEventListener('input', () => {
                    input.style.height = 'auto';
                    input.style.height = input.scrollHeight + 'px';
                });
            }
        });
    }

    /**
     * Handle responsive images and media
     */
    setupResponsiveMedia() {
        // Make images responsive
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.style.maxWidth) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        });
    }

    /**
     * Setup performance optimizations for mobile
     */
    setupPerformanceOptimizations() {
        // Lazy load images if Intersection Observer is supported
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }

        // Debounce resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCalendarOptimizations();
                this.setupMobileTaskInput();
            }, 250);
        });
    }
}

// Initialize mobile enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mobileEnhancer = new MobileEnhancer();
    
    // Setup additional mobile optimizations after page load
    window.addEventListener('load', () => {
        mobileEnhancer.setupCalendarOptimizations();
        mobileEnhancer.setupMobileTaskInput();
        mobileEnhancer.setupResponsiveMedia();
        mobileEnhancer.setupPerformanceOptimizations();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancer;
}

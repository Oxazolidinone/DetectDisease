// Home Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Home.js loaded');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize buttons
    initializeButtons();
    
    // Initialize animations
});
document.addEventListener('DOMContentLoaded', function() {
        const currentPage = window.location.pathname.split('/').pop() || 'input.html';
        const navLinks = document.querySelectorAll('header a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'home.html')) {
                link.classList.remove('text-gray-600', 'hover:text-accent');
                link.classList.add('text-accent', 'font-semibold');
            }
        });
    });
/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('nav a, .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/**
 * Initialize button interactions
 */
function initializeButtons() {
    // CTA Button - Get Started
    const ctaButtons = document.querySelectorAll('.btn-cta, [onclick*="input.html"], button');
    
    ctaButtons.forEach(btn => {
        if (btn.textContent.includes('Get Started') || btn.textContent.includes('Predict')) {
            btn.addEventListener('click', function(e) {
                console.log('Get Started clicked');
                window.location.href = 'input.html';
            });
        }
        
        if (btn.textContent.includes('Log In')) {
            btn.addEventListener('click', function(e) {
                console.log('Log In clicked');
                showNotification('Đăng nhập sẽ được thêm sau', 'info');
            });
        }
        
        if (btn.textContent.includes('Sign Up')) {
            btn.addEventListener('click', function(e) {
                console.log('Sign Up clicked');
                showNotification('Đăng ký sẽ được thêm sau', 'info');
            });
        }
    });
    
    // Learn More button
    const learnMoreBtn = document.querySelector('button:nth-of-type(2)');
    if (learnMoreBtn && learnMoreBtn.textContent.includes('Learn More')) {
        learnMoreBtn.addEventListener('click', function() {
            document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

/**
 * Initialize animations on scroll
 */
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .step-container, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}
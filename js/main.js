/*
 * BapuOP AI - Main Application Entrypoint
 * Handles site-wide navigation scrolls, mobile toggles, and form interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  initContactForms();
  initSEO();
});

/* 1. Header Transparent to Dark Glass on Scroll */
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  function checkScroll() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
      if (document.documentElement.classList.contains('light')) {
        header.classList.add('light');
      }
    } else {
      header.classList.remove('scrolled', 'light');
    }
  }

  window.addEventListener('scroll', checkScroll);
  checkScroll(); // Check once on load
}

/* 2. Mobile Responsive Navigation Drawer */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const menu = document.querySelector('.nav-menu');
  
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
    const isOpen = menu.classList.contains('open');
    toggle.innerHTML = isOpen ? '✕' : '☰';
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
      toggle.innerHTML = '☰';
    }
  });
}

/* 3. Sleek Contact Form submission responses */
function initContactForms() {
  const contactForm = document.getElementById('bapuop-contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Animate submit
    btn.disabled = true;
    btn.innerHTML = '<span class="typing-cursor">Processing...</span>';

    setTimeout(() => {
      btn.innerHTML = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      
      // Reset after delay
      setTimeout(() => {
        contactForm.reset();
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 3000);
    }, 1500);
  });
}

/* 4. Console log easter-eggs for SEO / tech */
function initSEO() {
  console.log(
    '%cBapuOP AI%c - Ultra Premium AI Startup Portal Loaded Successfully. %chttps://bapuop-ai.com',
    'color: #3b82f6; font-size: 1.5rem; font-weight: bold;',
    'color: #6b7280; font-size: 1rem;',
    'color: #3b82f6; font-size: 0.9rem; text-decoration: underline;'
  );
}

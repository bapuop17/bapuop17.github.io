/*
 * BapuOP AI - Animations Engine
 * Manages custom cursor glow, background particles pool, typing effects, and scroll reveals
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  initBackgroundParticles();
  initScrollReveal();
});

/* 1. Custom Cursor Glow Tracking */
function initCursorGlow() {
  // Create cursor glow element if it doesn't exist
  let glow = document.querySelector('.cursor-glow');
  if (!glow) {
    glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
  }

  window.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

/* 2. Floating Background Particles Pool */
function initBackgroundParticles() {
  const container = document.querySelector('.particle-container');
  if (!container) return;

  const particleCount = 25;
  const colors = ['#3b82f6', '#60a5fa', '#1d4ed8'];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Randomize particle parameters
    const size = Math.random() * 8 + 2; // size between 2px and 10px
    const left = Math.random() * 100; // left position %
    const delay = Math.random() * 12; // animation delay up to 12s
    const duration = Math.random() * 15 + 10; // animation duration between 10s and 25s
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = left + '%';
    particle.style.bottom = '-20px';
    particle.style.background = `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 80%)`;
    particle.style.animationDelay = delay + 's';
    particle.style.animationDuration = duration + 's';

    container.appendChild(particle);
  }
}

/* 3. Scroll Reveal Engine */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-scale');
  if (reveals.length === 0) return;

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once revealed, no need to track anymore
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => {
    revealObserver.observe(el);
  });
}

/* 4. Smooth Typing Animation Handler */
window.typeWriterEffect = function (element, text, speed = 30, callback = null) {
  if (!element) return;
  element.innerHTML = '';
  let i = 0;
  
  element.classList.add('typing-cursor');

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      element.classList.remove('typing-cursor');
      if (callback) callback();
    }
  }
  
  type();
};

/**
 * Our Blooms® — Sweet Flower Shop
 * main.js — Vanilla JS (no dependencies)
 *
 * Features:
 *  1. Sticky Nav: shadow + scroll-awareness
 *  2. Mobile hamburger menu toggle
 *  3. Smooth scroll-spy (active nav link)
 *  4. Image carousel (drag, buttons, keyboard, indicators)
 *  5. IntersectionObserver reveal animations
 *  6. Toast notification helper
 *  7. Nav closes on outside click / Escape key
 */

'use strict';

/* =============================================================================
   UTILITY HELPERS
   ============================================================================= */

/**
 * Select one element (throws if not found in debug mode).
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Select all elements.
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 */
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Run callback after DOM is ready.
 * @param {Function} fn
 */
const onReady = (fn) => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* =============================================================================
   1. STICKY NAVIGATION
   ============================================================================= */

function initStickyNav() {
  const nav = $('#navbar');
  if (!nav) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('nav--scrolled', window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =============================================================================
   2. MOBILE HAMBURGER MENU
   ============================================================================= */

function initMobileMenu() {
  const toggle = $('#navToggle');
  const navList = $('#navList');
  if (!toggle || !navList) return;

  const open = () => {
    navList.classList.add('nav__list--open');
    toggle.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', handleOutsideClick, { capture: true });
    document.addEventListener('keydown', handleEscape);
  };

  const close = () => {
    navList.classList.remove('nav__list--open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', handleOutsideClick, { capture: true });
    document.removeEventListener('keydown', handleEscape);
  };

  const handleOutsideClick = (e) => {
    if (!navList.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      close();
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // Close when a nav link is clicked (smooth scroll to section)
  $$('.nav__link', navList).forEach((link) => {
    link.addEventListener('click', () => {
      close();
    });
  });
}

/* =============================================================================
   3. SCROLL-SPY (Active Nav Link Highlighting)
   ============================================================================= */

function initScrollSpy() {
  const sections = $$('section[id], main[id], footer[id]');
  const navLinks = $$('.nav__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const NAV_HEIGHT = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '82',
    10
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            link.classList.toggle('nav__link--active', href === `#${activeId}`);
          });
        }
      });
    },
    {
      rootMargin: `-${NAV_HEIGHT + 10}px 0px -60% 0px`,
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* =============================================================================
   4. IMAGE CAROUSEL
   ============================================================================= */

function initCarousel() {
  const viewport = $('#carouselTrack');
  const prevBtn  = $('#carouselPrev');
  const nextBtn  = $('#carouselNext');
  const indicators = $('#carouselIndicators');
  if (!viewport || !prevBtn || !nextBtn) return;

  const items = $$('.carousel__item', viewport);
  if (!items.length) return;

  const SLIDE_GAP = 20; // matches --space-xs in CSS

  // ── Build dot indicators ──────────────────────────────────────────────────
  if (indicators) {
    items.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'carousel__indicator' + (i === 0 ? ' carousel__indicator--active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.dataset.index = String(i);
      btn.addEventListener('click', () => scrollToIndex(i));
      indicators.appendChild(btn);
    });
  }

  // ── Scroll to a specific slide by index ──────────────────────────────────
  const scrollToIndex = (index) => {
    const item = items[index];
    if (!item) return;
    const itemWidth = item.offsetWidth + SLIDE_GAP;
    viewport.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
  };

  // ── Update active dot + button states ────────────────────────────────────
  const updateState = () => {
    const scrollLeft = viewport.scrollLeft;
    const itemWidth  = (items[0]?.offsetWidth || 300) + SLIDE_GAP;
    const activeIdx  = Math.round(scrollLeft / itemWidth);

    // Update dots
    if (indicators) {
      $$('.carousel__indicator', indicators).forEach((dot, i) => {
        const isActive = i === activeIdx;
        dot.classList.toggle('carousel__indicator--active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
    }

    // Update prev/next button disabled state
    prevBtn.disabled = scrollLeft <= 1;
    nextBtn.disabled = scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
  };

  // ── Button navigation ─────────────────────────────────────────────────────
  prevBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: -(items[0]?.offsetWidth + SLIDE_GAP || 320), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    viewport.scrollBy({ left:  (items[0]?.offsetWidth + SLIDE_GAP || 320), behavior: 'smooth' });
  });

  // ── Listen to scroll events ───────────────────────────────────────────────
  let scrollTimer;
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateState, 80);
  }, { passive: true });

  // ── Keyboard navigation while carousel is focused ─────────────────────────
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextBtn.click();
    }
  });

  // ── Drag-to-scroll (mouse) ────────────────────────────────────────────────
  let isDragging = false;
  let dragStartX = 0;
  let scrollStartLeft = 0;

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    scrollStartLeft = viewport.scrollLeft;
    viewport.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = dragStartX - e.clientX;
    viewport.scrollLeft = scrollStartLeft + delta;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.userSelect = '';
    updateState();
  });

  // ── Touch swipe (passive) ─────────────────────────────────────────────────
  let touchStartX = 0;
  let touchScrollStart = 0;

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchScrollStart = viewport.scrollLeft;
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    const delta = touchStartX - e.touches[0].clientX;
    viewport.scrollLeft = touchScrollStart + delta;
  }, { passive: true });

  viewport.addEventListener('touchend', () => {
    updateState();
  }, { passive: true });

  // ── Auto-advance (pauses on hover/focus) ─────────────────────────────────
  const INTERVAL = 4000;
  let autoTimer = null;

  const startAuto = () => {
    stopAuto();
    autoTimer = setInterval(() => {
      const atEnd = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
      if (atEnd) {
        viewport.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        nextBtn.click();
      }
    }, INTERVAL);
  };

  const stopAuto = () => {
    clearInterval(autoTimer);
    autoTimer = null;
  };

  const carouselSection = viewport.closest('.carousel');
  if (carouselSection) {
    carouselSection.addEventListener('mouseenter', stopAuto);
    carouselSection.addEventListener('mouseleave', startAuto);
    carouselSection.addEventListener('focusin',    stopAuto);
    carouselSection.addEventListener('focusout',   startAuto);
  }

  // ── Initialise ────────────────────────────────────────────────────────────
  updateState();
  startAuto();

  // Handle resize (recalculate active state)
  const resizeObserver = new ResizeObserver(() => updateState());
  resizeObserver.observe(viewport);
}

/* =============================================================================
   5. SCROLL-REVEAL ANIMATIONS (IntersectionObserver)
   ============================================================================= */

function initReveal() {
  // Elements to animate — add reveal class and optional stagger delay
  const targets = [
    { selector: '.who-we-are__content',   delay: 0 },
    { selector: '.who-we-are .btn',       delay: 1 },
    { selector: '.carousel',              delay: 0 },
    { selector: '.services__header',      delay: 0 },
    { selector: '.service-item',          delay: 0 },
    { selector: '.feature-banner',        delay: 0 },
    { selector: '.work-with-us__content', delay: 0 },
    { selector: '.work-with-us .btn',     delay: 1 },
    { selector: '.footer__monogram',      delay: 0 },
    { selector: '.footer__bar',           delay: 1 },
  ];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // Skip animation entirely for accessibility

  targets.forEach(({ selector, delay }) => {
    $$(selector).forEach((el, i) => {
      el.classList.add('reveal');
      if (delay) el.classList.add(`reveal--delay-${delay}`);
      if (selector === '.service-item' && i > 0) {
        el.classList.add(`reveal--delay-${Math.min(i, 3)}`);
      }
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target); // Fire once only
        }
      });
    },
    { rootMargin: '-80px 0px', threshold: 0.05 }
  );

  $$('.reveal').forEach((el) => observer.observe(el));
}

/* =============================================================================
   6. TOAST NOTIFICATION
   ============================================================================= */

const Toast = (() => {
  let hideTimer = null;

  const show = (message, durationMs = 3000) => {
    const toast   = $('#toast');
    const msgEl   = $('#toastMessage');
    if (!toast || !msgEl) return;

    clearTimeout(hideTimer);
    msgEl.textContent = message;
    toast.setAttribute('aria-hidden', 'false');

    hideTimer = setTimeout(() => {
      toast.setAttribute('aria-hidden', 'true');
    }, durationMs);
  };

  return { show };
})();

/* =============================================================================
   7. CTA BUTTON INTERACTIONS
   ============================================================================= */

function initCTAButtons() {
  // "About Us" buttons in Who We Are & Work With Us
  $$('.btn--primary').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');
      // If it's an anchor link, show a toast after a brief delay
      if (href && href.startsWith('#')) {
        setTimeout(() => {
          Toast.show('✿ Welcome to Our Blooms®', 3000);
        }, 400);
      }
    });
  });
}

/* =============================================================================
   8. SMOOTH SCROLL FOR ALL ANCHOR LINKS (polyfill Safari)
   ============================================================================= */

function initSmoothScroll() {
  const NAV_HEIGHT = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '82',
    10
  );

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16;
      window.scrollTo({ top, behavior: 'smooth' });

      // Keep URL hash in sync
      history.pushState(null, '', `#${id}`);
    });
  });
}

/* =============================================================================
   9. FOOTER LINK CONTACT MAILTO
   ============================================================================= */

function initFooterContact() {
  const link = $('.footer__contact-link');
  if (!link) return;

  link.addEventListener('click', () => {
    Toast.show('✉ Opening your mail client…', 2500);
  });
}

/* =============================================================================
   BOOTSTRAP — Wire everything up
   ============================================================================= */

onReady(() => {
  initStickyNav();
  initMobileMenu();
  initScrollSpy();
  initCarousel();
  initReveal();
  initCTAButtons();
  initSmoothScroll();
  initFooterContact();

  // Brief welcome toast after page fully loads
  window.addEventListener('load', () => {
    setTimeout(() => Toast.show('✿  Welcome to Our Blooms®', 3500), 800);
  });
});

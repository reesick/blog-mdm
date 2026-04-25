/* ============================================================
   THE GREAT MACHINE · script.js
   Scroll engine, era tracking, counters, stamp reveals
   ============================================================ */

(function () {
  'use strict';

  /* ── STATE ── */
  const state = {
    currentEra: 0,
    uncoveredEras: new Set(),
    totalSections: 5,
  };

  /* ── ELEMENTS ── */
  const progressFill  = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  const eraLabels = {
    0: 'PROLOGUE',
    1: 'ERA 01 · STEAM & COAL',
    2: 'ERA 02 · ELECTRICITY',
    3: 'ERA 03 · COMPUTERS',
    4: 'ERA 04 · THE NETWORK',
    5: 'ERA 05 · HUMAN ERA',
  };

  /* ─────────────────────────────────────────────────
     1. SCROLL PROGRESS BAR
  ───────────────────────────────────────────────── */
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const raw = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const pct = Math.max(0, Math.min(100, raw));
    progressFill.style.width = pct.toFixed(2) + '%';
  }

  /* ─────────────────────────────────────────────────
     2. ERA DETECTION (IntersectionObserver)
  ───────────────────────────────────────────────── */
  const eraSections = document.querySelectorAll('.era-section');

  const eraObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const era = parseInt(entry.target.dataset.era, 10);
        if (!state.uncoveredEras.has(era)) {
          state.uncoveredEras.add(era);
          unlockEra(era);
        }
        setActiveEra(era);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );

  eraSections.forEach((s) => eraObserver.observe(s));

  function setActiveEra(era) {
    if (state.currentEra === era) return;
    state.currentEra = era;

    // progress label
    progressLabel.textContent = eraLabels[era] || '';
  }

  function unlockEra(era) {
    // Stamp animation
    const stamp = document.querySelector(`#era${era} .era-stamp`);
    if (stamp) {
      stamp.style.animation = 'stampDrop 0.5s cubic-bezier(0.22,0.61,0.36,1) forwards';
      stamp.classList.add('stamped');
    }

    // Unlock badge
    const badge = document.getElementById(`unlock${era}`);
    if (badge) badge.classList.add('unlocked');

    // Trigger counter animations inside that era
    const section = document.getElementById(`era${era}`);
    if (section) triggerCounters(section);
  }

  /* ─────────────────────────────────────────────────
     3. PRINT-REVEAL (scroll-triggered fade-in)
  ───────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.print-reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  revealEls.forEach((el, i) => {
    // stagger siblings inside same parent
    const siblings = el.parentElement
      ? Array.from(el.parentElement.querySelectorAll('.print-reveal'))
      : [];
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = idx * 0.07 + 's';
    revealObserver.observe(el);
  });

  /* ─────────────────────────────────────────────────
     4. NUMBER COUNTERS
  ───────────────────────────────────────────────── */
  function triggerCounters(container) {
    container.querySelectorAll('.counter[data-target]').forEach((el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = 'true';
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
    });
  }

  function animateCounter(el, target) {
    const duration = 1200;
    const start = performance.now();
    const from = 0;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ─────────────────────────────────────────────────
     5. HERO TYPEWRITER
  ───────────────────────────────────────────────── */
  const heroLoader = document.getElementById('heroLoader');
  const loaderTexts = [
    'LOADING ERA 01 OF 05',
    'LOADING ERA 02 OF 05',
    'LOADING ERA 03 OF 05',
    'ACCESSING ARCHIVE...',
    'ARCHIVE READY',
  ];

  let loaderIdx = 0;
  let loaderInterval;

  function cycleLoader() {
    loaderIdx = (loaderIdx + 1) % loaderTexts.length;
    const text = loaderTexts[loaderIdx];
    typeText(heroLoader, text, 40);

    if (loaderIdx === loaderTexts.length - 1) {
      clearInterval(loaderInterval);
    }
  }

  function typeText(el, text, speed) {
    const cursor = el.querySelector('.cursor');
    let i = 0;
    let plain = text;
    el.textContent = '';
    if (cursor) el.appendChild(cursor);

    const t = setInterval(() => {
      if (i < plain.length) {
        el.insertBefore(document.createTextNode(plain[i]), cursor || null);
        i++;
      } else {
        clearInterval(t);
      }
    }, speed);
  }

  // Start after initial animation settles
  setTimeout(() => {
    loaderInterval = setInterval(cycleLoader, 1800);
  }, 2800);

  /* ─────────────────────────────────────────────────
     6. SCROLL-LINKED GRID LINE PARALLAX (hero only)
  ───────────────────────────────────────────────── */
  const heroGridLines = document.querySelector('.hero-grid-lines');

  function parallaxHero() {
    if (!heroGridLines) return;
    const y = window.scrollY;
    heroGridLines.style.transform = `translateY(${y * 0.18}px)`;
  }

  /* ─────────────────────────────────────────────────
     8. SCROLL EVENT · master handler
  ───────────────────────────────────────────────── */
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        parallaxHero();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ─────────────────────────────────────────────────
     9. KEYBOARD SHORTCUT · press any key to start
  ───────────────────────────────────────────────── */
  let keyUsed = false;
  window.addEventListener('keydown', (e) => {
    if (keyUsed) return;
    if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      keyUsed = true;
      const era1 = document.getElementById('era1');
      if (era1) era1.scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ─────────────────────────────────────────────────
     10. CARD HOVER · subtle shadow shift
  ───────────────────────────────────────────────── */
  document.querySelectorAll('.era-card, .cs-card, .classified-box').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translate(-2px, -2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
    card.style.transition = 'transform 0.18s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.18s ease';
  });

  /* ─────────────────────────────────────────────────
     11. VERSUS BLOCK · animate lines in on scroll
  ───────────────────────────────────────────────── */
  const versusBlock = document.querySelector('.versus-block');
  if (versusBlock) {
    const vsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          versusBlock.querySelectorAll('li').forEach((li, i) => {
            li.style.opacity = '0';
            li.style.transform = 'translateX(-10px)';
            li.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;
            setTimeout(() => {
              li.style.opacity = '1';
              li.style.transform = 'translateX(0)';
            }, 50 + i * 80);
          });
          vsObserver.unobserve(versusBlock);
        }
      },
      { threshold: 0.3 }
    );
    vsObserver.observe(versusBlock);
  }

  /* ─────────────────────────────────────────────────
     12. TIMELINE NODES · animate in sequence
  ───────────────────────────────────────────────── */
  const timelineSection = document.querySelector('.timeline-section');
  if (timelineSection) {
    const tlObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.tl-node').forEach((node, i) => {
            node.style.opacity = '0';
            node.style.transform = 'translateY(15px)';
            node.style.transition = `opacity 0.4s ease ${i * 0.15}s, transform 0.4s ease ${i * 0.15}s`;
            setTimeout(() => {
              node.style.opacity = '1';
              node.style.transform = 'translateY(0)';
            }, 50);
          });
          document.querySelectorAll('.tl-line').forEach((line, i) => {
            line.style.scaleX = '0';
            line.style.transformOrigin = 'left';
            line.style.transition = `transform 0.5s ease ${i * 0.15 + 0.1}s`;
            setTimeout(() => { line.style.transform = 'scaleX(1)'; }, 50);
          });
          tlObserver.unobserve(timelineSection);
        }
      },
      { threshold: 0.3 }
    );
    tlObserver.observe(timelineSection);
  }

  /* ─────────────────────────────────────────────────
     13. PILLAR STAGGER ANIMATION
  ───────────────────────────────────────────────── */
  const pillarsEl = document.querySelector('.three-pillars');
  if (pillarsEl) {
    const pillarObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.pillar').forEach((p, i) => {
            p.style.opacity = '0';
            p.style.transform = 'translateX(-12px)';
            p.style.transition = `opacity 0.45s ease ${i * 0.12}s, transform 0.45s ease ${i * 0.12}s`;
            setTimeout(() => {
              p.style.opacity = '1';
              p.style.transform = 'translateX(0)';
            }, 50);
          });
          pillarObs.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    pillarObs.observe(pillarsEl);
  }

  /* ─────────────────────────────────────────────────
     14. FINAL QUOTE · dramatic entrance
  ───────────────────────────────────────────────── */
  const finalQuote = document.querySelector('.final-quote');
  if (finalQuote) {
    const fqObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          finalQuote.style.opacity = '0';
          finalQuote.style.transform = 'scale(0.97)';
          finalQuote.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          setTimeout(() => {
            finalQuote.style.opacity = '1';
            finalQuote.style.transform = 'scale(1)';
          }, 100);
          fqObs.unobserve(finalQuote);
        }
      },
      { threshold: 0.5 }
    );
    fqObs.observe(finalQuote);
  }

  /* ─────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────── */
  updateProgress();

  // On load · trigger any already-visible reveals
  window.addEventListener('load', () => {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add('visible');
      }
    });
  });

})();

/* ============================================================
   VISUAL UPGRADE · chart + figure reveal animations
   ============================================================ */
(function () {
  'use strict';

  /* Build waffle grids before they become visible */
  function buildWaffles() {
    document.querySelectorAll('.waffle[data-waffle-fill]').forEach((el) => {
      if (el.dataset.built) return;
      const total = 100;
      const fill = parseInt(el.dataset.waffleFill || '0', 10);
      // pick visually balanced positions
      const positions = pickPositions(fill, total);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < total; i++) {
        const cell = document.createElement('span');
        cell.className = 'waffle-cell';
        if (positions.has(i)) cell.classList.add('on');
        // stagger entry delay (capped)
        cell.style.transitionDelay = (0.002 * i) + 's';
        frag.appendChild(cell);
      }
      el.appendChild(frag);
      el.dataset.built = '1';
    });
  }

  function pickPositions(n, total) {
    // deterministic but visually scattered
    const s = new Set();
    if (n <= 0) return s;
    const step = Math.max(1, Math.floor(total / n));
    let i = Math.floor(step / 2);
    while (s.size < n && i < total) {
      s.add(i);
      i += step;
    }
    let k = 7;
    while (s.size < n) {
      if (!s.has(k % total)) s.add(k % total);
      k += 13;
    }
    return s;
  }

  /* Intersection observer for charts + archive plates + comparison matrix */
  const blocks = document.querySelectorAll('.chart-block, .archive-plate, .comparison-matrix');

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');

        // Chart-specific tweaks
        if (entry.target.classList.contains('chart-block')) {
          // Trigger counter animations inside
          entry.target.querySelectorAll('.counter[data-target]').forEach((el) => {
            if (el.dataset.counted) return;
            el.dataset.counted = '1';
            const target = parseInt(el.dataset.target, 10);
            animateCounter(el, target);
          });

          // Normalise line-draw dash lengths
          entry.target.querySelectorAll('path.line-draw').forEach((p) => {
            try {
              const len = p.getTotalLength();
              p.style.strokeDasharray = len;
              p.style.strokeDashoffset = len;
              // force reflow then remove to trigger transition
              requestAnimationFrame(() => {
                p.style.strokeDashoffset = '0';
              });
            } catch (e) { /* SVG not ready · skip */ }
          });
        }

        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  function animateCounter(el, target) {
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Initialise */
  function init() {
    buildWaffles();
    blocks.forEach((b) => obs.observe(b));

    // If any block is already in view on load, reveal it immediately
    blocks.forEach((b) => {
      const rect = b.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        b.classList.add('visible');
        b.querySelectorAll('path.line-draw').forEach((p) => {
          try {
            const len = p.getTotalLength();
            p.style.strokeDasharray = len;
            p.style.strokeDashoffset = '0';
          } catch (e) { /* ignore */ }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   HOVER INTERACTIONS — tooltips, lightbox
   ============================================================ */
(function () {
  /* --- Chart bar / data-point tooltips ---
     Reads the <title> text already embedded in SVG elements
     and shows a floating div positioned near the cursor.     */
  const tip = document.createElement('div');
  tip.id = 'svg-tooltip';
  tip.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:9999',
    'background:#0a0a0a',
    'color:#f5f3ef',
    'font-family:"DM Mono",monospace',
    'font-size:0.72rem',
    'letter-spacing:.06em',
    'padding:0.35em 0.7em',
    'border:1px solid #0a0a0a',
    'opacity:0',
    'transition:opacity .15s ease',
    'white-space:nowrap',
    'max-width:240px',
  ].join(';');
  document.body.appendChild(tip);

  function showTip(e, text) {
    tip.textContent = text;
    tip.style.opacity = '1';
    moveTip(e);
  }
  function moveTip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 28;
    tip.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    tip.style.top = Math.max(y, 4) + 'px';
  }
  function hideTip() { tip.style.opacity = '0'; }

  /* Attach to all SVG <rect>, <circle>, <path> that have a direct <title> child */
  function attachSvgTips() {
    document.querySelectorAll('svg rect, svg circle, svg path').forEach((el) => {
      const titleEl = el.querySelector(':scope > title');
      if (!titleEl) return;
      const text = titleEl.textContent.trim();
      el.style.cursor = 'crosshair';
      el.addEventListener('mouseenter', (e) => showTip(e, text));
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', hideTip);
    });
  }

  /* --- Lightbox for archive-plate images --- */
  function buildLightbox() {
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:10000',
      'background:rgba(10,10,10,.93)',
      'cursor:zoom-out',
      'align-items:center',
      'justify-content:center',
    ].join(';');

    const img = document.createElement('img');
    img.id = 'lightbox-img';
    img.style.cssText = [
      'max-width:92vw',
      'max-height:90vh',
      'object-fit:contain',
      'border:2px solid #f5f3ef',
      'box-shadow:0 8px 48px rgba(0,0,0,.8)',
    ].join(';');

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { overlay.style.display = 'none'; document.body.style.overflow = ''; }
    });

    document.querySelectorAll('.archive-plate img').forEach((el) => {
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        img.src = el.src;
        img.alt = el.alt || '';
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { attachSvgTips(); buildLightbox(); });
  } else {
    attachSvgTips();
    buildLightbox();
  }
})();
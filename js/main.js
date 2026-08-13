/* ==========================================================================
   main.js
   Navigation state, smooth scroll, section counter + progress bar,
   topbar show/hide, reduced-motion toggle.
   ========================================================================== */
(function () {
  document.body.classList.remove('no-js');

  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var counter = document.getElementById('section-counter');
  var progressFill = document.getElementById('progress-fill');
  var topbar = document.getElementById('topbar');
  var motionToggle = document.getElementById('motion-toggle');

  var TOTAL = sections.length - 1; // hero = 00, last section = 09

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function setActiveNav(index) {
    navLinks.forEach(function (l) {
      l.classList.toggle('is-active', parseInt(l.getAttribute('data-idx'), 10) === index);
    });
    if (counter) counter.textContent = pad(index) + ' / ' + pad(TOTAL);
  }

  var lastScrollY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;

    // active section + counter
    var mid = y + window.innerHeight * 0.35;
    var activeIndex = 0;
    sections.forEach(function (s, i) {
      if (s.offsetTop <= mid) activeIndex = i;
    });
    setActiveNav(activeIndex);

    // progress bar (based on total scrollable height)
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    if (progressFill) progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';

    // topbar show/hide (only when not presenting)
    if (topbar && !document.body.classList.contains('presenting')) {
      topbar.classList.toggle('is-scrolled', y > 40);
      if (y > lastScrollY && y > 200) {
        topbar.classList.add('is-hidden');
      } else {
        topbar.classList.remove('is-hidden');
      }
    }
    lastScrollY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- smooth scroll for nav + hero CTA ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- reduced motion manual toggle ---------- */
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.body.classList.add('reduce-motion');
    motionToggle && motionToggle.setAttribute('aria-pressed', 'true');
  }
  motionToggle && motionToggle.addEventListener('click', function () {
    var active = document.body.classList.toggle('reduce-motion');
    motionToggle.setAttribute('aria-pressed', String(active));
  });
})();

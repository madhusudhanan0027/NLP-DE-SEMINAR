/* ==========================================================================
   animations.js
   GSAP scroll-triggered reveals + the two signature text-segmentation
   animations (Section 2 "Core Concept" and Section 7 "Example").
   ========================================================================== */
(function () {
  var reduceMotion = document.body.classList.contains('reduce-motion') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (typeof gsap === 'undefined') {
    document.querySelectorAll('.reveal-up, .reveal-line').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (reduceMotion) {
    gsap.set('.reveal-up, .reveal-word', { opacity: 1, y: 0, x: 0 });
  }

  /* ---------- generic reveal-up for any section ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('.reveal-up').forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    /* ---------- hero title reveal ---------- */
    gsap.timeline({ delay: 0.2 })
      .to('.reveal-word', {
        y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.15
      }, 0)
      .to('.hero__subtitle, .hero__lede, .hero__cta, .hero__meta, .eyebrow', {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08
      }, 0.35);

    gsap.set('.reveal-word', { y: '110%', opacity: 0 });
    gsap.set('.hero__subtitle, .hero__lede, .hero__cta, .hero__meta, .eyebrow', { y: 20 });
  } else {
    gsap.set('.reveal-word', { y: 0, opacity: 1 });
  }

  /* ==========================================================================
     SECTION 2 — CORE CONCEPT: sentence -> discourse units
     ========================================================================== */
  (function segmenterAnimation() {
    var stage = document.getElementById('segmenter-stage');
    var source = document.getElementById('segmenter-source');
    var units = document.getElementById('segmenter-units');
    if (!stage || !source || !units) return;

    gsap.set(units, { opacity: 0, y: 24 });
    gsap.set(units.children, { opacity: 0, y: 20 });
    gsap.set(source, { opacity: 1 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top 65%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.to(source, { opacity: 0, y: -24, duration: 0.6, ease: 'power2.in' })
      .to(units, { opacity: 1, y: 0, duration: 0.1 })
      .to(units.children, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.18
      }, '<');
  })();

  /* ==========================================================================
     SECTION 7 — EXAMPLE: stream -> segments
     ========================================================================== */
  (function streamAnimation() {
    var stage = document.getElementById('stream-stage');
    var text = document.getElementById('stream-text');
    var segs = document.getElementById('stream-segments');
    if (!stage || !text || !segs) return;

    gsap.set(segs, { opacity: 0, y: 24 });
    gsap.set(segs.children, { opacity: 0, y: 20 });

    var tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top 60%',
        toggleActions: 'play none none reverse'
      }
    });

    tl2.to(text, { opacity: 0, y: -24, duration: 0.6, ease: 'power2.in', delay: 0.3 })
      .to(segs, { opacity: 1, y: 0, duration: 0.1 })
      .to(segs.children, {
        opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.2
      }, '<')
      .to('.connective', {
        color: '#ffb4c6',
        duration: 0.4,
        stagger: 0.15
      }, '-=0.3');
  })();

  /* ==========================================================================
     PIPELINE stage detail cards (Section 4)
     ========================================================================== */
  (function pipelineDetail() {
    var stageData = {
      1: { title: 'Raw Text', text: 'The process begins with an input — this could be a single document, an article, or a full conversation transcript with multiple speaker turns.' },
      2: { title: 'Preprocessing', text: 'Basic processing such as tokenization, sentence handling, punctuation analysis, and other linguistic preparation happens before any boundary decision is made.' },
      3: { title: 'Feature Analysis', text: 'The system examines useful signals such as punctuation, connectives, syntax, semantics, and context to build a picture of where boundaries might exist.' },
      4: { title: 'Boundary Detection', text: 'Using the extracted features, the system predicts where meaningful discourse boundaries occur — this is the core decision step of segmentation.' },
      5: { title: 'Discourse Segments', text: 'The text is divided into meaningful units, ready to be used by downstream tasks like summarization, translation, or question answering.' }
    };
    var buttons = document.querySelectorAll('.pipeline__stage');
    var detail = document.getElementById('stage-detail');
    var numEl = document.getElementById('stage-detail-num');
    var titleEl = document.getElementById('stage-detail-title');
    var textEl = document.getElementById('stage-detail-text');
    var closeBtn = document.getElementById('stage-detail-close');
    if (!buttons.length || !detail) return;

    function openStage(n, btn) {
      buttons.forEach(function (b) { b.classList.remove('is-active'); });
      if (btn) btn.classList.add('is-active');
      var d = stageData[n];
      if (!d) return;
      numEl.textContent = 'STEP ' + n;
      titleEl.textContent = d.title;
      textEl.textContent = d.text;
      detail.hidden = false;
      if (!reduceMotion && typeof gsap !== 'undefined') {
        gsap.fromTo(detail, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        openStage(btn.getAttribute('data-stage'), btn);
      });
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        detail.hidden = true;
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
      });
    }
  })();

  /* ==========================================================================
     "More details" expandable panels
     ========================================================================== */
  document.querySelectorAll('.link-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-more');
      var panel = document.getElementById(targetId);
      if (!panel) return;
      var isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
        btn.querySelector('span') && (btn.querySelector('span').textContent = '−');
        if (!reduceMotion && typeof gsap !== 'undefined') {
          gsap.fromTo(panel, { opacity: 0, height: 0 }, { opacity: 1, height: 'auto', duration: 0.35, ease: 'power2.out' });
        }
      } else {
        panel.setAttribute('hidden', '');
        btn.querySelector('span') && (btn.querySelector('span').textContent = '+');
      }
    });
  });

  /* refresh ScrollTrigger after fonts/layout settle */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();

/* ==========================================================================
   presentation.js
   Fullscreen presentation mode, keyboard section navigation (Arrow Up/Down),
   presenter notes panel toggle, and section HUD hint.
   ========================================================================== */
(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
  var presentToggle = document.getElementById('present-toggle');
  var notesToggle = document.getElementById('notes-toggle');
  var notesClose = document.getElementById('notes-close');
  var notesPanel = document.getElementById('notes-panel');
  var notesBody = document.getElementById('notes-body');

  var currentIndex = 0;

  function getSectionNotes(section) {
    return section.getAttribute('data-notes') || '';
  }

  function updateNotesFor(section) {
    if (!notesBody || !section) return;
    var text = getSectionNotes(section);
    notesBody.innerHTML = text
      ? '<p>' + text + '</p>'
      : '<p class="notes-empty">No notes for this section.</p>';
  }

  /* ---------- presenter notes toggle ---------- */
  function openNotes() {
    if (!notesPanel) return;
    notesPanel.classList.add('is-open');
    notesPanel.setAttribute('aria-hidden', 'false');
    notesToggle && notesToggle.setAttribute('aria-pressed', 'true');
  }
  function closeNotes() {
    if (!notesPanel) return;
    notesPanel.classList.remove('is-open');
    notesPanel.setAttribute('aria-hidden', 'true');
    notesToggle && notesToggle.setAttribute('aria-pressed', 'false');
  }
  function toggleNotes() {
    if (!notesPanel) return;
    notesPanel.classList.contains('is-open') ? closeNotes() : openNotes();
  }
  notesToggle && notesToggle.addEventListener('click', toggleNotes);
  notesClose && notesClose.addEventListener('click', closeNotes);

  /* ---------- presentation / fullscreen mode ---------- */
  function enterFullscreen() {
    var el = document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) { try { req.call(el); } catch (e) {} }
  }
  function exitFullscreen() {
    var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) {
      try { ex.call(document); } catch (e) {}
    }
  }
  function isPresenting() { return document.body.classList.contains('presenting'); }

  function enterPresentMode() {
    document.body.classList.add('presenting');
    presentToggle && presentToggle.setAttribute('aria-pressed', 'true');
    enterFullscreen();
  }
  function exitPresentMode() {
    document.body.classList.remove('presenting');
    presentToggle && presentToggle.setAttribute('aria-pressed', 'false');
    exitFullscreen();
  }
  function togglePresentMode() {
    isPresenting() ? exitPresentMode() : enterPresentMode();
  }
  presentToggle && presentToggle.addEventListener('click', togglePresentMode);

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && isPresenting()) exitPresentMode();
  });

  /* ---------- keyboard navigation ---------- */
  function scrollToIndex(i) {
    if (i < 0 || i >= sections.length) return;
    currentIndex = i;
    sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function currentSectionIndex() {
    var mid = window.scrollY + window.innerHeight * 0.4;
    var best = 0;
    sections.forEach(function (s, i) {
      if (s.offsetTop <= mid) best = i;
    });
    return best;
  }

  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollToIndex(currentSectionIndex() + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToIndex(currentSectionIndex() - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      togglePresentMode();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
    } else if (e.key === 'Escape' && isPresenting()) {
      exitPresentMode();
    }
  });

  /* ---------- keep notes panel synced to the section in view ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        updateNotesFor(entry.target);
      }
    });
  }, { threshold: [0.5] });
  sections.forEach(function (s) { io.observe(s); });

  if (sections[0]) updateNotesFor(sections[0]);
})();

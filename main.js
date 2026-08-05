(function () {
  'use strict';

  /* ─────────────────────────────────────────
     Cycling tagline
  ───────────────────────────────────────── */
  var words = [
    'Data Analyst',
    'Researcher',
    'Builder',
    'Traveler',
    'Photographer',
    'Rock Climber',
    'Badminton Player',
    'Problem Solver'
  ];
  var wordEl = document.getElementById('cyclingWord');
  var current = 0;

  function cycleWord() {
    // fade out
    wordEl.classList.add('fade-out');
    wordEl.classList.remove('fade-in');

    setTimeout(function () {
      current = (current + 1) % words.length;
      wordEl.textContent = words[current];

      // fade in
      wordEl.classList.remove('fade-out');
      wordEl.classList.add('fade-in');
    }, 380); // wait for fade-out to finish
  }

  // Start cycling after a short initial pause
  setTimeout(function () {
    wordEl.classList.add('fade-in');
    setInterval(cycleWord, 2600);
  }, 1200);

  /* ─────────────────────────────────────────
     Scroll-reveal
  ───────────────────────────────────────── */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  /* ─────────────────────────────────────────
     Modal helpers
  ───────────────────────────────────────── */
  var backdrop  = document.getElementById('projectModal');
  var imgWrap   = document.getElementById('modalImgWrap');
  var featBadge = document.getElementById('modalFeatBadge');
  var overview  = document.getElementById('modalOverview');
  var details   = document.getElementById('modalDetails');
  var tagsEl    = document.getElementById('modalTags');
  var ghBtn     = document.getElementById('modalGithubBtn');
  var liveBtn   = document.getElementById('modalLiveBtn');
  var closeBtn  = document.getElementById('modalClose');

  function openModal(card) {
    // ── populate image ──
    // Clone the .project-img content into the modal header
    var imgSrc = card.querySelector('.project-img');
    imgWrap.innerHTML = '';
    if (imgSrc) {
      var clone = imgSrc.cloneNode(true);
      // remove overlay + gh btn from clone
      var ov = clone.querySelector('.card-hover-overlay');
      if (ov) ov.remove();
      var ghBadge = clone.querySelector('.card-gh-btn');
      if (ghBadge) ghBadge.remove();
      clone.style.height = '320px';
      clone.style.borderRadius = '20px 20px 0 0';
      imgWrap.appendChild(clone);
    }

    // ── featured badge ──
    var isFeatured = card.dataset.featured === 'true';
    featBadge.style.display = isFeatured ? 'inline-block' : 'none';

    // ── text content ──
    overview.textContent = card.dataset.overview || '';
    details.textContent  = card.dataset.details  || '';

    // ── tags ──
    tagsEl.innerHTML = '';
    var tags = (card.dataset.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    tags.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagsEl.appendChild(span);
    });

    // ── github button ──
    var gh = card.dataset.github;
    if (gh) {
      ghBtn.href = gh;
      ghBtn.style.display = 'inline-flex';
    } else {
      ghBtn.style.display = 'none';
    }

    // ── live project link ──
    var liveLink = card.dataset.link;
    if (liveLink) {
      liveBtn.href = liveLink;
      liveBtn.style.display = 'inline-flex';
    } else {
      liveBtn.style.display = 'none';
    }

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ─────────────────────────────────────────
     Init on DOM ready
  ───────────────────────────────────────── */
  function init() {
    // Scroll reveal
    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });

    // Wire up every expand trigger (button in card body + card-expand-btn in overlay)
    document.querySelectorAll('.expand-trigger, .card-expand-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.project-card');
        if (card) openModal(card);
      });
    });

    // Close on backdrop click
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    // Close button
    closeBtn.addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Prevent GitHub badge clicks from opening the modal
    document.querySelectorAll('.card-gh-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

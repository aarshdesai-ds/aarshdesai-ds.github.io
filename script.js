/* =========================================================
   script.js: all the interactive parts of the site.
   Each numbered block is independent. You normally don't need
   to edit this file: all text lives in index.html.
   ========================================================= */
(function () {
  'use strict';

  // True when the visitor's device asks for less motion
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- 1. Light / dark mode toggle ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function updateThemeButton() {
    var dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.querySelector('.theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: ignore */ }
      updateThemeButton();
    });
    updateThemeButton();
  }

  /* ---------- 2. Phone menu (slide-in sidebar) ---------- */
  var menuBtn = document.getElementById('menu-toggle');
  var overlay = document.getElementById('overlay');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    overlay.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.querySelectorAll('.sidebar a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------- 3. Highlight the menu item for the section on screen ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.side-nav a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var section = document.querySelector(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ---------- 4. Scroll progress bar and back-to-top button ---------- */
  var bar = document.getElementById('progress');
  var toTop = document.getElementById('to-top');
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var y = window.scrollY || doc.scrollTop;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. Typing effect in the hero ---------- */
  var typed = document.querySelector('.typed');
  if (typed && !reduceMotion) {
    var phrases = typed.dataset.phrases.split('|');
    var p = 0, i = phrases[0].length, deleting = true;
    var tick = function () {
      var word = phrases[p];
      i += deleting ? -1 : 1;
      typed.textContent = word.slice(0, i);
      var delay = deleting ? 30 : 60;
      if (!deleting && i === word.length) { deleting = true; delay = 1900; }
      else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200); // show the first phrase for a moment before starting
  }

  /* ---------- 6. Sections slide in as you scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------- 7. Numbers count up when they appear ---------- */
  function formatNumber(n, decimals) {
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function countUp(el) {
    var target = parseFloat(el.dataset.to);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var finalText = el.textContent; // the real value written in index.html
    var start = null, duration = 1500;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = finalText; // always end on the exact text from index.html
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('.count');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var counterWatch = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterWatch.observe(el); });
  }

  /* ---------- 8. Project filter buttons ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (card) {
        var cats = card.dataset.category.split(' ');
        card.hidden = !(filter === 'all' || cats.indexOf(filter) !== -1);
        card.classList.add('visible'); // make sure filtered-in cards are not left invisible
      });
    });
  });

  /* ---------- 9. Soft light that follows the mouse on cards ---------- */
  if (!reduceMotion) {
    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 10. Project results pop-up ---------- */
  var dialog = document.getElementById('project-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var dialogBody = dialog.querySelector('.dialog-body');
    document.querySelectorAll('.details-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tpl = btn.closest('.project-card').querySelector('template');
        dialogBody.innerHTML = '';
        dialogBody.appendChild(tpl.content.cloneNode(true));
        dialog.showModal();
        btn.setAttribute('data-last-opened', '');
      });
    });
    dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // click outside closes
    dialog.addEventListener('close', function () {
      var last = document.querySelector('[data-last-opened]');
      if (last) { last.removeAttribute('data-last-opened'); last.focus(); }
    });
  } else {
    // Very old browsers: hide the button, the GitHub link still works
    document.querySelectorAll('.details-btn').forEach(function (b) { b.hidden = true; });
  }

  /* ---------- 11. Skill tabs (also work with left/right arrow keys) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      if (next !== null) { e.preventDefault(); tabs[next].focus(); selectTab(tabs[next]); }
    });
  });
  // Stagger the chip animation
  document.querySelectorAll('.chips').forEach(function (list) {
    list.querySelectorAll('li').forEach(function (li, k) { li.style.setProperty('--i', k); });
  });

  /* ---------- 12. Copy email button ---------- */
  var copyBtn = document.getElementById('copy-email');
  var copyStatus = document.getElementById('copy-status');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.dataset.email;
      var done = function (msg) {
        copyBtn.textContent = msg;
        copyStatus.textContent = msg;
        setTimeout(function () { copyBtn.textContent = 'Copy email'; copyStatus.textContent = ''; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { done('Copied!'); }, function () { done('Copy failed'); });
      } else {
        done('Copy failed');
      }
    });
  }

  /* ---------- 13. Animated network background in the hero ---------- */
  var canvas = document.getElementById('net');
  var hero = document.getElementById('hero');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, points = [];
    var mouse = { x: -9999, y: -9999 };
    var LINK = 130, MOUSE_LINK = 170;

    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(90, Math.floor((w * h) / 14000));
      points = [];
      for (var k = 0; k < count; k++) {
        points.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.6 + 0.8
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      var a, b, dx, dy, d;
      for (var m = 0; m < points.length; m++) {
        a = points[m];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
      }
      for (var n = 0; n < points.length; n++) {
        a = points[n];
        for (var q = n + 1; q < points.length; q++) {
          b = points[q];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(92,200,255,' + ((1 - d / LINK) * 0.35) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_LINK) {
          ctx.strokeStyle = 'rgba(170,230,255,' + ((1 - d / MOUSE_LINK) * 0.6) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(170,225,255,0.9)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    var running = false, heroVisible = true;
    var loop = function () {
      if (!running) return;
      draw();
      requestAnimationFrame(loop);
    };
    var updateRunning = function () {
      var shouldRun = heroVisible && !document.hidden && !reduceMotion;
      if (shouldRun && !running) { running = true; requestAnimationFrame(loop); }
      else if (!shouldRun) { running = false; }
    };

    resize();
    draw();
    window.addEventListener('resize', function () { resize(); draw(); });

    if (!reduceMotion) {
      hero.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });

      // Pause the animation when the hero is off screen or the tab is hidden (saves battery)
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          heroVisible = entries[0].isIntersecting;
          updateRunning();
        }).observe(hero);
      }
      document.addEventListener('visibilitychange', updateRunning);
      updateRunning();
    }
  }
})();

/* ============================================================================
   CCDV — Practice / Method — page-local behaviour
   v0.6.7 — practice_method_six_stack_rail_refactor
   Scope: services.html only. Loaded after app.js.
   - Returns immediately when .practice-method-page is absent.
   - Creates no globals (IIFE). Guards against duplicate binding.
   - One IntersectionObserver for active-section state; no scroll/rAF spy loop.
   - Local tabs, accordion, carousel, mobile selector, rail sync only.
   - Does not fetch JSON and does not touch shared app initialisation.
   ========================================================================== */
(function () {
  'use strict';

  var page = document.querySelector('.practice-method-page');
  if (!page) return;
  if (page.dataset.pmBound === 'true') return;
  page.dataset.pmBound = 'true';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function getHeaderH() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--site-header-h');
    var n = parseInt(v, 10);
    return isNaN(n) ? 72 : n;
  }

  /* ---- BlackPrint node emphasis (Stack 01) ------------------------------ */
  function makeBpSync(id) {
    var bp = document.getElementById(id);
    if (!bp) return null;
    var nodes = [].slice.call(bp.querySelectorAll('[data-bp-node]'));
    if (!nodes.length) return null;
    return function (index) {
      nodes.forEach(function (n) {
        n.classList.toggle('is-active', Number(n.getAttribute('data-bp-node')) === index);
      });
    };
  }

  /* ---- Selector / editorial tabs (Stack 01, 02, 04A) -------------------- */
  function initTabs(root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = [].slice.call(root.querySelectorAll('[role="tabpanel"]'));
    if (tabs.length < 2 || tabs.length !== panels.length) return;

    var bpSync = root.getAttribute('data-bp-target') ? makeBpSync(root.getAttribute('data-bp-target')) : null;

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach(function (panel, i) { panel.hidden = i !== index; });
      if (bpSync) bpSync(index);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var last = tabs.length - 1;
        var to = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = i <= 0 ? last : i - 1;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = i >= last ? 0 : i + 1;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = last;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });

    root.dataset.enhanced = 'true';
    select(0, false);
  }

  /* ---- Accordion, single open (Stack 03, 05B, 06) ----------------------- */
  function initAccordion(root) {
    var items = [].slice.call(root.querySelectorAll('details'));
    if (!items.length) return;
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  /* ---- Carousel / stepped sequence (Stack 04B, 05A) --------------------- */
  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var slides = [].slice.call(root.querySelectorAll('[data-carousel-slide]'));
    if (!track || slides.length < 2) return;

    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var indexEl = root.querySelector('[data-carousel-index]');
    var totalEl = root.querySelector('[data-carousel-total]');
    var status = root.querySelector('[data-carousel-status]');
    var total = slides.length;
    var index = 0;

    if (totalEl) totalEl.textContent = pad(total);

    function render(announce) {
      track.style.transform = 'translateX(-' + (index * (100 / total)) + '%)';
      if (indexEl) indexEl.textContent = pad(index + 1);
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === total - 1;
      slides.forEach(function (s, i) {
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      if (announce && status) {
        var title = slides[index].getAttribute('data-carousel-title') || '';
        status.textContent = pad(index + 1) + ' / ' + pad(total) + (title ? ' — ' + title : '');
      }
    }

    function go(to, announce) {
      index = Math.max(0, Math.min(total - 1, to));
      render(announce);
    }

    if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
    if (next) next.addEventListener('click', function () { go(index + 1, true); });

    root.addEventListener('keydown', function (e) {
      if (e.target === prev || e.target === next) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, true); }
    });

    root.dataset.enhanced = 'true';
    render(false);
  }

  /* ---- Rail active-section + mobile selector ---------------------------- */
  function initRail() {
    var stacks = [].slice.call(page.querySelectorAll('[data-practice-stack]'));
    if (!stacks.length) return;

    var railLinks = {};
    [].forEach.call(page.querySelectorAll('[data-rail-link]'), function (a) {
      railLinks[a.getAttribute('data-rail-link')] = a;
    });
    var mindexLinks = {};
    [].forEach.call(page.querySelectorAll('[data-mindex-link]'), function (a) {
      mindexLinks[a.getAttribute('data-mindex-link')] = a;
    });

    var mCount = page.querySelector('[data-mindex-count]');
    var mLabel = page.querySelector('[data-mindex-label]');
    var mTotal = page.querySelector('[data-mindex-total]');
    var details = page.querySelector('[data-mindex]');
    var total = stacks.length;
    var currentId = null;

    if (mTotal) mTotal.textContent = pad(total);

    function setActive(id, idx) {
      if (id === currentId) return;
      currentId = id;
      Object.keys(railLinks).forEach(function (key) {
        if (key === id) railLinks[key].setAttribute('aria-current', 'true');
        else railLinks[key].removeAttribute('aria-current');
      });
      Object.keys(mindexLinks).forEach(function (key) {
        if (key === id) mindexLinks[key].setAttribute('aria-current', 'true');
        else mindexLinks[key].removeAttribute('aria-current');
      });
      if (mCount) mCount.textContent = pad(idx + 1);
      if (mLabel) mLabel.textContent = stacks[idx].getAttribute('data-stack-label') || '';
    }

    function computeFromRects() {
      var line = getHeaderH() + 24;
      var activeIdx = 0;
      stacks.forEach(function (s, i) {
        if (s.getBoundingClientRect().top - line <= 1) activeIdx = i;
      });
      setActive(stacks[activeIdx].getAttribute('data-stack-id'), activeIdx);
    }

    if (details) {
      [].forEach.call(page.querySelectorAll('[data-mindex-link]'), function (a) {
        a.addEventListener('click', function () { details.open = false; });
      });
    }

    if ('IntersectionObserver' in window) {
      var io = null;

      function build() {
        if (io) io.disconnect();
        var line = getHeaderH() + 24;
        var bottom = Math.max(0, window.innerHeight - line - 2);
        io = new IntersectionObserver(function (entries) {
          var hit = null;
          entries.forEach(function (e) { if (e.isIntersecting) hit = e.target; });
          if (hit) {
            setActive(hit.getAttribute('data-stack-id'), stacks.indexOf(hit));
          } else {
            computeFromRects();
          }
        }, { root: null, rootMargin: '-' + line + 'px 0px -' + bottom + 'px 0px', threshold: 0 });
        stacks.forEach(function (s) { io.observe(s); });
      }

      build();
      computeFromRects();

      var raf = null;
      window.addEventListener('resize', function () {
        if (raf) window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(function () { build(); computeFromRects(); });
      }, { passive: true });

      window.addEventListener('load', computeFromRects);
      window.addEventListener('hashchange', computeFromRects);
    } else {
      setActive(stacks[0].getAttribute('data-stack-id'), 0);
    }
  }

  /* ---- Boot ------------------------------------------------------------- */
  [].forEach.call(page.querySelectorAll('[data-pm-tabs]'), initTabs);
  [].forEach.call(page.querySelectorAll('[data-pm-accordion]'), initAccordion);
  [].forEach.call(page.querySelectorAll('[data-pm-carousel]'), initCarousel);
  initRail();
})();

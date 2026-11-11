(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Mở menu');
    menu.textContent = '☰';
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    menu.textContent = open ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });

  const tabs = [...document.querySelectorAll('.personality [role=tab]')];
  function activateTab(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); activateTab(next); next.focus(); }
    });
  });

  const expand = document.querySelector('.expand-all');
  const allDetails = [...document.querySelectorAll('#source-content .source-question')];
  function syncExpand() {
    const open = allDetails.every(item => item.open);
    expand.setAttribute('aria-expanded', String(open));
    expand.innerHTML = open ? 'Thu gọn tất cả <span aria-hidden="true">−</span>' : 'Mở tất cả câu trả lời <span aria-hidden="true">＋</span>';
  }
  expand.addEventListener('click', () => {
    const open = !allDetails.every(item => item.open);
    allDetails.forEach(item => { item.open = open; });
    syncExpand();
  });
  allDetails.forEach(item => item.addEventListener('toggle', syncExpand));
  syncExpand();

  const pageProgress = document.querySelector('.progress');
  const navIndicator = document.querySelector('.nav-indicator');
  function positionNavIndicator() {
    const current = nav.querySelector('a[aria-current=true]');
    if (!current || !navIndicator || !nav.clientWidth) return;
    navIndicator.style.width = current.offsetWidth + 'px';
    navIndicator.style.transform = 'translateX(' + current.offsetLeft + 'px)';
    navIndicator.classList.add('is-visible');
  }
  let progressFrame = 0;
  function updatePageProgress() {
    const total = document.documentElement.scrollHeight - innerHeight;
    pageProgress.style.width = (total > 0 ? Math.min(100, Math.max(0, scrollY / total * 100)) : 0) + '%';
    progressFrame = 0;
  }
  addEventListener('scroll', () => {
    if (!progressFrame) progressFrame = requestAnimationFrame(updatePageProgress);
  }, { passive: true });
  addEventListener('resize', () => { updatePageProgress(); positionNavIndicator(); });
  updatePageProgress();
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('seen'); revealObserver.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(item => revealObserver.observe(item));
    const navLinks = [...nav.querySelectorAll('a')];
    const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const activeObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      positionNavIndicator();
    }, { rootMargin: '-12% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => activeObserver.observe(section));
  }

  const section = document.getElementById('ban-day-du');
  const viewport = document.querySelector('.chapter-viewport');
  const track = document.getElementById('source-content');
  const cards = [...track.querySelectorAll('.chapter-card')];
  const pills = [...document.querySelectorAll('.chapter-pill')];
  const previous = document.querySelector('.chapter-prev');
  const next = document.querySelector('.chapter-next');
  const chapterProgress = document.querySelector('.chapter-progress-fill');
  const chapterCurrent = document.querySelector('.chapter-current');
  const chapterStatus = document.querySelector('.chapter-status');
  const pinMedia = matchMedia('(min-width: 1000px) and (min-height: 760px)');
  const steps = Math.max(1, cards.length - 1);
  let active = -1;
  let pinned = false;
  let offsets = [];
  let target = 0;
  let eased = 0;
  let velocity = 0;
  let lastFrame = null;
  let animationFrame = 0;
  let viewportFrame = 0;
  let printing = false;
  const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, value));
  const SPRING = 12;

  function setActive(index) {
    index = clamp(index, 0, cards.length - 1);
    if (index === active) return;
    active = index;
    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === index);
      if (i === index) card.setAttribute('aria-current', 'step');
      else card.removeAttribute('aria-current');
    });
    pills.forEach((pill, i) => {
      pill.classList.toggle('is-active', i === index);
      if (i === index) pill.setAttribute('aria-current', 'step');
      else pill.removeAttribute('aria-current');
    });
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    chapterCurrent.textContent = String(index + 1).padStart(2, '0');
    chapterStatus.textContent = 'Phần ' + (index + 1) + ' trên ' + cards.length + ': ' + cards[index].querySelector('h3').textContent;
    const pill = pills[index];
    const rail = pill.parentElement;
    const left = pill.offsetLeft - (rail.clientWidth - pill.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: motionBehavior() });
  }
  function measure() {
    const origin = cards[0].offsetLeft;
    offsets = cards.map(card => Math.max(0, card.offsetLeft - origin));
  }
  function travelAt(progress) {
    const slide = clamp(progress) * steps;
    const i0 = Math.min(offsets.length - 1, Math.floor(slide));
    const i1 = Math.min(offsets.length - 1, i0 + 1);
    return offsets[i0] + (offsets[i1] - offsets[i0]) * (slide - i0);
  }
  function stop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = null;
  }
  function render(now) {
    if (!pinned || printing) { stop(); return; }
    const dt = lastFrame === null ? 1 / 60 : Math.min(.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const acceleration = SPRING * SPRING * (target - eased) - 2 * SPRING * velocity;
    velocity += acceleration * dt;
    eased += velocity * dt;
    const settled = Math.abs(target - eased) < .0004 && Math.abs(velocity) < .0015;
    if (settled) { eased = target; velocity = 0; }
    track.style.transform = 'translate3d(' + (-travelAt(eased)) + 'px,0,0)';
    chapterProgress.style.transform = 'scaleX(' + clamp(eased) + ')';
    setActive(Math.round(clamp(eased) * steps));
    if (settled) { animationFrame = 0; lastFrame = null; }
    else animationFrame = requestAnimationFrame(render);
  }
  function schedule() {
    if (!pinned || printing) return;
    const rect = section.getBoundingClientRect();
    target = clamp(-rect.top / Math.max(1, section.offsetHeight - innerHeight));
    if (!animationFrame) animationFrame = requestAnimationFrame(render);
  }
  function syncNative() {
    viewportFrame = 0;
    if (pinned || printing) return;
    let nearest = 0;
    let distance = Infinity;
    offsets.forEach((offset, index) => {
      const delta = Math.abs(viewport.scrollLeft - offset);
      if (delta < distance) { distance = delta; nearest = index; }
    });
    setActive(nearest);
    chapterProgress.style.transform = 'scaleX(' + clamp(viewport.scrollLeft / Math.max(1, offsets.at(-1))) + ')';
  }
  function configure() {
    stop();
    const wasPinned = pinned;
    pinned = pinMedia.matches && !reducedMotion.matches && !printing;
    section.classList.toggle('is-pinned', pinned);
    measure();
    if (pinned) {
      viewport.scrollLeft = 0;
      const rect = section.getBoundingClientRect();
      target = eased = clamp(-rect.top / Math.max(1, section.offsetHeight - innerHeight));
      velocity = 0;
      track.style.transform = 'translate3d(' + (-travelAt(eased)) + 'px,0,0)';
      setActive(Math.round(eased * steps));
      chapterProgress.style.transform = 'scaleX(' + eased + ')';
    } else {
      track.style.transform = '';
      if (wasPinned && active >= 0) viewport.scrollLeft = offsets[active] || 0;
      syncNative();
    }
  }
  function goTo(index) {
    index = clamp(index, 0, cards.length - 1);
    if (pinned) {
      const start = scrollY + section.getBoundingClientRect().top;
      const range = Math.max(1, section.offsetHeight - innerHeight);
      window.scrollTo({ top: start + (index / steps) * range, behavior: motionBehavior() });
    } else {
      viewport.scrollTo({ left: offsets[index], behavior: motionBehavior() });
      // The next scroll event updates the selected chapter after a smooth swipe settles.
      if (reducedMotion.matches) syncNative();
    }
  }
  pills.forEach((pill, index) => pill.addEventListener('click', () => goTo(index)));
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  viewport.addEventListener('keydown', event => {
    // Vertical keys remain available for reading long answers inside each panel.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const destination = event.key === 'ArrowRight' ? active + 1 : event.key === 'ArrowLeft' ? active - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null;
    if (destination !== null) { event.preventDefault(); goTo(destination); }
  });
  // Keyboard focus on an off-screen answer brings its chapter into view.
  track.addEventListener('focusin', event => {
    const card = event.target.closest('.chapter-card');
    const index = cards.indexOf(card);
    if (index >= 0 && index !== active) goTo(index);
  });
  viewport.addEventListener('scroll', () => {
    if (pinned && viewport.scrollLeft !== 0) { viewport.scrollLeft = 0; return; }
    if (!viewportFrame) viewportFrame = requestAnimationFrame(syncNative);
  }, { passive: true });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', configure);
  pinMedia.addEventListener('change', configure);
  reducedMotion.addEventListener('change', configure);
  document.fonts?.ready.then(() => { measure(); configure(); positionNavIndicator(); });
  configure();

  let printState = [];
  addEventListener('beforeprint', () => {
    printState = allDetails.map(item => item.open);
    printing = true;
    stop();
    section.classList.remove('is-pinned');
    track.style.transform = '';
    allDetails.forEach(item => { item.open = true; });
  });
  addEventListener('afterprint', () => {
    allDetails.forEach((item, index) => { item.open = printState[index]; });
    printing = false;
    syncExpand();
    configure();
  });
})();

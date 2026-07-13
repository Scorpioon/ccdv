const GLOBAL_PATH = './content/global.json';
const HOME_PATH = './content/home.json';
const ABOUT_PATH = './content/about.json';
const WORK_PATH = './content/work.json';
const PRODUCTS_PATH = './content/products.json';

let globalContent = null;
let pageContent = null;
let formState = {};

const formFields = [
  { key: 'sessionLanguages', label: 'Idioma de sesi\u00f3n', name: 'session_language', type: 'single-pill' },
  { key: 'days', label: 'Mejor d\u00eda', name: 'best_day', type: 'multi-pill' },
  { key: 'times', label: 'Franja horaria', name: 'time_slot', type: 'multi-pill' },
  { key: 'backgrounds', label: 'Background', name: 'background', type: 'single-pill' },
  { key: 'levels', label: 'Nivel', name: 'level', type: 'single-pill' },
  { key: 'systems', label: 'Sistema operativo', name: 'os', type: 'single-pill' },
  { key: 'llms', label: 'LLMs que usas', name: 'llms', type: 'multi-pill' },
  { key: 'futureInterest', label: 'Inter\u00e9s en futuras sesiones', name: 'future_interest', type: 'single-pill' }
];

const formStages = [
  { id: 'session', title: 'Preferencias de sesi\u00f3n', fields: ['sessionLanguages', 'days', 'times'], required: ['sessionLanguages', 'days', 'times'] },
  { id: 'profile', title: 'Tu punto de partida', fields: ['backgrounds', 'levels', 'systems'], required: ['backgrounds', 'levels'] },
  { id: 'tools', title: 'Herramientas e inter\u00e9s', fields: ['llms', 'futureInterest'], required: ['futureInterest'] }
];

function detectPagePath() {
  if (document.getElementById('workCases')) return WORK_PATH;
  if (document.getElementById('aionShelf')) return PRODUCTS_PATH;
  if (document.body.querySelector('.section--about-hero')) return ABOUT_PATH;
  return HOME_PATH;
}

async function init() {
  const pagePath = detectPagePath();
  const [globalRes, pageRes] = await Promise.all([
    fetch(GLOBAL_PATH, { cache: 'no-store' }),
    fetch(pagePath, { cache: 'no-store' })
  ]);
  globalContent = await globalRes.json();
  pageContent = await pageRes.json();
  bindClock();
  bindFixedHeaderOffset();
  bindGlobal();
  if (pagePath === ABOUT_PATH) renderAbout();
  else if (pagePath === WORK_PATH) renderWork();
  else if (pagePath === PRODUCTS_PATH) renderProducts();
  else renderHome();
  setActiveNav();
  bindMobileMenu();
}

function textByPath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function bindGlobal() {
  document.querySelectorAll('[data-bind]').forEach(node => {
    const value = textByPath(pageContent, node.dataset.bind);
    if (typeof value === 'string') node.textContent = value;
  });
  const footerLocation = document.getElementById('footerLocation');
  const footerEmail = document.getElementById('footerEmail');
  if (footerLocation) footerLocation.textContent = globalContent.footer.location;
  if (footerEmail) {
    footerEmail.textContent = globalContent.footer.email;
    footerEmail.href = `mailto:${globalContent.footer.email}`;
  }
}

function renderHome() {
  bindHomeSchematic();
  renderLearnGrid();
  bindOverviewCarousel();
  renderAccordion();
  renderBullets();
  renderDynamicFormFields();
  bindSignupFormSubmit();
}

function renderLearnGrid() {
  const target = document.getElementById('learnGrid');
  if (!target) return;
  const icons = ['context', 'tools', 'design', 'workflow', 'guide', 'process', 'code', 'project'];
  target.innerHTML = pageContent.learn.items.map((item, i) => `
    <article class="mini-card">
      <span class="mini-card__icon mini-card__icon--${icons[i] || 'context'}" aria-hidden="true"></span>
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `).join('');
}


function bindOverviewCarousel() {
  const grid = document.getElementById('learnGrid');
  if (!grid) return;

  document.querySelectorAll('.learn-carousel-controls, .learn-carousel-dots').forEach(node => node.remove());

  const cards = [...grid.querySelectorAll('.mini-card')];
  if (!cards.length) return;

  const controls = document.createElement('div');
  controls.className = 'learn-carousel-controls';
  controls.setAttribute('aria-label', 'Overview carousel controls');

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'learn-carousel-arrow learn-carousel-arrow--prev';
  prev.setAttribute('aria-label', 'Anterior');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'learn-carousel-arrow learn-carousel-arrow--next';
  next.setAttribute('aria-label', 'Siguiente');

  const dots = document.createElement('div');
  dots.className = 'learn-carousel-dots';
  dots.setAttribute('aria-label', 'Overview carousel position');

  const dotButtons = cards.map((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `learn-carousel-dot${index === 0 ? ' is-active' : ''}`;
    dot.setAttribute('aria-label', `Ir al bloque ${index + 1}`);
    dot.addEventListener('click', () => scrollToIndex(index));
    dots.appendChild(dot);
    return dot;
  });

  controls.append(prev, dots, next);
  grid.insertAdjacentElement('afterend', controls);

  let activeIndex = 0;

  const getCardLeft = index => cards[index].offsetLeft - grid.offsetLeft;

  const scrollToIndex = index => {
    const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
    grid.scrollTo({ left: getCardLeft(safeIndex), behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollToIndex(activeIndex - 1));
  next.addEventListener('click', () => scrollToIndex(activeIndex + 1));

  const updateActiveDot = () => {
    const currentLeft = grid.scrollLeft;
    let nextIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(getCardLeft(index) - currentLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        nextIndex = index;
      }
    });

    activeIndex = nextIndex;

    dotButtons.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
    });

    prev.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
  };

  let frame = null;
  grid.addEventListener('scroll', () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(updateActiveDot);
  }, { passive: true });

  window.addEventListener('resize', updateActiveDot, { passive: true });
  updateActiveDot();
}
function renderAccordion() {
  const target = document.getElementById('audienceAccordion');
  if (!target) return;
  target.innerHTML = pageContent.audience.items.map((item, index) => `
    <div class="accordion__item ${index === 0 ? 'is-open' : ''}">
      <button class="accordion__button" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
        <span>${item.title}</span>
        <span class="accordion__plus" aria-hidden="true"></span>
      </button>
      <div class="accordion__panel"><p>${item.body}</p></div>
    </div>
  `).join('');
  const items = [...target.querySelectorAll('.accordion__item')];
  items.forEach(item => {
    const button = item.querySelector('.accordion__button');
    button.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      items.forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.accordion__button').setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function renderBullets() {
  const target = document.getElementById('session0Bullets');
  if (!target) return;
  target.innerHTML = pageContent.session0.bullets.map(item => `<li>${item}</li>`).join('');
}

function getFieldConfig(key) {
  return formFields.find(field => field.key === key);
}

function getFieldValue(key) {
  const value = formState[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function isFieldComplete(key) {
  return getFieldValue(key).length > 0;
}

function createHiddenInput(name) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  return input;
}

function createPillButton(label, selected = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `pill${selected ? ' is-selected' : ''}`;
  button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  button.textContent = label;
  return button;
}

function updateStageVisibility() {
  const email = document.querySelector('input[name="email"]');
  const emailValid = !!email && email.value.trim().length > 3 && email.checkValidity();

  document.querySelectorAll('.form-stage').forEach((stageNode, index) => {
    let visible = false;

    if (index === 0) visible = emailValid;
    if (index > 0) {
      const previousStage = formStages[index - 1];
      visible = previousStage.required.every(isFieldComplete);
    }

    stageNode.classList.toggle('is-hidden', !visible);
  });

  const finalArea = document.getElementById('formFinalArea');
  if (finalArea) {
    const lastStage = formStages[formStages.length - 1];
    const ready = lastStage.required.every(isFieldComplete);
    finalArea.classList.toggle('is-hidden', !ready);
  }
}

function setBackgroundOtherVisibility(value, wrapper) {
  const inlineWrap = wrapper ? wrapper.querySelector('.background-other-inline') : document.querySelector('.background-other-inline');
  const inlineInput = inlineWrap ? inlineWrap.querySelector('input') : null;
  const show = value === 'Otro';
  if (!inlineWrap) return;
  inlineWrap.classList.toggle('is-hidden', !show);
  if (!show && inlineInput) inlineInput.value = '';
}

function createSinglePillField(cfg, choices) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pill-field';
  wrapper.dataset.fieldKey = cfg.key;

  const label = document.createElement('span');
  label.className = 'pill-field__label';
  label.textContent = cfg.label;

  const group = document.createElement('div');
  group.className = 'pill-group';

  const hidden = createHiddenInput(cfg.name);
  formState[cfg.key] = '';

  const buttons = choices.map(choice => {
    const button = createPillButton(choice, false);
    button.addEventListener('click', () => {
      buttons.forEach(other => {
        other.classList.remove('is-selected');
        other.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      hidden.value = choice;
      formState[cfg.key] = choice;

      if (cfg.name === 'background') {
        setBackgroundOtherVisibility(choice, wrapper);
      }

      updateStageVisibility();
    });
    group.appendChild(button);
    return button;
  });

  wrapper.append(label, group, hidden);

  if (cfg.name === 'background') {
    const otherWrap = document.createElement('label');
    otherWrap.className = 'field background-other-inline is-hidden';
    otherWrap.innerHTML = `
      <span>Otro background</span>
      <input type="text" name="background_other">
    `;
    wrapper.appendChild(otherWrap);
  }

  return wrapper;
}

function createMultiPillField(cfg, choices) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pill-field';
  wrapper.dataset.fieldKey = cfg.key;

  const label = document.createElement('span');
  label.className = 'pill-field__label';
  label.textContent = cfg.label;

  const group = document.createElement('div');
  group.className = 'pill-group';

  const hidden = createHiddenInput(cfg.name);
  const selected = new Set();
  formState[cfg.key] = [];

  choices.forEach(choice => {
    const button = createPillButton(choice, false);
    button.addEventListener('click', () => {
      if (selected.has(choice)) {
        selected.delete(choice);
        button.classList.remove('is-selected');
        button.setAttribute('aria-pressed', 'false');
      } else {
        selected.add(choice);
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
      }

      const values = [...selected];
      formState[cfg.key] = values;
      hidden.value = values.join(', ');
      updateStageVisibility();
    });
    group.appendChild(button);
  });

  wrapper.append(label, group, hidden);
  return wrapper;
}

function createPillField(cfg, choices) {
  if (cfg.type === 'multi-pill') return createMultiPillField(cfg, choices);
  return createSinglePillField(cfg, choices);
}

function createFormStage(stage, index, source) {
  const stageWrap = document.createElement('section');
  stageWrap.className = `form-stage form-stage--${index} is-hidden`;
  stageWrap.dataset.stage = stage.id;

  const title = document.createElement('p');
  title.className = 'form-stage__title';
  title.textContent = stage.title;

  const grid = document.createElement('div');
  grid.className = 'form-stage__grid';

  stage.fields.forEach(key => {
    const cfg = getFieldConfig(key);
    if (!cfg) return;
    grid.appendChild(createPillField(cfg, source[key] || []));
  });

  stageWrap.append(title, grid);
  return stageWrap;
}

function renderDynamicFormFields() {
  const target = document.getElementById('dynamicFormFields');
  if (!target) return;

  const source = globalContent.formOptions;
  formState = {};
  target.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'form-progress-note';
  intro.textContent = 'Completa nombre y email para abrir las preferencias.';
  target.appendChild(intro);

  formStages.forEach((stage, index) => {
    target.appendChild(createFormStage(stage, index, source));
  });

  const noteField = document.querySelector('textarea[name="note"]')?.closest('.field');
  const submitButton = document.querySelector('.signup-form button[type="submit"]');

  if (noteField && submitButton) {
    const finalArea = document.createElement('div');
    finalArea.id = 'formFinalArea';
    finalArea.className = 'form-final-area is-hidden';
    noteField.parentNode.insertBefore(finalArea, noteField);
    finalArea.appendChild(noteField);
    finalArea.appendChild(submitButton);
  }

  bindProgressiveFormStart();
  updateStageVisibility();
}

function bindProgressiveFormStart() {
  const name = document.querySelector('input[name="name"]');
  const email = document.querySelector('input[name="email"]');
  [name, email].forEach(input => {
    if (!input) return;
    input.addEventListener('input', updateStageVisibility);
    input.addEventListener('blur', updateStageVisibility);
  });
}


function getConfiguredFormEndpoint(form) {
  const endpoint = form ? (form.dataset.appsScriptEndpoint || '').trim() : '';
  if (!endpoint) return '';
  if (endpoint === 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') return '';
  return endpoint;
}

function ensureSignupFormStatus(form) {
  let status = form.querySelector('.form-submit-status');
  if (status) return status;

  status = document.createElement('p');
  status.className = 'form-submit-status';
  status.setAttribute('aria-live', 'polite');

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton && submitButton.parentNode) {
    submitButton.parentNode.insertBefore(status, submitButton);
  } else {
    form.appendChild(status);
  }

  return status;
}

function setSignupSubmitting(form, isSubmitting, message = '') {
  const status = ensureSignupFormStatus(form);
  const submitButton = form.querySelector('button[type="submit"]');

  form.classList.toggle('is-submitting', isSubmitting);
  status.textContent = message;

  if (submitButton) {
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? 'Enviando...' : 'Enviar inscripción';
  }
}

function buildSignupFormData(form) {
  const formData = new FormData(form);
  formData.set('form_id', 'openvibe_session_0');
  formData.set('submitted_at', new Date().toISOString());
  formData.set('source_page', window.location.href);
  formData.set('user_agent', navigator.userAgent || '');
  return formData;
}

function bindSignupFormSubmit() {
  const form = document.querySelector('.signup-form');
  if (!form || form.dataset.submitBound === 'true') return;

  form.dataset.submitBound = 'true';

  form.addEventListener('submit', event => {
    const endpoint = getConfiguredFormEndpoint(form);

    if (!endpoint) {
      return;
    }

    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSignupSubmitting(form, true, 'Enviando inscripción...');

    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      body: buildSignupFormData(form)
    })
      .then(() => {
        window.location.href = './thanks.html';
      })
      .catch(error => {
        console.error(error);
        setSignupSubmitting(form, false, 'No se ha podido enviar. Revisa la conexión y prueba otra vez.');
      });
  });
}

function renderAbout() {
  const target = document.getElementById('aboutSections');
  if (!target) return;
  target.innerHTML = pageContent.sections.map(section => `
    <article class="about-block">
      <p class="section__kicker">${section.kicker || 'About'}</p>
      <h2>${section.title}</h2>
      <p>${section.body}</p>
    </article>
  `).join('');
}

function renderWork() {
  const target = document.getElementById('workCases');
  if (!target) return;
  const projects = (pageContent.projects || [])
    .filter(p => p.publicSafe)
    .sort((a, b) => a.order - b.order);

  projects.forEach((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    const anchorId = `project-${num}`;

    const article = document.createElement('article');
    article.className = 'work-case';
    article.id = anchorId;

    const info = document.createElement('div');
    info.className = 'work-case__info';

    const index = document.createElement('p');
    index.className = 'work-case__index';
    index.textContent = `Proyecto ${num}`;

    const h2 = document.createElement('h2');
    h2.className = 'work-case__title';
    h2.textContent = p.title;

    info.append(index, h2);

    const typeStatus = [p.type, p.status].filter(Boolean).join(' · ');
    if (typeStatus) {
      const type = document.createElement('p');
      type.className = 'work-case__type';
      type.textContent = typeStatus;
      info.appendChild(type);
    }

    const meta = document.createElement('dl');
    meta.className = 'work-case__meta';
    [['Problema', p.problem], ['Sistema', p.system], ['Output', p.output]].forEach(([label, value]) => {
      if (!value) return;
      const row = document.createElement('div');
      row.className = 'work-case__meta-row';
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      row.append(dt, dd);
      meta.appendChild(row);
    });
    if (meta.childNodes.length) info.appendChild(meta);

    if (p.publicNote) {
      const note = document.createElement('p');
      note.className = 'work-case__note';
      note.textContent = p.publicNote;
      info.appendChild(note);
    }

    const figure = document.createElement('figure');
    figure.className = 'work-case__visual';
    const frame = document.createElement('div');
    frame.className = 'work-case__frame';
    if (p.image) {
      const img = document.createElement('img');
      img.src = p.image;
      img.alt = p.imageAlt || p.title;
      img.loading = 'lazy';
      frame.appendChild(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'work-case__placeholder';
      placeholder.textContent = p.title;
      frame.appendChild(placeholder);
    }
    figure.appendChild(frame);

    article.append(info, figure);
    target.appendChild(article);
  });
}

// Home flagship schematic — "Por dónde se entra". Drives the five-input → CCDV
// core → five-output system map. All inputs and outputs stay visible as a
// system, and the active index lights one full route — input, inbound wire,
// core, outbound wire,
// output — together. Inputs are real <button>s (keyboard + aria-pressed); the
// SVG wires and the outputs column are decorative mirrors (aria-hidden), so the
// semantic path lives in each input's text. No data fetch, no render-order
// dependency beyond the markup.
function bindHomeSchematic() {
  const root = document.querySelector('[data-home-schematic]');
  if (!root) return;
  const inputs = [...root.querySelectorAll('[data-home-entry-index]')];
  if (!inputs.length) return;

  const outputs = [...root.querySelectorAll('[data-home-output-index]')];
  const inPaths = [...root.querySelectorAll('.home-entry-schematic__connectors--in [data-path-index]')];
  const outPaths = [...root.querySelectorAll('.home-entry-schematic__connectors--out [data-path-index]')];

  const activate = index => {
    inputs.forEach(el => {
      const on = Number(el.dataset.homeEntryIndex) === index;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    outputs.forEach(el => el.classList.toggle('is-active', Number(el.dataset.homeOutputIndex) === index));
    inPaths.forEach(el => el.classList.toggle('is-active', Number(el.dataset.pathIndex) === index));
    outPaths.forEach(el => el.classList.toggle('is-active', Number(el.dataset.pathIndex) === index));
    root.dataset.activeIndex = String(index);
  };

  inputs.forEach(el => {
    const index = Number(el.dataset.homeEntryIndex);
    el.addEventListener('mouseenter', () => activate(index));
    el.addEventListener('focusin', () => activate(index));
    el.addEventListener('click', () => activate(index));
  });

  activate(0);
}

function renderProducts() {
  const aionTarget = document.getElementById('aionShelf');
  const registryTarget = document.getElementById('registryGrid');
  if (!aionTarget && !registryTarget) return;

  const items = (pageContent.items || [])
    .filter(p => p.publicSafe || p.teaserOnly)
    .sort((a, b) => a.order - b.order);

  const AION_ACCENT_WHITELIST = ['neutral']; // CCDV v0.6.1 — codename accents retired

  if (aionTarget) {
    items.filter(p => p.group === 'aion').forEach(p => {
      const item = document.createElement('article');
      item.className = 'aion-shelf__item' + (p.status === 'private' ? ' aion-shelf__item--private' : '');
      item.dataset.productId = p.id;
      item.dataset.group = p.group;
      const accentValue = (p.accent && AION_ACCENT_WHITELIST.includes(p.accent)) ? p.accent : 'neutral';
      item.dataset.accent = accentValue;

      const code = document.createElement('p');
      code.className = 'aion-shelf__code';
      code.textContent = p.type || 'AION';

      const name = document.createElement('h3');
      name.className = 'aion-shelf__name';
      name.textContent = p.name;

      const meta = document.createElement('div');
      meta.className = 'aion-shelf__meta';

      if (p.body) {
        const body = document.createElement('p');
        body.className = 'aion-shelf__body';
        body.textContent = p.body;
        meta.appendChild(body);
      }

      const badge = document.createElement('span');
      badge.className = 'aion-shelf__status-badge';
      const dot = document.createElement('span');
      dot.className = 'aion-shelf__status-dot';
      dot.setAttribute('aria-hidden', 'true');
      badge.append(dot, p.status || '—');
      meta.appendChild(badge);

      item.append(code, name, meta);
      aionTarget.appendChild(item);
    });
  }

  if (registryTarget) {
    items.filter(p => p.group !== 'aion').forEach(p => {
      const card = document.createElement('article');
      card.className = 'registry-card';
      card.dataset.productId = p.id;
      card.dataset.group = p.group;

      if (p.icon) {
        const icon = document.createElement('span');
        icon.className = 'ccdv-card__icon ' + p.icon;
        icon.setAttribute('aria-hidden', 'true');
        card.appendChild(icon);
      }

      const name = document.createElement('h3');
      name.className = 'registry-card__name';
      name.textContent = p.name;
      card.appendChild(name);

      if (p.type) {
        const type = document.createElement('p');
        type.className = 'registry-card__type';
        type.textContent = p.type;
        card.appendChild(type);
      }

      if (p.body) {
        const body = document.createElement('p');
        body.className = 'registry-card__body';
        body.textContent = p.body;
        card.appendChild(body);
      }

      const footer = document.createElement('div');
      footer.className = 'registry-card__footer';
      const statusTag = document.createElement('span');
      statusTag.className = 'status-tag';
      statusTag.textContent = p.status || '—';
      footer.appendChild(statusTag);
      if (p.version) {
        const vTag = document.createElement('span');
        vTag.className = 'status-tag';
        vTag.textContent = p.version;
        footer.appendChild(vTag);
      }
      card.appendChild(footer);
      registryTarget.appendChild(card);
    });
  }
}

function bindFixedHeaderOffset() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const apply = () => {
    const height = Math.ceil(header.getBoundingClientRect().height || 72);
    document.documentElement.classList.add('has-fixed-header');
    document.body.classList.add('has-fixed-header');
    document.documentElement.style.setProperty('--site-header-h', `${height}px`);
  };

  apply();

  window.addEventListener('resize', apply, { passive: true });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(apply);
    observer.observe(header);
  }
}
function bindClock() {
  const clock = document.getElementById('clock');
  if (!clock) return;
  const update = () => {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    clock.textContent = `BARCELONA ${fmt}`;
  };
  update();
  setInterval(update, 1000);
}

function bindMobileMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('primaryNav');
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-open');
    nav.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.classList.toggle('is-open', !expanded);
    nav.classList.toggle('is-open', !expanded);
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });
}

function setActiveNav() {
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  if (!navLinks.length) return;
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const mark = () => {
    let active = sections[0];
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120) active = section;
    });
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${active.id}`));
  };
  mark();
  window.addEventListener('scroll', mark, { passive: true });
}

function bindMotionReveal() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = [
    ...document.querySelectorAll(
      '.ccdv-main > .section:not(.section--hero):not(.section--about-hero)'
    ),
  ];

  if (!targets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -16px 0px' });

  targets.forEach(el => {
    el.classList.add('will-reveal');
    io.observe(el);
  });
}

function renderContentFallback(message) {
  const targets = ['#workCases','#aionShelf','#registryGrid','#openvibeSessions','#sessionFaq','#signupForm'];
  for (const sel of targets) {
    const el = document.querySelector(sel);
    if (el) {
      const notice = document.createElement('p');
      notice.className = 'section__body';
      notice.textContent = message;
      el.appendChild(notice);
      return;
    }
  }
  const main = document.getElementById('top');
  if (main) {
    const notice = document.createElement('p');
    notice.className = 'section__body';
    notice.textContent = message;
    main.prepend(notice);
  }
}

init().catch(err => {
  console.error(err);
  renderContentFallback('No se ha podido cargar este contenido. Puedes recargar la página o contactar con CCDV.');
});
bindMotionReveal();

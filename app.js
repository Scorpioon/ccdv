const GLOBAL_PATH = './content/global.json';
const HOME_PATH = './content/home.json';
const ABOUT_PATH = './content/about.json';

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

async function init() {
  const isAbout = document.body.querySelector('.section--about-hero');
  const [globalRes, pageRes] = await Promise.all([
    fetch(GLOBAL_PATH, { cache: 'no-store' }),
    fetch(isAbout ? ABOUT_PATH : HOME_PATH, { cache: 'no-store' })
  ]);
  globalContent = await globalRes.json();
  pageContent = await pageRes.json();
  bindClock();
  bindFixedHeaderOffset();
  bindGlobal();
  if (isAbout) renderAbout(); else renderHome();
  setActiveNav();
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
        setSignupSubmitting(form, false, 'No se ha podido enviar. Revisa la conexiÃ³n y prueba otra vez.');
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

init().catch(err => console.error(err));

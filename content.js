/**
 * LinkedIn Reply Assistant - Content Script
 * Runs on LinkedIn messaging pages to detect recruiter messages,
 * classify intent, detect language, and suggest appropriate responses
 */

(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────
  const CONFIG = {
    PANEL_ID: 'lra-assistant-panel',
    CHECK_INTERVAL: 2000,
    DEBOUNCE_MS: 500,
    USER_NAME: 'Louis FONTAINE',
  };

  // ── Default response templates (FR + EN) ─────────────────────────
  const DEFAULT_TEMPLATES = {
    fr: {
      job_offer: `Bonjour {firstName},

Merci de m'avoir contacté et de m'avoir proposé cette opportunité. Elle m'a l'air très intéressante ! Cependant, je me dois de décliner, n'étant pour l'instant pas en recherche d'un nouvel emploi.

Restons en contact pour de futures opportunités,

Bien à vous,
Louis FONTAINE`,

      cooptation: `Bonjour {firstName},

Merci pour votre message. Je n'ai personne en tête pour le moment, mais je reviens vers vous si j'ai du nouveau.

Bien à vous,
Louis FONTAINE`,

      other: `Bonjour {firstName},

Merci pour votre message. Je reviens vers vous rapidement.

Bien à vous,
Louis FONTAINE`,
    },

    en: {
      job_offer: `Hi {firstName},

Thank you for reaching out and for this opportunity. It sounds really interesting! However, I must decline as I am not currently looking for a new position.

Let's stay in touch for future opportunities,

Best regards,
Louis FONTAINE`,

      cooptation: `Hi {firstName},

Thank you for your message. I don't have anyone in mind at the moment, but I'll get back to you if that changes.

Best regards,
Louis FONTAINE`,

      other: `Hi {firstName},

Thank you for your message. I'll get back to you shortly.

Best regards,
Louis FONTAINE`,
    },
  };

  let templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  let panelVisible = false;
  let lastAnalyzedMessage = '';
  let currentLanguage = 'fr';

  // ── Load saved templates from storage ────────────────────────────
  function loadTemplates() {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(['templates_v2', 'templates', 'userName'], (data) => {
        // Prefer v2 (bilingual) format, fall back to legacy
        if (data.templates_v2) {
          templates = { ...DEFAULT_TEMPLATES, ...data.templates_v2 };
        } else if (data.templates) {
          // Legacy: treat existing templates as French
          templates.fr = { ...templates.fr, ...data.templates };
        }
        if (data.userName) {
          CONFIG.USER_NAME = data.userName;
        }
      });
    }
  }

  // ── DOM Helpers ──────────────────────────────────────────────────

  function querySelector(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function querySelectorAll(selectors) {
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return els;
    }
    return [];
  }

  function getConversationPartnerName() {
    const nameSelectors = [
      '.msg-overlay-conversation-bubble--is-active .msg-overlay-conversation-bubble__header h2',
      '.msg-thread__link-to-profile h2',
      '.msg-entity-lockup__entity-title',
      '.msg-conversation-card__participant-names',
      '.msg-conversations-container__title-row h2',
      '.msg-thread .msg-entity-lockup__entity-title',
      'h2.msg-entity-lockup__entity-title',
      '[data-control-name="conversation_title"]',
      '.msg-overlay-bubble-header__title',
      '.msg-thread__title',
    ];
    const nameEl = querySelector(nameSelectors);
    return nameEl ? nameEl.textContent.trim() : '';
  }

  function getLatestReceivedMessages() {
    const messageSelectors = [
      '.msg-s-event-listitem__body',
      '.msg-s-message-group__msg',
      '.msg-s-event__content',
      '.msg-s-message-list-content .msg-s-event-listitem',
    ];
    const messageEls = querySelectorAll(messageSelectors);
    if (messageEls.length === 0) return '';
    return Array.from(messageEls).slice(-3).map(el => el.textContent.trim()).join('\n');
  }

  function getMessageInput() {
    const inputSelectors = [
      '.msg-form__contenteditable[contenteditable="true"]',
      '.msg-form__msg-content-container .msg-form__contenteditable',
      '[role="textbox"].msg-form__contenteditable',
      'div.msg-form__contenteditable',
    ];
    return querySelector(inputSelectors);
  }

  // ── UI Panel ─────────────────────────────────────────────────────

  function createPanel() {
    const existing = document.getElementById(CONFIG.PANEL_ID);
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;
    panel.innerHTML = `
      <div class="lra-header">
        <div class="lra-header-left">
          <span class="lra-logo">🤖</span>
          <span class="lra-title">Reply Assistant</span>
        </div>
        <div class="lra-header-right">
          <button class="lra-btn-minimize" title="Minimize">−</button>
          <button class="lra-btn-close" title="Close">×</button>
        </div>
      </div>
      <div class="lra-body">
        <div class="lra-badges-row">
          <div class="lra-intent-badge">
            <span class="lra-intent-icon"></span>
            <span class="lra-intent-text">Analysing…</span>
          </div>
          <div class="lra-lang-badge" title="Detected language">
            <span class="lra-lang-flag"></span>
            <span class="lra-lang-text"></span>
          </div>
        </div>
        <div class="lra-confidence">
          <div class="lra-confidence-bar"><div class="lra-confidence-fill"></div></div>
          <span class="lra-confidence-text"></span>
        </div>
        <div class="lra-response-preview">
          <textarea class="lra-response-text" rows="8" readonly></textarea>
        </div>
        <div class="lra-actions">
          <button class="lra-btn lra-btn-copy" title="Copy response">
            📋 Copy
          </button>
          <button class="lra-btn lra-btn-insert" title="Insert into message field">
            ✏️ Insert
          </button>
          <button class="lra-btn lra-btn-edit" title="Edit response">
            🔧 Edit
          </button>
        </div>
        <div class="lra-manual-actions">
          <span class="lra-manual-label">Override:</span>
          <button class="lra-btn-small lra-force-job">💼 Job</button>
          <button class="lra-btn-small lra-force-coopt">🤝 Referral</button>
          <button class="lra-btn-small lra-force-other">💬 Other</button>
          <span class="lra-manual-sep">|</span>
          <button class="lra-btn-small lra-force-fr">🇫🇷</button>
          <button class="lra-btn-small lra-force-en">🇬🇧</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // ── Event listeners ──────────────────────────────────────────
    panel.querySelector('.lra-btn-close').addEventListener('click', () => {
      panel.classList.add('lra-hidden');
      panelVisible = false;
    });

    panel.querySelector('.lra-btn-minimize').addEventListener('click', () => {
      panel.classList.toggle('lra-minimized');
    });

    panel.querySelector('.lra-btn-copy').addEventListener('click', () => {
      const text = panel.querySelector('.lra-response-text').value;
      navigator.clipboard.writeText(text).then(() => {
        showToast(currentLanguage === 'fr' ? 'Réponse copiée !' : 'Response copied!');
      });
    });

    panel.querySelector('.lra-btn-insert').addEventListener('click', () => {
      const text = panel.querySelector('.lra-response-text').value;
      insertIntoMessageBox(text);
    });

    panel.querySelector('.lra-btn-edit').addEventListener('click', () => {
      const textarea = panel.querySelector('.lra-response-text');
      textarea.readOnly = !textarea.readOnly;
      textarea.classList.toggle('lra-editable');
      if (!textarea.readOnly) textarea.focus();
    });

    // Force intent
    panel.querySelector('.lra-force-job').addEventListener('click', () => updatePanelWithIntent('job_offer', 1.0, currentLanguage));
    panel.querySelector('.lra-force-coopt').addEventListener('click', () => updatePanelWithIntent('cooptation', 1.0, currentLanguage));
    panel.querySelector('.lra-force-other').addEventListener('click', () => updatePanelWithIntent('other', 1.0, currentLanguage));

    // Force language
    panel.querySelector('.lra-force-fr').addEventListener('click', () => {
      currentLanguage = 'fr';
      lastAnalyzedMessage = ''; // force re-render
      analyzeCurrentConversation();
    });
    panel.querySelector('.lra-force-en').addEventListener('click', () => {
      currentLanguage = 'en';
      lastAnalyzedMessage = '';
      analyzeCurrentConversation();
    });

    return panel;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'lra-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('lra-toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('lra-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  function insertIntoMessageBox(text) {
    const input = getMessageInput();
    if (!input) {
      showToast(currentLanguage === 'fr' ? 'Champ de message non trouvé' : 'Message field not found');
      return;
    }
    input.focus();
    input.innerHTML = '';
    text.split('\n').forEach((line) => {
      const p = document.createElement('p');
      p.innerHTML = line.trim() === '' ? '<br>' : document.createTextNode(line).textContent;
      input.appendChild(p);
    });
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    showToast(currentLanguage === 'fr' ? 'Réponse insérée !' : 'Response inserted!');
  }

  // ── Panel Update Logic ───────────────────────────────────────────

  const INTENT_CONFIG = {
    fr: {
      job_offer:   { icon: '💼', label: 'Proposition d\'emploi',     color: '#0a66c2' },
      cooptation:  { icon: '🤝', label: 'Demande de cooptation',    color: '#057642' },
      other:       { icon: '💬', label: 'Autre message',            color: '#666666' },
    },
    en: {
      job_offer:   { icon: '💼', label: 'Job opportunity',          color: '#0a66c2' },
      cooptation:  { icon: '🤝', label: 'Referral request',         color: '#057642' },
      other:       { icon: '💬', label: 'Other message',            color: '#666666' },
    },
  };

  const LANG_DISPLAY = {
    fr: { flag: '🇫🇷', label: 'Français' },
    en: { flag: '🇬🇧', label: 'English' },
  };

  function updatePanelWithIntent(intent, confidence, language) {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (!panel) return;

    const lang = language || 'fr';
    currentLanguage = lang;
    const config = (INTENT_CONFIG[lang] || INTENT_CONFIG.fr)[intent] || INTENT_CONFIG.fr.other;
    const langDisplay = LANG_DISPLAY[lang] || LANG_DISPLAY.fr;
    const partnerName = getConversationPartnerName();
    const firstName = IntentClassifier.extractFirstName(partnerName);

    // Intent badge
    panel.querySelector('.lra-intent-icon').textContent = config.icon;
    panel.querySelector('.lra-intent-text').textContent = config.label;
    panel.querySelector('.lra-intent-badge').style.borderColor = config.color;

    // Language badge
    panel.querySelector('.lra-lang-flag').textContent = langDisplay.flag;
    panel.querySelector('.lra-lang-text').textContent = langDisplay.label;

    // Confidence
    const confPercent = Math.round(confidence * 100);
    panel.querySelector('.lra-confidence-fill').style.width = `${confPercent}%`;
    panel.querySelector('.lra-confidence-fill').style.backgroundColor = config.color;
    const confLabel = lang === 'fr' ? 'Confiance' : 'Confidence';
    panel.querySelector('.lra-confidence-text').textContent = `${confLabel} : ${confPercent}%`;

    // Pick the right template for this language + intent
    const langTemplates = templates[lang] || templates.fr;
    let response = langTemplates[intent] || langTemplates.other;
    response = response.replace(/\{firstName\}/g, firstName || (lang === 'fr' ? 'Bonjour' : 'Hi'));
    response = response.replace(/\{name\}/g, partnerName || '');
    response = response.replace(/\{userName\}/g, CONFIG.USER_NAME);

    const textarea = panel.querySelector('.lra-response-text');
    textarea.value = response;
    textarea.readOnly = true;
    textarea.classList.remove('lra-editable');
  }

  // ── Main Analysis Loop ───────────────────────────────────────────

  function analyzeCurrentConversation() {
    const messageText = getLatestReceivedMessages();
    if (!messageText || messageText === lastAnalyzedMessage) return;
    lastAnalyzedMessage = messageText;

    const result = IntentClassifier.classify(messageText);

    if (result.intent !== 'other' || result.scores.job > 0 || result.scores.cooptation > 0) {
      let panel = document.getElementById(CONFIG.PANEL_ID);
      if (!panel) panel = createPanel();
      panel.classList.remove('lra-hidden');
      panelVisible = true;
      updatePanelWithIntent(result.intent, result.confidence, result.language);
    }
  }

  // ── Floating trigger button ──────────────────────────────────────

  function createTriggerButton() {
    const btn = document.createElement('button');
    btn.id = 'lra-trigger-btn';
    btn.innerHTML = '🤖';
    btn.title = 'LinkedIn Reply Assistant';
    btn.addEventListener('click', () => {
      let panel = document.getElementById(CONFIG.PANEL_ID);
      if (!panel) panel = createPanel();
      panel.classList.toggle('lra-hidden');
      panelVisible = !panel.classList.contains('lra-hidden');
      if (panelVisible) {
        lastAnalyzedMessage = '';
        analyzeCurrentConversation();
      }
    });
    document.body.appendChild(btn);
  }

  // ── Initialization ───────────────────────────────────────────────

  function init() {
    console.log('[LinkedIn Reply Assistant] Initializing...');
    loadTemplates();
    createTriggerButton();
    setInterval(analyzeCurrentConversation, CONFIG.CHECK_INTERVAL);
    const observer = new MutationObserver(debounce(() => analyzeCurrentConversation(), CONFIG.DEBOUNCE_MS));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    console.log('[LinkedIn Reply Assistant] Ready!');
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

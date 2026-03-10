/**
 * LinkedIn Reply Assistant - Content Script
 * Runs on LinkedIn messaging pages to detect recruiter messages
 * and suggest appropriate responses
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

  // ── Default response templates ───────────────────────────────────
  const DEFAULT_TEMPLATES = {
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
Louis FONTAINE`
  };

  let templates = { ...DEFAULT_TEMPLATES };
  let panelVisible = false;
  let lastAnalyzedMessage = '';

  // ── Load saved templates from storage ────────────────────────────
  function loadTemplates() {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(['templates', 'userName'], (data) => {
        if (data.templates) {
          templates = { ...DEFAULT_TEMPLATES, ...data.templates };
        }
        if (data.userName) {
          CONFIG.USER_NAME = data.userName;
        }
      });
    }
  }

  // ── DOM Helpers ──────────────────────────────────────────────────

  /**
   * Try multiple selectors to find an element (LinkedIn changes DOM often)
   */
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

  /**
   * Get the name of the current conversation partner
   */
  function getConversationPartnerName() {
    const nameSelectors = [
      // Thread header name
      '.msg-overlay-conversation-bubble--is-active .msg-overlay-conversation-bubble__header h2',
      '.msg-thread__link-to-profile h2',
      '.msg-entity-lockup__entity-title',
      '.msg-conversation-card__participant-names',
      // Full page messaging
      '.msg-conversations-container__title-row h2',
      '.msg-thread .msg-entity-lockup__entity-title',
      'h2.msg-entity-lockup__entity-title',
      // Newer LinkedIn layouts
      '[data-control-name="conversation_title"]',
      '.msg-overlay-bubble-header__title',
      '.msg-thread__title',
    ];

    const nameEl = querySelector(nameSelectors);
    if (nameEl) {
      return nameEl.textContent.trim();
    }
    return '';
  }

  /**
   * Get the latest messages in the current conversation (from the other person)
   */
  function getLatestReceivedMessages() {
    const messageSelectors = [
      '.msg-s-event-listitem__body',
      '.msg-s-message-group__msg',
      '.msg-s-event__content',
      '.msg-s-message-list-content .msg-s-event-listitem',
    ];

    const messageEls = querySelectorAll(messageSelectors);
    if (messageEls.length === 0) return '';

    // Get the last few messages (concatenated) to have context
    const recentMessages = Array.from(messageEls)
      .slice(-3)
      .map(el => el.textContent.trim())
      .join('\n');

    return recentMessages;
  }

  /**
   * Get the LinkedIn message input box
   */
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
    // Remove existing panel if any
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
          <button class="lra-btn-minimize" title="Réduire">−</button>
          <button class="lra-btn-close" title="Fermer">×</button>
        </div>
      </div>
      <div class="lra-body">
        <div class="lra-intent-badge">
          <span class="lra-intent-icon"></span>
          <span class="lra-intent-text">Analyse en cours...</span>
        </div>
        <div class="lra-confidence">
          <div class="lra-confidence-bar"><div class="lra-confidence-fill"></div></div>
          <span class="lra-confidence-text"></span>
        </div>
        <div class="lra-response-preview">
          <textarea class="lra-response-text" rows="8" readonly></textarea>
        </div>
        <div class="lra-actions">
          <button class="lra-btn lra-btn-copy" title="Copier la réponse">
            📋 Copier
          </button>
          <button class="lra-btn lra-btn-insert" title="Insérer dans le champ de message">
            ✏️ Insérer
          </button>
          <button class="lra-btn lra-btn-edit" title="Modifier la réponse">
            🔧 Modifier
          </button>
        </div>
        <div class="lra-manual-actions">
          <span class="lra-manual-label">Forcer le type :</span>
          <button class="lra-btn-small lra-force-job">💼 Offre</button>
          <button class="lra-btn-small lra-force-coopt">🤝 Cooptation</button>
          <button class="lra-btn-small lra-force-other">💬 Autre</button>
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
        showToast('Réponse copiée !');
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
      if (!textarea.readOnly) {
        textarea.focus();
      }
    });

    // Force intent buttons
    panel.querySelector('.lra-force-job').addEventListener('click', () => {
      updatePanelWithIntent('job_offer', 1.0);
    });
    panel.querySelector('.lra-force-coopt').addEventListener('click', () => {
      updatePanelWithIntent('cooptation', 1.0);
    });
    panel.querySelector('.lra-force-other').addEventListener('click', () => {
      updatePanelWithIntent('other', 1.0);
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
      showToast('Champ de message non trouvé');
      return;
    }

    // Focus the input
    input.focus();

    // Clear existing content
    input.innerHTML = '';

    // Create paragraph elements for each line (LinkedIn uses <p> tags)
    const lines = text.split('\n');
    lines.forEach((line) => {
      const p = document.createElement('p');
      if (line.trim() === '') {
        p.innerHTML = '<br>';
      } else {
        p.textContent = line;
      }
      input.appendChild(p);
    });

    // Trigger input event so LinkedIn registers the change
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    showToast('Réponse insérée !');
  }

  // ── Panel Update Logic ───────────────────────────────────────────

  const INTENT_CONFIG = {
    job_offer: {
      icon: '💼',
      label: 'Proposition d\'emploi',
      color: '#0a66c2',
    },
    cooptation: {
      icon: '🤝',
      label: 'Demande de cooptation',
      color: '#057642',
    },
    other: {
      icon: '💬',
      label: 'Autre message',
      color: '#666666',
    },
  };

  function updatePanelWithIntent(intent, confidence) {
    const panel = document.getElementById(CONFIG.PANEL_ID);
    if (!panel) return;

    const config = INTENT_CONFIG[intent] || INTENT_CONFIG.other;
    const partnerName = getConversationPartnerName();
    const firstName = IntentClassifier.extractFirstName(partnerName);

    // Update intent badge
    panel.querySelector('.lra-intent-icon').textContent = config.icon;
    panel.querySelector('.lra-intent-text').textContent = config.label;
    panel.querySelector('.lra-intent-badge').style.borderColor = config.color;

    // Update confidence bar
    const confPercent = Math.round(confidence * 100);
    panel.querySelector('.lra-confidence-fill').style.width = `${confPercent}%`;
    panel.querySelector('.lra-confidence-fill').style.backgroundColor = config.color;
    panel.querySelector('.lra-confidence-text').textContent = `Confiance : ${confPercent}%`;

    // Generate response
    let response = templates[intent] || templates.other;
    response = response.replace(/\{firstName\}/g, firstName || 'Bonjour');
    response = response.replace(/\{name\}/g, partnerName || '');
    response = response.replace(/\{userName\}/g, CONFIG.USER_NAME);

    // Update response textarea
    const textarea = panel.querySelector('.lra-response-text');
    textarea.value = response;
    textarea.readOnly = true;
    textarea.classList.remove('lra-editable');
  }

  // ── Main Analysis Loop ───────────────────────────────────────────

  function analyzeCurrentConversation() {
    const messageText = getLatestReceivedMessages();

    // Don't re-analyze the same message
    if (!messageText || messageText === lastAnalyzedMessage) return;
    lastAnalyzedMessage = messageText;

    const result = IntentClassifier.classify(messageText);

    // Only show panel for classified messages
    if (result.intent !== 'other' || result.scores.job > 0 || result.scores.cooptation > 0) {
      let panel = document.getElementById(CONFIG.PANEL_ID);
      if (!panel) {
        panel = createPanel();
      }
      panel.classList.remove('lra-hidden');
      panelVisible = true;
      updatePanelWithIntent(result.intent, result.confidence);
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
      if (!panel) {
        panel = createPanel();
      }
      panel.classList.toggle('lra-hidden');
      panelVisible = !panel.classList.contains('lra-hidden');

      if (panelVisible) {
        // Force analysis
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

    // Periodic check for new messages
    setInterval(analyzeCurrentConversation, CONFIG.CHECK_INTERVAL);

    // Also observe DOM mutations for conversation changes
    const observer = new MutationObserver(debounce(() => {
      analyzeCurrentConversation();
    }, CONFIG.DEBOUNCE_MS));

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    console.log('[LinkedIn Reply Assistant] Ready!');
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

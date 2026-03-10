/**
 * LinkedIn Reply Assistant - Popup Script
 * Manages settings, bilingual templates, and stats
 */

// ── Default templates (keep in sync with background.js) ───────────
const DEFAULTS = {
  fr: {
    job_offer: `Bonjour {firstName},\n\nMerci de m'avoir contacté et de m'avoir proposé cette opportunité. Elle m'a l'air très intéressante ! Cependant, je me dois de décliner, n'étant pour l'instant pas en recherche d'un nouvel emploi.\n\nRestons en contact pour de futures opportunités,\n\nBien à vous,\nLouis FONTAINE`,
    cooptation: `Bonjour {firstName},\n\nMerci pour votre message. Je n'ai personne en tête pour le moment, mais je reviens vers vous si j'ai du nouveau.\n\nBien à vous,\nLouis FONTAINE`,
    other: `Bonjour {firstName},\n\nMerci pour votre message. Je reviens vers vous rapidement.\n\nBien à vous,\nLouis FONTAINE`,
  },
  en: {
    job_offer: `Hi {firstName},\n\nThank you for reaching out and for this opportunity. It sounds really interesting! However, I must decline as I am not currently looking for a new position.\n\nLet's stay in touch for future opportunities,\n\nBest regards,\nLouis FONTAINE`,
    cooptation: `Hi {firstName},\n\nThank you for your message. I don't have anyone in mind at the moment, but I'll get back to you if that changes.\n\nBest regards,\nLouis FONTAINE`,
    other: `Hi {firstName},\n\nThank you for your message. I'll get back to you shortly.\n\nBest regards,\nLouis FONTAINE`,
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // ── Tab Navigation ─────────────────────────────────────────────
  const tabs = document.querySelectorAll('.popup-tab');
  const contents = document.querySelectorAll('.popup-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
    });
  });

  // ── Load everything ────────────────────────────────────────────
  chrome.storage.sync.get(['userName', 'autoDetect', 'showNotif', 'templates_v2', 'stats'], (data) => {
    if (data.userName) document.getElementById('userName').value = data.userName;
    document.getElementById('autoDetect').checked = data.autoDetect !== false;
    document.getElementById('showNotif').checked = data.showNotif !== false;

    const tpl = data.templates_v2 || DEFAULTS;

    // French
    document.getElementById('tpl-fr-job-offer').value   = (tpl.fr && tpl.fr.job_offer)   || DEFAULTS.fr.job_offer;
    document.getElementById('tpl-fr-cooptation').value   = (tpl.fr && tpl.fr.cooptation)  || DEFAULTS.fr.cooptation;
    document.getElementById('tpl-fr-other').value        = (tpl.fr && tpl.fr.other)       || DEFAULTS.fr.other;

    // English
    document.getElementById('tpl-en-job-offer').value    = (tpl.en && tpl.en.job_offer)   || DEFAULTS.en.job_offer;
    document.getElementById('tpl-en-cooptation').value   = (tpl.en && tpl.en.cooptation)  || DEFAULTS.en.cooptation;
    document.getElementById('tpl-en-other').value        = (tpl.en && tpl.en.other)       || DEFAULTS.en.other;

    // Stats
    if (data.stats) {
      document.getElementById('stat-analyzed').textContent = data.stats.messagesAnalyzed || 0;
      document.getElementById('stat-copied').textContent   = data.stats.repliesCopied || 0;
      document.getElementById('stat-inserted').textContent = data.stats.repliesInserted || 0;
    }
  });

  // ── Save Settings ──────────────────────────────────────────────
  document.getElementById('saveSettings').addEventListener('click', () => {
    chrome.storage.sync.set({
      userName: document.getElementById('userName').value,
      autoDetect: document.getElementById('autoDetect').checked,
      showNotif: document.getElementById('showNotif').checked,
    }, () => showToast('Settings saved!'));
  });

  // ── Save / Reset French templates ──────────────────────────────
  document.getElementById('saveTemplatesFr').addEventListener('click', () => {
    chrome.storage.sync.get(['templates_v2'], (data) => {
      const tpl = data.templates_v2 || JSON.parse(JSON.stringify(DEFAULTS));
      tpl.fr = {
        job_offer:   document.getElementById('tpl-fr-job-offer').value,
        cooptation:  document.getElementById('tpl-fr-cooptation').value,
        other:       document.getElementById('tpl-fr-other').value,
      };
      chrome.storage.sync.set({ templates_v2: tpl }, () => showToast('French templates saved!'));
    });
  });

  document.getElementById('resetTemplatesFr').addEventListener('click', () => {
    document.getElementById('tpl-fr-job-offer').value  = DEFAULTS.fr.job_offer;
    document.getElementById('tpl-fr-cooptation').value = DEFAULTS.fr.cooptation;
    document.getElementById('tpl-fr-other').value      = DEFAULTS.fr.other;
    chrome.storage.sync.get(['templates_v2'], (data) => {
      const tpl = data.templates_v2 || JSON.parse(JSON.stringify(DEFAULTS));
      tpl.fr = { ...DEFAULTS.fr };
      chrome.storage.sync.set({ templates_v2: tpl }, () => showToast('French templates reset!'));
    });
  });

  // ── Save / Reset English templates ─────────────────────────────
  document.getElementById('saveTemplatesEn').addEventListener('click', () => {
    chrome.storage.sync.get(['templates_v2'], (data) => {
      const tpl = data.templates_v2 || JSON.parse(JSON.stringify(DEFAULTS));
      tpl.en = {
        job_offer:   document.getElementById('tpl-en-job-offer').value,
        cooptation:  document.getElementById('tpl-en-cooptation').value,
        other:       document.getElementById('tpl-en-other').value,
      };
      chrome.storage.sync.set({ templates_v2: tpl }, () => showToast('English templates saved!'));
    });
  });

  document.getElementById('resetTemplatesEn').addEventListener('click', () => {
    document.getElementById('tpl-en-job-offer').value  = DEFAULTS.en.job_offer;
    document.getElementById('tpl-en-cooptation').value = DEFAULTS.en.cooptation;
    document.getElementById('tpl-en-other').value      = DEFAULTS.en.other;
    chrome.storage.sync.get(['templates_v2'], (data) => {
      const tpl = data.templates_v2 || JSON.parse(JSON.stringify(DEFAULTS));
      tpl.en = { ...DEFAULTS.en };
      chrome.storage.sync.set({ templates_v2: tpl }, () => showToast('English templates reset!'));
    });
  });

  // ── Reset Stats ────────────────────────────────────────────────
  document.getElementById('resetStats').addEventListener('click', () => {
    const stats = { messagesAnalyzed: 0, repliesCopied: 0, repliesInserted: 0 };
    chrome.storage.sync.set({ stats }, () => {
      document.getElementById('stat-analyzed').textContent = '0';
      document.getElementById('stat-copied').textContent = '0';
      document.getElementById('stat-inserted').textContent = '0';
      showToast('Stats reset!');
    });
  });

  // ── Toast helper ───────────────────────────────────────────────
  function showToast(message) {
    let toast = document.querySelector('.popup-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'popup-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
});

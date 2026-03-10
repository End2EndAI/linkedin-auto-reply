/**
 * LinkedIn Reply Assistant - Popup Script
 * Manages settings, templates, and stats
 */

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

  // ── Load Settings ──────────────────────────────────────────────
  chrome.storage.sync.get(['userName', 'autoDetect', 'showNotif', 'templates', 'stats'], (data) => {
    // Settings
    if (data.userName) {
      document.getElementById('userName').value = data.userName;
    }
    document.getElementById('autoDetect').checked = data.autoDetect !== false;
    document.getElementById('showNotif').checked = data.showNotif !== false;

    // Templates
    if (data.templates) {
      if (data.templates.job_offer) {
        document.getElementById('tpl-job-offer').value = data.templates.job_offer;
      }
      if (data.templates.cooptation) {
        document.getElementById('tpl-cooptation').value = data.templates.cooptation;
      }
      if (data.templates.other) {
        document.getElementById('tpl-other').value = data.templates.other;
      }
    }

    // Stats
    if (data.stats) {
      document.getElementById('stat-analyzed').textContent = data.stats.messagesAnalyzed || 0;
      document.getElementById('stat-copied').textContent = data.stats.repliesCopied || 0;
      document.getElementById('stat-inserted').textContent = data.stats.repliesInserted || 0;
    }
  });

  // ── Save Settings ──────────────────────────────────────────────
  document.getElementById('saveSettings').addEventListener('click', () => {
    const settings = {
      userName: document.getElementById('userName').value,
      autoDetect: document.getElementById('autoDetect').checked,
      showNotif: document.getElementById('showNotif').checked,
    };
    chrome.storage.sync.set(settings, () => {
      showToast('Paramètres sauvegardés !');
    });
  });

  // ── Save Templates ─────────────────────────────────────────────
  document.getElementById('saveTemplates').addEventListener('click', () => {
    const templates = {
      job_offer: document.getElementById('tpl-job-offer').value,
      cooptation: document.getElementById('tpl-cooptation').value,
      other: document.getElementById('tpl-other').value,
    };
    chrome.storage.sync.set({ templates }, () => {
      showToast('Templates sauvegardés !');
    });
  });

  // ── Reset Templates ────────────────────────────────────────────
  document.getElementById('resetTemplates').addEventListener('click', () => {
    const defaults = {
      job_offer: `Bonjour {firstName},\n\nMerci de m'avoir contacté et de m'avoir proposé cette opportunité. Elle m'a l'air très intéressante ! Cependant, je me dois de décliner, n'étant pour l'instant pas en recherche d'un nouvel emploi.\n\nRestons en contact pour de futures opportunités,\n\nBien à vous,\nLouis FONTAINE`,
      cooptation: `Bonjour {firstName},\n\nMerci pour votre message. Je n'ai personne en tête pour le moment, mais je reviens vers vous si j'ai du nouveau.\n\nBien à vous,\nLouis FONTAINE`,
      other: `Bonjour {firstName},\n\nMerci pour votre message. Je reviens vers vous rapidement.\n\nBien à vous,\nLouis FONTAINE`
    };

    document.getElementById('tpl-job-offer').value = defaults.job_offer;
    document.getElementById('tpl-cooptation').value = defaults.cooptation;
    document.getElementById('tpl-other').value = defaults.other;

    chrome.storage.sync.set({ templates: defaults }, () => {
      showToast('Templates réinitialisés !');
    });
  });

  // ── Reset Stats ────────────────────────────────────────────────
  document.getElementById('resetStats').addEventListener('click', () => {
    const stats = { messagesAnalyzed: 0, repliesCopied: 0, repliesInserted: 0 };
    chrome.storage.sync.set({ stats }, () => {
      document.getElementById('stat-analyzed').textContent = '0';
      document.getElementById('stat-copied').textContent = '0';
      document.getElementById('stat-inserted').textContent = '0';
      showToast('Statistiques réinitialisées !');
    });
  });

  // ── Toast ──────────────────────────────────────────────────────
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

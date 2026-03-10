/**
 * LinkedIn Reply Assistant - Service Worker (Background)
 * Handles extension lifecycle and storage
 */

// Set default templates on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      userName: 'Louis FONTAINE',
      templates: {
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
      },
      stats: {
        messagesAnalyzed: 0,
        repliesCopied: 0,
        repliesInserted: 0
      }
    });
    console.log('[LinkedIn Reply Assistant] Extension installed, defaults set.');
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TEMPLATES') {
    chrome.storage.sync.get(['templates', 'userName'], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  if (message.type === 'UPDATE_STATS') {
    chrome.storage.sync.get(['stats'], (data) => {
      const stats = data.stats || {};
      const key = message.stat;
      stats[key] = (stats[key] || 0) + 1;
      chrome.storage.sync.set({ stats });
    });
  }
});

/**
 * LinkedIn Reply Assistant - Service Worker (Background)
 * Handles extension lifecycle and bilingual template storage
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      userName: 'Louis FONTAINE',
      templates_v2: {
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
      },
      stats: {
        messagesAnalyzed: 0,
        repliesCopied: 0,
        repliesInserted: 0,
      },
    });
    console.log('[LinkedIn Reply Assistant] Extension installed, defaults set.');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TEMPLATES') {
    chrome.storage.sync.get(['templates_v2', 'userName'], (data) => sendResponse(data));
    return true;
  }
  if (message.type === 'UPDATE_STATS') {
    chrome.storage.sync.get(['stats'], (data) => {
      const stats = data.stats || {};
      stats[message.stat] = (stats[message.stat] || 0) + 1;
      chrome.storage.sync.set({ stats });
    });
  }
});

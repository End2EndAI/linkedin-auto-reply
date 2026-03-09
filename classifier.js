/**
 * LinkedIn Message Intent Classifier
 * Classifies recruiter messages into: job_offer, cooptation, or other
 * Uses keyword scoring with French and English support
 */

const IntentClassifier = (() => {
  // ── Keyword dictionaries with weights ──────────────────────────────
  const JOB_OFFER_KEYWORDS = {
    // French - strong signals
    'poste': 3,
    'opportunité': 3,
    'opportunite': 3,
    'mission': 2,
    'cdi': 4,
    'cdd': 4,
    'freelance': 3,
    'rejoindre': 3,
    'recrute': 4,
    'recrutement': 4,
    'candidature': 4,
    'profil correspond': 4,
    'profil intéressant': 3,
    'profil interessant': 3,
    'votre profil': 2,
    'salaire': 3,
    'rémunération': 3,
    'remuneration': 3,
    'package': 2,
    'entretien': 3,
    'échange téléphonique': 3,
    'appel': 1,
    'en recherche': 2,
    'offre d\'emploi': 5,
    'fiche de poste': 5,
    'description de poste': 5,
    'intéresser': 2,
    'intégrer': 2,
    'integrer': 2,
    'équipe': 1,
    'client recherche': 3,
    'client final': 3,
    'entreprise recherche': 3,
    'tech lead': 3,
    'développeur': 2,
    'developpeur': 2,
    'ingénieur': 2,
    'ingenieur': 2,
    'manager': 1,
    'senior': 1,
    'télétravail': 2,
    'teletravail': 2,
    'remote': 2,
    'hybrid': 1,
    'hybride': 1,
    'disponibilité': 2,
    'disponibilite': 2,
    'mobilité': 2,
    'mobilite': 2,
    'tj': 2,
    'tjm': 3,
    'taux journalier': 3,
    'contrat': 2,

    // English - strong signals
    'position': 3,
    'opportunity': 3,
    'role': 2,
    'hiring': 4,
    'job': 3,
    'offer': 2,
    'recruit': 4,
    'talent acquisition': 4,
    'your profile': 2,
    'impressed by': 2,
    'interested in': 2,
    'open to': 2,
    'salary': 3,
    'compensation': 3,
    'interview': 3,
    'schedule a call': 3,
    'quick chat': 2,
    'full-time': 3,
    'part-time': 3,
    'permanent': 2,
    'on behalf of': 3,
    'exciting company': 2,
    'growing team': 2,
    'tech stack': 2
  };

  const COOPTATION_KEYWORDS = {
    // French - strong signals
    'cooptation': 5,
    'coopter': 5,
    'recommander': 4,
    'recommandation': 4,
    'connaissez-vous': 4,
    'connaissez vous': 4,
    'connais-tu': 4,
    'connais tu': 4,
    'quelqu\'un dans votre réseau': 5,
    'quelqu\'un dans ton réseau': 5,
    'votre réseau': 3,
    'ton réseau': 3,
    'référence': 3,
    'reference': 3,
    'référer': 4,
    'referer': 4,
    'parrainage': 4,
    'parrainer': 4,
    'prime de cooptation': 5,
    'bonus de cooptation': 5,
    'profil à recommander': 5,
    'connaissance qui': 4,
    'personne de votre entourage': 4,
    'dans votre entourage': 3,
    'partager cette offre': 4,
    'diffuser': 2,
    'transmettre': 2,
    'faire suivre': 3,

    // English - strong signals
    'referral': 5,
    'refer': 4,
    'recommend someone': 5,
    'know someone': 5,
    'know anybody': 4,
    'anyone in your network': 5,
    'your network': 3,
    'referral bonus': 5,
    'referral program': 5,
    'share this': 3,
    'pass along': 3,
    'spread the word': 3
  };

  /**
   * Compute a score for a given keyword dictionary against text
   */
  function computeScore(text, keywords) {
    let score = 0;
    const lowerText = text.toLowerCase();

    for (const [keyword, weight] of Object.entries(keywords)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    return score;
  }

  /**
   * Extract the first name from a message sender's name
   */
  function extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/)[0];
  }

  /**
   * Classify a LinkedIn message
   * @param {string} messageText - The message content
   * @returns {{ intent: string, confidence: number, scores: object }}
   */
  function classify(messageText) {
    if (!messageText || messageText.trim().length < 10) {
      return { intent: 'other', confidence: 0, scores: { job: 0, cooptation: 0 } };
    }

    const jobScore = computeScore(messageText, JOB_OFFER_KEYWORDS);
    const cooptationScore = computeScore(messageText, COOPTATION_KEYWORDS);

    const totalScore = jobScore + cooptationScore;

    // Minimum threshold to classify
    const MIN_THRESHOLD = 4;

    if (totalScore < MIN_THRESHOLD) {
      return {
        intent: 'other',
        confidence: 0,
        scores: { job: jobScore, cooptation: cooptationScore }
      };
    }

    if (cooptationScore > jobScore && cooptationScore >= MIN_THRESHOLD) {
      return {
        intent: 'cooptation',
        confidence: Math.min(cooptationScore / 15, 1),
        scores: { job: jobScore, cooptation: cooptationScore }
      };
    }

    if (jobScore >= MIN_THRESHOLD) {
      return {
        intent: 'job_offer',
        confidence: Math.min(jobScore / 15, 1),
        scores: { job: jobScore, cooptation: cooptationScore }
      };
    }

    return {
      intent: 'other',
      confidence: 0,
      scores: { job: jobScore, cooptation: cooptationScore }
    };
  }

  return { classify, extractFirstName };
})();

// Export for use in content script
if (typeof window !== 'undefined') {
  window.IntentClassifier = IntentClassifier;
}

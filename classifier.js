/**
 * LinkedIn Message Intent Classifier
 * Classifies recruiter messages into: job_offer, cooptation, or other
 * Detects language (French / English) and returns it alongside the intent
 * Uses keyword scoring with weighted dictionaries
 */

const IntentClassifier = (() => {
  // ── Language detection ───────────────────────────────────────────
  // Common words that appear almost exclusively in one language
  const FR_MARKERS = [
    'bonjour', 'merci', 'vous', 'votre', 'nous', 'notre', 'avec',
    'pour', 'dans', 'cette', 'être', 'avoir', 'faire', 'aussi',
    'mais', 'comme', 'plus', 'tout', 'très', 'bien', 'chez',
    'une', 'des', 'les', 'est', 'sur', 'qui', 'que', 'sont',
    'pas', 'par', 'peut', 'ses', 'aux', 'ces', 'mon', 'mes',
    'nos', 'vos', 'leur', 'donc', 'alors', 'ainsi', 'entre',
    'depuis', 'encore', 'quel', 'sans', 'sous', 'après',
    'recherche', 'entreprise', 'poste', 'actuellement', 'équipe',
    'rejoindre', 'expérience', 'profil', 'opportunité', 'intéressé',
    'bonne journée', 'cordialement', 'salutations',
  ];

  const EN_MARKERS = [
    'hello', 'thank', 'you', 'your', 'the', 'and', 'with',
    'for', 'this', 'that', 'have', 'from', 'they', 'been',
    'would', 'could', 'should', 'about', 'which', 'their',
    'will', 'each', 'make', 'like', 'been', 'call', 'who',
    'its', 'may', 'than', 'them', 'some', 'into', 'only',
    'come', 'over', 'such', 'take', 'because', 'these',
    'looking', 'company', 'position', 'currently', 'team',
    'experience', 'profile', 'opportunity', 'interested',
    'regards', 'best', 'cheers', 'sincerely', 'exciting',
    'reach', 'reaching', 'wondered', 'thrilled',
  ];

  /**
   * Detect the language of a text (returns 'fr' or 'en')
   * Uses word-frequency scoring — the language with more marker hits wins
   */
  function detectLanguage(text) {
    if (!text || text.trim().length < 5) return 'fr'; // default

    const lowerText = text.toLowerCase();
    // Tokenise into words for whole-word matching
    const words = new Set(lowerText.split(/[^a-zà-ÿ'-]+/).filter(Boolean));

    let frScore = 0;
    let enScore = 0;

    for (const marker of FR_MARKERS) {
      if (marker.includes(' ')) {
        // Multi-word: substring match
        if (lowerText.includes(marker)) frScore += 2;
      } else {
        if (words.has(marker)) frScore++;
      }
    }

    for (const marker of EN_MARKERS) {
      if (marker.includes(' ')) {
        if (lowerText.includes(marker)) enScore += 2;
      } else {
        if (words.has(marker)) enScore++;
      }
    }

    // Tie-break or ambiguous → default to French
    return enScore > frScore ? 'en' : 'fr';
  }

  // ── Intent keyword dictionaries ──────────────────────────────────
  const JOB_OFFER_KEYWORDS = {
    // French
    'poste': 3, 'opportunité': 3, 'opportunite': 3, 'mission': 2,
    'cdi': 4, 'cdd': 4, 'freelance': 3, 'rejoindre': 3,
    'recrute': 4, 'recrutement': 4, 'candidature': 4,
    'profil correspond': 4, 'profil intéressant': 3, 'profil interessant': 3,
    'votre profil': 2, 'salaire': 3, 'rémunération': 3, 'remuneration': 3,
    'package': 2, 'entretien': 3, 'échange téléphonique': 3, 'appel': 1,
    'en recherche': 2, 'offre d\'emploi': 5, 'fiche de poste': 5,
    'description de poste': 5, 'intéresser': 2, 'intégrer': 2, 'integrer': 2,
    'équipe': 1, 'client recherche': 3, 'client final': 3,
    'entreprise recherche': 3, 'tech lead': 3, 'développeur': 2,
    'developpeur': 2, 'ingénieur': 2, 'ingenieur': 2, 'manager': 1,
    'senior': 1, 'télétravail': 2, 'teletravail': 2, 'remote': 2,
    'hybrid': 1, 'hybride': 1, 'disponibilité': 2, 'disponibilite': 2,
    'mobilité': 2, 'mobilite': 2, 'tj': 2, 'tjm': 3,
    'taux journalier': 3, 'contrat': 2,
    // English
    'position': 3, 'opportunity': 3, 'role': 2, 'hiring': 4,
    'job': 3, 'offer': 2, 'recruit': 4, 'talent acquisition': 4,
    'your profile': 2, 'impressed by': 2, 'interested in': 2,
    'open to': 2, 'salary': 3, 'compensation': 3, 'interview': 3,
    'schedule a call': 3, 'quick chat': 2, 'full-time': 3,
    'part-time': 3, 'permanent': 2, 'on behalf of': 3,
    'exciting company': 2, 'growing team': 2, 'tech stack': 2,
  };

  const COOPTATION_KEYWORDS = {
    // French
    'cooptation': 5, 'coopter': 5, 'recommander': 4, 'recommandation': 4,
    'connaissez-vous': 4, 'connaissez vous': 4, 'connais-tu': 4,
    'connais tu': 4, 'quelqu\'un dans votre réseau': 5,
    'quelqu\'un dans ton réseau': 5, 'votre réseau': 3, 'ton réseau': 3,
    'référence': 3, 'reference': 3, 'référer': 4, 'referer': 4,
    'parrainage': 4, 'parrainer': 4, 'prime de cooptation': 5,
    'bonus de cooptation': 5, 'profil à recommander': 5,
    'connaissance qui': 4, 'personne de votre entourage': 4,
    'dans votre entourage': 3, 'partager cette offre': 4,
    'diffuser': 2, 'transmettre': 2, 'faire suivre': 3,
    // English
    'referral': 5, 'refer': 4, 'recommend someone': 5, 'know someone': 5,
    'know anybody': 4, 'anyone in your network': 5, 'your network': 3,
    'referral bonus': 5, 'referral program': 5, 'share this': 3,
    'pass along': 3, 'spread the word': 3,
  };

  // ── Scoring helper ───────────────────────────────────────────────
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
   * Extract the first name from a message sender's full name
   */
  function extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/)[0];
  }

  /**
   * Classify a LinkedIn message
   * @param {string} messageText - The message content
   * @returns {{ intent: string, language: string, confidence: number, scores: object }}
   */
  function classify(messageText) {
    const empty = { intent: 'other', language: 'fr', confidence: 0, scores: { job: 0, cooptation: 0 } };
    if (!messageText || messageText.trim().length < 10) return empty;

    const language = detectLanguage(messageText);
    const jobScore = computeScore(messageText, JOB_OFFER_KEYWORDS);
    const cooptationScore = computeScore(messageText, COOPTATION_KEYWORDS);
    const totalScore = jobScore + cooptationScore;
    const MIN_THRESHOLD = 4;

    if (totalScore < MIN_THRESHOLD) {
      return { intent: 'other', language, confidence: 0, scores: { job: jobScore, cooptation: cooptationScore } };
    }

    if (cooptationScore > jobScore && cooptationScore >= MIN_THRESHOLD) {
      return {
        intent: 'cooptation', language,
        confidence: Math.min(cooptationScore / 15, 1),
        scores: { job: jobScore, cooptation: cooptationScore },
      };
    }

    if (jobScore >= MIN_THRESHOLD) {
      return {
        intent: 'job_offer', language,
        confidence: Math.min(jobScore / 15, 1),
        scores: { job: jobScore, cooptation: cooptationScore },
      };
    }

    return { intent: 'other', language, confidence: 0, scores: { job: jobScore, cooptation: cooptationScore } };
  }

  return { classify, extractFirstName, detectLanguage };
})();

// Export for use in content script
if (typeof window !== 'undefined') {
  window.IntentClassifier = IntentClassifier;
}

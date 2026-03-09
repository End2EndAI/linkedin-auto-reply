# LinkedIn Reply Assistant 🤖

Chrome extension qui détecte automatiquement les messages de recruteurs sur LinkedIn et propose des réponses pré-rédigées.

## Fonctionnalités

- **Détection d'intention** : Classifie automatiquement les messages en 3 catégories (offre d'emploi, cooptation, autre)
- **Réponses intelligentes** : Génère une réponse adaptée avec le prénom du recruteur
- **Copier / Insérer** : Un clic pour copier ou insérer directement dans le champ de message LinkedIn
- **Templates personnalisables** : Modifie les réponses par défaut depuis le popup
- **Override manuel** : Force le type de détection si le classifieur se trompe
- **Statistiques** : Suivi du nombre de messages analysés et réponses envoyées

## Installation

1. Clone le repo :
   ```bash
   git clone git@github.com:LouisFont662/linkedin-auto-reply.git
   ```

2. Ouvre Chrome et va sur `chrome://extensions/`

3. Active le **Mode développeur** (toggle en haut à droite)

4. Clique sur **Charger l'extension non empaquetée**

5. Sélectionne le dossier `linkedin-auto-reply/`

6. L'extension est prête ! Va sur LinkedIn Messaging pour la tester.

## Utilisation

1. Ouvre une conversation LinkedIn avec un recruteur
2. Le bouton 🤖 apparaît en bas à droite
3. L'assistant analyse automatiquement le dernier message
4. Choisis de **copier** ou **insérer** la réponse suggérée
5. Modifie la réponse si nécessaire avant l'envoi

## Variables de template

| Variable | Description |
|----------|-------------|
| `{firstName}` | Prénom du recruteur |
| `{name}` | Nom complet du recruteur |
| `{userName}` | Votre nom (configurable) |

## Stack technique

- **Manifest V3** (Chrome Extension)
- **Vanilla JS** (zero dependencies)
- **Keyword-based classifier** avec scoring pondéré (FR + EN)
- **MutationObserver** pour la détection de nouveaux messages

## Structure

```
linkedin-auto-reply/
├── manifest.json      # Config extension Chrome
├── classifier.js      # Classifieur d'intention
├── content.js         # Script injecté sur LinkedIn
├── content.css        # Styles du panneau flottant
├── background.js      # Service worker
├── popup.html/js/css  # Interface de configuration
└── icons/             # Icônes de l'extension
```

## Licence

MIT

# Contributing to LinkedIn Reply Assistant

Thanks for your interest in contributing! Whether it's a bug report, a new language, improved keyword coverage, or a documentation fix — all help is welcome.

## Getting started

1. Fork the repository and clone your fork
2. Load the extension locally in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked** and select the cloned folder
3. Create a new branch: `git checkout -b my-feature`
4. Make your changes and test them on `linkedin.com/messaging`
5. Commit and push to your fork
6. Open a pull request against `master`

## What to work on

Check the [open issues](https://github.com/End2EndAI/linkedin-auto-reply/issues) for bugs and feature requests. Issues labeled `good first issue` are a great starting point.

If you want to work on something not yet filed as an issue, please open one first to discuss the approach. This avoids duplicated effort and ensures alignment with the project direction.

## No build step required

This is a zero-dependency Vanilla JavaScript Chrome extension. There is no npm, no bundler, no TypeScript compilation. Just edit the `.js` / `.css` / `.html` files and reload the extension in Chrome.

To reload after changes: go to `chrome://extensions/` and click the refresh icon on the extension card (or press `Ctrl+R` / `Cmd+R` while on that page).

## Code style

- Vanilla JavaScript — no frameworks, no dependencies
- Follow the existing code patterns (IIFE for content script, JSDoc comments)
- Keep changes focused and small
- Test on both `linkedin.com/messaging` and `linkedin.com/in/*` pages

## Adding a new language

The extension currently supports French and English. To add a new language (e.g. Spanish):

1. Add language markers to the `FR_MARKERS` / `EN_MARKERS` arrays in `classifier.js` (or create a new `ES_MARKERS` array and update `detectLanguage`)
2. Add keyword dictionaries for the new language in `JOB_OFFER_KEYWORDS` and `COOPTATION_KEYWORDS`
3. Add default response templates in `background.js` (under the new language key)
4. Add language display config in `LANG_DISPLAY` and `INTENT_CONFIG` in `content.js`
5. Add a flag button in `content.js` → `createPanel()`

PRs that add new languages are very welcome.

## Pull request guidelines

- Keep PRs focused on a single change
- Write a clear description of what the PR does and why
- Test the extension manually on LinkedIn before submitting
- If you change default templates in `background.js`, also update the matching defaults in `content.js`

## Reporting bugs

Open a [bug report issue](https://github.com/End2EndAI/linkedin-auto-reply/issues/new?template=bug_report.md) with:

- Steps to reproduce
- Expected vs. actual behavior
- Chrome version and OS
- Screenshots or recordings if applicable

## Suggesting features

Open a [feature request issue](https://github.com/End2EndAI/linkedin-auto-reply/issues/new?template=feature_request.md) and describe the use case. Explain what problem you're trying to solve, not just the solution.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

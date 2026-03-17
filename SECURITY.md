# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LinkedIn Reply Assistant, please report it responsibly. **Do not open a public GitHub issue.**

**Email:** security@end2endai.com

Please include:
- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

We will acknowledge your report within 48 hours and aim to provide a fix within 7 days for critical issues.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Security Model

LinkedIn Reply Assistant is a **fully local Chrome extension**. It has no backend, no API calls, and no external servers.

- **No data leaves your browser.** All message analysis runs locally using a keyword scoring algorithm — no text is ever sent to a remote server.
- **No API keys.** The extension does not use OpenAI, Anthropic, or any other AI API. There are no secrets to protect.
- **Storage is local.** User preferences and templates are stored using the Chrome Storage Sync API, which syncs across your own Chrome profile via your Google account — no third-party servers involved.
- **Read-only page access.** The extension reads LinkedIn message content from the DOM to generate reply suggestions. It does not modify, scrape, or export any data.
- **Minimal permissions.** The extension only requests `storage` permission. It does not request access to tabs, browsing history, clipboard (beyond the explicit copy button), or any other sensitive browser APIs.

## Privacy

This extension does not collect, transmit, or store any personal data outside your own browser. See the README for full details.

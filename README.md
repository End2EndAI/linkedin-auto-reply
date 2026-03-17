<p align="center">
  <img src="icons/icon128.png" alt="LinkedIn Reply Assistant" width="80" />
</p>

<h1 align="center">LinkedIn Reply Assistant</h1>

<p align="center">
  <strong>Stop wasting time on recruiter messages. Let AI draft your replies.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/chrome-extension-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/zero-dependencies-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/languages-FR%20%7C%20EN-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/contributions-welcome-brightgreen?style=for-the-badge" />
</p>

<br/>

## The Problem

If you're active on LinkedIn, you know the drill: dozens of recruiter messages every week asking if you're open to new opportunities or if you know someone who is. Replying to each one manually is tedious. Ignoring them feels rude.

**LinkedIn Reply Assistant** fixes this. It sits quietly in the corner of your LinkedIn messaging page, reads incoming messages, figures out what the recruiter wants, and drafts a polished reply in the right language. You review it, click insert, done.

<br/>

## How It Works

```
Recruiter sends message  -->  Extension detects it
                               |
                         Classifies intent:
                         - Job offer?
                         - Referral request?
                         - Something else?
                               |
                         Detects language:
                         - French or English?
                               |
                         Generates a reply
                         in the correct language
                               |
                         You review & send
```

<br/>

## Features

### Smart Intent Detection
The classifier uses 80+ weighted keywords in both French and English to determine whether a recruiter is pitching a job, asking for a referral, or sending a generic message. Each keyword has a confidence weight, and the system requires a minimum score threshold before suggesting a reply.

### Automatic Language Detection
Messages are analyzed for language markers (common words, greetings, expressions) and the response is automatically generated in the same language. If the recruiter writes in English, you reply in English. French? French. You can also force a language with one click.

### One-Click Replies
Three options: copy to clipboard, insert directly into the LinkedIn message box, or edit before sending. The response is never sent automatically - you always have the final say.

### Fully Customizable Templates
Every response template can be edited from the extension popup. You have separate tabs for French and English templates. Use variables like `{firstName}` to auto-inject the recruiter's name.

### Privacy First
No data leaves your browser. No API calls. No accounts. No tracking. Everything runs locally in the extension.

<br/>

## Installation

### Step 1: Download

```bash
git clone https://github.com/End2EndAI/linkedin-auto-reply.git
```

Or click the green **Code** button above, then **Download ZIP**, and unzip it anywhere on your computer.

### Step 2: Load into Chrome

1. Open Chrome and type `chrome://extensions/` in the address bar
2. Toggle **Developer mode** ON (top-right corner)
3. Click **Load unpacked**
4. Select the `linkedin-auto-reply` folder you just downloaded
5. You should see the extension icon appear in your toolbar

### Step 3: Go to LinkedIn

Open [linkedin.com/messaging](https://www.linkedin.com/messaging/) and you'll see a small robot button in the bottom-right corner. That's your assistant.

<br/>

## Usage

| Action | What happens |
|--------|-------------|
| Open a conversation | Extension automatically analyzes the latest messages |
| Click the robot button | Opens the assistant panel manually |
| Click **Copy** | Copies the suggested reply to your clipboard |
| Click **Insert** | Pastes the reply directly into the LinkedIn message box |
| Click **Edit** | Unlocks the text area so you can tweak the reply |
| Click a flag button | Forces the response into that language |
| Click an intent button | Overrides the detected intent |

<br/>

## Customizing Your Replies

Click the extension icon in your Chrome toolbar to open settings:

**Settings tab** - Set your name (used in signatures) and toggle auto-detection.

**French / English tabs** - Edit each template separately. Available variables:

| Variable | Replaced with |
|----------|--------------|
| `{firstName}` | Recruiter's first name |
| `{name}` | Recruiter's full name |
| `{userName}` | Your name (from settings) |

<br/>

## FAQ

**Will this get my LinkedIn account banned?**
No. The extension only reads the page content and helps you compose replies. It does not automate sending messages, scrape data, or interact with LinkedIn's API. You always press send manually.

**Does it work with LinkedIn Premium / Sales Navigator?**
Yes. It works on any page under `linkedin.com/messaging`.

**Can I add more languages?**
The architecture supports it. You'd need to add language markers in `classifier.js` and a new template set. PRs welcome.

**Does it use AI / ChatGPT / any API?**
No. Classification is done locally with a keyword scoring algorithm. No external API calls, no data sent anywhere.

<br/>

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Extension format | Chrome Manifest V3 |
| Language | Vanilla JavaScript (zero dependencies) |
| Classifier | Weighted keyword scoring (80+ terms, FR + EN) |
| Language detection | Word-frequency analysis |
| DOM observation | MutationObserver + interval polling |
| Storage | Chrome Storage Sync API |
| Styling | Custom CSS with dark mode support |

<br/>

## Project Structure

```
linkedin-auto-reply/
|-- manifest.json       Chrome extension config
|-- classifier.js       Intent + language classifier
|-- content.js          Main script injected on LinkedIn
|-- content.css         Floating panel styles + dark mode
|-- background.js       Service worker, storage defaults
|-- popup.html          Extension popup UI
|-- popup.js            Popup logic (settings, templates, stats)
|-- popup.css           Popup styles
|-- icons/              Extension icons (16, 48, 128px)
```

<br/>

## Contributing

Contributions are welcome. Here are some ideas:

- Add more languages (German, Spanish, Portuguese...)
- Improve the classifier with n-gram analysis
- Add support for LinkedIn InMail detection
- Create a "snooze" feature to remind you to reply later
- Add analytics dashboard for response patterns

Fork the repo, create a branch, make your changes, open a PR.

<br/>

## License

MIT License. See [LICENSE](LICENSE) for details.

<br/>

---

<p align="center">
  Built by <a href="https://www.linkedin.com/in/louisfontaine/">Louis Fontaine</a> with the help of Claude
</p>

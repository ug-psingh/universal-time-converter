# Universal Time Converter

A Chrome extension that instantly converts timestamps between time zones. Paste any date format and auto-scan web pages to convert timestamps to your local time.

## Features

### 🔄 Converter Tab
Paste any timestamp or date — the extension auto-detects the format and converts it to your chosen timezone.

**Supported input formats:**
- Unix timestamp in seconds (10 digits): `1679347200`
- Unix timestamp in milliseconds (13 digits): `1679347200000`
- ISO 8601: `2023-03-20T15:00:00Z`
- ISO with space: `2023-03-20 15:00:00`
- RFC 2822: `Mon, 20 Mar 2023 15:00:00 GMT`
- Natural dates: `Mar 20, 2023 3:00 PM`
- US format: `03/20/2023 3:00 PM`

**30+ time zones supported** including UTC, US time zones, Europe, Asia, Australia, and more.

### 📄 Scan Page Tab
Automatically find and convert Unix timestamps on any webpage to readable dates.

**How it works:**
1. Toggle ON to scan the current page
2. Detects 10-digit (seconds) & 13-digit (milliseconds) timestamps
3. Converts them to your preferred timezone and format
4. Hover over converted times to see the original value

**Display formats:**
- Local Format
- Full Date & Time
- Short Date & Time
- Date Only
- Time Only
- Relative Time (e.g., "2 hours ago")

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner
3. Click **Load unpacked**
4. Select the folder containing this extension

## Quick Start

### Converting a Timestamp
1. Click the extension icon in Chrome toolbar
2. Paste your timestamp in the input field
3. Select source timezone (From) and target timezone (To)
4. Click **Convert**

### Scanning a Web Page
1. Navigate to a page with timestamps
2. Click the extension icon
3. Go to **Scan Page** tab
4. Toggle **Enable on this page**
5. All detected timestamps will be highlighted and converted

## File Structure

```
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup functionality
├── content.js         # Page timestamp detection
├── content.css        # Converted timestamp styles
├── background.js      # Service worker
└── README.md          # This file
```

## Adding Custom Icons (Optional)

Create PNG files in an `icons/` folder:
- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

Then add to `manifest.json`:
```json
"action": {
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

## Technical Details

- **Manifest V3** — Latest Chrome extension format
- **Chrome Storage API** — Persists user preferences
- **Content Scripts** — Scans and modifies page content
- **Service Worker** — Handles background tasks

## License

MIT License

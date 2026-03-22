# Privacy Policy for Universal Time Converter

**Last Updated:** March 22, 2026

## Overview

Universal Time Converter is a browser extension that converts timestamps between time zones. This privacy policy explains how we handle your data.

## Data Collection

**We do NOT collect, transmit, or share any personal data.**

### What the extension stores locally:

The extension saves the following preferences on your device only:
- Your preferred timezone setting
- Your preferred display format (e.g., "Full Date & Time", "Relative Time")
- Whether page scanning is enabled or disabled

This data is stored using Chrome's local storage API and **never leaves your device**.

### What the extension does NOT do:

- ❌ Collect personal information
- ❌ Track browsing history
- ❌ Send data to external servers
- ❌ Use analytics or tracking tools
- ❌ Store cookies
- ❌ Share data with third parties

## Permissions Explained

| Permission | Why it's needed |
|------------|-----------------|
| `storage` | Save your preferences locally on your device |
| `activeTab` | Access the current tab to scan for timestamps |
| `scripting` | Inject timestamp detection script into web pages |
| `tabs` | Identify the active tab to apply conversions |

## Page Scanning Feature

When you enable "Scan Page," the extension:
1. Reads the visible text on the current webpage
2. Detects Unix timestamps (10 or 13 digit numbers)
3. Converts them to readable dates displayed on the page
4. **All processing happens locally in your browser**

No webpage content is ever transmitted anywhere.

## Data Security

All data remains on your local device. We have no servers, databases, or external services.

## Changes to This Policy

If we update this privacy policy, we will revise the "Last Updated" date above.

## Contact

**Developer:** Prateek Singh  
**Email:** [your-email@example.com]

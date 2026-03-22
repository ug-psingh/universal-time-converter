// Background service worker for Time Zone Converter extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      pageConversionEnabled: false,
      pageTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pageDisplayFormat: 'local'
    });
    
    console.log('Time Zone Converter installed successfully!');
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get(['pageConversionEnabled', 'pageTimezone', 'pageDisplayFormat'], (result) => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
});

// Optional: Handle keyboard shortcuts
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'toggle-conversion') {
    chrome.storage.local.get(['pageConversionEnabled'], (result) => {
      const newState = !result.pageConversionEnabled;
      chrome.storage.local.set({ pageConversionEnabled: newState });
      
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.id && tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('chrome-extension://') && 
            !tab.url.startsWith('about:')) {
          chrome.tabs.sendMessage(tab.id, {
            action: newState ? 'enable' : 'disable'
          }).catch(() => {
            // Silently ignore - content script may not be loaded
          });
        }
      });
    });
  }
});

// Handle context menu (optional feature)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'convert-selection',
    title: 'Convert timestamp',
    contexts: ['selection']
  });
});

chrome.contextMenus?.onClicked?.addListener((info, tab) => {
  if (info.menuItemId === 'convert-selection' && info.selectionText) {
    // Try to parse and convert the selected text
    const text = info.selectionText.trim();
    let date = null;
    
    // Try different formats
    if (/^\d{10}$/.test(text)) {
      date = new Date(parseInt(text) * 1000);
    } else if (/^\d{13}$/.test(text)) {
      date = new Date(parseInt(text));
    } else {
      date = new Date(text);
    }
    
    if (date && !isNaN(date.getTime())) {
      const formatted = date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      
      // Show notification with converted time
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Converted Time',
        message: formatted
      });
    }
  }
});

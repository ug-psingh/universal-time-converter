// Content script for detecting and converting timestamps on web pages

class TimestampConverter {
  constructor() {
    this.enabled = false;
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.format = 'local';
    this.convertedElements = new Map();
    this.originalValues = new Map();
    this.timestampCount = 0;
    
    // Timestamp patterns - only 10 and 13 digit Unix timestamps
    this.patterns = {
      // Unix timestamp in milliseconds (13 digits)
      unixMs: /\b(\d{13})\b/g,
      // Unix timestamp in seconds (10 digits)
      unixSeconds: /\b(\d{10})\b/g
    };
    
    this.init();
  }
  
  init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'enable':
          this.enable(message.timezone, message.format);
          sendResponse({ count: this.timestampCount });
          break;
        case 'disable':
          this.disable();
          sendResponse({ count: 0 });
          break;
        case 'updateSettings':
          this.updateSettings(message.timezone, message.format);
          sendResponse({ count: this.timestampCount });
          break;
        case 'refresh':
          this.refresh(message.timezone, message.format);
          sendResponse({ count: this.timestampCount });
          break;
        case 'getStats':
          sendResponse({ count: this.timestampCount, enabled: this.enabled });
          break;
      }
      return true;
    });
    
    // Check if conversion was enabled
    chrome.storage.local.get(['pageConversionEnabled', 'pageTimezone', 'pageDisplayFormat'], (result) => {
      if (result.pageConversionEnabled) {
        this.enable(
          result.pageTimezone || this.timezone,
          result.pageDisplayFormat || this.format
        );
      }
    });
  }
  
  enable(timezone, format) {
    this.enabled = true;
    this.timezone = timezone || this.timezone;
    this.format = format || this.format;
    this.scanPage();
  }
  
  disable() {
    this.enabled = false;
    this.restoreOriginal();
    this.timestampCount = 0;
  }
  
  updateSettings(timezone, format) {
    if (!this.enabled) return;
    this.timezone = timezone || this.timezone;
    this.format = format || this.format;
    this.refresh(timezone, format);
  }
  
  refresh(timezone, format) {
    this.restoreOriginal();
    this.timezone = timezone || this.timezone;
    this.format = format || this.format;
    this.scanPage();
  }
  
  restoreOriginal() {
    this.originalValues.forEach((original, element) => {
      if (element.nodeType === Node.TEXT_NODE) {
        element.textContent = original;
      } else {
        element.innerHTML = original;
      }
      element.classList?.remove('tz-converted');
    });
    this.originalValues.clear();
    this.convertedElements.clear();
  }
  
  scanPage() {
    this.timestampCount = 0;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style tags
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip if inside our converted timestamp spans
          if (parent.classList.contains('tz-timestamp')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip empty text nodes
          if (!node.textContent || node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    textNodes.forEach(node => this.processTextNode(node));
  }
  
  processTextNode(textNode) {
    // Skip if text node is no longer in DOM or has no parent
    if (!textNode.parentElement || !textNode.isConnected) return;
    
    const originalText = textNode.textContent;
    if (!originalText || originalText.trim().length === 0) return;
    
    let text = originalText;
    let hasMatch = false;
    
    // Process 13-digit milliseconds first (to avoid partial matches with 10-digit)
    // Use replaceAll with a callback to handle all occurrences
    text = text.replace(/\b(\d{13})\b/g, (match, p1) => {
      const timestamp = parseInt(p1);
      if (this.isValidTimestamp(timestamp)) {
        const date = new Date(timestamp);
        const formatted = this.formatDate(date);
        hasMatch = true;
        this.timestampCount++;
        return this.wrapConverted(formatted, match);
      }
      return match;
    });
    
    // Process 10-digit seconds
    text = text.replace(/\b(\d{10})\b/g, (match, p1) => {
      // Skip if already converted (check if this is inside a converted span)
      if (text.includes(`data-original="${match}"`)) return match;
      const timestamp = parseInt(p1) * 1000;
      if (this.isValidTimestamp(timestamp)) {
        const date = new Date(timestamp);
        const formatted = this.formatDate(date);
        hasMatch = true;
        this.timestampCount++;
        return this.wrapConverted(formatted, match);
      }
      return match;
    });
    
    if (hasMatch && textNode.parentElement) {
      const parent = textNode.parentElement;
      // Store original for restoration
      if (!this.originalValues.has(parent)) {
        this.originalValues.set(parent, parent.innerHTML);
      }
      // Create a temporary span to hold the new content
      const temp = document.createElement('span');
      temp.innerHTML = text;
      // Replace the text node with the new content
      while (temp.firstChild) {
        parent.insertBefore(temp.firstChild, textNode);
      }
      parent.removeChild(textNode);
      parent.classList.add('tz-converted');
    }
  }
  
  isValidTimestamp(ms) {
    // Validate timestamp is between year 2000 and 2100
    const min = new Date('2000-01-01').getTime();
    const max = new Date('2100-01-01').getTime();
    return ms >= min && ms <= max;
  }
  
  wrapConverted(formatted, original) {
    return `<span class="tz-timestamp" data-original="${original}" title="Original: ${original}">${formatted}</span>`;
  }
  
  formatDate(date) {
    const options = this.getFormatOptions();
    
    if (this.format === 'relative') {
      return this.getRelativeTime(date);
    }
    
    try {
      return date.toLocaleString('en-US', {
        ...options,
        timeZone: this.timezone
      });
    } catch (e) {
      return date.toLocaleString('en-US', options);
    }
  }
  
  getFormatOptions() {
    switch (this.format) {
      case 'full':
        return {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        };
      case 'short':
        return {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
      case 'dateOnly':
        return {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };
      case 'timeOnly':
        return {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        };
      case 'local':
      default:
        return {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
    }
  }
  
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const absDiff = Math.abs(diff);
    const isPast = diff > 0;
    
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    let value, unit;
    if (years > 0) { value = years; unit = 'year'; }
    else if (months > 0) { value = months; unit = 'month'; }
    else if (days > 0) { value = days; unit = 'day'; }
    else if (hours > 0) { value = hours; unit = 'hour'; }
    else if (minutes > 0) { value = minutes; unit = 'minute'; }
    else { value = seconds; unit = 'second'; }
    
    const plural = value !== 1 ? 's' : '';
    return isPast ? `${value} ${unit}${plural} ago` : `in ${value} ${unit}${plural}`;
  }
}

// Initialize converter
const converter = new TimestampConverter();

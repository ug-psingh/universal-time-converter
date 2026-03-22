// Timezone list
const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'America/Vancouver', label: 'Vancouver' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Europe/Istanbul', label: 'Istanbul' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Australia/Perth', label: 'Perth' },
  { value: 'Pacific/Auckland', label: 'Auckland' }
];

// DOM Elements
let fromTimezone, toTimezone, pageTimezone;
let inputTime, convertTimezoneBtn, convertedTime;
let enablePageConversion, pageDisplayFormat, refreshPageBtn, timestampCount;
let currentTimeLocal;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initTabs();
  populateTimezones();
  initEventListeners();
  loadSettings();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  setDefaultInputTime();
});

function initElements() {
  fromTimezone = document.getElementById('fromTimezone');
  toTimezone = document.getElementById('toTimezone');
  pageTimezone = document.getElementById('pageTimezone');
  inputTime = document.getElementById('inputTime');
  convertTimezoneBtn = document.getElementById('convertTimezone');
  convertedTime = document.getElementById('convertedTime');
  enablePageConversion = document.getElementById('enablePageConversion');
  pageDisplayFormat = document.getElementById('pageDisplayFormat');
  refreshPageBtn = document.getElementById('refreshPage');
  timestampCount = document.getElementById('timestampCount');
  currentTimeLocal = document.getElementById('currentTimeLocal');
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function populateTimezones() {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  [fromTimezone, toTimezone, pageTimezone].forEach(select => {
    // Add local timezone at top
    const localOption = document.createElement('option');
    localOption.value = localTz;
    localOption.textContent = `Local (${localTz})`;
    select.appendChild(localOption);

    timezones.forEach(tz => {
      if (tz.value !== localTz) {
        const option = document.createElement('option');
        option.value = tz.value;
        option.textContent = tz.label;
        select.appendChild(option);
      }
    });
  });

  // Set defaults
  fromTimezone.value = 'UTC';
  toTimezone.value = localTz;
  pageTimezone.value = localTz;
}

function initEventListeners() {
  // Timezone conversion
  convertTimezoneBtn.addEventListener('click', convertTimezone);

  // Page conversion
  enablePageConversion.addEventListener('change', togglePageConversion);
  pageDisplayFormat.addEventListener('change', updatePageSettings);
  pageTimezone.addEventListener('change', updatePageSettings);
  refreshPageBtn.addEventListener('click', refreshPageConversion);
}

function setDefaultInputTime() {
  const now = new Date();
  // Use a readable format for the default value
  inputTime.value = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function loadSettings() {
  chrome.storage.local.get(['pageConversionEnabled', 'pageTimezone', 'pageDisplayFormat'], (result) => {
    if (result.pageConversionEnabled) {
      enablePageConversion.checked = result.pageConversionEnabled;
    }
    if (result.pageTimezone) {
      pageTimezone.value = result.pageTimezone;
    }
    if (result.pageDisplayFormat) {
      pageDisplayFormat.value = result.pageDisplayFormat;
    }
  });

  // Get current tab's timestamp count
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id && tabs[0].url && isValidUrl(tabs[0].url)) {
      try {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
          // Check for runtime error first to suppress the console warning
          if (chrome.runtime.lastError) {
            timestampCount.textContent = 'N/A';
            return;
          }
          if (response && response.count !== undefined) {
            timestampCount.textContent = response.count;
          } else {
            timestampCount.textContent = 'N/A';
          }
        });
      } catch (e) {
        timestampCount.textContent = 'N/A';
      }
    } else {
      timestampCount.textContent = 'N/A';
    }
  });
}

// Check if URL is a valid page where content scripts can run
function isValidUrl(url) {
  if (!url) return false;
  const invalidProtocols = [
    'chrome://', 'chrome-extension://', 'extension://',
    'about:', 'edge://', 'brave://', 'file://', 'data:', 'view-source:'
  ];
  return !invalidProtocols.some(protocol => url.startsWith(protocol));
}

function updateCurrentTime() {
  const now = new Date();
  currentTimeLocal.textContent = now.toLocaleString('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// Timezone Conversion
function convertTimezone() {
  const input = inputTime.value;
  if (!input) {
    convertedTime.textContent = 'Please enter a date/time';
    return;
  }

  const fromTz = fromTimezone.value;
  const toTz = toTimezone.value;

  try {
    // Auto-detect and parse input format
    const date = parseFlexibleDate(input);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      convertedTime.textContent = 'Invalid date/time format';
      return;
    }
    
    // Get the offset for the source timezone
    const fromOffset = getTimezoneOffset(date, fromTz);
    const localOffset = date.getTimezoneOffset();
    
    // Adjust the date to UTC based on source timezone
    const utcDate = new Date(date.getTime() + (localOffset - fromOffset) * 60000);
    
    // Format in target timezone
    const result = utcDate.toLocaleString('en-US', {
      timeZone: toTz,
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

    convertedTime.textContent = result;
  } catch (error) {
    convertedTime.textContent = 'Invalid date/time';
  }
}

function getTimezoneOffset(date, timezone) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate - tzDate) / 60000;
}

// Flexible date parser for timezone conversion - auto-detects format
function parseFlexibleDate(input) {
  const trimmed = input.trim();
  
  // Unix timestamp in milliseconds (13 digits)
  if (/^\d{13}$/.test(trimmed)) {
    return new Date(parseInt(trimmed));
  }
  
  // Unix timestamp in seconds (10 digits)
  if (/^\d{10}$/.test(trimmed)) {
    return new Date(parseInt(trimmed) * 1000);
  }
  
  // Unix timestamp with decimal (seconds.fraction)
  if (/^\d{10}\.\d+$/.test(trimmed)) {
    return new Date(parseFloat(trimmed) * 1000);
  }
  
  // ISO 8601 formats (handled natively by Date)
  // e.g., 2023-03-20T15:00:00Z, 2023-03-20T15:00:00+05:30
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return new Date(trimmed);
  }
  
  // ISO date with space instead of T: 2023-03-20 15:00:00
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(trimmed)) {
    return new Date(trimmed.replace(' ', 'T'));
  }
  
  // ISO date only: 2023-03-20
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'T00:00:00');
  }
  
  // Common formats - try native parsing first
  let date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try additional common formats
  // MM/DD/YYYY or M/D/YYYY with optional time
  const usDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (usDateMatch) {
    let [, month, day, year, hours, minutes, seconds, ampm] = usDateMatch;
    hours = parseInt(hours || 0);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return new Date(year, month - 1, day, hours, parseInt(minutes || 0), parseInt(seconds || 0));
  }
  
  // DD/MM/YYYY or D/M/YYYY (European format) - try if US format gives invalid date
  const euDateMatch = trimmed.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (euDateMatch) {
    let [, day, month, year, hours, minutes, seconds] = euDateMatch;
    const euDate = new Date(year, month - 1, day, parseInt(hours || 0), parseInt(minutes || 0), parseInt(seconds || 0));
    if (!isNaN(euDate.getTime())) {
      return euDate;
    }
  }
  
  // Return invalid date if nothing works
  return new Date(NaN);
}

// Helper function to safely send messages to content script
function sendMessageToTab(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id || !tab.url || !isValidUrl(tab.url)) {
      if (callback) callback(null);
      return;
    }
    try {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        // Check for runtime error to suppress console warning
        if (chrome.runtime.lastError) {
          if (callback) callback(null);
          return;
        }
        if (callback) callback(response);
      });
    } catch (e) {
      if (callback) callback(null);
    }
  });
}

// Page Conversion
function togglePageConversion() {
  const enabled = enablePageConversion.checked;
  
  chrome.storage.local.set({ pageConversionEnabled: enabled });
  
  sendMessageToTab({
    action: enabled ? 'enable' : 'disable',
    timezone: pageTimezone.value,
    format: pageDisplayFormat.value
  }, (response) => {
    if (response && response.count !== undefined) {
      timestampCount.textContent = response.count;
    } else {
      timestampCount.textContent = 'N/A';
    }
  });
}

function updatePageSettings() {
  chrome.storage.local.set({
    pageTimezone: pageTimezone.value,
    pageDisplayFormat: pageDisplayFormat.value
  });

  if (enablePageConversion.checked) {
    sendMessageToTab({
      action: 'updateSettings',
      timezone: pageTimezone.value,
      format: pageDisplayFormat.value
    }, (response) => {
      if (response && response.count !== undefined) {
        timestampCount.textContent = response.count;
      } else {
        timestampCount.textContent = 'N/A';
      }
    });
  }
}

function refreshPageConversion() {
  sendMessageToTab({
    action: 'refresh',
    timezone: pageTimezone.value,
    format: pageDisplayFormat.value
  }, (response) => {
    if (response && response.count !== undefined) {
      timestampCount.textContent = response.count;
    } else {
      timestampCount.textContent = 'N/A';
    }
  });
}

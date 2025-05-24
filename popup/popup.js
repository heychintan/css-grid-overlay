// Popup script for CSS Grid Overlay - Phase 2
let currentDomain = '';
let currentBreakpoint = 'desktop';
let settings = {};

// Default settings for each breakpoint
const defaultSettings = {
  enabled: false,
  desktop: {
    maxWidth: 1200,
    columns: { count: 12, gutter: 20, margin: 0, color: '#ff0000', opacity: 10 },
    rows: { count: 0, gutter: 20, margin: 0, color: '#ff0000', opacity: 10 }
  },
  tablet: {
    maxWidth: 991,
    columns: { count: 8, gutter: 16, margin: 0, color: '#ff0000', opacity: 10 },
    rows: { count: 0, gutter: 16, margin: 0, color: '#ff0000', opacity: 10 }
  },
  landscape: {
    maxWidth: 767,
    columns: { count: 6, gutter: 12, margin: 0, color: '#ff0000', opacity: 10 },
    rows: { count: 0, gutter: 12, margin: 0, color: '#ff0000', opacity: 10 }
  },
  portrait: {
    maxWidth: 479,
    columns: { count: 4, gutter: 8, margin: 0, color: '#ff0000', opacity: 10 },
    rows: { count: 0, gutter: 8, margin: 0, color: '#ff0000', opacity: 10 }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

function initializePopup() {
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Check if we can access this tab
    if (!tabs[0].url || tabs[0].url.startsWith('chrome://') || tabs[0].url.startsWith('chrome-extension://')) {
      showDisabledState('Cannot use on Chrome pages');
      return;
    }
    
    currentDomain = new URL(tabs[0].url).hostname;
    
    // Show domain in footer
    document.getElementById('domainInfo').textContent = currentDomain;
    
    // Load settings for this domain
    chrome.storage.local.get([currentDomain], (result) => {
      // Deep clone default settings to ensure proper structure
      const savedSettings = result[currentDomain];
      
      if (savedSettings) {
        // Merge saved settings with defaults to ensure all properties exist
        settings = JSON.parse(JSON.stringify(defaultSettings));
        settings.enabled = savedSettings.enabled || false;
        
        // Merge each breakpoint
        ['desktop', 'tablet', 'landscape', 'portrait'].forEach(bp => {
          if (savedSettings[bp]) {
            if (savedSettings[bp].maxWidth !== undefined) {
              settings[bp].maxWidth = savedSettings[bp].maxWidth;
            }
            if (savedSettings[bp].columns) {
              Object.assign(settings[bp].columns, savedSettings[bp].columns);
            }
            if (savedSettings[bp].rows) {
              Object.assign(settings[bp].rows, savedSettings[bp].rows);
            }
          }
        });
      } else {
        // Use default settings
        settings = JSON.parse(JSON.stringify(defaultSettings));
      }
      
      // Update UI
      document.getElementById('toggleGrid').checked = settings.enabled;
      updateControlsState();
      loadBreakpointSettings();
      
      // Setup event listeners
      setupEventListeners();
    });
  });
}

function showDisabledState(message) {
  document.getElementById('toggleGrid').disabled = true;
  document.querySelector('.popup-content').classList.add('disabled');
  document.getElementById('domainInfo').textContent = message;
}

function setupEventListeners() {
  // Toggle grid
  document.getElementById('toggleGrid').addEventListener('change', handleToggle);
  
  // Breakpoint tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => handleBreakpointChange(tab));
  });
  
  // Section headers (collapsible)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => toggleSection(header));
  });
  
  // All input controls
  const controls = [
    'grid-maxwidth',
    'columns-count', 'columns-gutter', 'columns-margin', 'columns-color', 'columns-opacity',
    'rows-count', 'rows-gutter', 'rows-margin', 'rows-color', 'rows-opacity'
  ];
  
  controls.forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('input', () => handleSettingChange(id, element.value));
    
    // Add keyboard support for number inputs
    if (element.type === 'number') {
      element.addEventListener('keydown', (e) => handleNumberKeydown(e, element));
    }
  });
  
  // Reset button
  document.getElementById('resetSettings').addEventListener('click', handleReset);
}

function handleNumberKeydown(e, element) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    
    const currentValue = parseInt(element.value) || 0;
    const step = e.shiftKey ? 10 : 1;
    const increment = e.key === 'ArrowUp' ? step : -step;
    const newValue = currentValue + increment;
    
    // Apply min/max constraints
    const min = parseInt(element.min) || 0;
    const max = parseInt(element.max) || 999;
    element.value = Math.max(min, Math.min(max, newValue));
    
    // Trigger input event to update settings
    element.dispatchEvent(new Event('input'));
  }
}

function handleReset() {
  if (confirm('Reset all grid settings to defaults?')) {
    // Reset current breakpoint to default settings
    settings[currentBreakpoint] = JSON.parse(JSON.stringify(defaultSettings[currentBreakpoint]));
    
    // Update UI with new values
    loadBreakpointSettings();
    
    // Save and apply
    saveAndApplySettings();
  }
}

function handleToggle(e) {
  settings.enabled = e.target.checked;
  updateControlsState();
  saveAndApplySettings();
}

function updateControlsState() {
  const content = document.querySelector('.popup-content');
  if (settings.enabled) {
    content.classList.remove('disabled');
  } else {
    content.classList.add('disabled');
  }
}

function handleBreakpointChange(tab) {
  // Update active tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  
  // Update current breakpoint
  currentBreakpoint = tab.dataset.breakpoint;
  
  // Load settings for this breakpoint
  loadBreakpointSettings();
}

function loadBreakpointSettings() {
  // Extra safety check
  if (!settings || !settings[currentBreakpoint]) {
    console.error('Settings not properly initialized');
    return;
  }
  
  const bp = settings[currentBreakpoint];
  
  // Grid settings
  document.getElementById('grid-maxwidth').value = bp.maxWidth || defaultSettings[currentBreakpoint].maxWidth;
  
  // Columns
  document.getElementById('columns-count').value = bp.columns.count;
  document.getElementById('columns-gutter').value = bp.columns.gutter;
  document.getElementById('columns-margin').value = bp.columns.margin;
  document.getElementById('columns-color').value = bp.columns.color;
  document.getElementById('columns-opacity').value = bp.columns.opacity;
  
  // Rows
  document.getElementById('rows-count').value = bp.rows.count;
  document.getElementById('rows-gutter').value = bp.rows.gutter;
  document.getElementById('rows-margin').value = bp.rows.margin;
  document.getElementById('rows-color').value = bp.rows.color;
  document.getElementById('rows-opacity').value = bp.rows.opacity;
}

function handleSettingChange(id, value) {
  // Handle grid-level settings
  if (id === 'grid-maxwidth') {
    settings[currentBreakpoint].maxWidth = parseInt(value) || 0;
    saveAndApplySettings();
    return;
  }
  
  const [type, property] = id.split('-');
  
  // Ensure settings structure exists
  if (!settings[currentBreakpoint]) {
    settings[currentBreakpoint] = JSON.parse(JSON.stringify(defaultSettings[currentBreakpoint]));
  }
  if (!settings[currentBreakpoint][type]) {
    settings[currentBreakpoint][type] = JSON.parse(JSON.stringify(defaultSettings[currentBreakpoint][type]));
  }
  
  // Update settings
  if (property === 'count' || property === 'gutter' || property === 'margin' || property === 'opacity') {
    settings[currentBreakpoint][type][property] = parseInt(value) || 0;
  } else if (property === 'color') {
    settings[currentBreakpoint][type][property] = value;
  }
  
  // Save and apply
  saveAndApplySettings();
}

function saveAndApplySettings() {
  // Save to storage
  chrome.storage.local.set({ [currentDomain]: settings }, () => {
    // Send message to content script (with error handling)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        // Check if we can inject scripts on this tab
        if (tabs[0].url && (tabs[0].url.startsWith('chrome://') || tabs[0].url.startsWith('chrome-extension://'))) {
          return; // Can't inject on Chrome pages
        }
        
        // Try to send message first
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: settings.enabled ? 'updateSettings' : 'toggleGrid',
            enabled: settings.enabled,
            settings: settings
          },
          (response) => {
            // If there's an error, the content script might not be loaded
            if (chrome.runtime.lastError) {
              // Only try to inject if the error is about connection
              if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
                // Inject content script and CSS
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  files: ['content/grid-overlay.js']
                }).then(() => {
                  return chrome.scripting.insertCSS({
                    target: { tabId: tabs[0].id },
                    files: ['content/grid-overlay.css']
                  });
                }).then(() => {
                  // Wait a bit for script to initialize
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: settings.enabled ? 'updateSettings' : 'toggleGrid',
                      enabled: settings.enabled,
                      settings: settings
                    });
                  }, 100);
                }).catch(err => {
                  // Silently fail - might be a restricted page
                  console.log('Could not inject content script:', err);
                });
              }
            }
          }
        );
      }
    });
  });
}

function toggleSection(header) {
  header.classList.toggle('collapsed');
  const section = header.dataset.section;
  const content = document.getElementById(`${section}-content`);
  content.classList.toggle('hidden');
}
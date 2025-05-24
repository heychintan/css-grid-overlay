// CSS Grid Overlay - Content Script - Phase 2
let gridOverlay = null;
let currentSettings = null;
let currentBreakpoint = 'desktop';

// Breakpoint definitions
const breakpoints = {
  desktop: window.matchMedia('(min-width: 992px)'),
  tablet: window.matchMedia('(min-width: 768px) and (max-width: 991px)'),
  landscape: window.matchMedia('(min-width: 480px) and (max-width: 767px)'),
  portrait: window.matchMedia('(max-width: 479px)')
};

// Initialize the grid overlay
function init() {
  const domain = window.location.hostname;
  
  // Load settings for this domain
  chrome.runtime.sendMessage({ action: 'getSettings', domain }, (settings) => {
    if (settings) {
      currentSettings = settings;
      if (settings.enabled) {
        createGridOverlay();
        updateBreakpoint();
      }
    }
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGrid') {
      if (request.enabled && request.settings) {
        currentSettings = request.settings;
        createGridOverlay();
        updateBreakpoint();
      } else {
        removeGridOverlay();
      }
    } else if (request.action === 'updateSettings') {
      currentSettings = request.settings;
      if (currentSettings.enabled) {
        if (!gridOverlay) {
          createGridOverlay();
        }
        updateBreakpoint();
      } else {
        removeGridOverlay();
      }
    }
  });
  
  // Listen for breakpoint changes
  Object.entries(breakpoints).forEach(([name, mq]) => {
    mq.addListener(() => {
      if (currentSettings && currentSettings.enabled) {
        updateBreakpoint();
      }
    });
  });
}

function createGridOverlay() {
  if (gridOverlay) return;
  
  gridOverlay = document.createElement('div');
  gridOverlay.className = 'css-grid-overlay';
  gridOverlay.id = 'css-grid-overlay-extension';
  document.body.appendChild(gridOverlay);
}

function removeGridOverlay() {
  if (gridOverlay) {
    gridOverlay.remove();
    gridOverlay = null;
  }
}

function updateBreakpoint() {
  // Determine current breakpoint
  for (const [name, mq] of Object.entries(breakpoints)) {
    if (mq.matches) {
      currentBreakpoint = name;
      break;
    }
  }
  
  updateGridOverlay();
}

function updateGridOverlay() {
  if (!gridOverlay || !currentSettings) return;
  
  const settings = currentSettings[currentBreakpoint];
  if (!settings) return;
  
  // Clear existing grid
  gridOverlay.innerHTML = '';
  
  // Create container with max-width
  const gridContainer = document.createElement('div');
  gridContainer.className = 'css-grid-overlay-container';
  gridContainer.style.maxWidth = settings.maxWidth ? `${settings.maxWidth}px` : 'none';
  gridContainer.style.margin = '0 auto';
  gridContainer.style.position = 'relative';
  gridContainer.style.height = '100%';
  
  // Create columns
  if (settings.columns.count > 0) {
    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'css-grid-overlay-columns';
    
    // Apply column styles
    columnsContainer.style.setProperty('--grid-gutter', `${settings.columns.gutter}px`);
    columnsContainer.style.setProperty('--grid-margin', `${settings.columns.margin}px`);
    columnsContainer.style.gap = `${settings.columns.gutter}px`;
    columnsContainer.style.padding = `0 ${settings.columns.margin}px`;
    
    // Create column elements
    for (let i = 0; i < settings.columns.count; i++) {
      const column = document.createElement('div');
      column.className = 'css-grid-overlay-column';
      column.style.backgroundColor = hexToRgba(settings.columns.color, settings.columns.opacity);
      columnsContainer.appendChild(column);
    }
    
    gridContainer.appendChild(columnsContainer);
  }
  
  // Create rows
  if (settings.rows.count > 0) {
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'css-grid-overlay-rows';
    
    // Apply row styles
    rowsContainer.style.setProperty('--grid-gutter', `${settings.rows.gutter}px`);
    rowsContainer.style.setProperty('--grid-margin', `${settings.rows.margin}px`);
    rowsContainer.style.gap = `${settings.rows.gutter}px`;
    rowsContainer.style.padding = `${settings.rows.margin}px 0`;
    
    // Create row elements
    for (let i = 0; i < settings.rows.count; i++) {
      const row = document.createElement('div');
      row.className = 'css-grid-overlay-row';
      row.style.backgroundColor = hexToRgba(settings.rows.color, settings.rows.opacity);
      rowsContainer.appendChild(row);
    }
    
    gridContainer.appendChild(rowsContainer);
  }
  
  gridOverlay.appendChild(gridContainer);
}

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
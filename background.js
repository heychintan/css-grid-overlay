// Background service worker for CSS Grid Overlay
chrome.runtime.onInstalled.addListener(() => {
    console.log('CSS Grid Overlay installed');
  });
  
  // Handle messages from content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
      // Get settings for the current domain
      chrome.storage.local.get([request.domain], (result) => {
        sendResponse(result[request.domain] || null);
      });
      return true; // Keep the message channel open for async response
    }
  });
  
  // Handle connection errors gracefully
  chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        // Ignore the error - this is expected when content script is not loaded
      }
    });
  });
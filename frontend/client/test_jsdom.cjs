const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', { runScripts: 'dangerously', url: 'http://localhost/' });
dom.window.console.log = console.log;
dom.window.console.error = console.error;
dom.window.onerror = (msg, url, line, col, error) => console.error('GLOBAL ERROR:', error?.stack || msg);

// Polyfill indexedDB to bypass Dexie crash
dom.window.indexedDB = {
  open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }),
  deleteDatabase: () => ({ onsuccess: null, onerror: null }),
  cmp: () => 0
};
dom.window.IDBKeyRange = {};

const fs = require('fs');
const code = fs.readFileSync('../dist/public/assets/index-2w-_4y1A.js', 'utf8');

try {
  dom.window.eval(code.replace(/import\\.meta\\.url/g, '"http://localhost/"'));
} catch(e) {
  console.error('EVAL ERROR:', e?.stack || e);
}

// Keep event loop alive for React rendering
setTimeout(() => {
  console.log("Finished waiting.");
}, 5000);

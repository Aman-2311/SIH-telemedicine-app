const fs = require('fs');

// Mocks to get through module evaluation
global.window = {
  location: { hostname: 'localhost' },
  addEventListener: () => {}
};
global.document = {
  createElement: () => ({ style: {} }),
  getElementById: () => ({ appendChild: () => {} })
};
global.navigator = { userAgent: 'node' };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.location = global.window.location;
global.indexedDB = {
  open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }),
  deleteDatabase: () => ({ onsuccess: null, onerror: null }),
  cmp: () => 0
};
global.IDBKeyRange = {};

const code = fs.readFileSync('../dist/public/assets/index-B_yI3cUH.js', 'utf8');

try {
  // Use Function to evaluate the code in the current scope
  new Function(code.replace(/import\\.meta\\.url/g, '"http://localhost/"'))();
  console.log('Evaluated successfully without top-level TDZ.');
} catch(e) {
  console.error('TDZ ERROR:', e?.stack || e);
}

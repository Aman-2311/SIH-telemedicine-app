const fs = require('fs');
const code = fs.readFileSync('index-vercel.js', 'utf8');

const matches = [...code.matchAll(/(const|let|var)\s+([^=;]+,\s*)*K\s*(=|;|,)/g)];
console.log("Found " + matches.length + " definitions of K");

for (const match of matches) {
  const index = match.index;
  const context = code.substring(Math.max(0, index - 100), Math.min(code.length, index + 100));
  console.log("Context:", context);
}

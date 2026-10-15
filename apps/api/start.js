const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, 'dist', 'src', 'main.js'),
  path.join(__dirname, 'dist', 'main.js'),
];

const found = candidates.find((p) => fs.existsSync(p));

if (!found) {
  console.error('Could not find main.js! Looking in:', candidates);
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    console.error('Files in dist:', fs.readdirSync(path.join(__dirname, 'dist')));
  }
  process.exit(1);
}

console.log('Starting CRM Backend from:', found);
require(found);

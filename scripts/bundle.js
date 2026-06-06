const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appPath = path.join(root, 'js', 'app.jsx');
const featPath = path.join(root, 'js', 'nexus-features.jsx');
const outPath = path.join(root, 'js', 'app.bundle.jsx');

const marker = '// ── Main App';
const app = fs.readFileSync(appPath, 'utf8');
const feat = fs.readFileSync(featPath, 'utf8');
const idx = app.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found in app.jsx');
  process.exit(1);
}
const bundled = app.slice(0, idx) + feat + '\n\n' + app.slice(idx);
fs.writeFileSync(outPath, bundled, 'utf8');
console.log('Bundled -> js/app.bundle.jsx');

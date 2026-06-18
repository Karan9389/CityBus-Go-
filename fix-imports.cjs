const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src');
const pattern = /(["'])(@?[^"']+?)@(\d+\.\d+\.\d+)([^"']*)\1/g;
const exts = ['.ts', '.tsx', '.js', '.jsx'];
let updated = 0;
let filesChanged = 0;
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.includes(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      const newText = text.replace(pattern, (match, quote, pkg, version, rest) => `${quote}${pkg}${rest}${quote}`);
      if (newText !== text) {
        fs.writeFileSync(full, newText, 'utf8');
        updated += (text.match(pattern) || []).length;
        filesChanged += 1;
      }
    }
  }
}
walk(root);
console.log(`Updated ${updated} imports across ${filesChanged} files`);

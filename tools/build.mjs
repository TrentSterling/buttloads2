// Optional standalone distribution; source development has no build step.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root = path.resolve(import.meta.dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, file) => '<style>' + fs.readFileSync(path.join(root, file), 'utf8') + '</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, file) => '<script>\n' + fs.readFileSync(path.join(root, file), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>');
let scripts = 0;
for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (match[1].includes('application/ld+json')) JSON.parse(match[2]);
  else { new vm.Script(match[2], { filename: `standalone-script-${++scripts}.js` }); }
}
if (/<script[^>]+src=/.test(html) || /<link[^>]+rel="stylesheet"/.test(html)) throw new Error('Standalone build contains an unbundled dependency.');
const out = path.join(root, 'dist'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'index.html'), html); fs.copyFileSync(path.join(root, 'og-image.png'), path.join(out, 'og-image.png'));
console.log(`Standalone build: dist/index.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
console.log(`PASS standalone: ${scripts} scripts compile; no external scripts or stylesheets.`);

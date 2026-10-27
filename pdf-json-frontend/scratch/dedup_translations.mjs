import fs from 'fs';
import path from 'path';

const tsPath = path.resolve('src/i18n/translations.ts');
let content = fs.readFileSync(tsPath, 'utf8');

// The file has export const translations: Record<LanguageCode, Record<string, string>> = { ... };
// Let's parse each language block: en: { ... }, es: { ... }, fr: { ... }, de: { ... }, hi: { ... }

const header = content.substring(0, content.indexOf('export const translations: Record<LanguageCode, Record<string, string>> = {'));

const langRegex = /^\s*([a-z]{2}):\s*\{/gm;
let match;
const langBlocks = {};
const blockIndices = [];

while ((match = langRegex.exec(content)) !== null) {
  blockIndices.push({ lang: match[1], index: match.index });
}

// For each block, extract all key-value pairs
for (let i = 0; i < blockIndices.length; i++) {
  const current = blockIndices[i];
  const next = blockIndices[i + 1];
  const endIdx = next ? next.index : content.lastIndexOf('};');
  const blockText = content.substring(current.index, endIdx);

  // Parse key-values with regex: 'some.key': 'some value' or 'some.key': "some value"
  const kvRegex = /^\s*['"]([a-zA-Z0-9_.-]+)['"]\s*:\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2\s*,?/gm;
  let kvMatch;
  const kvMap = new Map();
  while ((kvMatch = kvRegex.exec(blockText)) !== null) {
    const key = kvMatch[1];
    const val = kvMatch[3];
    // Keep the latest value
    kvMap.set(key, val);
  }
  langBlocks[current.lang] = kvMap;
}

// Now rebuild translations.ts cleanly
let output = header + 'export const translations: Record<LanguageCode, Record<string, string>> = {\n';

for (const [lang, map] of Object.entries(langBlocks)) {
  output += `  // ================= ${lang.toUpperCase()} =================\n`;
  output += `  ${lang}: {\n`;
  for (const [key, val] of map.entries()) {
    // Escape single quotes if not already escaped
    let unescaped = val.replace(/\\'/g, "'");
    let safe = unescaped.replace(/'/g, "\\'");
    output += `    '${key}': '${safe}',\n`;
  }
  output += `  },\n\n`;
}

output += '};\n';

fs.writeFileSync(tsPath, output, 'utf8');
console.log('Cleaned and de-duplicated translations.ts successfully!');

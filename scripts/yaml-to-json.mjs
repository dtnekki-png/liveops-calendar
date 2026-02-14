/**
 * Build script: convert all YAML files in data/ to JSON in dist/data/
 * Run after `vite build` to prepare data for production deployment
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.resolve('data');
const DIST_DATA_DIR = path.resolve('dist', 'data');

function walkDir(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDir(full));
        } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
            files.push(full);
        }
    }
    return files;
}

const yamlFiles = walkDir(DATA_DIR);
let count = 0;

for (const file of yamlFiles) {
    const rel = path.relative(DATA_DIR, file);
    const jsonRel = rel.replace(/\.ya?ml$/, '.json');
    const outPath = path.join(DIST_DATA_DIR, jsonRel);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const content = fs.readFileSync(file, 'utf-8');
    const data = yaml.load(content);
    fs.writeFileSync(outPath, JSON.stringify(data), 'utf-8');
    count++;
}

console.log(`✓ Converted ${count} YAML files to JSON in dist/data/`);

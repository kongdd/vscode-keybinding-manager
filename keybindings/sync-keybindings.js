/* Sync contributes/keybindings_*.jsonc into package.json's contributes.keybindings */
'use strict';

const fs = require('fs');
const path = require('path');

/** @param {string} str */
function stripJsonComments(str) {
    // minimal stripper for // and /* */ comments
    return str
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Read, merge, and deduplicate keybindings from multiple JSONC files.
 * Deduplication key is (key, command, when).
 * @param {string[]} sources
 * @returns {any[]}
 */
function mergeKeybindings(sources) {
    /** @param {string} p */
    const readJsonc = (p) => JSON.parse(stripJsonComments(fs.readFileSync(p, 'utf8')));
    const arrays = sources.filter(fs.existsSync).map(readJsonc);
    const merged = arrays.flat().filter(Boolean);

    const seen = new Set();
    return merged.filter((it) => {
        const id = `${it.key}|${it.command}|${it.when || ''}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function run() {
    const root = path.resolve(__dirname, '..');
    const pkgPath = path.join(root, 'package.json');

    const out = path.join(__dirname, 'keybindings.json');
    const sources = [
        path.join(__dirname, 'keybindings-all.jsonc'),
        path.join(__dirname, 'keybindings-md.jsonc'),
        path.join(__dirname, 'keybindings-typst.jsonc'),
    ];

    const keys = mergeKeybindings(sources);
    fs.writeFileSync(out, JSON.stringify(keys, null, 4) + '\n', 'utf8');
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.contributes = pkg.contributes || {};
    pkg.contributes.keybindings = keys;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf8');
    console.log(`[sync-keybindings] Synced ${keys.length} keybindings`);
}

if (require.main === module) run();

module.exports = { run, mergeKeybindings };

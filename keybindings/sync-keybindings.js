/* Sync contributes/keybindings_*.jsonc into package.json's contributes.keybindings */
'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function getUserConfigPath() {
    const osMap = {
        darwin: path.join(process.env.HOME || '', 'Library/Application Support'),
        win32: process.env.APPDATA || ''
    };
    return path.join(osMap[process.platform] || '/var/local', 'Code', 'User');
}

/** @param {string} str */
function stripJsonComments(str) {
    // minimal stripper for // and /* */ comments
    return str
        .replace(/\/\*[\s\S]*?\*\//g, '')  // 多行注释
        .replace(/^\s*\/\/.*$/gm, '')      // 单行注释
        .replace(/,(\s*[}\]])/g, '$1');    // 尾随逗号
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
    const indir = path.resolve(__dirname).replace(/\\/g, '/');
    const dir_root = path.resolve(__dirname, '..');

    const out = path.join(dir_root, 'keybindings.json');

    const userPath = getUserConfigPath();
    console.log(userPath);

    const pattern = `${indir}/*.jsonc`;
    const files = glob.sync(pattern);

    const keys = mergeKeybindings(files);
    fs.writeFileSync(out, JSON.stringify(keys, null, 4) + '\n', 'utf8');
    console.log(`[sync-keybindings] Synced ${keys.length} keybindings`);

    // write shortcuts into package.json
    let inject2pkg = false;
    if (inject2pkg) {
        const pkgPath = path.join(dir_root, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.contributes = pkg.contributes || {};
        pkg.contributes.keybindings = keys;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf8');
    }
}

if (require.main === module) run();

module.exports = { run, mergeKeybindings };

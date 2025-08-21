import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getKeybindingsPath } from './utils';
import { getAllKeybindingsFiles, mergeKeybindings } from './fileOperations';
import { backupKeybindingsFile } from './backup';
import { getExtensionConfig } from './config';

// 同步keybindings文件
export async function syncKeybindings(backup: boolean = false): Promise<void> {
    try {
        const config = getExtensionConfig();
        const sources = getAllKeybindingsFiles(config);

        if (sources.length === 0) {
            vscode.window.showInformationMessage('没有找到keybindings文件，请在设置中添加文件或文件夹');
            return;
        }

        const keybindingsPath = getKeybindingsPath();
        let backupPath = '';

        // 如果需要备份，先备份原文件
        if (backup && fs.existsSync(keybindingsPath)) {
            backupPath = await backupKeybindingsFile();
        }

        // 合并所有keybindings文件
        const keys = mergeKeybindings(sources);

        // 写入keybindings.json
        await fs.promises.writeFile(keybindingsPath, JSON.stringify(keys, null, 2) + '\n', 'utf8');

        let message = `已同步 ${keys.length} 个快捷键设置`;
        if (backup && backupPath) {
            message += `，原文件已备份到 ${path.basename(backupPath)}`;
        }
        vscode.window.showInformationMessage(message);
    } catch (error) {
        console.error('同步失败:', error);
        vscode.window.showErrorMessage(`同步快捷键设置失败: ${error}`);
    }
}

// 备份并同步keybindings文件
export async function backupAndSyncKeybindings(): Promise<void> {
    await syncKeybindings(true);
}

// 合并folder下的jsonc文件到用户keybindings
export async function mergeKeybindingsFromFolder(): Promise<void> {
    try {
        const config = getExtensionConfig();

        if (!config.folderPath || !config.folderPath.trim()) {
            vscode.window.showWarningMessage('请先在设置中配置keybindings文件夹路径');
            return;
        }

        const sources = getAllKeybindingsFiles(config);
        const folderFiles = sources.filter(file => {
            const userConfigPath = require('./utils').getUserConfigPath();
            const folderPath = path.isAbsolute(config.folderPath)
                ? config.folderPath
                : path.join(userConfigPath, config.folderPath);
            return file.startsWith(folderPath);
        });

        if (folderFiles.length === 0) {
            vscode.window.showInformationMessage(`在文件夹 ${config.folderPath} 中没有找到符合模式 ${config.filePattern} 的keybindings文件`);
            return;
        }

        const keybindingsPath = getKeybindingsPath();

        // 合并所有keybindings文件
        const keys = mergeKeybindings(folderFiles);

        // 写入keybindings.json
        await fs.promises.writeFile(keybindingsPath, JSON.stringify(keys, null, 2) + '\n', 'utf8');

        vscode.window.showInformationMessage(`已合并 ${folderFiles.length} 个文件中的 ${keys.length} 个快捷键设置到用户keybindings.json`);
    } catch (error) {
        console.error('合并失败:', error);
        vscode.window.showErrorMessage(`合并快捷键设置失败: ${error}`);
    }
}

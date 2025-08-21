import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getKeybindingsPath } from './utils';
import { getAllKeybindingsFiles, mergeKeybindings } from './fileOperations';
import { getExtensionConfig } from './config';

// 同步keybindings文件
export async function syncKeybindings(): Promise<void> {
    try {
        const config = getExtensionConfig();
        const sources = getAllKeybindingsFiles(config);

        if (sources.length === 0) {
            vscode.window.showInformationMessage('没有找到keybindings文件，请在设置中添加文件或文件夹');
            return;
        }

        const keybindingsPath = getKeybindingsPath();

        // 合并所有keybindings文件
        const keys = mergeKeybindings(sources);

        // 写入keybindings.json
        await fs.promises.writeFile(keybindingsPath, JSON.stringify(keys, null, 2) + '\n', 'utf8');

        let message = `已同步 ${keys.length} 个快捷键设置`;
        
        vscode.window.showInformationMessage(message);
    } catch (error) {
        console.error('同步失败:', error);
        vscode.window.showErrorMessage(`同步快捷键设置失败: ${error}`);
    }
}

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigPath, getKeybindingsPath, stripJsonComments, getExtensionConfig } from './config';


// 设置keybindings文件夹
export async function setupKeybindingsFolder(): Promise<void> {
    try {
        const folderPath = await vscode.window.showInputBox({
            prompt: '输入keybindings文件夹路径',
            placeHolder: 'keybindings 或 D:\\my-keybindings',
            validateInput: (value) => value?.trim() ? undefined : '路径不能为空'
        });
        
        if (!folderPath) return;

        const userConfigPath = getUserConfigPath();

        let actualPath = path.isAbsolute(folderPath) ? folderPath : path.join(userConfigPath, folderPath);
        actualPath = actualPath.replace(/\\/g, '/');

        await fs.promises.mkdir(actualPath, { recursive: true });

        const config = vscode.workspace.getConfiguration('keybindingsManager');
        await config.update('folderPath', actualPath, vscode.ConfigurationTarget.Global);

        await migrateExistingKeybindings();

    } catch (error) {
        console.error('设置文件夹失败:', error);
        vscode.window.showErrorMessage(`设置keybindings文件夹失败: ${error}`);
    }
}

// 迁移现有的keybindings.json
export async function migrateExistingKeybindings(): Promise<void> {
    try {
        const keybindingsPath = getKeybindingsPath();
        
        // 检查是否存在keybindings.json文件
        if (!fs.existsSync(keybindingsPath)) return;
        
        const content = await fs.promises.readFile(keybindingsPath, 'utf8');
        const cleanContent = stripJsonComments(content.trim() || '[]');
        const parsed = JSON.parse(cleanContent);
        
        if (!Array.isArray(parsed) || parsed.length === 0) return; // 空文件，无需迁移
        
        const config = getExtensionConfig();
        if (!config.folderPath || !config.folderPath.trim()) {
            vscode.window.showErrorMessage('请先设置keybindings文件夹');
            return;
        }
        
        const backupFolderPath = path.join(config.folderPath, "backup");
        await fs.promises.mkdir(backupFolderPath, { recursive: true });
        
        // 直接备份到backup文件夹
        const backupPath = path.join(backupFolderPath, 'keybindings-backup.json');
        await fs.promises.copyFile(keybindingsPath, backupPath);
        
        vscode.window.showInformationMessage(`已备份现有keybindings.json到 ${backupPath}`);
    } catch (error) {
        console.error('迁移keybindings失败:', error);
        vscode.window.showErrorMessage(`迁移keybindings文件失败: ${error}`);
    }
}

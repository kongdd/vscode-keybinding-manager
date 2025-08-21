import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigPath, getKeybindingsPath, stripJsonComments } from './utils';
import { getExtensionConfig } from './config';

// 初始化keybindings管理系统
export async function initializeKeybindingsManager(): Promise<void> {
    try {
        const config = getExtensionConfig();

        // 检查是否已经配置了文件夹
        if (!config.folderPath || !config.folderPath.trim()) {
            const shouldSetup = await vscode.window.showInformationMessage(
                '欢迎使用Keybindings Manager！需要先设置一个文件夹来存放您的keybindings文件。',
                '立即设置', '稍后设置'
            );

            if (shouldSetup === '立即设置') {
                await setupKeybindingsFolder();
            }
            return;
        }

        // 检查是否需要迁移现有的keybindings.json
        await migrateExistingKeybindings();

    } catch (error) {
        console.error('初始化失败:', error);
        vscode.window.showErrorMessage(`初始化Keybindings Manager失败: ${error}`);
    }
}

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
        const actualPath = path.isAbsolute(folderPath) ? folderPath : path.join(userConfigPath, folderPath);

        await fs.promises.mkdir(actualPath, { recursive: true });

        const config = vscode.workspace.getConfiguration('keybindingsManager');
        await config.update('folder', folderPath, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`已创建keybindings文件夹: ${actualPath}`);
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

        const shouldMigrate = await vscode.window.showInformationMessage(
            '检测到您已有keybindings.json文件，是否将其迁移为keybindings-main.json并复制到管理文件夹中？',
            '是', '否');
        if (shouldMigrate !== '是') return;

        const config = getExtensionConfig();
        if (!config.folderPath || !config.folderPath.trim()) {
            vscode.window.showErrorMessage('请先设置keybindings文件夹');
            return;
        }

        const mainKeybindingsName = 'keybindings-main.json';
        const backupKeybindingsName = 'keybindings-backup.json';

        const folderPath = config.folderPath + "/backup";
        await fs.promises.mkdir(folderPath, { recursive: true });    // 确保文件夹存在
        
        // 创建keybindings-main.json（用于管理的主文件）
        const mainKeybindingsPath = path.join(folderPath, mainKeybindingsName);
        await fs.promises.copyFile(keybindingsPath, mainKeybindingsPath);

        // 创建keybindings-backup.json（用户原始配置的备份）
        const backupKeybindingsPath = path.join(folderPath, backupKeybindingsName);
        await fs.promises.copyFile(keybindingsPath, backupKeybindingsPath);

        // 更新配置，将keybindings-main.json添加到files列表中
        const configObj = vscode.workspace.getConfiguration('keybindingsManager');
        const files = configObj.get<string[]>('files', []);

        if (!files.includes(mainKeybindingsName)) {
            files.push(mainKeybindingsName);
            await configObj.update('files', files, vscode.ConfigurationTarget.Global);
        }

        vscode.window.showInformationMessage(
            `已成功迁移keybindings.json：\n- 创建了${mainKeybindingsName}用于管理\n- 创建了${backupKeybindingsName}作为原始配置备份\n- 已复制到管理文件夹中`
        );
    } catch (error) {
        console.error('迁移keybindings失败:', error);
        vscode.window.showErrorMessage(`迁移keybindings文件失败: ${error}`);
    }
}

// 重置keybindings管理系统
export async function resetKeybindingsManager(): Promise<void> {
    try {
        const confirm = await vscode.window.showWarningMessage(
            '这将清除所有keybindings管理配置，确定要继续吗？',
            '确定', '取消'
        );
        if (confirm !== '确定') return;

        // 清除配置
        const config = vscode.workspace.getConfiguration('keybindingsManager');
        await config.update('files', [], vscode.ConfigurationTarget.Global);
        await config.update('folder', '', vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage('已重置keybindings管理配置');
    } catch (error) {
        console.error('重置失败:', error);
        vscode.window.showErrorMessage(`重置keybindings管理器失败: ${error}`);
    }
}

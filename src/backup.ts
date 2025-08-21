import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigPath, getKeybindingsPath } from './utils';

// 备份keybindings文件到用户配置目录
export async function backupKeybindingsFile(): Promise<string> {
    const userConfigPath = getUserConfigPath();
    const keybindingsPath = getKeybindingsPath();

    try {
        // 创建带时间戳的备份文件名
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, -5); // 移除毫秒部分
        const backupFileName = `keybindings-backup-${timestamp}.json`;
        const backupFilePath = path.join(userConfigPath, backupFileName);

        // 复制文件
        if (fs.existsSync(keybindingsPath)) {
            await fs.promises.copyFile(keybindingsPath, backupFilePath);
        } else {
            // 如果原文件不存在，创建一个空的备份文件
            await fs.promises.writeFile(backupFilePath, '[]\n', 'utf8');
        }

        return backupFilePath;
    } catch (error) {
        console.error('备份文件失败:', error);
        throw new Error(`备份文件失败: ${error}`);
    }
}

// 恢复原始keybindings文件
export async function restoreKeybindings(): Promise<void> {
    try {
        const userConfigPath = getUserConfigPath();

        // 获取所有备份文件（包括带时间戳的备份和keybindings-backup.json）
        const files = await fs.promises.readdir(userConfigPath);
        const timestampBackups = files
            .filter(file => file.startsWith('keybindings-backup-') && file.endsWith('.json'))
            .sort()
            .reverse(); // 最新的备份在前面

        const originalBackup = files.includes('keybindings-backup.json') ? ['keybindings-backup.json'] : [];
        const allBackups = [...originalBackup, ...timestampBackups];

        if (allBackups.length === 0) {
            vscode.window.showInformationMessage('没有找到备份文件');
            return;
        }

        // 创建显示选项，包含文件修改时间
        const options = await Promise.all(
            allBackups.map(async (file) => {
                const filePath = path.join(userConfigPath, file);
                const stats = await fs.promises.stat(filePath);
                const dateStr = stats.mtime.toLocaleString('zh-CN');

                let description = `创建时间: ${dateStr}`;
                if (file === 'keybindings-backup.json') {
                    description = `用户原始配置备份 - ${dateStr}`;
                }

                return {
                    label: file,
                    description: description,
                    file: file
                };
            })
        );

        // 让用户选择要恢复的备份文件
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: '选择要恢复的备份文件'
        });

        if (!selected) {
            return;
        }

        const backupFilePath = path.join(userConfigPath, selected.file);
        const keybindingsPath = getKeybindingsPath();

        // 恢复备份文件
        await fs.promises.copyFile(backupFilePath, keybindingsPath);

        let message = `已恢复备份文件: ${selected.file}`;
        if (selected.file === 'keybindings-backup.json') {
            message = '已恢复您的原始keybindings配置';
        }

        vscode.window.showInformationMessage(message);
    } catch (error) {
        console.error('恢复备份失败:', error);
        vscode.window.showErrorMessage(`恢复备份文件失败: ${error}`);
    }
}

// 恢复用户原始配置的专门函数
export async function restoreOriginalKeybindings(): Promise<void> {
    try {
        const userConfigPath = getUserConfigPath();
        const originalBackupPath = path.join(userConfigPath, 'keybindings-backup.json');

        // 检查原始备份文件是否存在
        if (!fs.existsSync(originalBackupPath)) {
            vscode.window.showErrorMessage('未找到原始keybindings配置备份文件 (keybindings-backup.json)');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            '确定要恢复到您的原始keybindings配置吗？这将覆盖当前的keybindings.json文件。',
            '确定', '取消'
        );

        if (confirm !== '确定') {
            return;
        }

        const keybindingsPath = getKeybindingsPath();

        // 恢复原始配置
        await fs.promises.copyFile(originalBackupPath, keybindingsPath);

        vscode.window.showInformationMessage('已成功恢复到您的原始keybindings配置');
    } catch (error) {
        console.error('恢复原始配置失败:', error);
        vscode.window.showErrorMessage(`恢复原始配置失败: ${error}`);
    }
}

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUserConfigPath } from './utils';
import { getExtensionConfig } from './config';
import { syncKeybindings } from './merge';

// 监听文件变化
export function watchKeybindingsFiles(): vscode.Disposable {
    const config = getExtensionConfig();
    const userConfigPath = getUserConfigPath();
    const watchers: vscode.Disposable[] = [];

    const handleChange = () => config.autoSync && syncKeybindings().catch(console.error);

    // 监听单个文件
    if (config.files.length > 0) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(userConfigPath, `{${config.files.join(',')}}`)
        );
        [fileWatcher.onDidChange, fileWatcher.onDidCreate, fileWatcher.onDidDelete]
            .forEach(event => event(handleChange));
        watchers.push(fileWatcher);
    }

    // 监听文件夹
    if (config.folderPath?.trim()) {
        const folderPath = path.isAbsolute(config.folderPath)
            ? config.folderPath
            : path.join(userConfigPath, config.folderPath);

        try {
            if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
                const folderWatcher = vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(folderPath, config.filePattern)
                );
                [folderWatcher.onDidChange, folderWatcher.onDidCreate, folderWatcher.onDidDelete]
                    .forEach(event => event(handleChange));
                watchers.push(folderWatcher);
            }
        } catch (error) {
            console.warn(`监听文件夹失败 ${folderPath}:`, error);
        }
    }

    return { dispose: () => watchers.forEach(w => w.dispose()) };
}

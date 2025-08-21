import * as vscode from 'vscode';
import { syncKeybindings } from './merge';
import { watchKeybindingsFiles } from './watcher';
import { setupKeybindingsFolder } from './initialization';

export function activate(context: vscode.ExtensionContext) {
    console.log('Keybindings Manager 扩展已激活');

    let fileWatcher: vscode.Disposable | undefined;
    const initializeWatcher = () => (fileWatcher?.dispose(), fileWatcher = watchKeybindingsFiles());

    // 命令映射 - 极简设计，只保留核心功能
    const commands = {
        'keybindings-manager.setupFolder': setupKeybindingsFolder,
        'keybindings-manager.sync': syncKeybindings
    };

    // 注册所有命令
    Object.entries(commands).forEach(([id, handler]) =>
        context.subscriptions.push(
            vscode.commands.registerCommand(id, () => handler().catch(console.error))
        )
    );

    // 监听配置变化
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('keybindingsManager')) {
                console.log('配置发生变化，重新初始化文件监听器');
                initializeWatcher();
            }
        })
    );

    // 初始化
    initializeWatcher();
    context.subscriptions.push({ dispose: () => fileWatcher?.dispose() });
}

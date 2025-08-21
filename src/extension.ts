import * as vscode from 'vscode';
import { syncKeybindings, backupAndSyncKeybindings, mergeKeybindingsFromFolder } from './merge';
import { restoreKeybindings, restoreOriginalKeybindings } from './backup';
import { watchKeybindingsFiles } from './watcher';
import {
    initializeKeybindingsManager,
    setupKeybindingsFolder,
    migrateExistingKeybindings,
    resetKeybindingsManager
} from './initialization';

export function activate(context: vscode.ExtensionContext) {
    console.log('Keybindings Manager 扩展已激活');

    let fileWatcher: vscode.Disposable | undefined;
    const initializeWatcher = () => (fileWatcher?.dispose(), fileWatcher = watchKeybindingsFiles());

    // 命令映射
    const commands = {
        'keybindings-manager.initialize': initializeKeybindingsManager,
        'keybindings-manager.setupFolder': setupKeybindingsFolder,
        'keybindings-manager.migrate': migrateExistingKeybindings,
        'keybindings-manager.sync': syncKeybindings,
        'keybindings-manager.merge': mergeKeybindingsFromFolder, // 合并folder下的jsonc文件
        'keybindings-manager.backupAndSync': backupAndSyncKeybindings,
        'keybindings-manager.restore': restoreKeybindings,
        'keybindings-manager.restoreOriginal': restoreOriginalKeybindings,
        'keybindings-manager.reset': resetKeybindingsManager
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
    // initializeKeybindingsManager().catch(console.error);
}

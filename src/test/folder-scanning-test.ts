/**
 * 测试文件夹扫描功能
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getAllKeybindingsFiles } from '../fileOperations';
import { ExtensionConfig } from '../config';

function testFolderScanning() {
    console.log('🧪 测试文件夹扫描功能...\n');

    // 创建临时测试目录
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keybindings-folder-test-'));
    const testFolder = path.join(tempDir, 'test-keybindings');
    fs.mkdirSync(testFolder, { recursive: true });

    // 创建测试文件
    const testFiles = [
        'keybindings-main.jsonc',
        'keybindings-custom.jsonc', 
        'keybindings-extra.json',
        'other-file.txt',
        'config.json'
    ];

    testFiles.forEach(filename => {
        const content = filename.includes('keybindings') 
            ? JSON.stringify([{ key: 'ctrl+shift+p', command: 'test.command' }], null, 2)
            : 'not a keybindings file';
        fs.writeFileSync(path.join(testFolder, filename), content);
    });

    console.log(`📁 创建测试文件夹: ${testFolder}`);
    console.log(`📝 创建测试文件: ${testFiles.join(', ')}\n`);

    // 测试不同的配置
    const testConfigs: { config: ExtensionConfig; description: string }[] = [
        {
            config: {
                files: [],
                folderPath: testFolder,
                filePattern: 'keybindings-*.jsonc',
                autoSync: true
            },
            description: '扫描 keybindings-*.jsonc 文件'
        },
        {
            config: {
                files: [],
                folderPath: testFolder,
                filePattern: '*.jsonc',
                autoSync: true
            },
            description: '扫描所有 .jsonc 文件'
        },
        {
            config: {
                files: [],
                folderPath: testFolder,
                filePattern: 'keybindings-*.*',
                autoSync: true
            },
            description: '扫描所有 keybindings-* 文件'
        }
    ];

    testConfigs.forEach((testCase, index) => {
        console.log(`📋 测试 ${index + 1}: ${testCase.description}`);
        console.log(`   文件夹: ${testCase.config.folderPath}`);
        console.log(`   模式: ${testCase.config.filePattern}`);
        
        const foundFiles = getAllKeybindingsFiles(testCase.config);
        console.log(`   找到文件数: ${foundFiles.length}`);
        foundFiles.forEach(file => {
            console.log(`   - ${path.basename(file)}`);
        });
        console.log('');
    });

    // 清理测试文件
    console.log('🧹 清理测试文件...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ 清理完成\n');

    console.log('🎉 文件夹扫描测试完成！');
}

// 运行测试
if (require.main === module) {
    testFolderScanning();
}

export { testFolderScanning };

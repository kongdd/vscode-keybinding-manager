#!/usr/bin/env node

/**
 * 独立的测试验证脚本 - 用于验证keybindings合并功能
 * 可以在Node.js环境中直接运行，不依赖VS Code环境
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 导入测试专用的模块（不依赖VS Code）
import { mergeKeybindings, readJsoncFile, stripJsonComments } from './testUtils';

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 简单的断言函数
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`❌ 断言失败: ${message}`);
    }
    console.log(`✅ ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`❌ 断言失败: ${message}. 期望: ${expected}, 实际: ${actual}`);
    }
    console.log(`✅ ${message}`);
}

// 测试用例运行器
async function runTests() {
    console.log('🚀 开始运行keybindings合并测试...\n');
    
    let tempDir: string = '';
    let testFiles: string[] = [];
    
    try {
        // 创建临时目录
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keybindings-test-'));
        console.log(`📁 创建临时测试目录: ${tempDir}`);
        
        // 辅助函数：创建测试文件
        function createTestFile(filename: string, content: string): string {
            const filePath = path.join(tempDir, filename);
            fs.writeFileSync(filePath, content, 'utf8');
            testFiles.push(filePath);
            return filePath;
        }
        
        console.log('\n📋 测试1: 正确合并多个keybindings文件');
        {
            const file1 = createTestFile('keybindings1.json', JSON.stringify([
                { "key": "ctrl+shift+p", "command": "workbench.action.showCommands" },
                { "key": "ctrl+n", "command": "workbench.action.files.newUntitledFile" }
            ], null, 2));

            const file2 = createTestFile('keybindings2.json', JSON.stringify([
                { "key": "ctrl+o", "command": "workbench.action.files.openFile" },
                { "key": "ctrl+s", "command": "workbench.action.files.save" }
            ], null, 2));

            const result = mergeKeybindings([file1, file2]);
            assertEqual(result.length, 4, '应该合并所有4个键绑定');
            
            const commands = result.map((item: any) => item.command);
            assert(commands.includes('workbench.action.showCommands'), '应该包含showCommands命令');
            assert(commands.includes('workbench.action.files.newUntitledFile'), '应该包含newUntitledFile命令');
            assert(commands.includes('workbench.action.files.openFile'), '应该包含openFile命令');
            assert(commands.includes('workbench.action.files.save'), '应该包含save命令');
        }
        
        console.log('\n📋 测试2: 正确去重相同的keybindings');
        {
            const file1 = createTestFile('dup1.json', JSON.stringify([
                { "key": "ctrl+shift+p", "command": "workbench.action.showCommands" },
                { "key": "ctrl+n", "command": "workbench.action.files.newUntitledFile" }
            ], null, 2));

            const file2 = createTestFile('dup2.json', JSON.stringify([
                { "key": "ctrl+shift+p", "command": "workbench.action.showCommands" },
                { "key": "ctrl+o", "command": "workbench.action.files.openFile" }
            ], null, 2));

            const result = mergeKeybindings([file1, file2]);
            assertEqual(result.length, 3, '应该去重相同的键绑定');
            
            const duplicateItems = result.filter((item: any) => 
                item.key === 'ctrl+shift+p' && item.command === 'workbench.action.showCommands'
            );
            assertEqual(duplicateItems.length, 1, '重复的键绑定应该只保留一个');
        }
        
        console.log('\n📋 测试3: 正确处理带when条件的keybindings');
        {
            const file1 = createTestFile('when.json', JSON.stringify([
                { "key": "ctrl+shift+p", "command": "workbench.action.showCommands", "when": "editorTextFocus" },
                { "key": "ctrl+shift+p", "command": "workbench.action.showCommands" }
            ], null, 2));

            const result = mergeKeybindings([file1]);
            assertEqual(result.length, 2, '不同when条件的键绑定应该都保留');
            
            const withWhen = result.find((item: any) => item.when === 'editorTextFocus');
            const withoutWhen = result.find((item: any) => !item.when);
            
            assert(!!withWhen, '应该包含有when条件的键绑定');
            assert(!!withoutWhen, '应该包含无when条件的键绑定');
        }
        
        console.log('\n📋 测试4: 正确处理JSONC格式（带注释）');
        {
            const jsonc = `// 这是一个keybindings配置文件
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands" // 显示命令面板
    },
    /* 多行注释 */
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile",
    } // 尾随逗号
]`;

            const file1 = createTestFile('jsonc.jsonc', jsonc);
            const result = mergeKeybindings([file1]);
            
            assertEqual(result.length, 2, '应该正确解析JSONC格式');
            assertEqual(result[0].command, 'workbench.action.showCommands', '第一个命令正确');
            assertEqual(result[1].command, 'workbench.action.files.newUntitledFile', '第二个命令正确');
        }
        
        console.log('\n📋 测试5: 正确处理空文件和无效文件');
        {
            console.log('   📝 注意：以下警告信息是预期的，表明错误处理机制正常工作');
            
            const emptyFile = createTestFile('empty.json', '');
            const invalidFile = createTestFile('invalid.json', '{ invalid json }');
            const validFile = createTestFile('valid.json', JSON.stringify([
                { "key": "ctrl+s", "command": "workbench.action.files.save" }
            ], null, 2));

            const result = mergeKeybindings([emptyFile, invalidFile, validFile]);
            assertEqual(result.length, 1, '应该只包含有效文件的内容');
            assertEqual(result[0].command, 'workbench.action.files.save', '应该是save命令');
        }
        
        console.log('\n📋 测试6: stripJsonComments工具函数');
        {
            const jsonWithComments = `{
    // 单行注释
    "key": "ctrl+s", /* 行内注释 */
    "command": "save", // 尾部注释
    /* 多行注释 */
    "when": "editorFocus"
}`;

            const result = stripJsonComments(jsonWithComments);
            
            assert(!result.includes('// 单行注释'), '应该移除单行注释');
            assert(!result.includes('/* 行内注释 */'), '应该移除行内注释');
            assert(!result.includes('// 尾部注释'), '应该移除尾部注释');
            assert(!result.includes('多行注释'), '应该移除多行注释');
            
            assert(result.includes('"key": "ctrl+s"'), '应该保留键值对');
            assert(result.includes('"command": "save"'), '应该保留命令');
        }
        
        console.log('\n🎉 所有测试通过！');
        
    } catch (error) {
        console.error('\n💥 测试失败:', error);
        process.exit(1);
    } finally {
        // 清理测试文件
        console.log('\n🧹 清理测试文件...');
        for (const file of testFiles) {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        console.log('✅ 清理完成');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { mergeKeybindings, readJsoncFile } from '../fileOperations';
import { stripJsonComments } from '../config';

// 使用VS Code测试框架的suite和test函数
declare function suite(name: string, fn: () => void): void;
declare function setup(fn: () => void): void;
declare function teardown(fn: () => void): void;
declare function test(name: string, fn: () => void): void;

// 测试套件：Keybindings合并功能
suite('Keybindings Merge Tests', () => {
    let tempDir: string;
    let testFiles: string[] = [];

    // 每个测试前的设置
    setup(() => {
        // 创建临时目录
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keybindings-test-'));
        testFiles = [];
    });

    // 每个测试后的清理
    teardown(() => {
        // 清理测试文件
        for (const file of testFiles) {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }
        // 清理临时目录
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // 辅助函数：创建测试文件
    function createTestFile(filename: string, content: string): string {
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        testFiles.push(filePath);
        return filePath;
    }

    test('应该正确合并多个keybindings文件', () => {
        // 创建测试文件
        const file1 = createTestFile('keybindings1.json', JSON.stringify([
            {
                "key": "ctrl+shift+p",
                "command": "workbench.action.showCommands"
            },
            {
                "key": "ctrl+n",
                "command": "workbench.action.files.newUntitledFile"
            }
        ], null, 2));

        const file2 = createTestFile('keybindings2.json', JSON.stringify([
            {
                "key": "ctrl+o",
                "command": "workbench.action.files.openFile"
            },
            {
                "key": "ctrl+s",
                "command": "workbench.action.files.save"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([file1, file2]);

        // 验证结果
        assert.strictEqual(result.length, 4, '应该合并所有4个键绑定');
        
        const commands = result.map(item => item.command);
        assert.ok(commands.includes('workbench.action.showCommands'), '应该包含showCommands命令');
        assert.ok(commands.includes('workbench.action.files.newUntitledFile'), '应该包含newUntitledFile命令');
        assert.ok(commands.includes('workbench.action.files.openFile'), '应该包含openFile命令');
        assert.ok(commands.includes('workbench.action.files.save'), '应该包含save命令');
    });

    test('应该正确去重相同的keybindings', () => {
        // 创建包含重复keybindings的测试文件
        const file1 = createTestFile('keybindings1.json', JSON.stringify([
            {
                "key": "ctrl+shift+p",
                "command": "workbench.action.showCommands"
            },
            {
                "key": "ctrl+n",
                "command": "workbench.action.files.newUntitledFile"
            }
        ], null, 2));

        const file2 = createTestFile('keybindings2.json', JSON.stringify([
            {
                "key": "ctrl+shift+p",
                "command": "workbench.action.showCommands"
            },
            {
                "key": "ctrl+o",
                "command": "workbench.action.files.openFile"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([file1, file2]);

        // 验证结果：应该去重，只保留3个不同的键绑定
        assert.strictEqual(result.length, 3, '应该去重相同的键绑定');
        
        const duplicateItems = result.filter(item => 
            item.key === 'ctrl+shift+p' && item.command === 'workbench.action.showCommands'
        );
        assert.strictEqual(duplicateItems.length, 1, '重复的键绑定应该只保留一个');
    });

    test('应该正确处理带when条件的keybindings', () => {
        // 创建包含when条件的测试文件
        const file1 = createTestFile('keybindings1.json', JSON.stringify([
            {
                "key": "ctrl+shift+p",
                "command": "workbench.action.showCommands",
                "when": "editorTextFocus"
            },
            {
                "key": "ctrl+shift+p",
                "command": "workbench.action.showCommands"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([file1]);

        // 验证结果：不同的when条件应该被视为不同的键绑定
        assert.strictEqual(result.length, 2, '不同when条件的键绑定应该都保留');
        
        const withWhen = result.find(item => item.when === 'editorTextFocus');
        const withoutWhen = result.find(item => !item.when);
        
        assert.ok(withWhen, '应该包含有when条件的键绑定');
        assert.ok(withoutWhen, '应该包含无when条件的键绑定');
    });

    test('应该正确处理JSONC格式（带注释）', () => {
        // 创建包含注释的JSONC文件
        const jsonc = `// 这是一个keybindings配置文件
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands" // 显示命令面板
    },
    /* 多行注释
       这里定义新文件快捷键 */
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile",
    } // 注意这里有尾随逗号
]`;

        const file1 = createTestFile('keybindings1.jsonc', jsonc);

        // 合并文件
        const result = mergeKeybindings([file1]);

        // 验证结果
        assert.strictEqual(result.length, 2, '应该正确解析JSONC格式');
        assert.strictEqual(result[0].command, 'workbench.action.showCommands');
        assert.strictEqual(result[1].command, 'workbench.action.files.newUntitledFile');
    });

    test('应该正确处理空文件和无效文件', () => {
        // 创建空文件
        const emptyFile = createTestFile('empty.json', '');
        
        // 创建无效JSON文件
        const invalidFile = createTestFile('invalid.json', '{ invalid json }');
        
        // 创建有效文件
        const validFile = createTestFile('valid.json', JSON.stringify([
            {
                "key": "ctrl+s",
                "command": "workbench.action.files.save"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([emptyFile, invalidFile, validFile]);

        // 验证结果：应该忽略空文件和无效文件，只处理有效文件
        assert.strictEqual(result.length, 1, '应该只包含有效文件的内容');
        assert.strictEqual(result[0].command, 'workbench.action.files.save');
    });

    test('应该正确处理包含args参数的keybindings', () => {
        // 创建包含args的测试文件
        const file1 = createTestFile('keybindings1.json', JSON.stringify([
            {
                "key": "ctrl+shift+t",
                "command": "workbench.action.terminal.new",
                "args": {
                    "cwd": "${workspaceFolder}"
                }
            },
            {
                "key": "f5",
                "command": "workbench.action.debug.start",
                "when": "debuggersAvailable && !inDebugMode"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([file1]);

        // 验证结果
        assert.strictEqual(result.length, 2, '应该包含所有键绑定');
        
        const terminalBinding = result.find(item => item.command === 'workbench.action.terminal.new');
        assert.ok(terminalBinding, '应该包含terminal命令');
        assert.ok(terminalBinding!.args, '应该保留args参数');
        assert.strictEqual(terminalBinding!.args.cwd, '${workspaceFolder}');
    });

    test('应该正确验证keybinding项的格式', () => {
        // 创建包含无效项的测试文件
        const file1 = createTestFile('keybindings1.json', JSON.stringify([
            {
                "key": "ctrl+s",
                "command": "workbench.action.files.save"
            },
            {
                // 缺少command字段
                "key": "ctrl+o"
            },
            {
                // 缺少key字段
                "command": "workbench.action.files.openFile"
            },
            null, // null项
            "invalid", // 字符串项
            {
                "key": "ctrl+n",
                "command": "workbench.action.files.newUntitledFile"
            }
        ], null, 2));

        // 合并文件
        const result = mergeKeybindings([file1]);

        // 验证结果：应该只保留有效的项
        assert.strictEqual(result.length, 2, '应该过滤掉无效的键绑定项');
        
        const commands = result.map(item => item.command);
        assert.ok(commands.includes('workbench.action.files.save'));
        assert.ok(commands.includes('workbench.action.files.newUntitledFile'));
    });

    test('stripJsonComments应该正确去除注释', () => {
        const jsonWithComments = `{
    // 单行注释
    "key": "ctrl+s", /* 行内注释 */
    "command": "save", // 尾部注释
    /* 多行注释
       第二行 */
    "when": "editorFocus",
}`;

        const result = stripJsonComments(jsonWithComments);
        
        // 验证注释被正确移除
        assert.ok(!result.includes('// 单行注释'), '应该移除单行注释');
        assert.ok(!result.includes('/* 行内注释 */'), '应该移除行内注释');
        assert.ok(!result.includes('// 尾部注释'), '应该移除尾部注释');
        assert.ok(!result.includes('多行注释'), '应该移除多行注释');
        
        // 验证内容被保留
        assert.ok(result.includes('"key": "ctrl+s"'), '应该保留键值对');
        assert.ok(result.includes('"command": "save"'), '应该保留命令');
        assert.ok(result.includes('"when": "editorFocus"'), '应该保留when条件');
    });

    test('readJsoncFile应该正确读取和解析文件', () => {
        // 创建正常的JSONC文件
        const validJsonc = `// Keybindings配置
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands"
    }
]`;
        
        const validFile = createTestFile('valid.jsonc', validJsonc);
        const result = readJsoncFile(validFile);
        
        assert.strictEqual(result.length, 1, '应该读取到一个键绑定');
        assert.strictEqual(result[0].key, 'ctrl+shift+p');
        assert.strictEqual(result[0].command, 'workbench.action.showCommands');
    });

    test('readJsoncFile应该处理不存在的文件', () => {
        const nonexistentFile = path.join(tempDir, 'nonexistent.json');
        const result = readJsoncFile(nonexistentFile);
        
        assert.strictEqual(result.length, 0, '不存在的文件应该返回空数组');
    });
});

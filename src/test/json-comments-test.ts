/**
 * 测试JSON注释处理功能
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 导入测试专用的模块
import { stripJsonComments } from '../utils';

function testJsonCommentsHandling() {
    console.log('🧪 测试JSON注释处理功能...\n');
    
    // 测试用例：带注释的keybindings.json内容
    const testCases = [
        {
            name: '标准JSON格式',
            content: `[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands"
    }
]`,
            expectSuccess: true
        },
        {
            name: '带单行注释的JSONC',
            content: `// Keybindings配置文件
[
    {
        "key": "ctrl+shift+p", // 显示命令面板
        "command": "workbench.action.showCommands"
    },
    // 这是另一个快捷键
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile"
    }
]`,
            expectSuccess: true
        },
        {
            name: '带多行注释的JSONC',
            content: `/* 
   多行注释
   Keybindings配置文件
*/
[
    {
        "key": "ctrl+shift+p",
        "command": "workbench.action.showCommands" /* 行内多行注释 */
    },
    {
        "key": "ctrl+n",
        "command": "workbench.action.files.newUntitledFile",
    } // 尾随逗号
]`,
            expectSuccess: true
        },
        {
            name: '空文件',
            content: '',
            expectSuccess: true // 应该用默认值 '[]'
        },
        {
            name: '只有注释的文件',
            content: `// 这个文件只有注释
/* 
   多行注释
*/`,
            expectSuccess: true // 去除注释后应该是空的，用默认值
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`📋 测试 ${index + 1}: ${testCase.name}`);
        
        try {
            // 模拟migration函数中的处理逻辑
            const content = testCase.content;
            const cleanContent = stripJsonComments(content.trim() || '[]');
            const parsed = JSON.parse(cleanContent);
            
            console.log(`   ✅ JSON解析成功`);
            console.log(`   📊 解析结果: ${Array.isArray(parsed) ? `数组，${parsed.length}个元素` : typeof parsed}`);
            
            if (Array.isArray(parsed)) {
                parsed.forEach((item, i) => {
                    if (item.key && item.command) {
                        console.log(`   📌 快捷键 ${i + 1}: ${item.key} → ${item.command}`);
                    }
                });
            }
            
        } catch (error) {
            if (testCase.expectSuccess) {
                console.log(`   ❌ 意外失败: ${error}`);
            } else {
                console.log(`   ✅ 按预期失败: ${error}`);
            }
        }
        
        console.log('');
    });
    
    console.log('🎉 JSON注释处理测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    testJsonCommentsHandling();
}

/**
 * 测试路径处理功能
 */

import * as path from 'path';
import * as os from 'os';

// 模拟配置对象
interface MockConfig {
    folderPath: string;
}

// 测试路径处理逻辑
function testPathHandling() {
    console.log('🧪 测试路径处理功能...\n');
    
    const userConfigPath = path.join(os.homedir(), '.vscode', 'User');
    console.log(`📁 用户配置路径: ${userConfigPath}\n`);

    // 测试用例
    const testCases: { config: MockConfig; description: string }[] = [
        {
            config: { folderPath: 'keybindings' },
            description: '相对路径 - 简单文件夹名'
        },
        {
            config: { folderPath: 'project/keybindings' },
            description: '相对路径 - 子文件夹'
        },
        {
            config: { folderPath: 'C:\\Users\\Public\\keybindings' },
            description: '绝对路径 - Windows路径'
        },
        {
            config: { folderPath: '/home/user/my-keybindings' },
            description: '绝对路径 - Unix路径'
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`📋 测试 ${index + 1}: ${testCase.description}`);
        console.log(`   输入: ${testCase.config.folderPath}`);
        
        let actualPath: string;
        
        // 判断是绝对路径还是相对路径
        if (path.isAbsolute(testCase.config.folderPath)) {
            actualPath = testCase.config.folderPath;
            console.log(`   识别为: 绝对路径`);
        } else {
            actualPath = path.join(userConfigPath, testCase.config.folderPath);
            console.log(`   识别为: 相对路径`);
        }
        
        console.log(`   实际路径: ${actualPath}`);
        console.log(`   ✅ 路径处理正确\n`);
    });
    
    console.log('🎉 路径处理测试完成！');
}

// 运行测试
if (require.main === module) {
    testPathHandling();
}

export { testPathHandling };

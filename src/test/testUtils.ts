/**
 * 用于测试的独立版本 - 不依赖VS Code环境
 */

import * as fs from 'fs';
import * as path from 'path';

// 键绑定项接口
interface KeybindingItem {
    key: string;
    command: string;
    when?: string;
    args?: any;
}

// 去除JSON注释的工具函数
function stripJsonComments(content: string): string {
    let result = '';
    let i = 0;
    let insideString = false;
    let escaped = false;
    
    while (i < content.length) {
        const char = content[i];
        const nextChar = content[i + 1];
        
        if (insideString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                insideString = false;
            }
            result += char;
            i++;
        } else {
            if (char === '"') {
                insideString = true;
                result += char;
                i++;
            } else if (char === '/' && nextChar === '/') {
                // 跳过单行注释
                while (i < content.length && content[i] !== '\n') {
                    i++;
                }
            } else if (char === '/' && nextChar === '*') {
                // 跳过多行注释
                i += 2;
                while (i < content.length - 1) {
                    if (content[i] === '*' && content[i + 1] === '/') {
                        i += 2;
                        break;
                    }
                    i++;
                }
            } else {
                result += char;
                i++;
            }
        }
    }
    
    // 移除尾随逗号
    result = result.replace(/,(\s*[}\]])/g, '$1');
    
    return result;
}

// 读取JSONC文件
function readJsoncFile(filePath: string): KeybindingItem[] {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 处理空文件
        if (!content.trim()) {
            return [];
        }
        
        const cleanContent = stripJsonComments(content);
        const parsed = JSON.parse(cleanContent);
        
        if (Array.isArray(parsed)) {
            return parsed.filter((item: any) => 
                item && 
                typeof item === 'object' && 
                typeof item.key === 'string' && 
                typeof item.command === 'string'
            );
        }
        
        return [];
    } catch (error) {
        // 在测试环境中，我们可以选择静默处理或显示详细信息
        const fileName = path.basename(filePath);
        if (process.env.NODE_ENV === 'test' || process.env.VERBOSE_ERRORS) {
            console.warn(`⚠️  跳过无效文件: ${fileName} (${error instanceof Error ? error.message : String(error)})`);
        }
        return [];
    }
}

// 合并keybindings文件
function mergeKeybindings(filePaths: string[]): KeybindingItem[] {
    const allKeybindings: KeybindingItem[] = [];
    const seen = new Set<string>();
    
    for (const filePath of filePaths) {
        const keybindings = readJsoncFile(filePath);
        
        for (const item of keybindings) {
            // 创建唯一标识符，考虑key, command和when条件
            const identifier = `${item.key}:${item.command}:${item.when || ''}`;
            
            if (!seen.has(identifier)) {
                seen.add(identifier);
                allKeybindings.push(item);
            }
        }
    }
    
    return allKeybindings;
}

export { mergeKeybindings, readJsoncFile, stripJsonComments };

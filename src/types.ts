// 键绑定接口定义
export interface KeybindingItem {
  key: string;
  command: string;
  when?: string;
  args?: any;
}

// 配置接口定义
export interface ExtensionConfig {
  files: string[];
  folderPath: string;
  filePattern: string;
  autoSync: boolean;
}

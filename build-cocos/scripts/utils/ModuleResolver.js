/**
 * 模块解析工具
 * 解决TypeScript路径别名在运行时无法解析的问题
 */
/**
 * 模块路径映射表
 */
const modulePathMap = {
    // 核心模块
    '@core/EventManager': '../core/EventManager',
    '@core/GameManager': '../core/GameManager',
    '@core/GameApp': '../core/GameApp',
    // 游戏玩法模块
    '@gameplay/merge/MergeSystem': '../gameplay/merge/MergeSystem',
    '@gameplay/business/BusinessSystem': '../gameplay/business/BusinessSystem',
    '@gameplay/story/StorySystem': '../gameplay/story/StorySystem',
    // 模型模块
    '@models/Item': '../models/Item',
    '@models/Order': '../models/Order',
    '@utils/*': '../utils/*'
};
/**
 * 解析模块路径
 * @param alias TypeScript路径别名
 * @returns 实际运行时路径
 */
export function resolveModulePath(alias) {
    if (modulePathMap[alias]) {
        return modulePathMap[alias];
    }
    // 如果没有映射，尝试直接返回（可能是相对路径）
    return alias;
}
/**
 * 创建模块导入助手
 * 用于在运行时动态导入模块
 */
export class ModuleImporter {
    constructor() {
        this.cache = new Map();
    }
    static getInstance() {
        if (!ModuleImporter.instance) {
            ModuleImporter.instance = new ModuleImporter();
        }
        return ModuleImporter.instance;
    }
    /**
     * 导入模块
     * @param alias 模块别名
     * @returns 模块导出
     */
    import(alias) {
        if (this.cache.has(alias)) {
            return this.cache.get(alias);
        }
        const resolvedPath = resolveModulePath(alias);
        const module = require(resolvedPath);
        this.cache.set(alias, module);
        return module;
    }
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
}
/**
 * 全局模块导入助手
 */
export const importModule = (alias) => {
    return ModuleImporter.getInstance().import(alias);
};
export default ModuleImporter;
//# sourceMappingURL=ModuleResolver.js.map
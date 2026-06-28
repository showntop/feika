/**
 * 存储管理器
 * 处理游戏数据的持久化存储
 */
export class StorageManager {
    constructor() {
        this.autoSaveTimer = null;
        this.currentSlotId = null;
    }
    static getInstance() {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }
    /**
     * 初始化存储系统
     */
    init() {
        console.log('[StorageManager] 初始化存储系统');
        this.startAutoSave();
    }
    /**
     * 保存玩家数据到指定槽位
     */
    async saveToSlot(slotId, slotName, playerData, gameState) {
        try {
            console.log(`[StorageManager] 保存数据到槽位 ${slotId}`);
            const saveData = {
                version: StorageManager.SAVE_VERSION,
                playerData: JSON.parse(JSON.stringify(playerData)), // 深拷贝
                gameState,
                timestamp: Date.now(),
                checksum: this.generateChecksum(playerData)
            };
            const slot = {
                slotId,
                slotName: slotName || `存档 ${slotId}`,
                timestamp: Date.now(),
                playtime: playerData.totalPlayTime || 0,
                data: saveData
            };
            // 保存到localStorage
            const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
            localStorage.setItem(storageKey, JSON.stringify(slot));
            // 更新当前槽位
            this.currentSlotId = slotId;
            console.log(`[StorageManager] 数据保存成功: ${slotId}`);
            return true;
        }
        catch (error) {
            console.error('[StorageManager] 保存数据失败:', error);
            return false;
        }
    }
    /**
     * 从指定槽位加载玩家数据
     */
    async loadFromSlot(slotId) {
        try {
            console.log(`[StorageManager] 从槽位 ${slotId} 加载数据`);
            const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
            const slotData = localStorage.getItem(storageKey);
            if (!slotData) {
                console.warn(`[StorageManager] 槽位 ${slotId} 不存在`);
                return null;
            }
            const slot = JSON.parse(slotData);
            // 验证数据完整性
            if (!this.validateSaveData(slot.data)) {
                console.error(`[StorageManager] 槽位 ${slotId} 数据损坏`);
                return null;
            }
            this.currentSlotId = slotId;
            console.log(`[StorageManager] 数据加载成功: ${slotId}`);
            return slot.data;
        }
        catch (error) {
            console.error(`[StorageManager] 加载数据失败:`, error);
            return null;
        }
    }
    /**
     * 获取所有存档槽位
     */
    getAllSlots() {
        try {
            const slots = [];
            for (let i = 0; i < StorageManager.MAX_SLOTS; i++) {
                const slotId = `slot_${i}`;
                const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
                const slotData = localStorage.getItem(storageKey);
                if (slotData) {
                    const slot = JSON.parse(slotData);
                    slots.push(slot);
                }
                else {
                    // 创建空槽位
                    slots.push({
                        slotId,
                        slotName: `空槽位 ${i + 1}`,
                        timestamp: 0,
                        playtime: 0,
                        data: null
                    });
                }
            }
            return slots;
        }
        catch (error) {
            console.error('[StorageManager] 获取存档列表失败:', error);
            return [];
        }
    }
    /**
     * 删除指定槽位
     */
    async deleteSlot(slotId) {
        try {
            console.log(`[StorageManager] 删除槽位 ${slotId}`);
            const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
            localStorage.removeItem(storageKey);
            if (this.currentSlotId === slotId) {
                this.currentSlotId = null;
            }
            console.log(`[StorageManager] 槽位 ${slotId} 已删除`);
            return true;
        }
        catch (error) {
            console.error(`[StorageManager] 删除槽位 ${slotId} 失败:`, error);
            return false;
        }
    }
    /**
     * 自动保存当前数据
     */
    async autoSave(playerData, gameState) {
        if (!this.currentSlotId) {
            // 如果没有当前槽位，使用槽位0
            this.currentSlotId = 'slot_0';
        }
        const slotName = `自动保存 ${new Date().toLocaleString()}`;
        return await this.saveToSlot(this.currentSlotId, slotName, playerData, gameState);
    }
    /**
     * 导出存档数据
     */
    exportSave(slotId) {
        try {
            const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
            const slotData = localStorage.getItem(storageKey);
            if (!slotData) {
                console.error(`[StorageManager] 导出失败：槽位 ${slotId} 不存在`);
                return null;
            }
            // 使用Buffer进行Base64编码（兼容Node.js环境）
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(slotData).toString('base64');
            }
            else {
                return btoa(slotData); // 浏览器环境
            }
        }
        catch (error) {
            console.error('[StorageManager] 导出存档失败:', error);
            return null;
        }
    }
    /**
     * 导入存档数据
     */
    importSave(slotId, importData) {
        try {
            // 使用Buffer进行Base64解码（兼容Node.js环境）
            let slotData;
            if (typeof Buffer !== 'undefined') {
                slotData = Buffer.from(importData, 'base64').toString('utf-8');
            }
            else {
                slotData = atob(importData); // 浏览器环境
            }
            const slot = JSON.parse(slotData);
            // 验证数据
            if (!this.validateSaveData(slot.data)) {
                console.error('[StorageManager] 导入失败：数据损坏');
                return false;
            }
            // 保存到指定槽位
            const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
            localStorage.setItem(storageKey, JSON.stringify(slot));
            console.log(`[StorageManager] 导入成功: ${slotId}`);
            return true;
        }
        catch (error) {
            console.error('[StorageManager] 导入存档失败:', error);
            return false;
        }
    }
    /**
     * 开始自动保存
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            // 这里需要获取当前玩家数据，由外部触发
            console.log('[StorageManager] 自动保存触发');
        }, StorageManager.AUTO_SAVE_INTERVAL);
        console.log(`[StorageManager] 自动保存已启动 (间隔: ${StorageManager.AUTO_SAVE_INTERVAL}ms)`);
    }
    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('[StorageManager] 自动保存已停止');
        }
    }
    /**
     * 生成数据校验和
     */
    generateChecksum(data) {
        const dataString = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
    /**
     * 验证存档数据完整性
     */
    validateSaveData(saveData) {
        // 检查版本兼容性
        if (saveData.version !== StorageManager.SAVE_VERSION) {
            console.warn(`[StorageManager] 版本不匹配: 保存=${saveData.version}, 当前=${StorageManager.SAVE_VERSION}`);
            // 可以添加版本转换逻辑
        }
        // 检查数据完整性
        if (!saveData.playerData || !saveData.timestamp) {
            console.error('[StorageManager] 存档数据缺少必要字段');
            return false;
        }
        // 验证校验和
        const expectedChecksum = this.generateChecksum(saveData.playerData);
        if (saveData.checksum !== expectedChecksum) {
            console.error(`[StorageManager] 校验和不匹配: 期望=${expectedChecksum}, 实际=${saveData.checksum}`);
            return false;
        }
        return true;
    }
    /**
     * 清理所有存档
     */
    clearAllSaves() {
        try {
            console.log('[StorageManager] 清理所有存档');
            for (let i = 0; i < StorageManager.MAX_SLOTS; i++) {
                const slotId = `slot_${i}`;
                const storageKey = `${StorageManager.STORAGE_PREFIX}${slotId}`;
                localStorage.removeItem(storageKey);
            }
            this.currentSlotId = null;
            console.log('[StorageManager] 所有存档已清理');
        }
        catch (error) {
            console.error('[StorageManager] 清理存档失败:', error);
        }
    }
    /**
     * 获取存储使用情况
     */
    getStorageInfo() {
        try {
            const slots = this.getAllSlots();
            let usedSpace = 0;
            slots.forEach(slot => {
                if (slot.data) {
                    const storageKey = `${StorageManager.STORAGE_PREFIX}${slot.slotId}`;
                    const data = localStorage.getItem(storageKey);
                    if (data) {
                        usedSpace += data.length;
                    }
                }
            });
            // 估算localStorage总空间（通常5-10MB）
            const totalSpace = 10 * 1024 * 1024; // 10MB
            return {
                usedSpace,
                totalSpace,
                slots
            };
        }
        catch (error) {
            console.error('[StorageManager] 获取存储信息失败:', error);
            return { usedSpace: 0, totalSpace: 0, slots: [] };
        }
    }
    /**
     * 销毁存储管理器
     */
    destroy() {
        this.stopAutoSave();
        console.log('[StorageManager] 存储管理器已销毁');
    }
}
StorageManager.SAVE_VERSION = '1.0.0';
StorageManager.MAX_SLOTS = 5;
StorageManager.AUTO_SAVE_INTERVAL = 60000; // 1分钟自动保存
StorageManager.STORAGE_PREFIX = 'feika_save_';
export default StorageManager;
//# sourceMappingURL=StorageManager.js.map
/**
 * 物品模型
 * 定义游戏中所有合成物品的基础类
 */
/**
 * 物品类型枚举
 */
export var ItemType;
(function (ItemType) {
    ItemType["PRODUCT"] = "product";
    ItemType["MONEY"] = "money";
    ItemType["RELATIONSHIP"] = "relationship";
    ItemType["EQUIPMENT"] = "equipment"; // 设备链
})(ItemType || (ItemType = {}));
/**
 * 物品质量等级
 */
export var ItemQuality;
(function (ItemQuality) {
    ItemQuality[ItemQuality["COMMON"] = 1] = "COMMON";
    ItemQuality[ItemQuality["RARE"] = 2] = "RARE";
    ItemQuality[ItemQuality["EPIC"] = 3] = "EPIC";
    ItemQuality[ItemQuality["LEGENDARY"] = 4] = "LEGENDARY"; // 传说
})(ItemQuality || (ItemQuality = {}));
/**
 * 合成物品类
 */
export class MergeItem {
    constructor(config) {
        this.gridPosition = null;
        this.config = config;
    }
    /**
     * 获取物品ID
     */
    getId() {
        return this.config.id;
    }
    /**
     * 获取物品名称
     */
    getName() {
        return this.config.name;
    }
    /**
     * 获取物品类型
     */
    getType() {
        return this.config.type;
    }
    /**
     * 获取物品等级
     */
    getLevel() {
        return this.config.level;
    }
    /**
     * 获取最大等级
     */
    getMaxLevel() {
        return this.config.maxLevel;
    }
    /**
     * 获取物品价值
     */
    getValue() {
        return this.config.value || 0;
    }
    /**
     * 获取合成成功概率
     */
    getMergeChance() {
        return this.config.mergeChance !== undefined ? this.config.mergeChance : 1.0;
    }
    /**
     * 获取出售价格
     */
    getSellPrice() {
        return this.config.sellPrice || this.getValue();
    }
    /**
     * 检查是否可以与另一个物品合成
     * @param other 另一个物品
     */
    canMergeWith(other) {
        if (!other)
            return false;
        // 必须是相同类型
        if (this.getType() !== other.getType())
            return false;
        // 必须是相同ID
        if (this.getId() !== other.getId())
            return false;
        // 必须是相同等级
        if (this.getLevel() !== other.getLevel())
            return false;
        // 不能超过最大等级
        if (this.getLevel() >= this.getMaxLevel())
            return false;
        return true;
    }
    /**
     * 获取合成结果物品配置
     */
    getMergeResultConfig() {
        if (this.getLevel() >= this.getMaxLevel()) {
            throw new Error(`物品 ${this.getName()} 已达到最大等级`);
        }
        return {
            ...this.config,
            level: this.getLevel() + 1,
            id: this.generateItemId(this.getLevel() + 1)
        };
    }
    /**
     * 生成高等级物品ID
     * @param level 目标等级
     */
    generateItemId(level) {
        const baseId = this.getId().replace(/_\d+$/, '');
        return `${baseId}_${level}`;
    }
    /**
     * 设置网格位置
     */
    setGridPosition(position) {
        this.gridPosition = position;
    }
    /**
     * 获取网格位置
     */
    getGridPosition() {
        return this.gridPosition;
    }
    /**
     * 获取物品配置
     */
    getConfig() {
        return this.config;
    }
    /**
     * 检查物品是否在合成盘上
     */
    isOnGrid() {
        return this.gridPosition !== null;
    }
    /**
     * 创建物品的深拷贝
     */
    clone() {
        return new MergeItem({ ...this.config });
    }
}
/**
 * 生成器类
 */
export class Generator {
    constructor(config) {
        this.lastProductionTime = 0;
        this.isProducing = false;
        this.config = config;
    }
    /**
     * 获取生成器配置
     */
    getConfig() {
        return this.config;
    }
    /**
     * 获取生成器ID
     */
    getId() {
        return this.config.id;
    }
    /**
     * 获取生成器名称
     */
    getName() {
        return this.config.name;
    }
    /**
     * 检查是否可以生产
     */
    canProduce() {
        const now = Date.now();
        const cooldown = this.config.production.cooldown * 1000;
        // 检查冷却时间
        if (now - this.lastProductionTime < cooldown) {
            return false;
        }
        // 检查是否正在生产中
        if (this.isProducing) {
            return false;
        }
        return true;
    }
    /**
     * 获取冷却剩余时间（秒）
     */
    getCooldownRemaining() {
        const now = Date.now();
        const cooldown = this.config.production.cooldown * 1000;
        const elapsed = now - this.lastProductionTime;
        const remaining = Math.max(0, cooldown - elapsed);
        return Math.ceil(remaining / 1000);
    }
    /**
     * 生产物品（不消耗体力）
     * @param allItems 所有可生成的物品配置
     */
    produce(allItems) {
        if (!this.canProduce()) {
            return null;
        }
        // 根据权重随机选择物品
        const itemId = this.selectRandomItem();
        if (!itemId) {
            console.error(`[Generator] 生成器 ${this.getName()} 没有可生成的物品`);
            return null;
        }
        const itemConfig = allItems.get(itemId);
        if (!itemConfig) {
            console.error(`[Generator] 找不到物品配置: ${itemId}`);
            return null;
        }
        this.isProducing = true;
        // 更新最后生产时间
        this.lastProductionTime = Date.now();
        return new MergeItem(itemConfig);
    }
    /**
     * 完成生产（重置生产状态）
     */
    completeProduction() {
        this.isProducing = false;
    }
    /**
     * 根据权重随机选择物品
     */
    selectRandomItem() {
        const items = this.config.production.items;
        const weights = this.config.production.weights;
        if (items.length === 0 || weights.length === 0) {
            return null;
        }
        if (items.length !== weights.length) {
            console.error('[Generator] 物品和权重数组长度不匹配');
            return null;
        }
        // 计算总权重
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        // 随机选择
        let random = Math.random() * totalWeight;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        // 如果有浮点误差，返回最后一个
        return items[items.length - 1];
    }
    /**
     * 获取体力消耗
     */
    getEnergyCost() {
        return this.config.production.energyCost;
    }
    /**
     * 获取解锁章节
     */
    getUnlockChapter() {
        return this.config.unlockChapter;
    }
}
export default MergeItem;
//# sourceMappingURL=Item.js.map
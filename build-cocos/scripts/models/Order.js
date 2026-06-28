/**
 * 订单模型
 * 定义游戏中的顾客订单系统
 */
/**
 * 顾客类型
 */
export var CustomerType;
(function (CustomerType) {
    CustomerType["NORMAL"] = "normal";
    CustomerType["REGULAR"] = "regular";
    CustomerType["VIP"] = "vip";
    CustomerType["SPECIAL"] = "special"; // 特殊顾客
})(CustomerType || (CustomerType = {}));
/**
 * 订单类
 */
export class Order {
    constructor(config) {
        this.isCompleted = false;
        this.expired = false;
        this.config = config;
        this.createTime = Date.now();
        this.expireTime = this.createTime + (config.timeLimit * 1000);
    }
    /**
     * 获取订单ID
     */
    getId() {
        return this.config.id;
    }
    /**
     * 获取顾客类型
     */
    getCustomerType() {
        return this.config.customerType;
    }
    /**
     * 获取顾客名称
     */
    getCustomerName() {
        return this.config.customerName;
    }
    /**
     * 获取物品需求
     */
    getRequirements() {
        return [...this.config.requirements];
    }
    /**
     * 获取基础奖励
     */
    getBaseReward() {
        return { ...this.config.baseReward };
    }
    /**
     * 计算实际奖励（考虑店铺等级等加成）
     */
    calculateReward(shopLevel, reputationMultiplier = 1.0) {
        const baseReward = this.getBaseReward();
        // 店铺等级加成：每级+20%
        const shopBonus = 1 + (shopLevel - 1) * 0.2;
        // 口碑加成
        const totalMultiplier = shopBonus * reputationMultiplier;
        return {
            cash: Math.floor(baseReward.cash * totalMultiplier),
            reputation: baseReward.reputation,
            connections: baseReward.connections,
            specialRewards: baseReward.specialRewards
        };
    }
    /**
     * 检查订单是否过期
     */
    isExpired() {
        if (this.isCompleted || this.expired) {
            return true;
        }
        const now = Date.now();
        this.expired = now > this.expireTime;
        return this.expired;
    }
    /**
     * 获取剩余时间（秒）
     */
    getRemainingTime() {
        if (this.isCompleted || this.expired) {
            return 0;
        }
        const now = Date.now();
        const remaining = Math.max(0, this.expireTime - now);
        return Math.ceil(remaining / 1000);
    }
    /**
     * 检查是否可以完成（玩家有所需物品）
     */
    canComplete(checkItemCallback) {
        if (this.isCompleted || this.expired) {
            return false;
        }
        return this.config.requirements.every(req => checkItemCallback(req.itemId, req.level, req.count));
    }
    /**
     * 完成订单
     */
    complete(consumeItemCallback) {
        if (this.isCompleted || this.expired) {
            return null;
        }
        // 消耗物品
        for (const req of this.config.requirements) {
            if (!consumeItemCallback(req.itemId, req.level, req.count)) {
                console.error(`[Order] 消耗物品失败: ${req.itemId}`);
                return null;
            }
        }
        this.isCompleted = true;
        return this.getBaseReward();
    }
    /**
     * 获取订单难度
     */
    getDifficulty() {
        return this.config.difficulty;
    }
    /**
     * 检查解锁条件
     */
    checkUnlock(checkConditionCallback) {
        if (!this.config.unlockConditions) {
            return true;
        }
        return this.config.unlockConditions.every((cond) => checkConditionCallback(cond.type, cond.value));
    }
    /**
     * 获取订单状态
     */
    getStatus() {
        return {
            isCompleted: this.isCompleted,
            isExpired: this.expired,
            remainingTime: this.getRemainingTime(),
            canComplete: !this.isCompleted && !this.expired
        };
    }
}
/**
 * 店铺升级类
 */
export class ShopUpgrade {
    constructor(config) {
        this.isUpgraded = false;
        this.config = config;
    }
    /**
     * 获取升级配置
     */
    getConfig() {
        return this.config;
    }
    /**
     * 获取目标等级
     */
    getTargetLevel() {
        return this.config.level;
    }
    /**
     * 获取等级名称
     */
    getName() {
        return this.config.name;
    }
    /**
     * 检查是否可以升级
     */
    canUpgrade(checkResourceCallback) {
        if (this.isUpgraded) {
            return false;
        }
        // 检查现金
        if (!checkResourceCallback('cash', this.config.costs.cash)) {
            return false;
        }
        // 检查物品消耗
        if (this.config.costs.items) {
            for (const item of this.config.costs.items) {
                if (!checkResourceCallback('item', item)) {
                    return false;
                }
            }
        }
        // 检查口碑要求
        if (this.config.costs.reputation) {
            if (!checkResourceCallback('reputation', this.config.costs.reputation)) {
                return false;
            }
        }
        // 检查人脉要求
        if (this.config.costs.connections) {
            if (!checkResourceCallback('connections', this.config.costs.connections)) {
                return false;
            }
        }
        return true;
    }
    /**
     * 执行升级
     */
    upgrade(consumeResourceCallback) {
        if (!this.canUpgrade(consumeResourceCallback)) {
            return false;
        }
        // 消耗现金
        if (!consumeResourceCallback('cash', this.config.costs.cash)) {
            return false;
        }
        // 消耗物品
        if (this.config.costs.items) {
            for (const item of this.config.costs.items) {
                if (!consumeResourceCallback('item', item)) {
                    return false;
                }
            }
        }
        this.isUpgraded = true;
        return true;
    }
    /**
     * 获取升级奖励
     */
    getRewards() {
        return this.config.rewards;
    }
    /**
     * 获取升级状态
     */
    isUpgradeCompleted() {
        return this.isUpgraded;
    }
}
export default Order;
//# sourceMappingURL=Order.js.map
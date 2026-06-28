/**
 * 经营系统
 * 负责订单管理、店铺升级、顾客管理
 */
import { EventManager, GameEvents } from '../../core/EventManager';
import { Order } from '../../models/Order';
/**
 * 经营系统类
 */
export class BusinessSystem {
    constructor() {
        // 状态
        this.currentOrders = [];
        this.reputation = 0;
        this.connections = 0;
        this.cash = 100;
        this.lastOrderRefreshTime = Date.now();
        // 配置数据
        this.orderConfigs = [];
        this.upgradeConfigs = [];
        this.config = {
            maxOrders: 5,
            orderRefreshInterval: 300,
            initialShopLevel: 1
        };
        this.shopLevel = this.config.initialShopLevel;
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!BusinessSystem.instance) {
            BusinessSystem.instance = new BusinessSystem();
        }
        return BusinessSystem.instance;
    }
    /**
     * 初始化经营系统
     */
    init() {
        this.currentOrders = [];
        this.shopLevel = this.config.initialShopLevel;
        this.reputation = 0;
        this.connections = 0;
        this.cash = 100;
        this.lastOrderRefreshTime = Date.now();
        console.log('[BusinessSystem] 初始化完成');
    }
    /**
     * 设置订单配置
     */
    setOrderConfigs(configs) {
        this.orderConfigs = configs;
    }
    /**
     * 设置升级配置
     */
    setUpgradeConfigs(configs) {
        this.upgradeConfigs = configs;
    }
    /**
     * 获取当前现金
     */
    getCash() {
        return this.cash;
    }
    /**
     * 设置现金
     */
    setCash(amount) {
        const oldCash = this.cash;
        this.cash = Math.max(0, amount);
        EventManager.getInstance().emit(GameEvents.CASH_CHANGED, {
            old: oldCash,
            current: this.cash
        });
    }
    /**
     * 增加现金
     */
    addCash(amount) {
        this.setCash(this.cash + amount);
    }
    /**
     * 消耗现金
     */
    consumeCash(amount) {
        if (this.cash < amount) {
            return false;
        }
        this.setCash(this.cash - amount);
        return true;
    }
    /**
     * 获取口碑
     */
    getReputation() {
        return this.reputation;
    }
    /**
     * 设置口碑
     */
    setReputation(amount) {
        const oldReputation = this.reputation;
        this.reputation = Math.max(0, amount);
        EventManager.getInstance().emit(GameEvents.REPUTATION_CHANGED, {
            old: oldReputation,
            current: this.reputation
        });
    }
    /**
     * 增加口碑
     */
    addReputation(amount) {
        this.setReputation(this.reputation + amount);
    }
    /**
     * 获取人脉
     */
    getConnections() {
        return this.connections;
    }
    /**
     * 设置人脉
     */
    setConnections(amount) {
        const oldConnections = this.connections;
        this.connections = Math.max(0, amount);
        EventManager.getInstance().emit(GameEvents.CONNECTIONS_CHANGED, {
            old: oldConnections,
            current: this.connections
        });
    }
    /**
     * 增加人脉
     */
    addConnections(amount) {
        this.setConnections(this.connections + amount);
    }
    /**
     * 获取店铺等级
     */
    getShopLevel() {
        return this.shopLevel;
    }
    /**
     * 获取所有当前订单
     */
    getCurrentOrders() {
        return [...this.currentOrders];
    }
    /**
     * 生成新订单
     */
    generateOrder() {
        // 检查订单数量上限
        if (this.currentOrders.length >= this.config.maxOrders) {
            return null;
        }
        // 过滤可用的订单配置
        const availableConfigs = this.orderConfigs.filter(config => {
            // 检查解锁条件
            return config.unlockConditions ? config.unlockConditions.every((cond) => {
                switch (cond.type) {
                    case 'reputation':
                        return this.reputation >= cond.value;
                    case 'shop_level':
                        return this.shopLevel >= cond.value;
                    case 'chapter':
                        // 剧情解锁条件由其他系统处理
                        return true;
                    default:
                        return true;
                }
            }) : true;
        });
        if (availableConfigs.length === 0) {
            return null;
        }
        // 根据难度和权重随机选择订单
        const config = this.selectRandomOrder(availableConfigs);
        if (!config) {
            return null;
        }
        // 创建订单
        const order = new Order(config);
        this.currentOrders.push(order);
        // 触发新订单事件
        EventManager.getInstance().emit(GameEvents.NEW_ORDER, {
            order,
            totalOrders: this.currentOrders.length
        });
        return order;
    }
    /**
     * 随机选择订单配置
     */
    selectRandomOrder(configs) {
        if (configs.length === 0) {
            return null;
        }
        // 根据难度权重随机选择（低难度订单出现概率更高）
        const weights = configs.map(config => {
            const difficultyWeight = Math.max(1, 6 - config.difficulty);
            return difficultyWeight;
        });
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < configs.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return configs[i];
            }
        }
        return configs[configs.length - 1];
    }
    /**
     * 完成订单
     */
    completeOrder(orderId, checkItemCallback, consumeItemCallback) {
        const order = this.currentOrders.find(o => o.getId() === orderId);
        if (!order) {
            return false;
        }
        if (!order.canComplete(checkItemCallback)) {
            return false;
        }
        // 完成订单（消耗物品）
        const reward = order.complete(consumeItemCallback);
        if (!reward) {
            return false;
        }
        // 计算实际奖励（考虑店铺等级加成）
        const actualReward = order.calculateReward(this.shopLevel);
        // 发放奖励
        this.addCash(actualReward.cash);
        this.addReputation(actualReward.reputation);
        this.addConnections(actualReward.connections);
        // 触发订单完成事件
        EventManager.getInstance().emit(GameEvents.ORDER_COMPLETE, {
            order,
            reward: actualReward
        });
        // 移除订单
        this.currentOrders = this.currentOrders.filter(o => o.getId() !== orderId);
        return true;
    }
    /**
     * 获取订单详情
     */
    getOrder(orderId) {
        return this.currentOrders.find(o => o.getId() === orderId);
    }
    /**
     * 检查并移除过期订单
     */
    checkExpiredOrders() {
        const expiredOrders = [];
        this.currentOrders = this.currentOrders.filter(order => {
            const expired = order.getStatus().isExpired;
            if (expired) {
                expiredOrders.push(order);
                EventManager.getInstance().emit(GameEvents.ORDER_EXPIRED, {
                    order
                });
                return false;
            }
            return true;
        });
        return expiredOrders;
    }
    /**
     * 升级店铺
     */
    upgradeShop(consumeResourceCallback) {
        const nextLevel = this.shopLevel + 1;
        const upgradeConfig = this.upgradeConfigs.find(u => u.level === nextLevel);
        if (!upgradeConfig) {
            console.log(`[BusinessSystem] 没有找到等级 ${nextLevel} 的升级配置`);
            return false;
        }
        // 检查升级条件
        const checkCallback = (type, value) => {
            switch (type) {
                case 'cash':
                    return this.cash >= value;
                case 'item':
                    // 物品检查由调用者提供
                    return consumeResourceCallback(type, value);
                case 'reputation':
                    return this.reputation >= value;
                case 'connections':
                    return this.connections >= value;
                default:
                    return true;
            }
        };
        // 检查现金
        if (!checkCallback('cash', upgradeConfig.costs.cash)) {
            console.log(`[BusinessSystem] 现金不足，需要 ${upgradeConfig.costs.cash}，当前 ${this.cash}`);
            return false;
        }
        // 检查物品消耗
        if (upgradeConfig.costs.items) {
            for (const item of upgradeConfig.costs.items) {
                if (!checkCallback('item', item)) {
                    console.log(`[BusinessSystem] 物品不足: ${item.itemId}`);
                    return false;
                }
            }
        }
        // 检查口碑要求
        if (upgradeConfig.costs.reputation) {
            if (!checkCallback('reputation', upgradeConfig.costs.reputation)) {
                console.log(`[BusinessSystem] 口碑不足，需要 ${upgradeConfig.costs.reputation}，当前 ${this.reputation}`);
                return false;
            }
        }
        // 检查人脉要求
        if (upgradeConfig.costs.connections) {
            if (!checkCallback('connections', upgradeConfig.costs.connections)) {
                console.log(`[BusinessSystem] 人脉不足，需要 ${upgradeConfig.costs.connections}，当前 ${this.connections}`);
                return false;
            }
        }
        // 消耗现金
        if (!this.consumeCash(upgradeConfig.costs.cash)) {
            console.log('[BusinessSystem] 消耗现金失败');
            return false;
        }
        // 消耗物品
        if (upgradeConfig.costs.items) {
            for (const item of upgradeConfig.costs.items) {
                if (!consumeResourceCallback('item', item)) {
                    console.log(`[BusinessSystem] 消耗物品失败: ${item.itemId}`);
                    return false;
                }
            }
        }
        // 执行升级
        this.shopLevel = nextLevel;
        // 触发升级事件
        EventManager.getInstance().emit(GameEvents.SHOP_UPGRADE, {
            oldLevel: nextLevel - 1,
            newLevel: nextLevel,
            upgradeConfig
        });
        console.log(`[BusinessSystem] 店铺升级成功: ${nextLevel - 1} -> ${nextLevel}`);
        return true;
    }
    /**
     * 获取下一级升级配置
     */
    getNextUpgradeConfig() {
        const nextLevel = this.shopLevel + 1;
        return this.upgradeConfigs.find(u => u.level === nextLevel) || null;
    }
    /**
     * 检查是否可以升级
     */
    canUpgradeShop() {
        const upgradeConfig = this.getNextUpgradeConfig();
        if (!upgradeConfig) {
            return false;
        }
        // 检查现金
        if (this.cash < upgradeConfig.costs.cash) {
            return false;
        }
        // 检查口碑要求
        if (upgradeConfig.costs.reputation && this.reputation < upgradeConfig.costs.reputation) {
            return false;
        }
        // 检查人脉要求
        if (upgradeConfig.costs.connections && this.connections < upgradeConfig.costs.connections) {
            return false;
        }
        return true;
    }
    /**
     * 刷新订单（定期生成新订单）
     */
    refreshOrders() {
        const now = Date.now();
        const elapsed = (now - this.lastOrderRefreshTime) / 1000;
        if (elapsed >= this.config.orderRefreshInterval) {
            // 检查过期订单
            this.checkExpiredOrders();
            // 生成新订单
            while (this.currentOrders.length < this.config.maxOrders) {
                const newOrder = this.generateOrder();
                if (!newOrder) {
                    break;
                }
            }
            this.lastOrderRefreshTime = now;
        }
    }
    /**
     * 获取系统状态
     */
    getSystemState() {
        return {
            cash: this.cash,
            reputation: this.reputation,
            connections: this.connections,
            shopLevel: this.shopLevel,
            currentOrders: this.currentOrders.length,
            maxOrders: this.config.maxOrders,
            canUpgrade: this.canUpgradeShop(),
            nextUpgradeLevel: this.getNextUpgradeConfig()?.level || null
        };
    }
    /**
     * 加载订单配置
     */
    loadOrderConfigs(orderConfigs) {
        console.log('[BusinessSystem] 加载订单配置...');
        this.orderConfigs = orderConfigs.orders || [];
        this.upgradeConfigs = orderConfigs.shop_upgrades || orderConfigs.shopUpgrades || [];
        this.config.availableOrders = this.orderConfigs;
        this.config.shopUpgrades = this.upgradeConfigs;
        console.log(`[BusinessSystem] 已加载 ${this.orderConfigs.length} 个订单配置`);
        console.log(`[BusinessSystem] 已加载 ${this.upgradeConfigs.length} 个店铺升级配置`);
    }
}
export default BusinessSystem;
//# sourceMappingURL=BusinessSystem.js.map
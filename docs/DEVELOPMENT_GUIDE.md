# 🛠️ 开发指南

## 快速开始

### 1. 环境搭建

```bash
# 克隆项目
git clone <repository-url>
cd feica

# 安装依赖
npm install

# 开发模式
npm run dev
```

### 2. 项目初始化

```typescript
// 在 main.ts 中
import { startGame } from './assets/scripts/main';

// 启动游戏
startGame();
```

## 核心系统使用

### 合成系统

```typescript
import { MergeSystem } from './gameplay/merge/MergeSystem';

// 获取实例
const mergeSystem = MergeSystem.getInstance();

// 初始化
mergeSystem.init();

// 生成物品
const newItem = mergeSystem.generateFrom('generator_old_box');

// 合成物品
const result = mergeSystem.mergeItems(
    { x: 0, y: 0 },  // 源位置
    { x: 1, y: 1 }   // 目标位置
);

// 获取系统状态
const state = mergeSystem.getSystemState();
```

### 经营系统

```typescript
import { BusinessSystem } from './gameplay/business/BusinessSystem';

// 获取实例
const businessSystem = BusinessSystem.getInstance();

// 生成订单
const order = businessSystem.generateOrder();

// 完成订单
businessSystem.completeOrder(orderId, (itemId, level, count) => {
    // 检查玩家是否有足够物品
    return true;
});

// 升级店铺
businessSystem.upgradeShop((type, value) => {
    // 检查资源是否足够
    return true;
});

// 获取资源状态
const cash = businessSystem.getCash();
const reputation = businessSystem.getReputation();
```

### 剧情系统

```typescript
import { StorySystem } from './gameplay/story/StorySystem';

// 获取实例
const storySystem = StorySystem.getInstance();

// 加载章节
storySystem.loadChapter('chapter_1', (req) => {
    // 检查解锁条件
    return true;
});

// 检查并触发事件
const event = storySystem.checkAndTriggerEvents((req) => {
    // 检查触发条件
    return true;
});

// 完成事件
storySystem.completeCurrentEvent((reward) => {
    // 发放奖励
    console.log('获得奖励:', reward);
});
```

## 配置文件说明

### 物品配置 (items.json)

```json
{
  "items": [
    {
      "id": "product_1",
      "name": "散货",
      "type": "product",
      "level": 1,
      "maxLevel": 5,
      "value": 20,
      "mergeChance": 1.0
    }
  ],
  "generators": [
    {
      "id": "generator_old_box",
      "name": "旧纸箱",
      "production": {
        "items": ["product_1"],
        "weights": [70],
        "cooldown": 3,
        "energyCost": 1
      }
    }
  ]
}
```

### 章节配置 (chapters.json)

```json
{
  "chapters": [
    {
      "id": "chapter_1",
      "title": "重回2010，家里欠债",
      "goalTarget": {
        "type": "cash",
        "value": 5000
      },
      "events": [
        {
          "id": "event_ch1_wakeup",
          "type": "main",
          "dialogue": [
            {
              "speaker": "旁白",
              "text": "你从2026年醒来..."
            }
          ],
          "requirements": [],
          "rewards": {}
        }
      ]
    }
  ]
}
```

## 测试指南

### 单元测试

```typescript
// 创建测试文件
import { MergeSystem } from './gameplay/merge/MergeSystem';

describe('MergeSystem', () => {
    test('should merge two items', () => {
        const system = MergeSystem.getInstance();
        system.init();

        // 测试合成逻辑
        const result = system.mergeItems({x: 0, y: 0}, {x: 0, y: 1});
        expect(result.success).toBe(true);
    });
});
```

### 快速测试

```typescript
// 运行快速测试
import { quickTest } from './assets/scripts/main';

quickTest();
```

## 常见问题

### Q: 如何添加新物品？
A: 在 `config/items.json` 中添加物品配置。

### Q: 如何创建新章节？
A: 在 `config/chapters.json` 中添加章节配置。

### Q: 如何调试游戏状态？
A: 使用 `GameManager.getInstance().getGameStatus()` 查看完整状态。

### Q: 如何测试特定功能？
A: 在 `main.ts` 中创建专门的测试函数。

## 性能优化建议

### 1. 对象池使用
```typescript
// 复用对象而非频繁创建
const itemPool: MergeItem[] = [];

function getItem(): MergeItem {
    return itemPool.pop() || new MergeItem(config);
}

function releaseItem(item: MergeItem): void {
    itemPool.push(item);
}
```

### 2. 事件监听优化
```typescript
// 及时移除不需要的监听器
EventManager.getInstance().off(eventName, callback);
```

### 3. 配置缓存
```typescript
// 缓存配置数据避免重复读取
const configCache = new Map();
```

## 部署指南

### 构建微信小游戏

```bash
# 1. 构建TypeScript
npm run build

# 2. 使用Cocos Creator构建微信小游戏
# 在Cocos Creator中选择：项目 -> 构建发布 -> 微信小游戏

# 3. 上传到微信开发者工具
# 打开微信开发者工具，导入构建项目
```

### 性能检查

```typescript
// 运行性能测试
import { performanceTest } from './assets/scripts/main';

performanceTest();
```

## 调试技巧

### 1. 日志系统
```typescript
// 使用console.log调试
console.log('[SystemName] 操作详情:', data);
```

### 2. 状态监控
```typescript
// 定期检查系统状态
setInterval(() => {
    const status = GameManager.getInstance().getGameStatus();
    console.log('游戏状态:', status);
}, 5000);
```

### 3. 事件追踪
```typescript
// 监听关键事件
EventManager.getInstance().on(GameEvents.MERGE_SUCCESS, (data) => {
    console.log('合成成功:', data);
});
```

## 下一步开发

### 短期目标
1. 完成UI系统实现
2. 集成微信SDK
3. 完善第2-3章内容
4. 添加音效和特效

### 中期目标
1. 实现存档系统
2. 集成广告变现
3. 性能优化
4. 灰度测试

### 长期目标
1. 社交功能
2. 多结局系统
3. IP化运营
4. 长期内容更新

---

🎮 **立即开始开发，创造属于你的重生游戏！**
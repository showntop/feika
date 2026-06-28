# Cocos Creator 迁移计划

## 📋 项目概述

本文档记录"重返2010：我的第一桶金"游戏从纯TypeScript架构向Cocos Creator引擎迁移的完整计划和技术方案。

## 🎯 迁移目标

### 主要目标
- ✅ 将现有TypeScript游戏逻辑集成到Cocos Creator 3.x框架
- ✅ 保持原有游戏系统完整性（合成、经营、剧情三大系统）
- ✅ 实现微信小游戏平台部署
- ✅ 优化性能和用户体验

### 技术目标
- **引擎**: Cocos Creator 3.x
- **语言**: TypeScript 5.x
- **目标平台**: 微信小游戏（主）、抖音小游戏（备选）
- **包体积**: < 4MB（微信小游戏限制）

## 📊 当前项目状态分析

### ✅ 已完成清理工作
- 移除了微信小游戏临时适配文件
- 移除了浏览器相关构建产物
- 清理了过时文档和测试文件
- 保留了核心游戏逻辑TypeScript代码

### 🎮 当前游戏架构
```
assets/scripts/
├── core/                    # 核心系统
│   ├── GameApp.ts           # 游戏主入口
│   ├── GameManager.ts       # 游戏管理器
│   ├── EventManager.ts      # 事件管理器
│   └── StorageManager.ts    # 存储管理器
├── gameplay/                # 游戏玩法系统
│   ├── merge/               # 合成系统
│   ├── business/            # 经营系统
│   └── story/               # 剧情系统
├── ui/                      # UI系统
│   ├── UIManager.ts         # UI管理器
│   ├── components/          # UI组件
│   ├── AnimationManager.ts  # 动画管理
│   └── ResponsiveManager.ts # 响应式管理
├── models/                  # 数据模型
│   ├── Item.ts              # 物品模型
│   ├── Order.ts             # 订单模型
│   └── Chapter.ts           # 章节模型
└── utils/                   # 工具函数
    ├── ErrorHandler.ts      # 错误处理
    ├── PerformanceMonitor.ts # 性能监控
    └── ItemGuideData.ts     # 物品引导数据
```

### 🔍 架构分析
**优点**:
- 游戏逻辑系统完整且模块化
- TypeScript类型安全
- 清晰的分层架构
- 完善的事件驱动机制

**挑战**:
- 缺少Cocos Creator组件集成
- UI系统基于HTML/DOM，需要重写为Cocos Creator UI
- 缺少场景管理和资源加载机制
- 需要适配Cocos Creator生命周期

## 🛠️ 迁移策略

### 阶段1: Cocos Creator项目初始化 (Week 1)

#### 1.1 项目创建
- [ ] 安装Cocos Creator 3.8 LTS
- [ ] 创建新项目 `time-loop-2010`
- [ ] 配置项目设置（Canvas适配、微信小游戏构建选项）
- [ ] 设置TypeScript编译选项

#### 1.2 基础场景搭建
- [ ] 创建启动场景 `LaunchScene`
- [ ] 创建主游戏场景 `MainGameScene`
- [ ] 创建合成玩法场景 `MergeScene`
- [ ] 配置场景切换逻辑

#### 1.3 核心系统适配
- [ ] 将`GameApp.ts`改造为Cocos Creator组件
- [ ] 适配`GameManager.ts`到Cocos生命周期
- [ ] 集成`EventManager.ts`到Cocos事件系统
- [ ] 配置`StorageManager.ts`使用微信存储API

### 阶段2: 游戏系统集成 (Week 2-3)

#### 2.1 合成系统迁移
**当前实现**: `MergeSystem.ts` (纯TypeScript逻辑)
**迁移目标**: Cocos Creator场景 + 组件

**技术方案**:
```typescript
// 合成网格组件
@Component
export class MergeGridComponent extends Component {
    @Property({ type: CCInteger })
    gridSize: number = 6;

    @Property({ type: Node })
    itemPrefab: Node = null;

    // 集成现有MergeSystem逻辑
    private mergeSystem: MergeSystem;

    start() {
        this.mergeSystem = new MergeSystem(this.gridSize);
        this.initGrid();
    }

    private initGrid() {
        // 创建网格UI
        // 绑定点击事件
        // 集成合成逻辑
    }
}
```

**UI组件映射**:
- `GameBoard.ts` → Cocos Creator节点 + 脚本
- HTML DOM点击事件 → Cocos触摸事件
- CSS动画 → Cocos Animation/Tween

#### 2.2 经营系统迁移
**当前实现**: `BusinessSystem.ts` (订单、客户、资源管理)
**迁移目标**: UI面板 + 数据管理

**技术方案**:
```typescript
@Component
export class ShopPanelComponent extends Component {
    @Property({ type: Label })
    cashLabel: Label = null;

    @Property({ type: Label })
    reputationLabel: Label = null;

    private businessSystem: BusinessSystem;

    update() {
        this.updateUI();
    }

    private updateUI() {
        // 集成现有BusinessSystem逻辑
        this.cashLabel.string = `¥${this.businessSystem.getCash()}`;
        this.reputationLabel.string = `${this.businessSystem.getReputation()}`;
    }
}
```

#### 2.3 剧情系统迁移
**当前实现**: `StorySystem.ts` (章节、事件、对话)
**迁移目标**: 对话框UI + 分支逻辑

**技术方案**:
```typescript
@Component
export class StoryDialogComponent extends Component {
    @Property({ type: Node })
    dialogNode: Node = null;

    @Property({ type: Label })
    textLabel: Label = null;

    private storySystem: StorySystem;

    showDialog(event: StoryEvent) {
        // 集成现有StorySystem逻辑
        // 使用Cocos动画显示对话框
    }
}
```

### 阶段3: UI系统重构 (Week 4)

#### 3.1 UI组件Cocos化
**现有UI组件**:
- `UIManager.ts`
- `ResourcePanel.ts`
- `OrderPanel.ts`
- `SaveLoadPanel.ts`
- `NotificationManager.ts`
- `StoryDialog.ts`

**迁移策略**:
1. **保持业务逻辑不变**: 核心数据管理逻辑保留
2. **UI渲染重写**: HTML/DOM → Cocos Creator节点
3. **事件系统重写**: DOM事件 → Cocos输入事件
4. **动画系统**: CSS动画 → Cocos Tween/Animation

#### 3.2 资源管理
- [ ] 将JSON配置文件导入Cocos Creator resources
- [ ] 创建UI预制体 (Prefabs)
- [ ] 配置纹理资源
- [ ] 设置音频资源

#### 3.3 响应式布局
```typescript
@Component
export class ResponsiveManager extends Component {
    private designResolution: Size = new Size(1080, 1920);

    onLoad() {
        this适配不同屏幕尺寸();
        this处理刘海屏();
    }
}
```

### 阶段4: 微信小游戏集成 (Week 5)

#### 4.1 微信API适配
```typescript
// 微信API管理器
@Component
export class WeChatAPIManager {
    static login(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof wx !== 'undefined') {
                wx.login({
                    success: () => resolve(),
                    fail: (err) => reject(err)
                });
            }
        });
    }

    static getUserInfo(): Promise<any> {
        // 适配wx.getUserInfo
    }

    static showRewardedVideoAd(): Promise<void> {
        // 适配wx.createRewardedVideoAd
    }
}
```

#### 4.2 存储系统
```typescript
// 适配StorageManager到微信存储
class WeChatStorageAdapter {
    setItem(key: string, value: string): void {
        if (typeof wx !== 'undefined') {
            wx.setStorageSync(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    }

    getItem(key: string): string {
        if (typeof wx !== 'undefined') {
            return wx.getStorageSync(key);
        } else {
            return localStorage.getItem(key);
        }
    }
}
```

#### 4.3 性能优化
- [ ] 包体积优化（资源压缩、代码分包）
- [ ] 启动速度优化（预加载、资源管理）
- [ ] 运行时性能（对象池、减少GC）

### 阶段5: 测试与发布 (Week 6)

#### 5.1 测试计划
- [ ] 单元测试（游戏逻辑）
- [ ] 集成测试（场景切换、系统交互）
- [ ] 性能测试（帧率、内存）
- [ ] 微信小游戏真机测试

#### 5.2 发布流程
- [ ] 配置微信小游戏AppID
- [ ] 构建微信小游戏版本
- [ ] 提交微信审核
- [ ] 灰度发布监控

## 🔧 技术方案细节

### Cocos Creator组件映射

#### 核心类改造
**原GameApp.ts**:
```typescript
export class GameApp {
    private static instance: GameApp;
    // ... 单例模式
}
```

**改造后**:
```typescript
@ccclass('GameApp')
export class GameApp extends Component {
    private static instance: GameApp;

    static getInstance(): GameApp {
        return GameApp.instance;
    }

    onLoad() {
        GameApp.instance = this;
        director.loadScene('MainGameScene');
    }
}
```

#### 数据层保持
**优势**: 所有数据模型类（Item、Order、Chapter）无需修改，可直接使用：
```typescript
// 这些类可以直接在Cocos Creator中使用
import { Item } from './models/Item';
import { Order } from './models/Order';
import { Chapter } from './models/Chapter';
```

### 资源管理策略

#### 配置文件加载
```typescript
@Component
export class ConfigManager extends Component {
    loadItemsConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            resources.load('config/items', JsonAsset, (err, json) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(json.json);
                }
            });
        });
    }
}
```

#### 预制体实例化
```typescript
// 创建物品节点
private createItemNode(item: Item, position: Vec3): Node {
    const itemNode = instantiate(this.itemPrefab);
    itemNode.setPosition(position);

    const itemComponent = itemNode.addComponent(ItemComponent);
    itemComponent.setItem(item);

    return itemNode;
}
```

### 性能优化要点

#### 对象池管理
```typescript
@Component
export class ItemPool extends Component {
    private pool: Node[] = [];

    getItem(): Node {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return instantiate(this.itemPrefab);
    }

    returnItem(node: Node) {
        node.active = false;
        this.pool.push(node);
    }
}
```

#### 纹理优化
- 使用纹理压缩格式（ASTC/PVRTC for微信小游戏）
- 合并小纹理为图集（Texture Atlas）
- 按需加载大纹理

## 📝 开发规范

### 代码规范
1. **命名约定**:
   - 组件类: PascalCase + Component后缀
   - 场景脚本: PascalCase + Scene后缀
   - 工具类: PascalCase + Manager/Util后缀

2. **注解使用**:
   ```typescript
   @ccclass('GameApp')
   @menu('Game/Core/GameApp')
   export class GameApp extends Component {
       @property({ type: Node, tooltip: '游戏Canvas根节点' })
       gameCanvas: Node = null;

       @property({ type: SpriteFrame, tooltip: '背景图片' })
       background: SpriteFrame = null;
   }
   ```

3. **生命周期**:
   ```typescript
   onLoad()    // 初始化
   start()     // 首次update前
   update(dt)  // 每帧更新
   onDestroy() // 清理资源
   ```

### Git工作流
- feature分支: 功能开发
- develop分支: 集成测试
- main分支: 生产发布

### 测试规范
```typescript
// 单元测试示例
describe('MergeSystem', () => {
    it('should merge items correctly', () => {
        const mergeSystem = new MergeSystem(6);
        const result = mergeSystem.mergeItems(item1, item2);
        expect(result.level).toBe(3);
    });
});
```

## 🎯 成功标准

### 功能完整性
- ✅ 三大核心系统（合成、经营、剧情）完整迁移
- ✅ UI交互流畅，无明显卡顿
- ✅ 存档系统正常工作

### 性能指标
- ✅ 启动时间 < 3秒
- ✅ 平均帧率 > 55fps
- ✅ 内存占用 < 150MB
- ✅ 包体积 < 4MB

### 平台要求
- ✅ 微信小游戏正常运行
- ✅ 通过微信官方审核
- ✅ 适配主流机型（iOS + Android）

## 📅 时间计划

| 阶段 | 任务 | 预计工期 | 负责人 |
|------|------|----------|--------|
| 阶段1 | Cocos Creator项目初始化 | 1周 | 待定 |
| 阶段2 | 游戏系统集成 | 2周 | 待定 |
| 阶段3 | UI系统重构 | 1周 | 待定 |
| 阶段4 | 微信小游戏集成 | 1周 | 待定 |
| 阶段5 | 测试与发布 | 1周 | 待定 |
| **总计** | | **6周** | |

## 🤔 讨论要点

### 待确认事项
1. **Cocos Creator版本**: 确认使用3.8 LTS还是最新版本？
2. **美术资源**: 现有UI如何视觉化？需要重新设计吗？
3. **音效音乐**: 是否已有音效资源？如何集成？
4. **分包策略**: 哪些内容需要分包加载？
5. **第三方SDK**: 是否需要集成广告SDK、统计SDK？

### 技术决策点
1. **UI框架**: 使用Cocos Creator原生UI还是第三方框架？
2. **状态管理**: 继续使用EventManager还是引入MVC框架？
3. **数据持久化**: 仅使用本地存储还是需要云端存档？
4. **网络功能**: 是否需要实时排行榜、好友系统？

## 📚 参考资料

### 官方文档
- [Cocos Creator 3.x 文档](https://docs.cocos.com/creator/3.8/)
- [微信小游戏开发指南](https://developers.weixin.qq.com/minigame/en/dev/guide/)
- [TypeScript 5.x 手册](https://www.typescriptlang.org/docs/)

### 最佳实践
- [Cocos Creator性能优化](https://docs.cocos.com/creator/manual/zh/advanced-topics/performance/)
- [微信小游戏性能优化](https://developers.weixin.qq.com/minigame/en/dev/guide/performance/)

---

**文档状态**: 🟢 进行中
**最后更新**: 2025-06-28
**维护者**: 开发团队
**讨论记录**: 见下方评论

---

## 💬 讨论区

### 2025-06-28 讨论记录
**议题**: 迁移策略确认
**决定事项**:
1. ✅ 确认使用Cocos Creator 3.8 LTS作为目标引擎
2. ✅ 保持现有TypeScript游戏逻辑，仅重构UI和引擎集成部分
3. ✅ 优先实现核心功能，美术资源后续完善
4. ✅ 第一阶段重点：项目初始化和核心系统适配

**下一步行动**:
- 安装Cocos Creator 3.8 LTS
- 创建基础项目结构
- 开始核心系统适配工作

**待讨论**:
- 美术资源设计方案
- 音效集成策略
- 性能优化具体指标
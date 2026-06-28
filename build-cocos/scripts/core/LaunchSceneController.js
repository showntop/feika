/**
 * 启动场景控制器
 * 负责启动场景的逻辑和加载控制
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Component, Label, Node, director, _decorator } from 'cc';
import { CocosGameApp } from './CocosGameApp';
const { ccclass, property, requireComponent } = _decorator;
/**
 * 启动场景控制器
 */
let LaunchSceneController = class LaunchSceneController extends Component {
    constructor() {
        super(...arguments);
        this.loadingLabel = null;
        this.loadingBar = null;
        this.loadingProgress = 0;
        this.loadingTips = [
            '欢迎来到2010年...',
            '准备开始你的创业之旅...',
            '加载游戏资源中...',
            '正在初始化游戏系统...'
        ];
    }
    /**
     * Cocos Creator生命周期：节点加载时调用
     */
    onLoad() {
        console.log('[LaunchScene] 启动场景加载');
        this.setupScene();
    }
    /**
     * Cocos Creator生命周期：节点首次激活时调用
     */
    start() {
        console.log('[LaunchScene] 开始启动流程');
        this.startLoadingProcess();
    }
    /**
     * 设置场景
     */
    setupScene() {
        // 设置初始UI状态
        if (this.loadingLabel) {
            this.loadingLabel.string = '游戏初始化中...';
        }
        if (this.loadingBar) {
            this.loadingBar.setScale(0, 1, 1); // 初始进度条为0
        }
    }
    /**
     * 开始加载流程
     */
    async startLoadingProcess() {
        try {
            // 模拟加载过程
            await this.simulateLoading();
            // 获取游戏实例并初始化
            const gameApp = CocosGameApp.getInstance();
            if (gameApp && !gameApp.isReady()) {
                // 游戏会在CocosGameApp组件的start方法中自动初始化
                console.log('[LaunchScene] 游戏初始化完成');
            }
            // 延迟一小段时间后切换到主游戏场景
            this.scheduleOnce(() => {
                this.loadMainGameScene();
            }, 1.0);
        }
        catch (error) {
            console.error('[LaunchScene] 启动过程出错:', error);
            this.handleLoadingError(error);
        }
    }
    /**
     * 模拟加载过程
     */
    async simulateLoading() {
        const loadingDuration = 2.0; // 2秒加载时间
        const updateInterval = 0.1; // 每0.1秒更新一次
        const steps = loadingDuration / updateInterval;
        for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => {
                this.scheduleOnce(() => {
                    this.loadingProgress = i / steps;
                    this.updateLoadingUI();
                    resolve(undefined);
                }, updateInterval);
            });
        }
    }
    /**
     * 更新加载UI
     */
    updateLoadingUI() {
        // 更新进度条
        if (this.loadingBar) {
            this.loadingBar.setScale(this.loadingProgress, 1, 1);
        }
        // 更新提示文本
        if (this.loadingLabel) {
            const tipIndex = Math.floor(this.loadingProgress * this.loadingTips.length);
            const tip = this.loadingTips[Math.min(tipIndex, this.loadingTips.length - 1)];
            this.loadingLabel.string = `${tip} (${Math.floor(this.loadingProgress * 100)}%)`;
        }
    }
    /**
     * 加载主游戏场景
     */
    loadMainGameScene() {
        console.log('[LaunchScene] 切换到主游戏场景');
        director.loadScene('MainGameScene');
    }
    /**
     * 处理加载错误
     */
    handleLoadingError(error) {
        console.error('[LaunchScene] 加载失败:', error);
        if (this.loadingLabel) {
            this.loadingLabel.string = '加载失败，请重新启动游戏';
        }
        // 可以在这里添加重试逻辑
    }
};
__decorate([
    property(Label),
    __metadata("design:type", typeof (_a = typeof Label !== "undefined" && Label) === "function" ? _a : Object)
], LaunchSceneController.prototype, "loadingLabel", void 0);
__decorate([
    property(Node),
    __metadata("design:type", typeof (_b = typeof Node !== "undefined" && Node) === "function" ? _b : Object)
], LaunchSceneController.prototype, "loadingBar", void 0);
LaunchSceneController = __decorate([
    ccclass('LaunchSceneController'),
    requireComponent(CocosGameApp)
], LaunchSceneController);
export { LaunchSceneController };
//# sourceMappingURL=LaunchSceneController.js.map
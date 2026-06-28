/**
 * 响应式设计管理器
 * 统一管理响应式布局和设备适配
 */

export interface Breakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
}

export interface DeviceConfig {
    name: string;
    breakpoints: Breakpoint[];
    defaultFontSize: number;
    gridColumns: number;
    touchOptimized: boolean;
}

export class ResponsiveManager {
    private static instance: ResponsiveManager;
    private currentBreakpoint: string = 'desktop';
    private deviceConfig: DeviceConfig;
    private resizeListeners: Array<() => void> = [];

    // 预定义的断点配置
    private readonly BREAKPOINTS: Breakpoint[] = [
        { name: 'mobile', minWidth: 0, maxWidth: 480 },
        { name: 'tablet', minWidth: 481, maxWidth: 768 },
        { name: 'laptop', minWidth: 769, maxWidth: 1024 },
        { name: 'desktop', minWidth: 1025, maxWidth: 1440 },
        { name: 'large', minWidth: 1441 }
    ];

    // 设备配置映射
    private readonly DEVICE_CONFIGS: { [key: string]: DeviceConfig } = {
        mobile: {
            name: 'mobile',
            breakpoints: this.BREAKPOINTS.slice(0, 2),
            defaultFontSize: 14,
            gridColumns: 4,
            touchOptimized: true
        },
        tablet: {
            name: 'tablet',
            breakpoints: this.BREAKPOINTS.slice(1, 3),
            defaultFontSize: 16,
            gridColumns: 6,
            touchOptimized: true
        },
        desktop: {
            name: 'desktop',
            breakpoints: this.BREAKPOINTS.slice(2),
            defaultFontSize: 16,
            gridColumns: 7,
            touchOptimized: false
        }
    };

    private constructor() {
        this.deviceConfig = this.detectDevice();
        this.setupResizeListener();
    }

    public static getInstance(): ResponsiveManager {
        if (!ResponsiveManager.instance) {
            ResponsiveManager.instance = new ResponsiveManager();
        }
        return ResponsiveManager.instance;
    }

    /**
     * 检测当前设备类型
     */
    private detectDevice(): DeviceConfig {
        const width = window.innerWidth;

        if (width <= 480) {
            return this.DEVICE_CONFIGS.mobile;
        } else if (width <= 768) {
            return this.DEVICE_CONFIGS.tablet;
        } else {
            return this.DEVICE_CONFIGS.desktop;
        }
    }

    /**
     * 设置窗口大小变化监听
     */
    private setupResizeListener(): void {
        let resizeTimeout: any;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250); // 防抖
        });
    }

    /**
     * 处理窗口大小变化
     */
    private handleResize(): void {
        const oldConfig = this.deviceConfig;
        this.deviceConfig = this.detectDevice();
        const newBreakpoint = this.getCurrentBreakpoint();

        if (oldConfig.name !== this.deviceConfig.name || this.currentBreakpoint !== newBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            this.notifyListeners();
        }
    }

    /**
     * 获取当前断点
     */
    public getCurrentBreakpoint(): string {
        const width = window.innerWidth;

        for (const breakpoint of this.BREAKPOINTS) {
            if (width >= breakpoint.minWidth && (!breakpoint.maxWidth || width <= breakpoint.maxWidth)) {
                return breakpoint.name;
            }
        }

        return 'desktop';
    }

    /**
     * 获取当前设备配置
     */
    public getDeviceConfig(): DeviceConfig {
        return this.deviceConfig;
    }

    /**
     * 检查是否为移动设备
     */
    public isMobile(): boolean {
        return this.deviceConfig.name === 'mobile';
    }

    /**
     * 检查是否为触摸设备
     */
    public isTouchOptimized(): boolean {
        return this.deviceConfig.touchOptimized;
    }

    /**
     * 获取网格列数
     */
    public getGridColumns(): number {
        return this.deviceConfig.gridColumns;
    }

    /**
     * 获取响应式值
     */
    public getResponsiveValue(mobile: any, tablet: any, desktop: any): any {
        switch (this.deviceConfig.name) {
            case 'mobile':
                return mobile;
            case 'tablet':
                return tablet;
            case 'desktop':
                return desktop;
            default:
                return desktop;
        }
    }

    /**
     * 添加响应式变化监听器
     */
    public onResize(listener: () => void): void {
        this.resizeListeners.push(listener);
    }

    /**
     * 移除响应式变化监听器
     */
    public offResize(listener: () => void): void {
        const index = this.resizeListeners.indexOf(listener);
        if (index > -1) {
            this.resizeListeners.splice(index, 1);
        }
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        this.resizeListeners.forEach(listener => listener());
    }

    /**
     * 应用响应式样式
     */
    public applyResponsiveStyles(element: HTMLElement, styles: { [breakpoint: string]: any }): void {
        const currentStyles = styles[this.currentBreakpoint] || styles.desktop;

        for (const property in currentStyles) {
            (element.style as any)[property] = currentStyles[property];
        }
    }

    /**
     * 获取最优字体大小
     */
    public getOptimalFontSize(baseSize: number): number {
        const scaleFactor = this.getResponsiveValue(0.85, 0.95, 1.0);
        return Math.round(baseSize * scaleFactor);
    }

    /**
     * 获取最优间距
     */
    public getOptimalSpacing(baseSpacing: number): number {
        const scaleFactor = this.getResponsiveValue(0.7, 0.85, 1.0);
        return Math.round(baseSpacing * scaleFactor);
    }

    /**
     * 获取最优触摸目标大小
     */
    public getOptimalTouchTarget(minSize: number = 44): number {
        // iOS推荐最小触摸目标为44x44px
        return this.deviceConfig.touchOptimized ? Math.max(minSize, 44) : minSize;
    }

    /**
     * 检查是否支持某个媒体查询
     */
    public matchesMediaQuery(query: string): boolean {
        return window.matchMedia(query).matches;
    }

    /**
     * 获取安全区域（适配刘海屏等）
     */
    public getSafeAreaInset(): { top: number; right: number; bottom: number; left: number } {
        const style = (window as any).document.defaultView.getComputedStyle(document.documentElement);
        return {
            top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
            right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
            bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
            left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
        };
    }

    /**
     * 初始化全局响应式CSS变量
     */
    public initResponsiveCSSVariables(): void {
        const root = document.documentElement;

        // 设置基础字体大小
        root.style.setProperty('--base-font-size', `${this.deviceConfig.defaultFontSize}px`);

        // 设置网格列数
        root.style.setProperty('--grid-columns', this.deviceConfig.gridColumns.toString());

        // 设置触摸优化标志
        root.style.setProperty('--touch-optimized', this.deviceConfig.touchOptimized ? '1' : '0');

        // 设置安全区域（CSS env变量）
        root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
        root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
        root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
        root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');

        // 设置断点变量
        this.BREAKPOINTS.forEach(breakpoint => {
            if (breakpoint.maxWidth) {
                root.style.setProperty(`--breakpoint-${breakpoint.name}`, `${breakpoint.maxWidth}px`);
            }
        });
    }

    /**
     * 生成响应式CSS媒体查询
     */
    public generateMediaQueries(): { [key: string]: string } {
        const queries: { [key: string]: string } = {};

        queries.mobile = `@media (max-width: 480px)`;
        queries.tablet = `@media (min-width: 481px) and (max-width: 768px)`;
        queries.laptop = `@media (min-width: 769px) and (max-width: 1024px)`;
        queries.desktop = `@media (min-width: 1025px) and (max-width: 1440px)`;
        queries.large = `@media (min-width: 1441px)`;

        // 触摸设备
        queries.touch = '@media (hover: none) and (pointer: coarse)';
        queries.mouse = '@media (hover: hover) and (pointer: fine)';

        // 屏幕方向
        queries.portrait = '@media (orientation: portrait)';
        queries.landscape = '@media (orientation: landscape)';

        // 高分辨率屏幕
        queries.retina = '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)';

        return queries;
    }
}
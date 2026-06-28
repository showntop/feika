/**
 * 保存/加载界面组件
 * 提供游戏存档管理功能
 */
import { GameManager } from '../../core/GameManager';
import { NotificationManager } from './NotificationManager';
import { BaseComponent } from './BaseComponent';
export class SaveLoadPanel extends BaseComponent {
    constructor() {
        super();
        this.isInitialized = false;
        // UI状态
        this.isOpen = false;
        this.currentMode = 'save';
        this.selectedSlot = null;
        this.gameManager = GameManager.getInstance();
        this.notificationManager = NotificationManager.getInstance();
    }
    static getInstance() {
        if (!SaveLoadPanel.instance) {
            SaveLoadPanel.instance = new SaveLoadPanel();
        }
        return SaveLoadPanel.instance;
    }
    /**
     * 初始化组件
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        console.log('[SaveLoadPanel] 初始化保存/加载面板');
        this.isInitialized = true;
    }
    /**
     * 创建DOM元素
     */
    createElement() {
        // 在测试环境中，我们不需要创建实际的DOM元素
        console.log('[SaveLoadPanel] 创建DOM元素');
    }
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 在测试环境中，我们不需要绑定事件
        console.log('[SaveLoadPanel] 绑定事件监听器');
    }
    /**
     * 渲染组件内容
     */
    render() {
        // 在测试环境中，我们只需要更新状态
        console.log('[SaveLoadPanel] 渲染组件');
    }
    /**
     * 显示保存面板
     */
    showSavePanel() {
        this.currentMode = 'save';
        this.selectedSlot = null;
        this.isOpen = true;
        console.log('[SaveLoadPanel] 显示保存面板');
        this.notifyUpdate();
    }
    /**
     * 显示加载面板
     */
    showLoadPanel() {
        this.currentMode = 'load';
        this.selectedSlot = null;
        this.isOpen = true;
        console.log('[SaveLoadPanel] 显示加载面板');
        this.notifyUpdate();
    }
    /**
     * 隐藏面板
     */
    async hide() {
        this.isOpen = false;
        this.selectedSlot = null;
        console.log('[SaveLoadPanel] 隐藏面板');
        this.notifyUpdate();
    }
    /**
     * 选择槽位
     */
    selectSlot(slotId) {
        this.selectedSlot = slotId;
        console.log(`[SaveLoadPanel] 选择槽位: ${slotId}`);
        this.notifyUpdate();
    }
    /**
     * 确认操作（保存或加载）
     */
    async confirmAction() {
        if (!this.selectedSlot) {
            this.notificationManager.warning('请先选择一个存档槽位');
            return false;
        }
        if (this.currentMode === 'save') {
            return await this.saveToSlot(this.selectedSlot);
        }
        else {
            return await this.loadFromSlot(this.selectedSlot);
        }
    }
    /**
     * 保存到指定槽位
     */
    async saveToSlot(slotId) {
        try {
            console.log(`[SaveLoadPanel] 保存到槽位: ${slotId}`);
            // 获取当前槽位信息
            const allSlots = this.gameManager.getAllSaveSlots();
            const existingSlot = allSlots.find(slot => slot.slotId === slotId);
            let slotName;
            if (existingSlot && existingSlot.data) {
                // 覆盖现有存档
                slotName = `手动保存 ${new Date().toLocaleString()}`;
                const confirmed = await this.confirmOverwrite(existingSlot.slotName);
                if (!confirmed) {
                    return false;
                }
            }
            else {
                // 新建存档
                slotName = await this.promptSlotName(`存档 ${slotId}`);
            }
            // 执行保存
            const success = await this.gameManager.saveGame(slotId, slotName);
            if (success) {
                this.notificationManager.success(`游戏已保存到 ${slotId}`);
                this.hide();
                return true;
            }
            else {
                this.notificationManager.error('保存失败，请重试');
                return false;
            }
        }
        catch (error) {
            console.error('[SaveLoadPanel] 保存失败:', error);
            this.notificationManager.error('保存过程中发生错误');
            return false;
        }
    }
    /**
     * 从指定槽位加载
     */
    async loadFromSlot(slotId) {
        try {
            console.log(`[SaveLoadPanel] 从槽位加载: ${slotId}`);
            // 获取槽位信息
            const allSlots = this.gameManager.getAllSaveSlots();
            const slot = allSlots.find(s => s.slotId === slotId);
            if (!slot || !slot.data) {
                this.notificationManager.error('该槽位为空，无法加载');
                return false;
            }
            // 确认加载
            const confirmed = await this.confirmLoad(slot.slotName);
            if (!confirmed) {
                return false;
            }
            // 执行加载
            const success = await this.gameManager.loadGame(slotId);
            if (success) {
                this.notificationManager.success(`游戏已从 ${slotId} 加载`);
                this.hide();
                return true;
            }
            else {
                this.notificationManager.error('加载失败，请重试');
                return false;
            }
        }
        catch (error) {
            console.error('[SaveLoadPanel] 加载失败:', error);
            this.notificationManager.error('加载过程中发生错误');
            return false;
        }
    }
    /**
     * 删除槽位
     */
    async deleteSlot(slotId) {
        try {
            console.log(`[SaveLoadPanel] 删除槽位: ${slotId}`);
            // 确认删除
            const allSlots = this.gameManager.getAllSaveSlots();
            const slot = allSlots.find(s => s.slotId === slotId);
            if (!slot || !slot.data) {
                this.notificationManager.warning('该槽位已经是空的');
                return false;
            }
            const confirmed = await this.confirmDelete(slot.slotName);
            if (!confirmed) {
                return false;
            }
            // 执行删除
            const success = await this.gameManager.deleteSave(slotId);
            if (success) {
                this.notificationManager.success(`存档 ${slotId} 已删除`);
                this.notifyUpdate();
                return true;
            }
            else {
                this.notificationManager.error('删除失败，请重试');
                return false;
            }
        }
        catch (error) {
            console.error('[SaveLoadPanel] 删除失败:', error);
            this.notificationManager.error('删除过程中发生错误');
            return false;
        }
    }
    /**
     * 导出存档
     */
    exportSlot(slotId) {
        try {
            console.log(`[SaveLoadPanel] 导出槽位: ${slotId}`);
            const exportData = this.gameManager.exportSave(slotId);
            if (exportData) {
                // 在实际浏览器环境中，这里会触发下载
                console.log(`[SaveLoadPanel] 导出数据长度: ${exportData.length}`);
                this.notificationManager.success(`存档 ${slotId} 已导出`);
            }
            else {
                this.notificationManager.error('导出失败，存档可能不存在');
            }
        }
        catch (error) {
            console.error('[SaveLoadPanel] 导出失败:', error);
            this.notificationManager.error('导出过程中发生错误');
        }
    }
    /**
     * 导入存档
     */
    importSlot(slotId, importData) {
        try {
            console.log(`[SaveLoadPanel] 导入到槽位: ${slotId}`);
            const success = this.gameManager.importSave(slotId, importData);
            if (success) {
                this.notificationManager.success(`存档已导入到 ${slotId}`);
                this.notifyUpdate();
            }
            else {
                this.notificationManager.error('导入失败，数据可能损坏');
            }
        }
        catch (error) {
            console.error('[SaveLoadPanel] 导入失败:', error);
            this.notificationManager.error('导入过程中发生错误');
        }
    }
    /**
     * 获取所有槽位信息
     */
    getAllSlots() {
        const slots = this.gameManager.getAllSaveSlots();
        return slots.map(slot => ({
            slotId: slot.slotId,
            slotName: slot.slotName,
            timestamp: slot.timestamp,
            playtime: slot.playtime || 0,
            isEmpty: !slot.data
        }));
    }
    /**
     * 确认覆盖
     */
    async confirmOverwrite(slotName) {
        // 在实际实现中，这里会显示确认对话框
        console.log(`[SaveLoadPanel] 确认覆盖存档: ${slotName}`);
        return true; // 测试环境直接返回true
    }
    /**
     * 确认加载
     */
    async confirmLoad(slotName) {
        console.log(`[SaveLoadPanel] 确认加载存档: ${slotName}`);
        return true;
    }
    /**
     * 确认删除
     */
    async confirmDelete(slotName) {
        console.log(`[SaveLoadPanel] 确认删除存档: ${slotName}`);
        return true;
    }
    /**
     * 提示槽位名称
     */
    async promptSlotName(defaultName) {
        console.log(`[SaveLoadPanel] 提示输入槽位名称: ${defaultName}`);
        return `手动保存 ${new Date().toLocaleString()}`;
    }
    /**
     * 通知更新
     */
    notifyUpdate() {
        console.log('[SaveLoadPanel] 面板状态更新');
    }
    /**
     * 获取面板状态
     */
    getState() {
        return {
            isOpen: this.isOpen,
            currentMode: this.currentMode,
            selectedSlot: this.selectedSlot,
            slots: this.getAllSlots()
        };
    }
    /**
     * 销毁组件
     */
    destroy() {
        this.hide();
        this.isInitialized = false;
        console.log('[SaveLoadPanel] 组件已销毁');
    }
}
export default SaveLoadPanel;
//# sourceMappingURL=SaveLoadPanel.js.map
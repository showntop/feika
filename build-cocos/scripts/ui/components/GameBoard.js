/**
 * 游戏盘面组件
 * 7x7网格，支持物品拖拽合成
 */
import { BaseComponent } from './BaseComponent';
import { MergeSystem } from '../../gameplay/merge/MergeSystem';
import { EventManager } from '../../core/EventManager';
import { UIEventType } from '../UIManager';
/**
 * 游戏盘面组件
 */
export class GameBoard extends BaseComponent {
    constructor() {
        super();
        // 游戏数据
        this.gridData = new Map();
        this.selectedItem = null;
        // UI元素
        this.gridElement = null;
        this.cells = [];
        this.itemElements = new Map();
        this.mergeSystem = MergeSystem.getInstance();
    }
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'game-board';
        this.element.innerHTML = `
            <div class="board-container">
                <div class="board-header">
                    <h2 class="board-title">合成盘</h2>
                    <div class="board-info">
                        <span class="item-count">物品: 0/49</span>
                        <span class="energy-display">体力: --/--</span>
                    </div>
                </div>
                <div class="grid-container" id="mergeGrid"></div>
                <div class="board-controls">
                    <button class="control-btn" id="autoArrangeBtn">自动整理</button>
                    <button class="control-btn" id="clearBoardBtn">清空盘面</button>
                </div>
            </div>
            <style>
                :root {
                    --grid-columns: 7;
                    --cell-size: 80px;
                    --gap-size: 8px;
                }

                .game-board {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    box-sizing: border-box;
                    font-family: 'Microsoft YaHei', sans-serif;
                }

                .board-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .board-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .board-title {
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                    color: #ffffff;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .board-info {
                    display: flex;
                    gap: 20px;
                    font-size: 14px;
                    color: #ffffff;
                    flex-wrap: wrap;
                }

                .grid-container {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(var(--grid-columns), 1fr);
                    grid-template-rows: repeat(var(--grid-columns), 1fr);
                    gap: var(--gap-size);
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    min-height: 300px;
                }

                /* 响应式设计 */
                @media (max-width: 768px) {
                    .game-board {
                        padding: 10px;
                    }

                    .board-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .board-title {
                        font-size: 18px;
                    }

                    .board-info {
                        font-size: 12px;
                        gap: 10px;
                    }

                    .grid-container {
                        gap: 4px;
                        padding: 5px;
                        min-height: 250px;
                    }

                    :root {
                        --grid-columns: 5;
                        --gap-size: 4px;
                    }
                }

                @media (max-width: 480px) {
                    .board-title {
                        font-size: 16px;
                    }

                    .board-info {
                        font-size: 11px;
                        gap: 8px;
                    }

                    .grid-container {
                        min-height: 200px;
                    }

                    :root {
                        --grid-columns: 4;
                        --gap-size: 3px;
                    }

                    .board-controls {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .control-btn {
                        font-size: 12px;
                        padding: 8px 12px;
                    }
                }

                .grid-cell {
                    aspect-ratio: 1;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .grid-cell:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: scale(1.05);
                }

                .grid-cell.selected {
                    border-color: #ffd700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
                    animation: pulse 1s infinite;
                }

                .grid-cell.drag-over {
                    border-color: #4CAF50;
                    background: rgba(76, 175, 80, 0.3);
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .grid-item {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    cursor: grab;
                    transition: transform 0.2s ease;
                    user-select: none;
                }

                .grid-item:active {
                    cursor: grabbing;
                }

                .grid-item.dragging {
                    opacity: 0.5;
                    transform: scale(1.1);
                }

                .item-icon {
                    font-size: 32px;
                    margin-bottom: 4px;
                }

                .item-level {
                    font-size: 12px;
                    font-weight: bold;
                    color: #ffd700;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .item-name {
                    font-size: 10px;
                    color: #ffffff;
                    margin-top: 2px;
                    text-align: center;
                    max-width: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .board-controls {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .control-btn {
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: bold;
                    color: #ffffff;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .control-btn:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .control-btn:active {
                    transform: translateY(0);
                }

                @keyframes itemAppear {
                    from {
                        opacity: 0;
                        transform: scale(0);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes itemMerge {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.3);
                        filter: brightness(1.5);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                .grid-item.appear {
                    animation: itemAppear 0.3s ease-out;
                }

                .grid-item.merging {
                    animation: itemMerge 0.5s ease-out;
                }
            </style>
        `;
        // 初始化网格
        this.initializeGrid();
    }
    bindEvents() {
        const eventManager = EventManager.getInstance();
        // 监听游戏事件更新盘面
        eventManager.on('merge_success', () => this.handleMergeSuccess());
        eventManager.on('item_generated', () => this.handleItemGenerated());
        eventManager.on('grid_updated', () => this.refreshGrid());
        // 监听响应式变化
        this.responsiveManager.onResize(() => this.handleResponsiveChange());
        // 绑定控制按钮事件
        setTimeout(() => {
            this.bindControlEvents();
        }, 100);
    }
    handleResponsiveChange() {
        const gridColumns = this.responsiveManager.getGridColumns();
        const gridContainer = this.element?.querySelector('#mergeGrid');
        if (gridContainer) {
            // 更新CSS变量以调整网格列数
            gridContainer.style.setProperty('--grid-columns', gridColumns.toString());
            // 重新初始化网格以适应新的列数
            this.initializeResponsiveGrid(gridColumns);
        }
    }
    initializeResponsiveGrid(columns) {
        // 根据列数调整网格大小
        const effectiveGridSize = Math.min(GameBoard.GRID_SIZE, columns * columns);
        // 清空现有网格
        const gridContainer = this.element?.querySelector('#mergeGrid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
            this.cells = [];
            // 创建新的网格
            for (let row = 0; row < GameBoard.GRID_SIZE; row++) {
                this.cells[row] = [];
                for (let col = 0; col < GameBoard.GRID_SIZE; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.row = row.toString();
                    cell.dataset.col = col.toString();
                    // 只在有效范围内显示单元格
                    if (row < columns && col < columns) {
                        this.bindCellEvents(cell, { row, col });
                    }
                    else {
                        cell.style.visibility = 'hidden';
                    }
                    gridContainer.appendChild(cell);
                    this.cells[row][col] = cell;
                }
            }
        }
    }
    initializeGrid() {
        if (!this.element)
            return;
        const gridContainer = this.element.querySelector('#mergeGrid');
        if (!gridContainer)
            return;
        this.gridElement = gridContainer;
        this.cells = [];
        // 创建7x7网格
        for (let row = 0; row < GameBoard.GRID_SIZE; row++) {
            this.cells[row] = [];
            for (let col = 0; col < GameBoard.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row.toString();
                cell.dataset.col = col.toString();
                // 绑定单元格事件
                this.bindCellEvents(cell, { row, col });
                gridContainer.appendChild(cell);
                this.cells[row][col] = cell;
            }
        }
    }
    bindCellEvents(cell, position) {
        // 点击选择
        cell.addEventListener('click', () => this.handleCellClick(position));
        // 拖拽事件
        cell.addEventListener('dragover', (e) => this.handleDragOver(e, position));
        cell.addEventListener('drop', (e) => this.handleDrop(e, position));
        cell.addEventListener('dragleave', () => this.handleDragLeave(position));
    }
    bindControlEvents() {
        if (!this.element)
            return;
        const autoArrangeBtn = this.element.querySelector('#autoArrangeBtn');
        const clearBoardBtn = this.element.querySelector('#clearBoardBtn');
        if (autoArrangeBtn) {
            autoArrangeBtn.addEventListener('click', () => this.autoArrangeItems());
        }
        if (clearBoardBtn) {
            clearBoardBtn.addEventListener('click', () => this.clearBoard());
        }
    }
    render() {
        if (!this.element || !this.gridElement)
            return;
        // 清空所有物品
        this.itemElements.clear();
        this.gridData.clear();
        // 暂时使用模拟数据，后续通过事件系统获取实际数据
        let itemCount = 0;
        // TODO: 通过MergeSystem的公共API获取网格数据
        // 目前使用占位符显示
        for (let row = 0; row < GameBoard.GRID_SIZE; row++) {
            for (let col = 0; col < GameBoard.GRID_SIZE; col++) {
                // 暂时显示一些示例物品
                if (itemCount < 3 && (row * GameBoard.GRID_SIZE + col) < 5) {
                    const mockItem = {
                        id: `mock_${itemCount}`,
                        typeId: 'basic_customer',
                        level: 1
                    };
                    this.renderItem(mockItem, { row, col });
                    itemCount++;
                }
            }
        }
        // 更新统计信息
        this.updateBoardInfo(itemCount);
    }
    renderItem(item, position) {
        const cell = this.cells[position.row][position.col];
        if (!cell)
            return;
        // 创建物品元素
        const itemElement = document.createElement('div');
        itemElement.className = 'grid-item appear';
        itemElement.draggable = true;
        itemElement.dataset.position = JSON.stringify(position);
        // 设置物品内容
        const icons = {
            'basic_customer': '👤',
            'vip_customer': '🤵',
            'celebrity': '⭐'
        };
        const names = {
            'basic_customer': '普通顾客',
            'vip_customer': 'VIP顾客',
            'celebrity': '名人'
        };
        const icon = icons[item.typeId] || '📦';
        const name = names[item.typeId] || '未知物品';
        itemElement.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-level">Lv.${item.level}</div>
            <div class="item-name">${name}</div>
        `;
        // 绑定拖拽事件
        itemElement.addEventListener('dragstart', (e) => this.handleDragStart(e, position));
        itemElement.addEventListener('dragend', (e) => this.handleDragEnd(e, position));
        // 清空单元格并添加物品
        cell.innerHTML = '';
        cell.appendChild(itemElement);
        // 播放出现动画
        this.animationManager.scale(itemElement, 0, 1, { duration: 300, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' });
        // 保存引用
        const key = this.getGridKey(position);
        this.gridData.set(key, {
            id: item.id,
            type: item.typeId,
            level: item.level,
            position,
            icon,
            name
        });
        this.itemElements.set(key, itemElement);
    }
    getGridKey(position) {
        return `${position.row}-${position.col}`;
    }
    handleCellClick(position) {
        const key = this.getGridKey(position);
        const itemData = this.gridData.get(key);
        if (!itemData) {
            // 点击空单元格，取消选择
            this.clearSelection();
            return;
        }
        if (this.selectedItem) {
            // 已有选中物品，尝试合并
            const selectedKey = this.getGridKey(this.selectedItem);
            if (key === selectedKey) {
                // 点击同一个物品，取消选择
                this.clearSelection();
            }
            else {
                // 尝试合并
                this.attemptMerge(this.selectedItem, position);
            }
        }
        else {
            // 选中当前物品
            this.selectItem(position);
        }
    }
    handleDragStart(e, position) {
        if (!e.dataTransfer)
            return;
        const key = this.getGridKey(position);
        const itemElement = this.itemElements.get(key);
        if (itemElement) {
            itemElement.classList.add('dragging');
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(position));
        this.selectItem(position);
    }
    handleDragEnd(e, position) {
        const key = this.getGridKey(position);
        const itemElement = this.itemElements.get(key);
        if (itemElement) {
            itemElement.classList.remove('dragging');
        }
        // 清除所有拖拽样式
        this.cells.forEach(row => {
            row.forEach(cell => {
                cell.classList.remove('drag-over');
            });
        });
    }
    handleDragOver(e, position) {
        e.preventDefault();
        if (!e.dataTransfer)
            return;
        e.dataTransfer.dropEffect = 'move';
        const cell = this.cells[position.row][position.col];
        if (cell) {
            cell.classList.add('drag-over');
        }
    }
    handleDrop(e, position) {
        e.preventDefault();
        const data = e.dataTransfer?.getData('text/plain');
        if (!data)
            return;
        const fromPos = JSON.parse(data);
        this.attemptMerge(fromPos, position);
    }
    handleDragLeave(position) {
        const cell = this.cells[position.row][position.col];
        if (cell) {
            cell.classList.remove('drag-over');
        }
    }
    selectItem(position) {
        this.clearSelection();
        this.selectedItem = position;
        const cell = this.cells[position.row][position.col];
        if (cell) {
            cell.classList.add('selected');
        }
        console.log('[GameBoard] 选择物品:', position);
    }
    clearSelection() {
        if (this.selectedItem) {
            const cell = this.cells[this.selectedItem.row][this.selectedItem.col];
            if (cell) {
                cell.classList.remove('selected');
            }
            this.selectedItem = null;
        }
    }
    attemptMerge(fromPos, toPos) {
        const eventManager = EventManager.getInstance();
        eventManager.emit(UIEventType.ITEM_MERGE, {
            fromPos,
            toPos
        });
        this.clearSelection();
    }
    handleMergeSuccess() {
        console.log('[GameBoard] 处理合成成功');
        this.render();
        this.playMergeAnimation();
    }
    handleItemGenerated() {
        console.log('[GameBoard] 处理物品生成');
        this.render();
        this.playGenerateAnimation();
    }
    refreshGrid() {
        console.log('[GameBoard] 刷新网格');
        this.render();
    }
    updateBoardInfo(itemCount) {
        if (!this.element)
            return;
        const itemCountElement = this.element.querySelector('.item-count');
        const energyDisplay = this.element.querySelector('.energy-display');
        if (itemCountElement) {
            itemCountElement.textContent = `物品: ${itemCount}/49`;
        }
        if (energyDisplay) {
            const currentEnergy = this.mergeSystem.getCurrentEnergy();
            const maxEnergy = this.mergeSystem.getMaxEnergy();
            energyDisplay.textContent = `体力: ${currentEnergy}/${maxEnergy}`;
        }
    }
    autoArrangeItems() {
        console.log('[GameBoard] 自动整理物品');
        // TODO: 实现自动整理逻辑
    }
    clearBoard() {
        console.log('[GameBoard] 清空盘面');
        // TODO: 实现清空盘面逻辑
    }
    playMergeAnimation() {
        console.log('[GameBoard] 播放合成动画');
        this.itemElements.forEach((element) => {
            // 组合多个动画效果
            this.animationManager.pulse(element, { duration: 400, iterations: 2 });
            setTimeout(() => {
                this.animationManager.glow(element, '#ffd700', { duration: 600, iterations: 2 });
            }, 200);
        });
    }
    playGenerateAnimation() {
        console.log('[GameBoard] 播放生成动画');
        // 新物品已通过 appear 动画类显示
    }
    showError(message) {
        console.error('[GameBoard] 错误:', message);
        // TODO: 显示错误提示UI
    }
}
GameBoard.GRID_SIZE = 7;
GameBoard.CELL_SIZE = 80; // px
//# sourceMappingURL=GameBoard.js.map
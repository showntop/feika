/**
 * 订单面板组件
 * 显示和管理订单系统
 */
import { BaseComponent } from './BaseComponent';
export class OrderPanel extends BaseComponent {
    constructor() {
        super(...arguments);
        this.orders = [];
        this.selectedOrder = null;
        // UI元素
        this.ordersList = null;
        this.orderDetails = null;
        this.completeButton = null;
        this.notificationBadge = null;
    }
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'order-panel';
        this.element.innerHTML = `
            <div class="panel-container">
                <div class="panel-header">
                    <h2 class="panel-title">📋 订单中心</h2>
                    <button class="panel-toggle" id="panelToggle">−</button>
                </div>
                <div class="panel-content">
                    <div class="orders-section">
                        <div class="section-header">
                            <h3 class="section-title">当前订单</h3>
                            <div class="order-count" id="orderCount">0/3</div>
                        </div>
                        <div class="orders-list" id="ordersList">
                            <div class="no-orders">暂无订单</div>
                        </div>
                    </div>
                    <div class="order-details-section" id="orderDetailsSection">
                        <div class="details-placeholder">
                            <div class="placeholder-icon">📦</div>
                            <div class="placeholder-text">选择一个订单查看详情</div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .order-panel {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Microsoft YaHei', sans-serif;
                    overflow: hidden;
                }

                .panel-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }

                .panel-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: bold;
                    color: #ffffff;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .panel-toggle {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .panel-toggle:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }

                .panel-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .orders-section {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                    padding: 15px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .section-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: bold;
                    color: #ffd700;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
                }

                .order-count {
                    background: rgba(255, 215, 0, 0.2);
                    color: #ffd700;
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 14px;
                    font-weight: bold;
                }

                .orders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .order-item {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .order-item:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateX(5px);
                    border-color: rgba(255, 215, 0, 0.5);
                }

                .order-item.selected {
                    background: rgba(255, 215, 0, 0.1);
                    border-color: #ffd700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
                }

                .order-item.completed {
                    opacity: 0.5;
                    pointer-events: none;
                }

                .order-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .order-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #ffffff;
                }

                .order-difficulty {
                    font-size: 12px;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-weight: bold;
                }

                .difficulty-easy {
                    background: #4CAF50;
                    color: #ffffff;
                }

                .difficulty-medium {
                    background: #FF9800;
                    color: #ffffff;
                }

                .difficulty-hard {
                    background: #f44336;
                    color: #ffffff;
                }

                .order-description {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 10px;
                }

                .order-rewards {
                    display: flex;
                    gap: 15px;
                    font-size: 13px;
                    color: #ffd700;
                }

                .reward-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .order-progress {
                    margin-top: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 5px;
                    height: 6px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    border-radius: 5px;
                    transition: width 0.3s ease;
                }

                .order-details-section {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                }

                .details-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .placeholder-icon {
                    font-size: 60px;
                    margin-bottom: 15px;
                }

                .placeholder-text {
                    font-size: 16px;
                }

                .order-details-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .details-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: #ffffff;
                    margin-bottom: 10px;
                }

                .details-description {
                    font-size: 15px;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.6;
                }

                .items-requirements {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .requirement-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }

                .requirement-item.completed {
                    border-color: #4CAF50;
                    opacity: 0.7;
                }

                .requirement-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                }

                .item-icon {
                    font-size: 24px;
                }

                .item-details {
                    display: flex;
                    flex-direction: column;
                }

                .item-name {
                    font-size: 14px;
                    font-weight: bold;
                    color: #ffffff;
                }

                .item-level {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .requirement-status {
                    font-size: 13px;
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 10px;
                }

                .status-pending {
                    background: rgba(244, 67, 54, 0.3);
                    color: #ff6b6b;
                }

                .status-complete {
                    background: rgba(76, 175, 80, 0.3);
                    color: #81C784;
                }

                .complete-button {
                    padding: 15px 30px;
                    font-size: 16px;
                    font-weight: bold;
                    color: #ffffff;
                    background: linear-gradient(135deg, #4CAF50, #8BC34A);
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .complete-button:hover {
                    background: linear-gradient(135deg, #8BC34A, #4CAF50);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .complete-button:disabled {
                    background: rgba(128, 128, 128, 0.5);
                    cursor: not-allowed;
                    transform: none;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .notification-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4444;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 10px;
                    animation: pulse 1s infinite;
                }
            </style>
        `;
        // 初始化UI元素引用
        this.initializeElements();
    }
    bindEvents() {
        if (!this.element)
            return;
        // 面板折叠按钮
        const toggleBtn = this.element.querySelector('#panelToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }
    }
    initializeElements() {
        if (!this.element)
            return;
        this.ordersList = this.element.querySelector('#ordersList');
        this.orderDetails = this.element.querySelector('#orderDetailsSection');
    }
    render() {
        if (!this.ordersList || !this.orderDetails)
            return;
        // 清空列表
        this.ordersList.innerHTML = '';
        if (this.orders.length === 0) {
            this.ordersList.innerHTML = '<div class="no-orders">暂无订单</div>';
            this.orderDetails.innerHTML = `
                <div class="details-placeholder">
                    <div class="placeholder-icon">📦</div>
                    <div class="placeholder-text">暂无订单</div>
                </div>
            `;
            return;
        }
        // 渲染订单列表
        this.orders.forEach((order, index) => {
            const orderElement = this.createOrderElement(order, index);
            if (this.ordersList) {
                this.ordersList.appendChild(orderElement);
            }
        });
        // 更新订单计数
        this.updateOrderCount();
    }
    createOrderElement(order, index) {
        if (!this.ordersList)
            return document.createElement('div');
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.style.animation = `slideIn 0.3s ease-out ${index * 0.1}s both`;
        const difficultyClass = `difficulty-${order.difficulty}`;
        const difficultyText = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        }[order.difficulty];
        orderElement.innerHTML = `
            <div class="order-item-header">
                <div class="order-title">${order.title}</div>
                <div class="order-difficulty ${difficultyClass}">${difficultyText}</div>
            </div>
            <div class="order-description">${order.description}</div>
            <div class="order-rewards">
                <div class="reward-item">
                    <span>💰</span>
                    <span>${order.reward.cash}</span>
                </div>
                <div class="reward-item">
                    <span>⭐</span>
                    <span>${order.reward.reputation}</span>
                </div>
                <div class="reward-item">
                    <span>🤝</span>
                    <span>${order.reward.connections}</span>
                </div>
            </div>
            <div class="order-progress">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        // 绑定点击事件
        orderElement.addEventListener('click', () => this.selectOrder(order));
        return orderElement;
    }
    selectOrder(order) {
        this.selectedOrder = order;
        // 更新选中状态
        const orderItems = this.ordersList?.querySelectorAll('.order-item');
        orderItems?.forEach((item, index) => {
            if (this.orders[index] === order) {
                item.classList.add('selected');
            }
            else {
                item.classList.remove('selected');
            }
        });
        // 显示订单详情
        this.showOrderDetails(order);
    }
    showOrderDetails(order) {
        if (!this.orderDetails)
            return;
        const completedItems = this.calculateCompletedItems(order);
        const totalItems = order.items.length;
        const progress = (completedItems / totalItems) * 100;
        this.orderDetails.innerHTML = `
            <div class="order-details-content">
                <div class="details-title">${order.title}</div>
                <div class="details-description">${order.description}</div>
                <div class="items-requirements">
                    ${order.items.map(item => this.createRequirementElement(item)).join('')}
                </div>
                <button class="complete-button" ${progress < 100 ? 'disabled' : ''}>
                    ${progress < 100 ? '完成订单' : '领取奖励'}
                </button>
            </div>
        `;
        // 绑定完成按钮事件
        const completeButton = this.orderDetails.querySelector('.complete-button');
        if (completeButton) {
            completeButton.addEventListener('click', () => this.handleCompleteOrder(order));
        }
    }
    createRequirementElement(item) {
        const isComplete = Math.random() > 0.5; // 模拟完成状态
        const itemIcons = {
            'basic_customer': '👤',
            'vip_customer': '🤵',
            'celebrity': '⭐'
        };
        const icon = itemIcons[item.itemId] || '📦';
        return `
            <div class="requirement-item ${isComplete ? 'completed' : ''}">
                <div class="requirement-info">
                    <div class="item-icon">${icon}</div>
                    <div class="item-details">
                        <div class="item-name">物品名称 × ${item.count}</div>
                        <div class="item-level">等级 ${item.level}</div>
                    </div>
                </div>
                <div class="requirement-status ${isComplete ? 'status-complete' : 'status-pending'}">
                    ${isComplete ? '✓ 完成' : '进行中'}
                </div>
            </div>
        `;
    }
    calculateCompletedItems(order) {
        // 模拟计算完成的物品数量
        return order.items.filter(() => Math.random() > 0.5).length;
    }
    handleCompleteOrder(order) {
        console.log('[OrderPanel] 完成订单:', order.id);
        // 触发订单完成事件
        const eventManager = window.eventManager;
        if (eventManager) {
            eventManager.emit('ui_order_complete', {
                orderId: order.id
            });
        }
        this.playCompleteAnimation();
    }
    updateOrderCount() {
        const orderCount = this.element?.querySelector('#orderCount');
        if (orderCount) {
            orderCount.textContent = `${this.orders.length}/3`;
        }
    }
    playCompleteAnimation() {
        console.log('[OrderPanel] 播放完成动画');
        // 为面板添加完成动画效果
        if (this.element) {
            this.element.style.animation = 'pulse 0.5s ease-out';
            setTimeout(() => {
                if (this.element) {
                    this.element.style.animation = '';
                }
            }, 500);
        }
    }
    showNotification() {
        console.log('[OrderPanel] 显示新订单通知');
        // 在面板标题上添加通知徽章
        if (!this.notificationBadge) {
            const panelTitle = this.element?.querySelector('.panel-title');
            if (panelTitle) {
                this.notificationBadge = document.createElement('div');
                this.notificationBadge.className = 'notification-badge';
                this.notificationBadge.textContent = '!';
                panelTitle.style.position = 'relative';
                panelTitle.appendChild(this.notificationBadge);
            }
        }
        // 3秒后移除通知
        setTimeout(() => {
            if (this.notificationBadge && this.notificationBadge.parentNode) {
                this.notificationBadge.parentNode.removeChild(this.notificationBadge);
                this.notificationBadge = null;
            }
        }, 3000);
    }
    addOrder(order) {
        this.orders.push(order);
        this.render();
        this.showNotification();
    }
    removeOrder(orderId) {
        this.orders = this.orders.filter(order => order.id !== orderId);
        this.render();
    }
    togglePanel() {
        const content = this.element?.querySelector('.panel-content');
        const toggle = this.element?.querySelector('#panelToggle');
        if (content && toggle) {
            if (content.style.display === 'none') {
                content.style.display = 'flex';
                toggle.textContent = '−';
            }
            else {
                content.style.display = 'none';
                toggle.textContent = '+';
            }
        }
    }
}
//# sourceMappingURL=OrderPanel.js.map
import {
  _decorator,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  sys,
  UITransform,
  Vec3
} from 'cc';

const { ccclass } = _decorator;

declare const wx: any;

type Chain = 'goods' | 'money' | 'social';

interface ItemDef {
  id: string;
  name: string;
  short: string;
  chain: Chain;
  level: number;
  next?: string;
}

interface Requirement {
  kind: 'item' | 'cash' | 'reputation' | 'connections' | 'shop';
  id?: string;
  count?: number;
  value?: number;
}

interface Reward {
  cash?: number;
  reputation?: number;
  connections?: number;
  energy?: number;
}

interface OrderDef {
  id: string;
  title: string;
  customer: string;
  requirements: Requirement[];
  reward: Reward;
  unlock?: () => boolean;
}

interface StoryBeat {
  id: string;
  title: string;
  body: string;
  requirements: Requirement[];
  reward: Reward;
  after: string;
}

interface GameState {
  grid: Array<string | null>;
  cash: number;
  energy: number;
  reputation: number;
  connections: number;
  shopLevel: number;
  selectedIndex: number;
  orderIds: string[];
  storyIndex: number;
  completedOrders: number;
  adCount: number;
}

interface ButtonSpec {
  node: Node;
  label: Label;
  bg: Graphics;
  enabled: boolean;
}

const BOARD_SIZE = 7;
const GRID_COUNT = BOARD_SIZE * BOARD_SIZE;
const STORAGE_KEY = 'time_loop_2010_cocos_mvp_v1';

const COLORS = {
  bg: new Color(238, 242, 236, 255),
  panel: new Color(255, 252, 244, 255),
  panelSoft: new Color(245, 249, 244, 255),
  line: new Color(194, 203, 195, 255),
  ink: new Color(35, 38, 36, 255),
  muted: new Color(105, 112, 108, 255),
  green: new Color(37, 126, 78, 255),
  greenDark: new Color(26, 88, 55, 255),
  gold: new Color(223, 167, 57, 255),
  red: new Color(174, 60, 48, 255),
  cell: new Color(250, 255, 249, 255),
  cellItem: new Color(255, 245, 198, 255),
  cellSelected: new Color(255, 227, 121, 255),
  sky: new Color(197, 225, 236, 255),
  ground: new Color(216, 200, 164, 255),
  stall: new Color(177, 111, 55, 255)
};

const ITEMS: Record<string, ItemDef> = {
  goods_1: { id: 'goods_1', name: '发卡', short: '发卡', chain: 'goods', level: 1, next: 'goods_2' },
  goods_2: { id: 'goods_2', name: '商品包', short: '货包', chain: 'goods', level: 2, next: 'goods_3' },
  goods_3: { id: 'goods_3', name: '热卖摊货', short: '热货', chain: 'goods', level: 3, next: 'goods_4' },
  goods_4: { id: 'goods_4', name: '招牌爆款', short: '爆款', chain: 'goods', level: 4 },
  money_1: { id: 'money_1', name: '零钱', short: '零钱', chain: 'money', level: 1, next: 'money_2' },
  money_2: { id: 'money_2', name: '一叠现金', short: '现金', chain: 'money', level: 2, next: 'money_3' },
  money_3: { id: 'money_3', name: '进货款', short: '货款', chain: 'money', level: 3, next: 'money_4' },
  money_4: { id: 'money_4', name: '第一桶金', short: '金', chain: 'money', level: 4 },
  social_1: { id: 'social_1', name: '熟脸', short: '熟脸', chain: 'social', level: 1, next: 'social_2' },
  social_2: { id: 'social_2', name: '老客', short: '老客', chain: 'social', level: 2, next: 'social_3' },
  social_3: { id: 'social_3', name: '贵人', short: '贵人', chain: 'social', level: 3 }
};

@ccclass('TenMinuteGame')
export class TenMinuteGame extends Component {
  private state: GameState = this.createInitialState();
  private root: Node | null = null;
  private resourceLabel: Label | null = null;
  private storyTitleLabel: Label | null = null;
  private storyBodyLabel: Label | null = null;
  private goalLabel: Label | null = null;
  private shopNameLabel: Label | null = null;
  private hintLabel: Label | null = null;
  private orderListNode: Node | null = null;
  private gridNode: Node | null = null;
  private progressBar: Graphics | null = null;
  private progressBarWidth = 0;
  private storyButton: ButtonSpec | null = null;
  private upgradeButton: ButtonSpec | null = null;
  private adButton: ButtonSpec | null = null;
  private cellLabels: Label[] = [];
  private cellBgs: Graphics[] = [];

  private readonly orders: OrderDef[] = [
    {
      id: 'student_hairpin',
      title: '学生买发卡',
      customer: '放学路过的学生',
      requirements: [{ kind: 'item', id: 'goods_1', count: 2 }],
      reward: { cash: 48, reputation: 1 }
    },
    {
      id: 'aunt_pack',
      title: '邻居阿姨进货',
      customer: '隔壁阿姨',
      requirements: [{ kind: 'item', id: 'goods_2', count: 1 }],
      reward: { cash: 96, reputation: 1 }
    },
    {
      id: 'worker_bundle',
      title: '下班带一包',
      customer: '厂里下班的工友',
      requirements: [{ kind: 'item', id: 'goods_2', count: 2 }],
      reward: { cash: 170, reputation: 2 }
    },
    {
      id: 'hospital_run',
      title: '医院门口急单',
      customer: '陪护家属',
      requirements: [
        { kind: 'item', id: 'money_2', count: 1 },
        { kind: 'item', id: 'goods_1', count: 1 }
      ],
      reward: { cash: 220, reputation: 1, connections: 1 },
      unlock: () => this.state.storyIndex >= 1
    },
    {
      id: 'small_boss',
      title: '小老板批货',
      customer: '街边小老板',
      requirements: [
        { kind: 'item', id: 'goods_3', count: 1 },
        { kind: 'item', id: 'social_1', count: 1 }
      ],
      reward: { cash: 360, reputation: 2, connections: 1 },
      unlock: () => this.state.reputation >= 2
    }
  ];

  private readonly story: StoryBeat[] = [
    {
      id: 'wake',
      title: '重返2010',
      body: '你从2026年的低谷醒来，眼前是2010年的老房子。父亲住院，亲戚催债，母亲攥着仅剩的零钱。这次，你要先保住这个家。',
      requirements: [],
      reward: { cash: 50 },
      after: '母亲把最后的零钱交给你。今晚，先去街角摆摊。'
    },
    {
      id: 'deposit',
      title: '先交住院押金',
      body: '医院让先交押金。你知道前世就是这一刻开始，家里被一步步拖垮。',
      requirements: [{ kind: 'item', id: 'money_2', count: 1 }],
      reward: { connections: 1 },
      after: '押金交上了。母亲第一次觉得，你真的能扛事。'
    },
    {
      id: 'debt',
      title: '亲戚催债',
      body: '亲戚堵在门口，让你三天内还5000。你没有解释，只说今晚就先还一笔。',
      requirements: [{ kind: 'cash', value: 500 }],
      reward: { reputation: 2 },
      after: '第一沓钱拍在桌上，亲戚的笑停住了。邻居开始记住你的摊子。'
    },
    {
      id: 'night_market',
      title: '抢下夜市口',
      body: '你想起前世：这个街角几天后会成为夜市入口。先摆出来，明天就能起量。',
      requirements: [
        { kind: 'item', id: 'goods_3', count: 1 },
        { kind: 'reputation', value: 3 }
      ],
      reward: { cash: 260, connections: 1 },
      after: '热卖摊货摆出来，人流明显多了。同行开始眼红。'
    },
    {
      id: 'cart',
      title: '换成小推车',
      body: '纸箱摊太寒酸。换一辆小推车，顾客才会相信你不是只摆一晚。',
      requirements: [{ kind: 'shop', value: 2 }],
      reward: { cash: 300, reputation: 1 },
      after: '小推车挂上招牌。母亲摸着车把，说：像个样子了。'
    },
    {
      id: 'first_win',
      title: '第一次打脸',
      body: '亲戚又来了，这次还带着看热闹的人。你数出一沓钱，说：账，今晚先还一半。',
      requirements: [
        { kind: 'cash', value: 1200 },
        { kind: 'item', id: 'money_3', count: 1 }
      ],
      reward: { reputation: 3, connections: 2 },
      after: '院子安静了几秒。有人小声说：这孩子真能翻身。第一晚，成了。'
    }
  ];

  public start(): void {
    this.loadState();
    this.buildScene();
    this.renderAll();
  }

  private createInitialState(): GameState {
    return {
      grid: Array.from({ length: GRID_COUNT }, () => null),
      cash: 100,
      energy: 40,
      reputation: 0,
      connections: 0,
      shopLevel: 1,
      selectedIndex: -1,
      orderIds: [],
      storyIndex: 0,
      completedOrders: 0,
      adCount: 0
    };
  }

  private buildScene(): void {
    this.node.removeAllChildren();
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);

    this.root = this.createPanel('Root', this.node, 0, 0, 750, 1334, COLORS.bg, COLORS.bg);

    this.createHeader();
    this.createStoryPanel();
    this.createBoard();
    this.createOrderPanel();
    this.createControls();
  }

  private createHeader(): void {
    if (!this.root) return;
    this.createLabel('Title', this.root, -335, 606, 360, 42, '重返2010：第一桶金', 30, COLORS.ink, 'left');
    this.createLabel('Subtitle', this.root, -335, 572, 360, 30, '2010 · 老家街角 · 微信小游戏MVP', 18, COLORS.greenDark, 'left');
    this.resourceLabel = this.createLabel('Resources', this.root, 54, 580, 300, 74, '', 20, COLORS.ink, 'right');
  }

  private createStoryPanel(): void {
    if (!this.root) return;
    const panel = this.createPanel('StoryPanel', this.root, 0, 415, 700, 245, COLORS.panel, COLORS.line);
    this.shopNameLabel = this.createLabel('ShopName', panel, -270, 73, 130, 34, '', 20, COLORS.ink, 'center');
    this.createPanel('ShopSky', panel, -270, 0, 150, 92, COLORS.sky, COLORS.sky);
    this.createPanel('ShopGround', panel, -270, -56, 150, 40, COLORS.ground, COLORS.ground);
    this.createPanel('Stall', panel, -270, -36, 112, 34, COLORS.stall, COLORS.stall);
    this.storyTitleLabel = this.createLabel('StoryTitle', panel, -170, 72, 470, 34, '', 24, COLORS.greenDark, 'left');
    this.storyBodyLabel = this.createLabel('StoryBody', panel, -170, 16, 470, 112, '', 19, COLORS.ink, 'left');
    this.goalLabel = this.createLabel('Goal', panel, -170, -65, 470, 30, '', 17, COLORS.muted, 'left');
    const progressBack = this.createPanel('ProgressBack', panel, 85, -98, 350, 12, new Color(220, 227, 220, 255), new Color(220, 227, 220, 255));
    this.progressBarWidth = 350;
    this.progressBar = progressBack.addComponent(Graphics);
    this.storyButton = this.createTextButton('StoryButton', panel, 252, -63, 145, 48, '推进剧情', COLORS.green, COLORS.greenDark, COLORS.panel, () => this.completeStory());
  }

  private createBoard(): void {
    if (!this.root) return;
    this.gridNode = this.createPanel('Board', this.root, -8, 48, 700, 700, new Color(218, 229, 219, 255), COLORS.line);
    this.cellLabels = [];
    this.cellBgs = [];
    const cellSize = 88;
    const gap = 8;
    const start = -((cellSize + gap) * (BOARD_SIZE - 1)) / 2;

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const index = y * BOARD_SIZE + x;
        const cell = this.createPanel(`Cell${index}`, this.gridNode, start + x * (cellSize + gap), -start - y * (cellSize + gap), cellSize, cellSize, COLORS.cell, COLORS.line);
        const label = this.createLabel(`CellLabel${index}`, cell, 0, 0, cellSize - 6, 44, '', 19, COLORS.ink, 'center');
        cell.on(Node.EventType.TOUCH_END, () => this.onCellTap(index), this);
        this.cellLabels[index] = label;
        this.cellBgs[index] = cell.getComponent(Graphics)!;
      }
    }
  }

  private createOrderPanel(): void {
    if (!this.root) return;
    const panel = this.createPanel('OrderPanel', this.root, 0, -455, 700, 285, COLORS.panel, COLORS.line);
    this.createLabel('OrderTitle', panel, -320, 104, 180, 30, '街边订单', 23, COLORS.ink, 'left');
    this.createTextButton('RefreshOrders', panel, 242, 104, 130, 40, '换一批', COLORS.panelSoft, COLORS.line, COLORS.greenDark, () => this.refreshOrders());
    this.orderListNode = new Node('OrderList');
    this.orderListNode.setParent(panel);
    this.orderListNode.setPosition(new Vec3(0, 16, 0));

    this.createLabel('UpgradeTitle', panel, -320, -104, 180, 28, '摊位升级', 21, COLORS.ink, 'left');
    this.upgradeButton = this.createTextButton('UpgradeButton', panel, 242, -104, 130, 42, '升级', COLORS.green, COLORS.greenDark, COLORS.panel, () => this.upgradeShop());
  }

  private createControls(): void {
    if (!this.root) return;
    this.createTextButton('GoodsGen', this.root, -255, -638, 140, 58, '小商品箱\n-1体力', COLORS.panel, COLORS.line, COLORS.ink, () => this.generate('goods'));
    this.createTextButton('MoneyGen', this.root, -88, -638, 140, 58, '零钱包\n-2体力', COLORS.panel, COLORS.line, COLORS.ink, () => this.generate('money'));
    this.createTextButton('SocialGen', this.root, 79, -638, 140, 58, '熟人介绍\n-3体力', COLORS.panel, COLORS.line, COLORS.ink, () => this.generate('social'));
    this.adButton = this.createTextButton('AdEnergy', this.root, 246, -638, 140, 58, '广告补体力', COLORS.gold, COLORS.gold, COLORS.ink, () => this.watchAdForEnergy());
    this.hintLabel = this.createLabel('Hint', this.root, -335, -692, 670, 36, '', 18, COLORS.muted, 'left');
  }

  private renderAll(): void {
    this.ensureStartContent();
    this.renderResources();
    this.renderStory();
    this.renderGrid();
    this.renderOrders();
    this.renderUpgrade();
    this.saveState();
  }

  private ensureStartContent(): void {
    if (!this.state.grid.some(Boolean)) {
      ['goods_1', 'goods_1', 'goods_1', 'money_1', 'money_1'].forEach((id) => this.addItemToEmptyCell(id));
    }
    if (this.state.orderIds.length === 0) {
      this.refreshOrders(false);
    }
  }

  private renderResources(): void {
    if (this.resourceLabel) {
      this.resourceLabel.string = `现金 ${this.state.cash}\n体力 ${this.state.energy}/60  口碑 ${this.state.reputation}  人脉 ${this.state.connections}`;
    }
    if (this.shopNameLabel) {
      this.shopNameLabel.string = this.state.shopLevel >= 2 ? '小推车' : '纸箱摊';
    }
  }

  private renderStory(): void {
    const beat = this.story[this.state.storyIndex];
    const done = Math.min(this.state.storyIndex, this.story.length);
    if (this.progressBar) {
      this.progressBar.clear();
      this.progressBar.fillColor = COLORS.green;
      this.progressBar.rect(-this.progressBarWidth / 2, -6, this.progressBarWidth * done / this.story.length, 12);
      this.progressBar.fill();
    }

    if (!beat) {
      if (this.storyTitleLabel) this.storyTitleLabel.string = '第一晚完成';
      if (this.storyBodyLabel) this.storyBodyLabel.string = '你已经跑通了摆摊、订单、押金、还债、升级和第一次打脸。接下来可以扩第二章夜市。';
      if (this.goalLabel) this.goalLabel.string = 'MVP剧情完成';
      this.setButton(this.storyButton, '已完成', false);
      return;
    }

    if (this.storyTitleLabel) this.storyTitleLabel.string = beat.title;
    if (this.storyBodyLabel) this.storyBodyLabel.string = beat.body;
    if (this.goalLabel) this.goalLabel.string = `条件：${this.describeRequirements(beat.requirements)}  进度 ${done}/${this.story.length}`;
    this.setButton(this.storyButton, this.canPay(beat.requirements) ? '完成剧情' : '条件不足', this.canPay(beat.requirements));
  }

  private renderGrid(): void {
    for (let i = 0; i < GRID_COUNT; i++) {
      const itemId = this.state.grid[i];
      const bg = this.cellBgs[i];
      const label = this.cellLabels[i];
      if (!bg || !label) continue;
      const fill = i === this.state.selectedIndex ? COLORS.cellSelected : itemId ? COLORS.cellItem : COLORS.cell;
      this.redrawRect(bg, 88, 88, fill, COLORS.line);
      label.string = itemId ? `${ITEMS[itemId].short}\nLv.${ITEMS[itemId].level}` : '';
    }
  }

  private renderOrders(): void {
    if (!this.orderListNode) return;
    this.orderListNode.removeAllChildren();
    this.state.orderIds.forEach((orderId, index) => {
      const order = this.orders.find((item) => item.id === orderId);
      if (!order) return;
      const y = 62 - index * 58;
      const card = this.createPanel(`Order${order.id}`, this.orderListNode!, -76, y, 450, 50, COLORS.panelSoft, COLORS.line);
      this.createLabel(`OrderText${order.id}`, card, -208, 2, 320, 42, `${order.title}｜${this.describeRequirements(order.requirements)}\n奖励：${this.describeReward(order.reward)}`, 15, COLORS.ink, 'left');
      this.createTextButton(`OrderButton${order.id}`, this.orderListNode!, 220, y, 120, 42, this.canPay(order.requirements) ? '交付' : '缺货', this.canPay(order.requirements) ? COLORS.green : COLORS.panelSoft, this.canPay(order.requirements) ? COLORS.greenDark : COLORS.line, this.canPay(order.requirements) ? COLORS.panel : COLORS.muted, () => this.completeOrder(order));
    });
  }

  private renderUpgrade(): void {
    if (this.state.shopLevel >= 2) {
      this.setButton(this.upgradeButton, '已升级', false);
      return;
    }
    this.setButton(this.upgradeButton, this.canUpgradeShop() ? '升级' : '缺条件', this.canUpgradeShop());
  }

  private onCellTap(index: number): void {
    const tapped = this.state.grid[index];
    if (this.state.selectedIndex < 0) {
      if (!tapped) return;
      this.state.selectedIndex = index;
      this.setHint(`选中 ${ITEMS[tapped].name}，再点空格移动，点相同物品合成。`);
      this.renderAll();
      return;
    }

    const fromIndex = this.state.selectedIndex;
    const from = this.state.grid[fromIndex];
    if (!from) {
      this.state.selectedIndex = -1;
      this.renderAll();
      return;
    }

    if (fromIndex === index) {
      this.state.selectedIndex = -1;
      this.renderAll();
      return;
    }

    if (!tapped) {
      this.state.grid[index] = from;
      this.state.grid[fromIndex] = null;
      this.setHint('移动完成。');
    } else if (tapped === from && ITEMS[from].next) {
      const next = ITEMS[from].next!;
      this.state.grid[index] = next;
      this.state.grid[fromIndex] = null;
      this.setHint(`合成 ${ITEMS[next].name}。`);
    } else {
      this.setHint('这两个物品不能合成。');
    }

    this.state.selectedIndex = -1;
    this.renderAll();
  }

  private generate(chain: Chain): void {
    const cost = chain === 'goods' ? 1 : chain === 'money' ? 2 : 3;
    if (chain === 'money' && this.state.storyIndex < 1) {
      this.setHint('先完成开场剧情，拿到母亲给的本钱。');
      return;
    }
    if (chain === 'social' && this.state.reputation < 2) {
      this.setHint('口碑到2后，熟人才愿意介绍生意。');
      return;
    }
    if (this.state.energy < cost) {
      this.setHint('体力不足，可以用广告补体力。');
      return;
    }
    if (!this.hasEmptyCell()) {
      this.setHint('盘面满了，先合成或交订单。');
      return;
    }

    const pools: Record<Chain, string[]> = {
      goods: ['goods_1', 'goods_1', 'goods_1', 'goods_2'],
      money: ['money_1', 'money_1', 'money_2'],
      social: ['social_1', 'social_1', 'social_2']
    };
    this.state.energy -= cost;
    this.addItemToEmptyCell(this.pick(pools[chain]));
    this.setHint('出了新物品。');
    this.renderAll();
  }

  private completeOrder(order: OrderDef): void {
    if (!this.canPay(order.requirements)) return;
    this.consumeRequirements(order.requirements);
    this.giveReward(this.withShopBonus(order.reward));
    this.state.completedOrders += 1;
    this.state.orderIds = this.state.orderIds.filter((id) => id !== order.id);
    this.addOneOrder();
    this.setHint(`完成订单：${order.title}。`);
    this.renderAll();
  }

  private completeStory(): void {
    const beat = this.story[this.state.storyIndex];
    if (!beat || !this.canPay(beat.requirements)) return;
    this.consumeRequirements(beat.requirements);
    this.giveReward(beat.reward);
    this.state.storyIndex += 1;
    this.setHint(beat.after);
    this.renderAll();
  }

  private upgradeShop(): void {
    if (!this.canUpgradeShop()) return;
    this.state.cash -= 500;
    this.state.reputation -= 2;
    this.removeItems('goods_2', 1);
    this.state.shopLevel = 2;
    this.setHint('小推车到手，订单现金奖励提高20%。');
    this.renderAll();
  }

  private watchAdForEnergy(): void {
    const reward = () => {
      this.state.adCount += 1;
      this.state.energy = Math.min(60, this.state.energy + 30);
      this.setHint(`体力 +30。本局广告次数：${this.state.adCount}`);
      this.renderAll();
    };

    if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
      const ad = wx.createRewardedVideoAd({ adUnitId: 'replace-with-your-ad-unit-id' });
      ad.onClose((res: { isEnded?: boolean }) => {
        if (!res || res.isEnded) reward();
      });
      ad.show().catch(() => reward());
      return;
    }

    reward();
  }

  private refreshOrders(shouldRender = true): void {
    this.state.orderIds = [];
    for (let i = 0; i < 3; i++) {
      this.addOneOrder();
    }
    this.setHint('订单刷新了。');
    if (shouldRender) this.renderAll();
  }

  private addOneOrder(): void {
    const available = this.orders.filter((order) => !order.unlock || order.unlock());
    const candidates = available.filter((order) => !this.state.orderIds.includes(order.id));
    const pool = candidates.length > 0 ? candidates : available;
    if (pool.length > 0) this.state.orderIds.push(this.pick(pool).id);
  }

  private canUpgradeShop(): boolean {
    return this.state.shopLevel < 2 && this.state.cash >= 500 && this.state.reputation >= 2 && this.countItem('goods_2') >= 1;
  }

  private canPay(requirements: Requirement[]): boolean {
    return requirements.every((req) => {
      if (req.kind === 'item') return this.countItem(req.id!) >= (req.count ?? 1);
      if (req.kind === 'cash') return this.state.cash >= (req.value ?? 0);
      if (req.kind === 'reputation') return this.state.reputation >= (req.value ?? 0);
      if (req.kind === 'connections') return this.state.connections >= (req.value ?? 0);
      if (req.kind === 'shop') return this.state.shopLevel >= (req.value ?? 1);
      return true;
    });
  }

  private consumeRequirements(requirements: Requirement[]): void {
    requirements.forEach((req) => {
      if (req.kind === 'item') this.removeItems(req.id!, req.count ?? 1);
      if (req.kind === 'cash') this.state.cash -= req.value ?? 0;
      if (req.kind === 'reputation') this.state.reputation -= req.value ?? 0;
      if (req.kind === 'connections') this.state.connections -= req.value ?? 0;
    });
  }

  private giveReward(reward: Reward): void {
    this.state.cash += reward.cash ?? 0;
    this.state.reputation += reward.reputation ?? 0;
    this.state.connections += reward.connections ?? 0;
    this.state.energy = Math.min(60, this.state.energy + (reward.energy ?? 0));
  }

  private withShopBonus(reward: Reward): Reward {
    if (this.state.shopLevel < 2 || !reward.cash) return reward;
    return { ...reward, cash: Math.round(reward.cash * 1.2) };
  }

  private countItem(itemId: string): number {
    return this.state.grid.filter((id) => id === itemId).length;
  }

  private removeItems(itemId: string, count: number): void {
    let left = count;
    for (let i = 0; i < this.state.grid.length && left > 0; i++) {
      if (this.state.grid[i] === itemId) {
        this.state.grid[i] = null;
        left -= 1;
      }
    }
  }

  private addItemToEmptyCell(itemId: string): boolean {
    const empty = this.state.grid.map((value, index) => value ? -1 : index).filter((index) => index >= 0);
    if (empty.length === 0) return false;
    this.state.grid[this.pick(empty)] = itemId;
    return true;
  }

  private hasEmptyCell(): boolean {
    return this.state.grid.some((value) => !value);
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private describeRequirements(requirements: Requirement[]): string {
    if (requirements.length === 0) return '无';
    return requirements.map((req) => {
      if (req.kind === 'item') return `${ITEMS[req.id!].name}x${req.count ?? 1}`;
      if (req.kind === 'cash') return `现金${req.value}`;
      if (req.kind === 'reputation') return `口碑${req.value}`;
      if (req.kind === 'connections') return `人脉${req.value}`;
      if (req.kind === 'shop') return `摊位Lv.${req.value}`;
      return '';
    }).join('、');
  }

  private describeReward(reward: Reward): string {
    const parts: string[] = [];
    if (reward.cash) parts.push(`现金+${reward.cash}`);
    if (reward.reputation) parts.push(`口碑+${reward.reputation}`);
    if (reward.connections) parts.push(`人脉+${reward.connections}`);
    if (reward.energy) parts.push(`体力+${reward.energy}`);
    return parts.join('、');
  }

  private createPanel(name: string, parent: Node, x: number, y: number, w: number, h: number, fill: Color, stroke: Color): Node {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(w, h);
    const graphics = node.addComponent(Graphics);
    this.redrawRect(graphics, w, h, fill, stroke);
    return node;
  }

  private redrawRect(graphics: Graphics, w: number, h: number, fill: Color, stroke: Color): void {
    graphics.clear();
    graphics.fillColor = fill;
    graphics.strokeColor = stroke;
    graphics.lineWidth = 2;
    graphics.rect(-w / 2, -h / 2, w, h);
    graphics.fill();
    graphics.stroke();
  }

  private createLabel(name: string, parent: Node, x: number, y: number, w: number, h: number, text: string, size: number, color: Color, align: 'left' | 'center' | 'right'): Label {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(new Vec3(x + w / 2, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(w, h);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = size;
    label.lineHeight = Math.round(size * 1.25);
    label.color = color;
    label.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : align === 'right' ? Label.HorizontalAlign.RIGHT : Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    return label;
  }

  private createTextButton(name: string, parent: Node, x: number, y: number, w: number, h: number, text: string, fill: Color, stroke: Color, textColor: Color, callback: () => void): ButtonSpec {
    const node = this.createPanel(name, parent, x, y, w, h, fill, stroke);
    const label = this.createLabel(`${name}Label`, node, -w / 2, 0, w, h, text, 17, textColor, 'center');
    const bg = node.getComponent(Graphics)!;
    const spec = { node, label, bg, enabled: true };
    node.on(Node.EventType.TOUCH_END, () => {
      if (spec.enabled) callback();
    }, this);
    return spec;
  }

  private setButton(button: ButtonSpec | null, text: string, enabled: boolean): void {
    if (!button) return;
    button.enabled = enabled;
    button.label.string = text;
    const transform = button.node.getComponent(UITransform)!;
    const size = transform.contentSize;
    this.redrawRect(button.bg, size.width, size.height, enabled ? COLORS.green : COLORS.panelSoft, enabled ? COLORS.greenDark : COLORS.line);
    button.label.color = enabled ? COLORS.panel : COLORS.muted;
  }

  private setHint(text: string): void {
    if (this.hintLabel) this.hintLabel.string = text;
  }

  private saveState(): void {
    sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private loadState(): void {
    const raw = sys.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      this.state = { ...this.createInitialState(), ...parsed };
      if (!Array.isArray(this.state.grid) || this.state.grid.length !== GRID_COUNT) {
        this.state.grid = Array.from({ length: GRID_COUNT }, () => null);
      }
    } catch {
      this.state = this.createInitialState();
    }
  }
}

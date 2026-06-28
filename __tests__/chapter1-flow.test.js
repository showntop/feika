const { GameManager } = require('../build/core/GameManager');
const { MergeItem, ItemType } = require('../build/models/Item');

function makeItem(id, name, type, level) {
  return new MergeItem({
    id,
    name,
    type,
    level,
    maxLevel: 5,
    value: 0,
    mergeChance: 1
  });
}

function placeRequiredItem(mergeSystem, id, name, type, level) {
  const [slot] = mergeSystem.getEmptySlots();
  if (!slot) {
    throw new Error('No empty slot available for test item');
  }
  const item = makeItem(id, name, type, level);
  const placed = mergeSystem.placeItem(item, slot);
  if (!placed) {
    throw new Error(`Failed to place test item ${id}`);
  }
}

function triggerAndComplete(gameManager, expectedEventId) {
  const storySystem = gameManager.getStorySystem();
  const event = storySystem.checkAndTriggerEvents((req) => gameManager.checkRequirement(req));

  expect(event).not.toBeNull();
  expect(event.getId()).toBe(expectedEventId);
  expect(gameManager.completeCurrentStoryEvent()).toBe(true);
  expect(storySystem.isEventCompleted(expectedEventId)).toBe(true);
}

describe('chapter 1 golden flow', () => {
  test('uses item submissions to complete the first-bucket-of-gold payoff', async () => {
    const gameManager = GameManager.getInstance();
    await gameManager.init();

    const mergeSystem = gameManager.getMergeSystem();
    const storySystem = gameManager.getStorySystem();

    expect(storySystem.loadChapter('chapter_1', (req) => gameManager.checkRequirement(req))).toBe(true);
    expect(mergeSystem.getGenerator('generator_old_phone')).toBeUndefined();

    triggerAndComplete(gameManager, 'event_ch1_wakeup');

    placeRequiredItem(mergeSystem, 'money_2', '攒钱罐', ItemType.MONEY, 2);
    triggerAndComplete(gameManager, 'event_ch1_father_illness');
    expect(mergeSystem.hasItem('money_2', 2)).toBe(false);

    triggerAndComplete(gameManager, 'event_ch1_relative_debt');

    triggerAndComplete(gameManager, 'event_ch1_mother_support');

    placeRequiredItem(mergeSystem, 'product_1', '散货', ItemType.PRODUCT, 1);
    placeRequiredItem(mergeSystem, 'product_1', '散货', ItemType.PRODUCT, 1);
    triggerAndComplete(gameManager, 'event_ch1_first_business');
    expect(mergeSystem.hasItem('product_1', 1)).toBe(false);

    triggerAndComplete(gameManager, 'event_ch1_forecast_hot_sale');

    placeRequiredItem(mergeSystem, 'product_2', '小商品', ItemType.PRODUCT, 2);
    triggerAndComplete(gameManager, 'event_ch1_first_earnings');
    expect(mergeSystem.hasItem('product_2', 2)).toBe(false);
    expect(mergeSystem.getGenerator('generator_old_phone')).toBeDefined();

    placeRequiredItem(mergeSystem, 'relationship_2', '老客户', ItemType.RELATIONSHIP, 2);
    placeRequiredItem(mergeSystem, 'product_2', '小商品', ItemType.PRODUCT, 2);
    triggerAndComplete(gameManager, 'event_ch1_regular_customers');
    expect(mergeSystem.hasItem('relationship_2', 2)).toBe(false);
    expect(mergeSystem.hasItem('product_2', 2)).toBe(false);

    placeRequiredItem(mergeSystem, 'money_5', '第一桶金', ItemType.MONEY, 5);
    triggerAndComplete(gameManager, 'event_ch1_debt_payment');
    expect(mergeSystem.hasItem('money_5', 5)).toBe(false);

    expect(storySystem.isEventCompleted('event_ch1_debt_payment')).toBe(true);
    expect(gameManager.getPlayerData().completedChapters).toContain('chapter_1');
  });
});

import { Core } from './core';
import { GetItem } from './configLoader';
import { Item } from '../common';
import {InvManager} from "./inventoryManager";

const UsableItemRegistry = new Map<string, (source: number, item: Item, slot: number) => void>();

/**
 * Registers a callback for when an item is used.
 * This is exported so other resources can use it.
 *
 * @param itemName The 'name' of the item from your config (e.g., "water_bottle")
 * @param callback The function to run when the item is used
 */
export function RegisterUsableItem(itemName: string, callback: (source: number, item: Item, slot: number) => void) {
  if (UsableItemRegistry.has(itemName)) {
    console.warn(`[ItemRegistry] Overwriting usable item callback for: ${itemName}`);
  }
  UsableItemRegistry.set(itemName, callback);
  console.log(`[ItemRegistry] Registered usable item: ${itemName}`);
}

/**
 * Handles the 'core:server:useItem' event from the client.
 * It checks inventory and, if successful, triggers the registered callback.
 */
onNet('core:server:useItem', async (data: {
  inventoryId: string,
  slot: number,
}) => {
  const src = global.source;
  const Player = Core.getPlayer(src);

  if (!Player) return;

  const inv = InvManager.getPlayerInventory(src);
  if (!inv) return;

  const slot = data.slot;

  const itemSlot = inv.getItem(slot);
  if (!itemSlot) {
    console.warn(`[ItemRegistry] Player ${src} tried to use empty slot: ${slot}`);
    return;
  }

  const itemName = itemSlot.name;
  const itemConfig = GetItem(itemName);
  if (!itemConfig) return;

  const itemCallback = UsableItemRegistry.get(itemName);
  if (!itemCallback) {
    console.warn(`[ItemRegistry] No usable item callback registered for: ${itemName}`);
    return;
  }

  if (itemConfig.consumable) {
    const removed = inv.removeItemFromSlot(slot, 1);
    if (!removed) {
      console.error(`[ItemRegistry] Failed to remove '${itemName}' from slot ${slot} for player ${src}!`);
      return;
    }
  }

  console.log(`[ItemRegistry] Player ${src} used item: ${itemName} from slot ${slot}`);
  itemCallback(src, itemConfig, slot); // Pass slot to callback

});

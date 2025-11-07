// src/server/InventoryManager.ts
import {oxmysql as MySQL} from '@communityox/oxmysql';
import {ItemSlot} from '../common';
import {Inventory} from './inventory';
import {GetItem} from "./configLoader";

// Helper to (de)serialize item map for database
function serializeItems(items: Map<number, ItemSlot>): string {
  return JSON.stringify(Array.from(items.entries()));
}

function deserializeItems(json: string | null): Map<number, ItemSlot> {
  if (!json) {
    return new Map<number, ItemSlot>();
  }
  try {
    return new Map<number, ItemSlot>(JSON.parse(json));
  } catch (e) {
    console.error('[Inventory] Failed to deserialize items!', e);
    return new Map<number, ItemSlot>();
  }
}

class InventoryManager {
  // Holds all active inventories (player, trunk, stash, etc.)
  private activeInventories = new Map<string, Inventory>();

  // Maps a player's source to their inventory ID
  private playerInvIdMap = new Map<number, string>();

  constructor() {
    console.log('[InventoryManager] Started.');
  }

  /**
   * Loads a player's inventory from the DB when they join.
   */
  public async loadPlayerInventory(source: number, citizenid: string) {
    const invId = `player-${citizenid}`;

    const result = await MySQL.scalar('SELECT inventory FROM characters WHERE citizenid = ?', [citizenid]);

    const items = deserializeItems(result as string | null);

    // TODO: Get real slots/weight from config or player data
    const playerInv = new Inventory(
      invId,
      "Player Inventory",
      40, // Default slots
      100000, // Default weight
      items,
      this.onInventoryUpdate.bind(this) // Pass the update callback
    );

    this.activeInventories.set(invId, playerInv);
    this.playerInvIdMap.set(source, invId);

    console.log(`[InventoryManager] Loaded inventory ${invId} for player ${source}`);
    this.syncInventoryToClient(source, playerInv);
  }

  /**
   * Saves a player's inventory to the database.
   */
  public async savePlayerInventory(invId: string) {
    const inv = this.activeInventories.get(invId);
    if (!inv || !invId.startsWith('player-')) return;

    const citizenid = invId.replace('player-', '');
    const itemsJson = serializeItems(inv.items);

    await MySQL.update(
      'UPDATE characters SET inventory = ? WHERE citizenid = ?',
      [itemsJson, citizenid]
    );
  }

  /**
   * Gets a player's inventory from their source.
   */
  public getPlayerInventory(source: number): Inventory | undefined {
    const invId = this.playerInvIdMap.get(source);
    if (!invId) return undefined;
    return this.activeInventories.get(invId);
  }

  /**
   * Gets any active inventory by its ID.
   */
  public getInventory(invId: string): Inventory | undefined {
    return this.activeInventories.get(invId);
  }

  public getPlayerSourceFromInvId(invId: string): number | null {
    for (const [src, id] of this.playerInvIdMap.entries()) {
      if (id === invId) return src;
    }
    return null;
  }

  /**
   * Handles player drops, saving their inventory.
   */
  public onPlayerDropped(source: number) {
    const invId = this.playerInvIdMap.get(source);
    if (invId) {
      this.savePlayerInventory(invId).then(r => {
      });
      this.activeInventories.delete(invId);
      this.playerInvIdMap.delete(source);
      console.log(`[InventoryManager] Saved and unloaded inventory ${invId}`);
    }
  }

  /**
   * Sends the full state of an inventory to a client.
   */
  public syncInventoryToClient(source: number, inv: Inventory) {
    const data = {
      id: inv.id,
      label: inv.label,
      slots: inv.slots,
      maxWeight: inv.maxWeight,
      currentWeight: inv.currentWeight,
      items: Object.fromEntries(inv.items) // Convert Map to object for NUI
    };
    emitNet('core:client:syncInventory', source, data);
  }

  /**
   * Called when an inventory's state is updated.
   * This is responsible for syncing changes to clients.
   */
  private onInventoryUpdate(inventory: Inventory) {
    // 1. Save to DB (if it's a player inv, others save differently)
    if (inventory.id.startsWith('player-')) {
      this.savePlayerInventory(inventory.id).then(r => {
      });
    }

    // 2. Sync to clients
    // Find all players who have this inventory open
    // For a player's own inventory:
    const playerSource = this.getPlayerSourceFromInvId(inventory.id);
    if (playerSource) {
      // This is a player inventory, sync to its owner
      this.syncInventoryToClient(playerSource, inventory);
    }

    // Here you would also loop over all players who have this
    // inventory open as a *secondary* inventory (e.g., a trunk)
    // and sync it to them as well.
  }

  /**
   * Handles the server-side logic for moving an item between inventories.
   * This is called by the 'core:server:moveInventoryItem' network event.
   */
  public async handleItemMove(source: number, data: MoveItemData) {
    // 1. Get the inventory instances
    const fromInv = this.getInventory(data.from.inventory);
    const toInv = this.getInventory(data.to.inventory);

    if (!fromInv || !toInv) {
      console.error(`[Inv] Move failed for ${source}: 'from' or 'to' inventory not found.`);
      // TODO: Notify client of failed move
      return;
    }

    // 2. === CRITICAL: VALIDATION ===
    // We must verify the player has permission to interact with both inventories.
    // A real system needs to track all inventories a player has open (e.g., trunk, stash, another player).
    const playerInv = this.getPlayerInventory(source);
    if (!playerInv) {
      console.error(`[Inv] Move failed for ${source}: Player inventory not found.`);
      return;
    }

    // This is a *basic* permission check. It assumes the player must
    // own one of the inventories. This is NOT sufficient for things like
    // public stashes or vehicle trunks, which require proximity/job checks.
    if (fromInv.id !== playerInv.id && toInv.id !== playerInv.id) {
      console.error(`[Inv] Move failed for ${source}: No access to ${fromInv.id} or ${toInv.id}.`);
      // TODO: Notify client
      return;
    }
    // TODO: Add proximity/job/owner checks for accessing non-player inventories.

    // 3. Get the item from the 'from' slot
    const fromItem = fromInv.items.get(data.from.slot);

    if (!fromItem) {
      console.error(`[Inv] Move failed for ${source}: No item in ${fromInv.id}:${data.from.slot}.`);
      // TODO: Notify client of desync
      return;
    }

    // 4. Get the item (if any) from the 'to' slot
    const toItem = toInv.items.get(data.to.slot);
    const moveQuantity = data.quantity || fromItem.quantity;

    // ---
    // For this first step, we'll only implement the simplest case:
    // moving an item to a completely empty slot.
    // ---

    if (!toItem) {
      // CASE 1: Moving to an empty slot

      const itemConfig = GetItem(fromItem.name);
      const isUnique = itemConfig?.unique === true;

      if (moveQuantity === fromItem.quantity && !isUnique) {
        // Moving the whole stack
        toInv.setSlot(data.to.slot, fromItem);
        fromInv.setSlot(data.from.slot, null);
      } else {
        // Moving part of a stack or a unique item
        const newItem: ItemSlot = {
          name: fromItem.name,
          quantity: moveQuantity,
          metadata: fromItem.metadata,
        };

        toInv.setSlot(data.to.slot, newItem);

        fromItem.quantity -= moveQuantity;
        fromInv.setSlot(data.from.slot, fromItem.quantity > 0 ? fromItem : null);
      }

    } else if (toItem.name === fromItem.name && !GetItem(fromItem.name)?.unique && this.canStack(fromItem, toItem)) {
      // CASE 2: Stacking
      // We'll assume a 'maxStack' property in item config, or a default
      const maxStack = GetItem(fromItem.name)?.maxStack || 100;
      const canAdd = maxStack - toItem.quantity;

      if (canAdd <= 0) {
        // 'To' slot is already full, so treat it as a swap (Case 3)
        this.performSwap(fromInv, fromItem, data.from.slot, toInv, toItem, data.to.slot);
        return;
      }

      const amountToMove = Math.min(moveQuantity, canAdd);

      toItem.quantity += amountToMove;
      toInv.setSlot(data.to.slot, toItem);

      fromItem.quantity -= amountToMove;
      fromInv.setSlot(data.from.slot, fromItem.quantity > 0 ? fromItem : null);

    } else {
      // CASE 3: Swapping
      this.performSwap(fromInv, fromItem, data.from.slot, toInv, toItem, data.to.slot);
    }
  }

  public canStack(item1: ItemSlot, item2: ItemSlot): boolean {
    // A real stacking check should compare metadata.
    // For now, we just check names.
    // TODO: Compare metadata (e.g., item1.metadata.quality === item2.metadata.quality)
    return item1.name === item2.name;
  }

  private performSwap(fromInv: Inventory, fromItem: ItemSlot, fromSlot: number, toInv: Inventory, toItem: ItemSlot, toSlot: number) {
    // Simple swap
    fromInv.setSlot(fromSlot, toItem);
    toInv.setSlot(toSlot, fromItem);
  }
}

// Create a singleton instance
export const InvManager = new InventoryManager();

interface MoveItemData {
  from: { inventory: string; slot: number };
  to: { inventory: string; slot: number };
  quantity?: number;
}

/**
 * Fired by the client when a NUI 'moveItem' callback is triggered.
 */
onNet('core:server:moveInventoryItem', (data: MoveItemData) => {

  // Get the player source who sent the event
  const source = global.source;

  if (!data.from || !data.to) {
    console.error(`[Inv] Invalid move data received from ${source}.`);
    return;
  }

  // Delegate the actual logic to the InvManager instance
  // to keep event handler clean.
  InvManager.handleItemMove(source, data).catch(console.error);
});

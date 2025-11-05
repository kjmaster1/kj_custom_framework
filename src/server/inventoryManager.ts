// src/server/InventoryManager.ts
import {oxmysql as MySQL} from '@communityox/oxmysql';
import {ItemSlot} from '../common';
import {Inventory} from './inventory';

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
      this.savePlayerInventory(invId).then(r => {});
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
      this.savePlayerInventory(inventory.id).then(r => {});
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
}

// Create a singleton instance
export const InvManager = new InventoryManager();

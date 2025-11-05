// src/client/InventoryManager.ts
import {Inventory, ItemSlot} from '../common';

// This is what the server *sends* (items as a plain object)
interface InventorySyncData {
  id: string;
  label: string;
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: Record<number, ItemSlot>;
}

/**
 * This is the shape of the inventory data
 * as it will be received by the NUI (React) app.
 */
export interface NuiInventory {
  id: string;
  label: string;
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: Record<number, ItemSlot>; // <slot, item>
}

// Holds all inventories the client is aware of (self, trunk, stash)
const ClientInventories = new Map<string, Inventory>(); // Use the new type
let PlayerInventoryId: string | null = null;

/**
 * Fired by the server to sync a full inventory.
 */
onNet('core:client:syncInventory', (data: InventorySyncData) => {
  // Convert the items object from the server into a Map
  const itemsMap = new Map(Object.entries(data.items).map(([k, v]) => [Number(k), v]));

  // Create the new client-side inventory object
  const clientInv: Inventory = {
    id: data.id,
    label: data.label,
    slots: data.slots,
    maxWeight: data.maxWeight,
    currentWeight: data.currentWeight,
    items: itemsMap, // Assign the new Map
  };

  // Store the correctly typed object in our client cache
  ClientInventories.set(clientInv.id, clientInv);

  // If this is our own inventory, store its ID
  if (clientInv.id.startsWith('player-')) {
    PlayerInventoryId = clientInv.id;
  }

  console.log(`[Inv] Synced inventory: ${clientInv.label} (${clientInv.id})`);

  // Convert the Map back to an object for NUI
  const nuiData: NuiInventory = {
    ...clientInv,
    items: Object.fromEntries(clientInv.items),
  };

  // Send the data to the NUI
  SendNUIMessage({
    action: 'updateInventory',
    data: nuiData,
  });

});

RegisterCommand('inventory', () => {
  const playerInv = GetPlayerInventory();

  console.log("inventory command", JSON.stringify(playerInv));

  if (!playerInv) return;

  // Send the data to the NUI
  SendNUIMessage({
    action: 'updateInventory',
    data: {
      ...playerInv,
      items: Object.fromEntries(playerInv.items),
    } as NuiInventory
  });

  SendNUIMessage({
    action: 'setVisible',
    data: true,
  });

  SetNuiFocus(true, true);
}, false);

/**
 * Gets the player's personal inventory.
 */
export function GetPlayerInventory(): Inventory | null {
  if (!PlayerInventoryId) return null;
  return ClientInventories.get(PlayerInventoryId) || null;
}

/**
 * Gets any open inventory by its ID.
 */
export function GetInventory(invId: string): Inventory | undefined {
  return ClientInventories.get(invId);
}

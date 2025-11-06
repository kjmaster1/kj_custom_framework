// src/client/InventoryManager.ts
import {Inventory, ItemSlot} from '../common';
import {GetItemDefinitions} from "./configRegistry";

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


RegisterNuiCallback('uiLoaded', (data: any, cb: Function) => {
  console.log('[Inv] NUI is loaded and ready to receive data.');

  const definitions = GetItemDefinitions();

  // Now that we know the NUI is listening, send the definitions.
  if (definitions) {
    SendNUIMessage({
      action: 'setDefinitions',
      data: definitions,
    });
  } else {
    console.error('[Inv] UI loaded, but item definitions are not yet cached!');
  }

  cb(1); // Acknowledge the callback
});

// --- moveItem NUI Callback ---
RegisterNuiCallback('moveItem', (data: {
  from: { inventory: string, slot: number },
  to: { inventory: string, slot: number }
}, cb: Function) => {

  // Acknowledge the NUI callback immediately
  cb(1);

  // Could do client-side validation here if needed.
  // For now, we'll just tell the server what the player wants to do.

  console.log(`[Inv] NUI requested move: ${data.from.inventory}:${data.from.slot} -> ${data.to.inventory}:${data.to.slot}`);

  // 'emitNet' to the server event
  emitNet('core:server:moveInventoryItem', data);
});

// --- contextAction NUI Callback ---
RegisterNuiCallback('contextAction', (data: {
  action: string,
  inventoryId: string,
  slot: number,
  item: ItemSlot
}, cb: Function) => {

  cb(1);

  console.log(`[Inv] Context Action: ${data.action} on ${data.item.name} in slot ${data.slot}`);

  // Send the action to the server to be handled

  if (data.action === 'use') {
    emitNet('core:server:useItem', {
      inventoryId: data.inventoryId,
      slot: data.slot
    });
  }

  if (data.action === 'drop') {
    // TODO: Add logic to get quantity from player
    emitNet('core:server:dropItem', {
      inventoryId: data.inventoryId,
      slot: data.slot,
      quantity: data.item.quantity // Drops the whole stack for now
    });
  }

  if (data.action === 'give') {
    // TODO: Add logic to get target player
    emitNet('core:server:giveItem', {
      inventoryId: data.inventoryId,
      slot: data.slot,
      quantity: data.item.quantity,
      target: -1 // -1 = closest player
    });
  }
});

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

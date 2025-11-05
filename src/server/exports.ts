import {Core} from "./core";
import {RegisterUsableItem} from "./itemRegistry";
import {Item} from "../common";

console.log('[Framework] Initializing server exports...');

/**
 * Server-side export to get the full Player object by source ID.
 * @param source The player's server ID
 * @returns The Player object or undefined
 */
exports('getPlayer', (source: number) => {
  return Core.getPlayer(source);
});

/**
 * Server-side export to get the full Player object by citizen ID.
 * @param citizenid The player's citizen ID
 * @returns The Player object or undefined
 */
exports('getPlayerByCitizenId', (citizenid: string) => {
  return Core.getPlayerByCitizenId(citizenid);
});

/**
 * Server-side export to get the entire Core object.
 * (Use with caution, prefer specific exports like getPlayer)
 */
exports('getCore', () => {
  return Core;
});

/**
 * Server-side export to register an item as usable.
 * @param itemName The name (ID) of the item
 * @param callback The function to run when used (source: number, item: Item, slot: number) => void
 */
exports('RegisterUsableItem', (itemName: string, callback: (source: number, item: Item, slot: number) => void) => {
  RegisterUsableItem(itemName, callback);
});

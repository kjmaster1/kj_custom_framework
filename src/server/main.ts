import {Core} from './core';
import {createCharacter, getCharacter, getCharacters, getOrCreateAccount} from "./database";
import {Item, PlayerData} from "../common";
import {GetConfigDataForClient, GetItem, GetJob, InitConfigLoader} from "./configLoader";
import {RegisterUsableItem} from "./itemRegistry";
import {InvManager} from "./inventoryManager";

console.log("[Framework] Server resource started!");

// Stores the account_id for players in character selection
const pendingPlayers = new Map<number, number>();


try {
  InitConfigLoader();

  const item = GetItem('water_bottle'); // Assuming 'water' is in your items/general.json
  if (item) {
    console.log(`Found item 'water_bottle': ${item.label}`);
  } else {
    console.log(`Item 'water_bottle' not found!`);
  }

  // Example from your police.json
  const policeJob = GetJob('lspd');
  if (policeJob) {
    console.log(`Found job 'lspd': ${policeJob.label}`);
    console.log(`Grade 0 Name: ${policeJob.grades[0].name}`);
  } else {
    console.log(`Job 'lspd' not found!`);
  }


  RegisterUsableItem('water_bottle', (source: number, item: Item, slot: number) => {
    const Player = Core.getPlayer(source);
    if (!Player) return;

    console.log(`[ItemLogic] ${Player.data.name} is drinking water.`);
    // Here you would add logic, e.g., trigger a sound, an animation,
    // and increase the player's thirst status.
    // For now, we'll just send a notification.
    emitNet('ox_lib:notify', source, {
      title: 'Aaaah!',
      description: 'You chugged a water bottle.',
      type: 'success'
    });
  });


  RegisterUsableItem('lockpick', (source: number, item: Item, slot: number) => {
    // Logic for using a lockpick
    console.log(`[ItemLogic] Player ${source} is trying to use a lockpick.`);
    emitNet('ox_lib:notify', source, {
      title: 'Hmm...',
      description: 'You look at the lockpick, but have nothing to use it on.',
      type: 'info'
    });
  });


} catch (e) {
  console.error('[CORE] Failed to initialize core resource:', e);
}


/**
 * Player Joins: Get their account and store their account ID.
 * We will wait for the client to tell us it's ready.
 */
on('playerJoining', async () => {
  const src = global.source;
  const identifiers = getPlayerIdentifiers(src);
  const license = identifiers.find(id => id.startsWith('license:'));

  if (!license) {
    DropPlayer(src.toString(10), 'Could not find your license.');
    return;
  }

  // 1. Get or create the ACCOUNT
  const accountId = await getOrCreateAccount(license);

  // 2. Just store their account ID. Don't send anything yet.
  pendingPlayers.set(src, accountId);
  console.log(`[Framework] Player ${src} (Account ${accountId}) is joining.`);

  const data = GetConfigDataForClient();

  console.log(`[Config] Sending config data to player ${src}`);

  // Emit a sync config network event to this specific client
  emitNet('core:client:syncConfig', src, data);

});

/**
 * Client is loaded and is requesting its character list.
 */
onNet('Framework:server:requestCharacters', async () => {
  const src = global.source;
  const accountId = pendingPlayers.get(src);

  if (!accountId) {
    DropPlayer(src.toString(10), 'Could not find your account. Please rejoin.');
    return;
  }

  // 1. Get all CHARACTERS for that account
  const characters = await getCharacters(accountId);

  // 2. Now send the list to the client for selection
  console.log(`[Framework] Sending ${characters.length} characters to player ${src}.`);
  emitNet('Framework:client:showCharSelect', src, characters);
});

/**
 * Player Selects Character: Client sends the citizenid.
 */
onNet('Framework:server:selectCharacter', async (citizenid: string) => {
  const src = global.source;
  const accountId = pendingPlayers.get(src);

  if (!accountId) return;

  const charData = await getCharacter(citizenid);

  // Security Check: Does this character belong to this account?
  if (!charData || charData.account_id !== accountId) {
    DropPlayer(src.toString(10), 'Character data mismatch.');
    return;
  }

  const playerData: PlayerData = {...charData, source: src};

  Core.loadPlayer(playerData);

  pendingPlayers.delete(src);

  console.log(`[Core] Player ${playerData.name} (CitizenID: ${playerData.citizenid}) loaded.`);

  // <-- 2. Load the player's inventory
  InvManager.loadPlayerInventory(src, playerData.citizenid).then(() => {
    // You can now access the player's inventory!
    const inv = InvManager.getPlayerInventory(src);

    console.log(`[Core] ${playerData.name} inventory: ${JSON.stringify(inv)}`);

    if (inv) {
      console.log(`[Core] ${playerData.name} inventory weight: ${inv.currentWeight}`);

      // Example: Give a new player a water bottle
      if (inv.items.size === 0) {
        console.log(`[Core] ${playerData.name} given water bottle!`);
        inv.addItem('water_bottle', 1);
      }
    }
  })
});

/**
 * Player Creates Character: Client sends new character details.
 */
onNet('Framework:server:createCharacter', async (data: { name: string }) => {
  const src = global.source;
  const accountId = pendingPlayers.get(src);

  if (!accountId) return;

  // Create the new character
  const charData = await createCharacter(accountId, data.name);

  const playerData: PlayerData = {...charData, source: src, isNew: true};
  Core.loadPlayer(playerData);

  pendingPlayers.delete(src);
});


/**
 * Player Drops: Save their active character (if one is loaded).
 */
on('playerDropped', (reason: string) => {
  const src = global.source;

  InvManager.onPlayerDropped(src);

  if (pendingPlayers.has(src)) {
    pendingPlayers.delete(src);
  }

  Core.removePlayer(src).catch(e => console.error(e));
});

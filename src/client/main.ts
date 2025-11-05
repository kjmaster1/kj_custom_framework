import {Core} from './core';
import {GetItem, GetJob, InitConfigRegistry} from "./configRegistry";
import {Lang} from "./locale";
import {UseItem} from "./itemUsage"; // This import initializes the client core

console.log("[Framework] Client resource started!");

exports.spawnmanager.setAutoSpawn(false);

InitConfigRegistry();

RegisterCommand('testitem', () => {

  const itemName = 'water_bottle';
  const item = GetItem(itemName);

  if (item) {
    console.log(Lang('info.item_found_label', item.label));
  } else {
    console.log(Lang('info.item_not_found', itemName));
  }
}, false);

RegisterCommand('testjob', () => {
  const jobName = 'lspd';
  const job = GetJob(jobName);

  if (job) {
    console.log(Lang('info.job_found_label', job.label)); // Let's add this key
    console.log(Lang('info.job_grade_label', job.grades[0].name)); // And this one
  } else {
    console.log(Lang('info.job_not_found', jobName));
  }
}, false);

RegisterCommand('use1', () => {
  UseItem(1);
}, false);

RegisterCommand('use2', () => {
  UseItem(2);
}, false);

const sessionTick = setTick(() => {
  // Wait until the network session is fully active
  if (NetworkIsSessionStarted()) {
    // Stop this tick loop
    clearTick(sessionTick);

    console.log("[Framework] Session started. Requesting characters...");

    // Put the game into the "limbo" state for character selection
    NetworkStartSoloTutorialSession();

    // Now, tell the server we are ready for the character list
    emitNet('Framework:server:requestCharacters');
  }
});

// Handle NUI callbacks
RegisterNuiCallback('exit', (data: any, cb: (data: any) => void) => {
  console.log('NUI closed');
  SetNuiFocus(false, false);
  SetNuiFocusKeepInput(false);
  cb(1);
});

// You can add client-side loops here
setTick(() => {
  if (Core.isLoaded) {

  }
});

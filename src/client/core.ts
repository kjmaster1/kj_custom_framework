import {PlayerData} from "../common";
import lib from "@communityox/ox_lib/client";
import {destroyCharacterSelectionCam} from "./charselect";
import {Delay} from "@nativewrappers/fivem";

async function loadDefaultModel() {
  const model = 'mp_m_freemode_01';
  RequestModel(model);
  while (!HasModelLoaded(model)) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for model to load
  }
  return model;
}

class ClientCore {
  public playerData: PlayerData | null = null;
  public isLoaded: boolean = false;

  constructor() {
    console.log("[Framework] Client Core Initialized");
    this.init();
  }

  public getPlayerData(): PlayerData | null {
    return this.playerData;
  }

  private init() {
    // Register the event to receive data from the server
    onNet('Framework:client:setPlayerData', async (data: PlayerData) => {
      this.playerData = data;
      this.isLoaded = true;
      console.log('[Framework] Player data received and set.');

      lib.hideContext(false);
      lib.closeInputDialog();

      // Clean up the custom camera
      destroyCharacterSelectionCam();
      DoScreenFadeOut(500);
      await Delay(500)

      if (data.isNew) {
        console.log('[Framework] New character, setting default model.');
        const model = await loadDefaultModel();
        SetPlayerModel(PlayerId(), model);
        SetModelAsNoLongerNeeded(model);

        // This is where you would trigger your clothing UI
        // e.g., exports['illenium-appearance']?.openMenu()
        // For now, we just spawn.
      }

      NetworkEndTutorialSession();

      while (NetworkIsInTutorialSession()) {
        await Delay(0);
      }

      console.log("[Framework] Tutorial session ended. Spawning player.");
      exports.spawnmanager.spawnPlayer();

      const ped = PlayerPedId();
      SetEntityVisible(ped, true, true);
      FreezeEntityPosition(ped, false);

      DoScreenFadeIn(500);

      // We can now trigger other resources to load
      emit('Framework:client:playerLoaded');
    });
  }
}

export const Core = new ClientCore();

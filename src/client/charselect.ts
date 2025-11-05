import lib from '@communityox/ox_lib/client';
import {Character} from '../common';

let charCam: number = 0;
// A simple, static location for the character select screen
const pedLocation = { x: 402.8, y: -996.4, z: -99.0, w: 180.0 };
const camLocation = { x: 402.8, y: -997.4, z: -98.5 };

// This event is now triggered by the server *after* we request it
onNet('Framework:client:showCharSelect', (characters: Character[]) => {
  console.log('[Framework] Received characters, setting up scene.');

  // Shut down the default loading screen
  ShutdownLoadingScreenNui();
  DoScreenFadeIn(500);

  // --- QBox Style Camera Setup ---
  const ped = PlayerPedId();

  // Move the ped to our "limbo" spot
  SetEntityCoords(ped, pedLocation.x, pedLocation.y, pedLocation.z, false, false, false, false);
  SetEntityHeading(ped, pedLocation.w);
  FreezeEntityPosition(ped, true);

  // Create and activate a camera
  charCam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', camLocation.x, camLocation.y, camLocation.z, 0.0, 0.0, 0.0, 50.0, false, 0);
  PointCamAtCoord(charCam, pedLocation.x, pedLocation.y, pedLocation.z + 0.5);
  SetCamActive(charCam, true);
  RenderScriptCams(true, false, 0, true, true);
  // --- End Camera Setup ---

  showCharacterSelection(characters);
});

function showCharacterSelection(characters: Character[]) {
  // Use ox_lib context menu [cite: 2083]
  lib.registerContext({
    id: 'char_select',
    title: 'Select Your Character',
    options: [
      // Map each character to a button
      ...characters.map(char => ({
        title: char.name,
        description: `Citizen ID: ${char.citizenid}`,
        icon: 'user',
        onSelect: () => {
          // Tell the server which character we want to play
          emitNet('Framework:server:selectCharacter', char.citizenid);
        },
      })),
      // Add a "Create New" button
      {
        title: 'Create New Character',
        icon: 'plus',
        onSelect: () => {
          showCharacterCreation().catch((err: Error) => {console.error(err)});
        },
      },
    ],
  });
  lib.showContext('char_select');
}

async function showCharacterCreation() {
  // Use ox_lib input dialog [cite: 2131]
  const input = await lib.inputDialog('Create Character', [
    { type: 'input', label: 'Full Name', placeholder: 'John Doe', required: true },
    // TODO: Add inputs for date of birth, gender, etc.
  ], {allowCancel: true});

  if (input) {
    const fullName = input[0] as string;
    // Tell the server to create this character
    emitNet('Framework:server:createCharacter', { name: fullName });
  }
}

// We need a function to clean up the camera
export function destroyCharacterSelectionCam() {
  if (charCam !== 0) {
    RenderScriptCams(false, false, 0, true, true);
    DestroyCam(charCam, false);
    charCam = 0;
  }
}

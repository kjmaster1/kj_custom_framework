import {useEffect, useState} from 'react';
import {isEnvBrowser} from './utils/misc';
import {useNuiEvent} from './hooks/useNuiEvent';
import {fetchNui} from './utils/fetchNui';
import {ItemDefinition, ItemSlot, NuiInventory} from "./types";
import {InventorySlot} from "./components/InventorySlot";
import {useItemDefinitions} from "./context/ItemDefinitionsContext";
import {GlobalTooltip} from "./components/GlobalTooltip";
import {useTooltip} from "./context/TooltipContext";
import {useContextMenu} from "./context/ContextMenuContext";
import {ContextMenu} from "./components/ContextMenu";
import {DragPreview} from "./components/DragPreview";


if (isEnvBrowser()) {
  const mockItems: Record<number, ItemSlot> = {
    1: {name: 'water_bottle', quantity: 5},
    5: {name: 'lockpick', quantity: 10, metadata: {quality: 80}},
  };

  const mockPlayerInv: NuiInventory = {
    id: 'player-12345',
    label: 'Player Inventory',
    slots: 40,
    maxWeight: 100000,
    currentWeight: 3500,
    items: mockItems,
  };

  const mockTrunkInv: NuiInventory = {
    id: 'trunk-ABCD-1234', // <-- Other ID
    label: 'Vehicle Trunk',
    slots: 20,
    maxWeight: 50000,
    currentWeight: 0,
    items: {},
  };

  // Use a timeout to simulate receiving the event
  setTimeout(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          action: 'updateInventory',
          data: mockPlayerInv,
        },
      })
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          action: 'updateInventory',
          data: mockTrunkInv
        },
      })
    );
  }, 100);


  const mockDefinitions: Record<string, ItemDefinition> = {
    water_bottle: {
      name: "water_bottle",
      label: "Water Bottle",
      weight: 500,
      type: "item",
      image: "water_bottle.png",
      unique: false,
      useable: true,
      consumable: true,
      description: "Keeps you hydrated."
    },

    lockpick: {
      name: "lockpick",
      label: "Lockpick",
      weight: 100,
      type: "item",
      image: "lockpick.png",
      unique: false,
      useable: true,
      consumable: false,
      description: "Might open a lock... or break."
    },
  };

  // Simulate receiving definitions
  setTimeout(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          action: 'setDefinitions',
          data: mockDefinitions,
        },
      })
    );
  }, 100);
}

function App() {
  const [visible, setVisible] = useState(isEnvBrowser());
  const [leftInventory, setLeftInventory] = useState<NuiInventory | null>(null);
  const [rightInventory, setRightInventory] = useState<NuiInventory | null>(null);

  const {setDefinitions} = useItemDefinitions();
  const {hideTooltip} = useTooltip();
  const {hideContextMenu} = useContextMenu();

  // Listen for visibility changes
  useNuiEvent('setVisible', (data: boolean) => {
    setVisible(data);
  });

  // Listen for item definitions
  useNuiEvent<Record<string, ItemDefinition>>('setDefinitions', (data) => {
    console.log("setDefinitions", data);
    setDefinitions(data);
  });

  // Listen for inventory data
  useNuiEvent<NuiInventory>('updateInventory', (data) => {
    console.log("updateInventory", data);

    // Simple logic: player inventory starts with 'player-'
    // Everything else is a 'right' inventory.
    if (data.id.startsWith('player-')) {
      setLeftInventory(data);
    } else {
      setRightInventory(data);
    }
  });

  useNuiEvent<void>('closeRightInventory', () => {
    setRightInventory(null);
  });

  // Handle closing the UI
  function handleClose() {
    console.log("close");
    hideContextMenu();
    hideTooltip();
    setVisible(false);
    setRightInventory(null);
    void fetchNui('exit'); // Tell the client we've closed the UI
  }

  // Tell the client we are loaded
  useEffect(() => {
    // This runs only once when the App component mounts
    if (!isEnvBrowser()) {
      fetchNui('uiLoaded').catch(console.error);
    }
  }, []);

  useEffect(() => {
    // Only run this when the UI is visible
    if (!visible) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the listener
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]); // Re-run the effect when 'visible' changes


  const leftSlotsToRender = [];
  if (leftInventory) {
    for (let i = 1; i <= leftInventory.slots; i++) {
      const item = leftInventory.items[i] || null;
      leftSlotsToRender.push({ slot: i, item: item });
    }
  }

  const rightSlotsToRender = [];
  if (rightInventory) {
    for (let i = 1; i <= rightInventory.slots; i++) {
      const item = rightInventory.items[i] || null;
      rightSlotsToRender.push({ slot: i, item: item });
    }
  }

  return (
    <>
      <GlobalTooltip />
      <ContextMenu />
      <DragPreview />

      {/* Only show if UI is visible AND player inv is loaded */}
      {visible && leftInventory && (
        <div className="inventory-ui-wrapper">

          {/* --- LEFT (PLAYER) INVENTORY --- */}
          <div className="inventory-container" id="player-inventory">
            <div className="inventory-header">
              <h3>{leftInventory.label}</h3>
              <button type='button' onClick={handleClose}>Close [ESC]</button>
            </div>
            <div className="inventory-info">
              <p>Weight: {(leftInventory.currentWeight / 1000).toFixed(2)} kg / {(leftInventory.maxWeight / 1000).toFixed(2)} kg</p>
              <p>Slots: {Object.keys(leftInventory.items).length} / {leftInventory.slots}</p>
            </div>
            <div className="inventory-grid">
              {leftSlotsToRender.map((slotData) => (
                <InventorySlot
                  key={slotData.slot}
                  slotNumber={slotData.slot}
                  item={slotData.item}
                  inventoryId={leftInventory.id}
                />
              ))}
            </div>
          </div>

          {/* --- RIGHT (OTHER) INVENTORY --- */}
          {/* Only render if rightInventory is not null */}
          {rightInventory && (
            <div className="inventory-container" id="other-inventory">
              <div className="inventory-header">
                <h3>{rightInventory.label}</h3>
                {/* This button *only* closes the right inv */}
                <button type='button' onClick={() => {
                  setRightInventory(null);
                  fetchNui('closeRightInventory').catch(console.error);
                }}>Close</button>
              </div>
              <div className="inventory-info">
                <p>Weight: {(rightInventory.currentWeight / 1000).toFixed(2)} kg / {(rightInventory.maxWeight / 1000).toFixed(2)} kg</p>
                <p>Slots: {Object.keys(rightInventory.items).length} / {rightInventory.slots}</p>
              </div>
              <div className="inventory-grid">
                {rightSlotsToRender.map((slotData) => (
                  <InventorySlot
                    key={slotData.slot}
                    slotNumber={slotData.slot}
                    item={slotData.item}
                    inventoryId={rightInventory.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;

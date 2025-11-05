import {useEffect, useState} from 'react';
import {isEnvBrowser} from './utils/misc';
import {useNuiEvent} from './hooks/useNuiEvent';
import {fetchNui} from './utils/fetchNui';
import {ItemDefinition, ItemSlot, NuiInventory} from "./types";
import {InventorySlot} from "./components/InventorySlot";
import {useItemDefinitions} from "./context/ItemDefinitionsContext";


if (isEnvBrowser()) {
  const mockItems: Record<number, ItemSlot> = {
    1: {name: 'water_bottle', quantity: 5},
    5: {name: 'lockpick', quantity: 10, metadata: {quality: 80}},
  };

  const mockInv: NuiInventory = {
    id: 'player-12345',
    label: 'Player Inventory',
    slots: 40,
    maxWeight: 100000,
    currentWeight: 12000,
    items: mockItems,
  };

  // Use a timeout to simulate receiving the event
  setTimeout(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          action: 'updateInventory',
          data: mockInv,
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
  const [inventory, setInventory] = useState<NuiInventory | null>(null);

  // Get the setDefinitions function from our context
  const { setDefinitions } = useItemDefinitions();

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
    setInventory(data);
  });

  // Handle closing the UI
  function handleClose() {
    console.log("close");
    setVisible(false);
    void fetchNui('exit'); // This tells the client we've closed the UI
    // We need to handle this on the client-side to remove focus
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

  console.log(visible);
  console.log(inventory);


  const slotsToRender = [];
  if (inventory) {
    for (let i = 1; i <= inventory.slots; i++) {
      const item = inventory.items[i] || null; // Get item for slot `i`, or null if empty
      slotsToRender.push({
        slot: i,
        item: item,
      });
    }
  }


  return (
    <>
      {visible && inventory && (
        // Use a wrapper for the whole UI
        <div className="inventory-ui-wrapper">
          <div className="inventory-container">
            {/* Header */}
            <div className="inventory-header">
              <h3>{inventory.label}</h3>
              <button type='button' onClick={handleClose}>Close [ESC]</button>
            </div>

            {/* Info */}
            <div className="inventory-info">
              <p>Weight: {inventory.currentWeight} / {inventory.maxWeight}</p>
              <p>Slots: {Object.keys(inventory.items).length} / {inventory.slots}</p>
            </div>

            {/* Item Grid */}
            <div className="inventory-grid">
              {slotsToRender.map((slotData) => (
                <InventorySlot
                  key={slotData.slot}
                  slotNumber={slotData.slot}
                  item={slotData.item}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

import {useEffect, useState} from 'react';
import {isEnvBrowser} from './utils/misc';
import {useNuiEvent} from './hooks/useNuiEvent';
import {fetchNui} from './utils/fetchNui';
import {ItemSlot, NuiInventory} from "./types";


if (isEnvBrowser()) {
  const mockItems: Record<number, ItemSlot> = {
    1: {name: 'water_bottle', quantity: 5},
    2: {name: 'sandwich', quantity: 2},
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
}

function App() {
  const [visible, setVisible] = useState(isEnvBrowser());
  const [inventory, setInventory] = useState<NuiInventory | null>(null);

  // Listen for visibility changes
  useNuiEvent('setVisible', (data: boolean) => {
    setVisible(data);
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

  return (
    <>
      {visible && inventory && (
        <div style={{padding: '20px', background: 'rgba(0, 0, 0, 0.8)', color: 'white', fontFamily: 'sans-serif'}}>
          <div style={{border: '1px solid white', padding: '10px', minWidth: '300px'}}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #555',
              paddingBottom: '10px'
            }}>
              <h3>{inventory.label}</h3>
              <button type='button' onClick={handleClose}>Close [ESC]</button>
            </div>

            {/* Info */}
            <div style={{padding: '10px 0'}}>
              <p>Weight: {inventory.currentWeight} / {inventory.maxWeight}</p>
              <p>Slots Used: {Object.keys(inventory.items).length} / {inventory.slots}</p>
            </div>

            {/* Item List (Simple) */}
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              <h4>Items:</h4>
              <pre>
                {/* We'll just dump the JSON for now. Next step is to make a grid! */}
                {JSON.stringify(inventory.items, null, 2)}
              </pre>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default App;

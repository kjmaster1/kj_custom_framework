import React from 'react';
import { ItemSlot } from '../types';

interface Props {
  slotNumber: number;
  item: ItemSlot | null;
}

// A simple component to render one slot
export const InventorySlot: React.FC<Props> = ({ slotNumber, item }) => {
  if (item) {
    // This slot has an item
    return (
      <div className="inventory-slot with-item" data-slot-id={slotNumber}>
        {/* Later, you can add a background-image here for the item */}
        <div className="item-name">{item.name}</div>
        <div className="item-quantity">{item.quantity}</div>
        {item.metadata?.quality && (
          <div className="item-quality-bar">
            <div style={{ width: `${item.metadata.quality}%` }} />
          </div>
        )}
        <div className="slot-number">{slotNumber}</div>
      </div>
    );
  }

  // This is an empty slot
  return (
    <div className="inventory-slot empty" data-slot-id={slotNumber}>
      <div className="slot-number">{slotNumber}</div>
    </div>
  );
};

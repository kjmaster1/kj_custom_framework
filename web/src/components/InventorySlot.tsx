import React, {useState} from 'react';
import { ItemSlot } from '../types';
import {useItemDefinitions} from "../context/ItemDefinitionsContext";

interface Props {
  slotNumber: number;
  item: ItemSlot | null;
}

// A simple component to render one slot
export const InventorySlot: React.FC<Props> = ({ slotNumber, item }) => {

  // Get the definitions dictionary from our context
  const { definitions } = useItemDefinitions();
  const [isTooltipVisible, setTooltipVisible] = useState(false);

  // Get the static definition for this item
  // If item exists, find its definition. If not, definition is null.
  const itemDefinition = item ? definitions[item.name] : null;

  // --- Tooltip Handlers ---

  // Add a simple hover-based tooltip
  const handleMouseEnter = () => {
    if (itemDefinition) {
      setTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

  if (item && itemDefinition) {
    // This slot has an item AND we found its definition
    return (
      <div
        className="inventory-slot with-item"
        data-slot-id={slotNumber}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* We'll add the item-name as a background-image later */}
        {/* <div className="item-image" style={{ backgroundImage: `url(./images/${item.name}.png)` }} /> */}

        {/* Use the LABEL from the definition */}
        <div className="item-name">{itemDefinition.label}</div>

        <div className="item-quantity">{item.quantity}</div>
        {item.metadata?.quality && (
          <div className="item-quality-bar">
            <div style={{ width: `${item.metadata.quality}%` }} />
          </div>
        )}
        <div className="slot-number">{slotNumber}</div>

        {/* --- Simple Tooltip --- */}
        {isTooltipVisible && (
          <div className="item-tooltip">
            <h4>{itemDefinition.label}</h4>
            <p>{itemDefinition.description}</p>
            <p>Weight: {itemDefinition.weight}</p>
          </div>
        )}
      </div>
    );
  }

  // This is an empty slot or an item with no definition
  return (
    <div className="inventory-slot empty" data-slot-id={slotNumber}>
      <div className="slot-number">{slotNumber}</div>
    </div>
  );
};

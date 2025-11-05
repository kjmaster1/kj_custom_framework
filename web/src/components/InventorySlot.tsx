import React from 'react'; // Removed useState
import { ItemSlot } from '../types';
import { useItemDefinitions } from '../context/ItemDefinitionsContext';
import { useTooltip } from '../context/TooltipContext';

interface Props {
  slotNumber: number;
  item: ItemSlot | null;
}

export const InventorySlot: React.FC<Props> = ({ slotNumber, item }) => {
  const { definitions } = useItemDefinitions();

  // --- Get functions from the global tooltip context ---
  const { showTooltip, hideTooltip } = useTooltip();

  const itemDefinition = item ? definitions[item.name] : null;

  // --- Tooltip Handlers ---
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (itemDefinition && item) {
      // Show the global tooltip with item data and mouse coordinates
      showTooltip(item, itemDefinition, { x: e.clientX, y: e.clientY });
    }
  };

  // Move the tooltip with the mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (itemDefinition && item) {
      showTooltip(item, itemDefinition, { x: e.clientX, y: e.clientY });
    }
  }

  const handleMouseLeave = () => {
    // Hide the global tooltip
    hideTooltip();
  };

  if (item && itemDefinition) {
    return (
      <div
        className="inventory-slot with-item"
        data-slot-id={slotNumber}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="slot-content-wrapper">
          <div className="slot-header">
            <div className="slot-number">{slotNumber}</div>
            <div className="item-quantity">{item.quantity}</div>
          </div>
          <div className="slot-footer">
            <div className="item-name">{itemDefinition.label}</div>
            {item.metadata?.quality && (
              <div className="item-quality-bar">
                <div style={{ width: `${item.metadata.quality}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // This is an empty slot
  return (
    <div className="inventory-slot empty" data-slot-id={slotNumber}>
      {/* Make sure empty slots also have the wrapper for consistent layout */}
      <div className="slot-content-wrapper">
        <div className="slot-header">
          <div className="slot-number">{slotNumber}</div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { DragItem, ItemTypes } from '../types'; // Import your custom DragItem type

// Define the props we'll collect from the drag layer
interface CollectedProps {
  item: DragItem | null;
  itemType: string | symbol | null;
  isDragging: boolean;
  currentOffset: XYCoord | null;
}

// Define the styles for the preview container
const previewContainerStyles: React.CSSProperties = {
  // This is the magic:
  position: 'fixed',        // Use 'fixed' to position relative to the viewport
  pointerEvents: 'none',    // Let mouse events pass through to what's underneath
  zIndex: 9999,             // Ensure it's on top of everything
  top: 0,
  left: 0,
  // Set width and height in the item style itself
};

export const DragPreview: React.FC = () => {

  // Use the useDragLayer hook to get drag state
  const { item, itemType, isDragging, currentOffset } = useDragLayer<CollectedProps>(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getClientOffset(), // Get the cursor's client (viewport) offset
    })
  );

  // Don't render anything if not dragging, or no offset, or not our item type
  if (!isDragging || !currentOffset || itemType !== ItemTypes.INVENTORY_SLOT || !item) {
    return null;
  }

  // --- Get width and height from the item ---
  const { item: itemData, itemDefinition, width, height } = item;

  // Get the image URL from the item's definition
  // Safely assert item.itemDefinition exists because we added it in InventorySlot.tsx
  const imageUrl = (itemDefinition && itemDefinition.image)
    ? `./images/${itemDefinition.image}`
    : 'none';

  // Create the dynamic styles for the item itself
  const itemStyles: React.CSSProperties = {
    // This style will be applied to the div that moves
    transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
    width: `${width}px`,   // <-- Apply the dynamic width
    height: `${height}px`, // <-- Apply the dynamic height
  };

  // Render the preview
  return (
    <div style={previewContainerStyles}>
      <div
        className="item-drag-preview inventory-slot with-item"
        style={{
          ...itemStyles,
          backgroundImage: `url(${imageUrl})`,
        }}
      >
        <div className="slot-content-wrapper">
          <div className="slot-header">
            {/* Empty slot number div to push quantity to same top right corner as in a slot */}
            <div className="slot-number" />
            <div className="item-quantity">{itemData.quantity}</div>
          </div>
          <div className="slot-footer">
            <div className="item-name">{itemDefinition.label}</div>
            {itemData.metadata?.quality && (
              <div className="item-quality-bar">
                <div style={{ width: `${itemData.metadata.quality}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react'; // Removed useState
import {DragItem, ItemSlot, ItemTypes} from '../types';
import {useItemDefinitions} from '../context/ItemDefinitionsContext';
import {useTooltip} from '../context/TooltipContext';
import {useDrag, useDrop} from 'react-dnd';
import {fetchNui} from "../utils/fetchNui";
import {useContextMenu} from "../context/ContextMenuContext";

interface Props {
  slotNumber: number;
  item: ItemSlot | null;
  inventoryId: string;
}

export const InventorySlot: React.FC<Props> = ({slotNumber, item, inventoryId}) => {
  const {definitions} = useItemDefinitions();

  // --- Get functions from the global tooltip context ---
  const {showTooltip, hideTooltip} = useTooltip();

  const {showContextMenu} = useContextMenu();

  const itemDefinition = item ? definitions[item.name] : null;

  // --- Generate the image URL ---
  // Use the 'image' field from ItemDefinition
  const imageUrl = (itemDefinition && itemDefinition.image)
    ? `./images/${itemDefinition.image}` // Vite will handle this path
    : 'none';

  // --- Implement useDrag ---
  // This makes the component draggable *if* it has an item.
  const [{isDragging}, drag] = useDrag(() => ({
    type: ItemTypes.INVENTORY_SLOT,
    // The 'item' is the data payload for the drag operation
    item: (): DragItem => {
      // We must return all data needed to identify the item
      return {type: ItemTypes.INVENTORY_SLOT, inventoryId, slotNumber, item: item!, itemDefinition: itemDefinition!}
    },
    canDrag: !!item, // You can only drag if an item exists
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, itemDefinition, inventoryId, slotNumber]); // Dependencies

  // --- 4. Implement useDrop ---
  // This makes the component a drop target
  const [{isOver}, drop] = useDrop(() => ({
    accept: ItemTypes.INVENTORY_SLOT, // It only accepts our item type

    // This function runs when a compatible item is dropped
    drop: (draggedItem: DragItem) => {
      // Prevent dropping an item onto itself
      if (draggedItem.slotNumber === slotNumber && draggedItem.inventoryId === inventoryId) {
        return;
      }

      // --- THIS IS THE CORE LOGIC ---
      // We send the 'move' action to the client script.
      // The client script (and server) are the source of truth.
      // We wait for the 'updateInventory' NUI message to
      // reflect the change, rather than changing React state directly.
      fetchNui('moveItem', {
        from: {
          inventory: draggedItem.inventoryId,
          slot: draggedItem.slotNumber,
        },
        to: {
          inventory: inventoryId,
          slot: slotNumber,
        },
        // You can add more data here, like quantity for splitting
      }).catch(console.error);

      // We've dropped, so hide the tooltip
      hideTooltip();
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(), // True if a draggable item is over this slot
    }),
  }), [inventoryId, slotNumber]); // Dependencies

  // --- Combine Refs ---
  // Need to attach *both* the drag and drop refs to div
  const combinedRef = (node: HTMLDivElement) => drag(drop(node));

  // --- Tooltip Handlers ---
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (itemDefinition && item) {
      // Show the global tooltip with item data and mouse coordinates
      showTooltip(item, itemDefinition, {x: e.clientX, y: e.clientY});
    }
  };

  // Move the tooltip with the mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (itemDefinition && item) {
      showTooltip(item, itemDefinition, {x: e.clientX, y: e.clientY});
    }
  }

  const handleMouseLeave = () => {
    // Hide the global tooltip
    hideTooltip();
  };

  // --- Add Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent) => {
    // Prevent the default browser right-click menu
    e.preventDefault();

    // Can't open on empty slots
    if (item && itemDefinition) {
      hideTooltip(); // Hide tooltip when opening context menu
      showContextMenu(
        {item, definition: itemDefinition, slotNumber, inventoryId},
        {x: e.clientX, y: e.clientY}
      );
    }
  };

  if (item && itemDefinition) {
    return (
      <div
        ref={combinedRef}
        className="inventory-slot with-item"
        data-slot-id={slotNumber}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{
          backgroundImage: `url(${imageUrl})`,
          // --- Add visual feedback on dragging ---
          opacity: isDragging ? 0.4 : 1,
        }}
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
                <div style={{width: `${item.metadata.quality}%`}}/>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // This is an empty slot
  return (
    <div
      ref={drop}
      className={`inventory-slot empty ${isOver ? 'over' : ''}`}
      data-slot-id={slotNumber}
    >
      {/* Make sure empty slots also have the wrapper for consistent layout */}
      <div className="slot-content-wrapper">
        <div className="slot-header">
          <div className="slot-number">{slotNumber}</div>
        </div>
      </div>
    </div>
  );
};

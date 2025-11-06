import React, { useEffect, useRef } from 'react';
import { useContextMenu } from '../context/ContextMenuContext';
import { fetchNui } from '../utils/fetchNui';

export const ContextMenu: React.FC = () => {
  const { contextMenu, hideContextMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const { visible, position, data } = contextMenu;

  // Effect to handle clicking *outside* the menu to close it
  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };
    // Use 'mousedown' to catch click before it bubbles
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, hideContextMenu]);

  if (!visible || !data) {
    return null;
  }

  // --- NUI Action Handler ---
  const handleAction = (action: string) => {
    fetchNui('contextAction', {
      action: action,
      inventoryId: data.inventoryId,
      slot: data.slotNumber,
      item: data.item,
    }).catch(console.error);
    hideContextMenu();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu" // Style this in index.css
      style={{
        position: 'fixed', // Use 'fixed' to position relative to viewport
        top: position.y,
        left: position.x,
        zIndex: 1000,
      }}
    >
      <ul className="context-menu-list">
        {/* Only show 'Use' if item is useable */}
        {data.definition.useable && (
          <li onClick={() => handleAction('use')}>Use</li>
        )}
        <li onClick={() => handleAction('give')}>Give</li>
        <li onClick={() => handleAction('drop')}>Drop</li>
      </ul>
    </div>
  );
};

import React from 'react';
import { useTooltip } from '../context/TooltipContext';

export const GlobalTooltip: React.FC = () => {
  const { item, coords } = useTooltip();

  if (!item || !coords) {
    return null;
  }

  // Render the tooltip at a fixed position based on mouse coords
  // Add a small offset (e.g., 15px) so it doesn't flicker under the cursor
  return (
    <div
      className="item-tooltip"
      style={{
        position: 'fixed',
        top: `${coords.y + 15}px`,
        left: `${coords.x + 15}px`,
      }}
    >
      <h4>{item.label}</h4>
      <p>{item.description}</p>
      <p>Weight: {(item.weight / 1000).toFixed(2)} kg</p>
    </div>
  );
};

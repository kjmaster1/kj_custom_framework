export interface Item {
  // Unique ID, e.g., 'water_bottle'
  name: string;
  // Display Name, e.g., 'Water Bottle'
  label: string;
  // Weight in grams
  weight: number;
  // Item type
  type: 'item' | 'weapon' | 'account';
  // Image file name (e.g., 'water_bottle.png')
  image: string;
  // Is it stackable?
  unique: boolean;
  // Can it be used?
  useable: boolean;
  // Is 1 of the item consumed on use?
  consumable: boolean;
  // We can add metadata, weapon data, etc. here later
  description: string;

  maxStack?: number;
}

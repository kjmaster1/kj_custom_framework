import {ItemSlot} from '../common';
import {GetItem} from './configLoader';

type InventoryItemMap = Map<number, ItemSlot>; // Map<slot, ItemSlot>

/**
 * Represents a single, stateful inventory instance.
 * This class manages its own items, weight, and slots.
 */
export class Inventory {
    public id: string;
    public label: string;
    public slots: number;
    public maxWeight: number;
    public items: InventoryItemMap; // The state of this inventory
    public currentWeight: number;

    // A callback to notify the manager when this inventory changes
    private onUpdate: (inv: Inventory) => void;

    constructor(
        id: string,
        label: string,
        slots: number,
        maxWeight: number,
        items: InventoryItemMap,
        onUpdateCallback: (inv: Inventory) => void
    ) {
        this.id = id;
        this.label = label;
        this.slots = slots;
        this.maxWeight = maxWeight;
        this.items = items;
        this.onUpdate = onUpdateCallback;
        this.currentWeight = this.recalculateWeight();
    }

    /**
     * Recalculates the total weight of the inventory.
     * @returns The total weight.
     */
    public recalculateWeight(): number {
        let newWeight = 0;
        for (const [slot, itemSlot] of this.items.entries()) {
            const itemConfig = GetItem(itemSlot.name);
            if (itemConfig) {
                newWeight += itemConfig.weight * itemSlot.quantity;
            } else {
                console.warn(`[Inventory] Config for item ${itemSlot.name} not found!`);
                this.items.delete(slot); // Clean up bad item
            }
        }
        this.currentWeight = newWeight;
        return newWeight;
    }

    /**
     * Gets the item in a specific slot.
     */
    public getItem(slot: number): ItemSlot | undefined {
        return this.items.get(slot);
    }

    /**
     * Directly sets or removes an item from a slot.
     * This is the primary internal method for item manipulation.
     * @param slot The slot number (1-based).
     * @param item The ItemSlot to place, or null to clear.
     */
    public setSlot(slot: number, item: ItemSlot | null): boolean {
        if (slot < 1 || slot > this.slots) {
            console.error(`[Inventory] Invalid slot: ${slot}`);
            return false;
        }

        if (item) {
            this.items.set(slot, item);
        } else {
            this.items.delete(slot);
        }

        this.recalculateWeight();
        this.onUpdate(this); // Trigger the update callback
        return true;
    }

    /**
     * Checks if a specific amount of an item can be added.
     * @returns True if it fits, false otherwise.
     */
    public canAddItem(itemName: string, quantity: number): boolean {
        const itemConfig = GetItem(itemName);
        if (!itemConfig) return false;

        const addedWeight = itemConfig.weight * quantity;
        if (this.currentWeight + addedWeight > this.maxWeight) {
            return false;
        }

        // Check for stacking
        const stackSlot = this.findStackableSlot(itemName);
        if (stackSlot) return true; // Can always stack

        // Check for empty slot
        const emptySlot = this.findEmptySlot();
        return emptySlot !== null;
    }

    /**
     * Tries to add an item to the inventory.
     * Will try to stack first, then find an empty slot.
     * @returns True if added, false if full or overweight.
     */
    public addItem(itemName: string, quantity: number, metadata?: Record<string, any>): boolean {
        const itemConfig = GetItem(itemName);
        if (!itemConfig) {
            console.error(`[Inventory] Tried to add non-existent item: ${itemName}`);
            return false;
        }

        if (!this.canAddItem(itemName, quantity)) {
            return false; // Overweight or no slots
        }

        // 1. Try to stack
        const stackSlotNum = this.findStackableSlot(itemName);
        if (stackSlotNum) {
            const itemSlot = this.items.get(stackSlotNum)!;
            itemSlot.quantity += quantity;
            this.setSlot(stackSlotNum, itemSlot); // Triggers update
            return true;
        }

        // 2. Find empty slot
        const emptySlot = this.findEmptySlot();
        if (emptySlot) {
            this.setSlot(emptySlot, {
                name: itemName,
                quantity: quantity,
                metadata: metadata || {},
            });
            return true;
        }

        return false; // Should be caught by canAddItem, but good failsafe
    }

    /**
     * Removes a specific quantity of an item from a given slot.
     * @param slot The slot to remove from.
     * @param quantity The amount to remove.
     * @returns True on success, false if not enough.
     */
    public removeItemFromSlot(slot: number, quantity: number): boolean {
        const itemSlot = this.items.get(slot);
        if (!itemSlot) {
            return false; // Slot is empty
        }

        if (itemSlot.quantity < quantity) {
            return false; // Not enough in this slot
        }

        if (itemSlot.quantity === quantity) {
            // Remove item entirely
            this.setSlot(slot, null);
        } else {
            // Just decrease quantity
            itemSlot.quantity -= quantity;
            this.setSlot(slot, itemSlot);
        }

        return true;
    }

    /**
     * Finds the first available empty slot.
     * @returns Slot number or null if full.
     */
    private findEmptySlot(): number | null {
        for (let i = 1; i <= this.slots; i++) {
            if (!this.items.has(i)) {
                return i;
            }
        }
        return null;
    }

    /**
     * Finds the first slot containing an item that can be stacked with.
     * @param itemName The name of the item to stack.
     * @returns Slot number or null if no stackable slot found.
     */
    private findStackableSlot(itemName: string): number | null {
        const itemConfig = GetItem(itemName);
        if (!itemConfig || itemConfig.unique) {
            return null;
        }

        for (const [slot, itemSlot] of this.items.entries()) {
            if (itemSlot.name === itemName) {
                // Here you would also check metadata if it affects stacking
                return slot;
            }
        }
        return null;
    }
}

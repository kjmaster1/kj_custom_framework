export interface Character {
    id: number; // Database row ID
    citizenid: string;
    name: string;
    // We'll add more preview data later (e.g., job, money)
}

/**
 * This interface defines the core data for a player
 * that is stored in the database and synchronized.
 */
export interface PlayerData {
    source: number;       // Server-side source ID
    license: string;      // Rockstar License
    citizenid: string;    // Unique character ID
    name: string;
    money: {
        cash: number;
        bank: number;
    };
    job: {
        id: string;
        label: string;
        grade: number;
    };
    isNew?: boolean;
    // We will add more here, like inventory, metadata, etc.
}

// We need to import the savePlayer function *only on the server*.
// We use a trick to make this file work on both client and server.
let savePlayer: (playerData: PlayerData) => Promise<boolean>;
if (IsDuplicityVersion()) {
    // We are on the server, so we can import the server-side db file
    savePlayer = require('../server/database').savePlayer;
}

/**
 * This defines the shape of our server-side Player object,
 * which will hold the PlayerData and other live game info.
 */
export class Player {
    public source: number;
    public data: PlayerData;

    constructor(playerData: PlayerData) {
        this.source = playerData.source;
        this.data = playerData;
    }


    // Example method:
    public addMoney(type: 'cash' | 'bank', amount: number) {
        if (amount < 0) return false; // Use a dedicated removeMoney for clarity
        this.data.money[type] += amount;
        // TODO: Emit an event to update the client UI
        return true;
    }

    public get(key: keyof PlayerData) {
        return this.data[key];
    }

    /**
     * Saves the player's current data to the database.
     * This is a server-only method.
     */
    public async save() {
        if (IsDuplicityVersion()) {
            try {
                await savePlayer(this.data);
                console.log(`[Framework] Saved data for ${this.data.name}`);
            } catch (e) {
                console.error(`[Framework] Failed to save player ${this.data.name}: ${e.message}`);
            }
        }
    }
}

/**
 * Represents a single item stack in an inventory slot.
 * This is the data that will be saved in the database.
 */
export interface ItemSlot {
    name: string; // The item ID (e.g., "water_bottle")
    quantity: number;
    metadata?: Record<string, any>; // For serial numbers, durability, etc.
}

export interface Inventory {
    id: string;
    label: string;
    slots: number;
    maxWeight: number;
    currentWeight: number;
    items: Map<number, ItemSlot>;
}

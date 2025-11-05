// We need to import the savePlayer function *only on the server*.
// We use a trick to make this file work on both client and server.
let savePlayer;
if (IsDuplicityVersion()) {
    // We are on the server, so we can import the server-side db file
    savePlayer = require('../server/database').savePlayer;
}
/**
 * This defines the shape of our server-side Player object,
 * which will hold the PlayerData and other live game info.
 */
export class Player {
    source;
    data;
    constructor(playerData) {
        this.source = playerData.source;
        this.data = playerData;
    }
    // Example method:
    addMoney(type, amount) {
        if (amount < 0)
            return false; // Use a dedicated removeMoney for clarity
        this.data.money[type] += amount;
        // TODO: Emit an event to update the client UI
        return true;
    }
    get(key) {
        return this.data[key];
    }
    /**
     * Saves the player's current data to the database.
     * This is a server-only method.
     */
    async save() {
        if (IsDuplicityVersion()) {
            try {
                await savePlayer(this.data);
                console.log(`[Framework] Saved data for ${this.data.name}`);
            }
            catch (e) {
                console.error(`[Framework] Failed to save player ${this.data.name}: ${e.message}`);
            }
        }
    }
}

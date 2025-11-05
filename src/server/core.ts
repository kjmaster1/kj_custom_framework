import {Player, PlayerData} from "../common/types";

class ServerCore {
  private players: Map<number, Player>; // Use a Map for O(1) lookups
  private playersByCitizenId: Map<string, Player>

  constructor() {
    this.players = new Map<number, Player>();
    this.playersByCitizenId = new Map<string, Player>();
    console.log("[Framework] Server Core Initialized");
    this.init();
  }

  private init() {
    // This is where we will register all our base event handlers
  }

  /**
   * Gets a Player object by their server source ID.
   * @param source The server source ID of the player
   * @returns The Player object or undefined
   */
  public getPlayer(source: number): Player | undefined {
    return this.players.get(source);
  }

  /**
   * Gets a Player object by their character's citizen ID.
   * @param citizenid The player's unique character ID
   * @returns The Player object or undefined
   */
  public getPlayerByCitizenId(citizenid: string): Player | undefined {
    return this.playersByCitizenId.get(citizenid);
  }

  /**
   * Loads a player into the core.
   * This will be called after a player connects and their data is fetched from the DB.
   */
  public loadPlayer(playerData: PlayerData): Player {
    const source = playerData.source;
    const player = new Player(playerData);

    this.players.set(source, player);
    this.playersByCitizenId.set(player.data.citizenid, player);

    console.log(`[Framework] Loaded player: ${player.data.name} (Source: ${source})`);

    // Send the player data to the client for them to use
    emitNet('Framework:client:setPlayerData', source, playerData);

    return player;
  }

  /**
   * Removes a player from the core and saves their data.
   * This MUST be async to allow the save() to complete.
   * @param source The server source ID of the player
   */
  public async removePlayer(source: number) {
    const player = this.players.get(source);

    if (player) {
      // Call our new save method
      await player.save();

      this.players.delete(source);
      this.playersByCitizenId.delete(player.data.citizenid);

      console.log(`[Framework] Removed player: ${player.data.name}`);
    }
  }
}

// Export a single, global instance of our ServerCore.
// This is the singleton pattern.
export const Core = new ServerCore();

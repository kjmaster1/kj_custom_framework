import {oxmysql as MySQL} from '@communityox/oxmysql';
import {Character, PlayerData} from '../common';

// Omit 'source' as it's runtime-only
type CharacterData = Omit<PlayerData, 'source'> & {account_id: number;};

/**
 * Gets or creates an account based on the player's license.
 * @param license The player's Rockstar license
 * @returns The account's database ID
 */
export async function getOrCreateAccount(license: string): Promise<number> {
    // Try to find the account
    const result = await MySQL.scalar(
        'SELECT id FROM accounts WHERE license = ?',
        [license]
    );

    if (result) {
        return result as number;
    }

    // If not found, create it
    return await MySQL.insert(
        'INSERT INTO accounts (license) VALUES (?)',
        [license]
    )
}

/**
 * Fetches all characters associated with an account ID.
 * @param accountId The account's unique ID
 * @returns An array of Character objects
 */
export async function getCharacters(accountId: number): Promise<Character[]> {
    const characters = await MySQL.query(
        'SELECT id, citizenid, name FROM characters WHERE account_id = ?',
        [accountId]
    );
    return characters as Character[];
}

/**
 * Fetches a single character's full data by their citizen ID.
 * @param citizenid The character's unique ID
 * @returns Full CharacterData or null
 */
export async function getCharacter(citizenid: string): Promise<CharacterData | null> {
    const result = await MySQL.single(
        'SELECT * FROM characters WHERE citizenid = ?',
        [citizenid]
    );

    if (result) {
        // Parse JSON data back into objects
        return {
            ...result,
            money: JSON.parse(<string>result.money),
            job: JSON.parse(<string>result.job),
        } as CharacterData;
    }
    return null;
}

/**
 * Creates a new character for a given account.
 * @param accountId The account's unique ID
 * @param name The new character's name
 * @returns The newly created CharacterData
 */
export async function createCharacter(accountId: number, name: string): Promise<CharacterData> {
    const citizenid = `U${Math.floor(Math.random() * 10000000 + 10000000)}`;
    const defaultMoney = { cash: 500, bank: 10000 };
    const defaultJob = { id: 'unemployed', label: 'Unemployed', grade: 0 };

    // We need the license from the account table to store in PlayerData
    // This is slightly redundant but saves us a JOIN query when loading
    const license: string = await MySQL.scalar('SELECT license FROM accounts WHERE id = ?', [accountId]);

    const newCharData: CharacterData = {
        account_id: accountId,
        license: license,
        citizenid: citizenid,
        name: name,
        money: defaultMoney,
        job: defaultJob,
    };

    await MySQL.insert(
        'INSERT INTO characters (account_id, citizenid, name, money, job, license) VALUES (?, ?, ?, ?, ?, ?)',
        [
            accountId,
            citizenid,
            name,
            JSON.stringify(defaultMoney),
            JSON.stringify(defaultJob),
            license, // We'll add license to the characters table for easier lookups
        ]
    );

    return newCharData;
}

/**
 * Saves a player's data to the database.
 * @param playerData The full PlayerData object
 */
export async function savePlayer(playerData: PlayerData): Promise<boolean> {
    const result = await MySQL.update(
        'UPDATE characters SET name = ?, money = ?, job = ? WHERE citizenid = ?',
        [
            playerData.name,
            JSON.stringify(playerData.money),
            JSON.stringify(playerData.job),
            playerData.citizenid,
        ]
    );

    return result > 0;
}

import {Guild, GuildMember, User} from "discord.js";
import {SimpleUser} from "../Typings/DatabaseTypes";
import {ParseUser} from "../Utils/Parsers";
import {Database} from "../Utils/Database";
import {client} from "../Client";
import {Log} from "../Utils/Log";

const INVALID_USER_IDS = new Set();

/**
 * Saves the given user to the database.
 * Returns the parsed version for convenience.
 */
export function SaveUser(user: User | SimpleUser): SimpleUser {
	const parsed = user instanceof User ? ParseUser(user) : user;

	Database.prepare(`
        INSERT INTO Users (id, username, bot, icon_hash)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET username = excluded.username, icon_hash = excluded.icon_hash
	`).run(
		parsed.id,
		parsed.username,
		parsed.bot,
		parsed.icon_hash
	);

	return parsed;
}

/**
 * Attempts to resolve a user ID to a user object in database, fetches otherwise.
 * Return `null` if user ID does not exist.
 */
export async function GetUser(id: string): Promise<SimpleUser | null> {
	if (INVALID_USER_IDS.has(id)) {
		return null;
	}

	const db_user = Database.prepare("SELECT * FROM Users WHERE id = ?").get(id) as SimpleUser;
	if (!db_user) {
		return null;
	}

	if (client.users.cache.has(id)) {
		const parsed = ParseUser(client.users.cache.get(id)!);
		return SaveUser(parsed);
	}

	try {
		const fetched = await client.users.fetch(id);
		const parsed = ParseUser(fetched);
		return SaveUser(parsed);
	} catch (error) {
		Log('ERROR', error);
		INVALID_USER_IDS.add(id);
		return null;
	}
}

/**
 * Evicts the user from database, will have to be fetched again
 */
export function DiscardUser(id: string) {
	if (INVALID_USER_IDS.has(id)) {
		return; // nothing to do
	}

	Database.prepare("DELETE FROM Users WHERE id = ?").run(id);
}

/**
 * Save a member (and it's internal user) to the database
 */
export function SaveMember(guild: Guild, member: GuildMember) {
	SaveUser(member.user);

	Database.prepare(`
		INSERT INTO Members (id, guild_id, joined_at)
		VALUES (?, ?, ?) ON CONFLICT (id, guild_id) DO NOTHING
	`).run(member.user.id, guild.id, ~~((member.joinedTimestamp ?? Date.now())/1000));
}
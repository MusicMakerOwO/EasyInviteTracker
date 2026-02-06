import {SimpleGuild} from "../Typings/DatabaseTypes";
import {Database} from "../Utils/Database";
import {client} from "../Client";
import {ParseGuild} from "../Utils/Parsers";
import {AnonymousGuild} from "discord.js";

const INVALID_GUILD_IDS = new Set();

/**
 * Saves the given guild to the database.
 * Returns the parsed version for convenience.
 */
export function SaveGuild(guild: AnonymousGuild | SimpleGuild): SimpleGuild {
	if (INVALID_GUILD_IDS.has(guild.id)) {
		throw new Error("Guild does not exist");
	}

	const parsed = guild instanceof AnonymousGuild ? ParseGuild(guild) : guild;

	Database.prepare(`
		INSERT INTO Guilds (id, name, icon_hash, vanity_code)
		VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET name = excluded.name, icon_hash = excluded.icon_hash, vanity_code = excluded.vanity_code
	`).run(
		parsed.id,
		parsed.name,
		parsed.icon_hash,
		parsed.vanity_code
	);

	return Database.prepare("SELECT * FROM Guilds WHERE id = ?").get(guild.id) as SimpleGuild;
}

/**
 * Attempts to resolve guild ID to a guild object in database, fetches otherwise.
 * Return `null` if guild does not exist.
 */
export async function GetGuild(id: string): Promise<SimpleGuild | null> {
	if (INVALID_GUILD_IDS.has(id)) {
		return null;
	}

	const db_guild = Database.prepare("SELECT * FROM Guilds WHERE id = ?").get(id) as SimpleGuild | undefined;
	if (db_guild) return db_guild;

	if (client.guilds.cache.has(id)) {
		const cached = client.guilds.cache.get(id)!;
		return SaveGuild(cached);
	}

	const fetched = await client.guilds.fetch(id).catch( () => null );
	if (!fetched) {
		INVALID_GUILD_IDS.add(id);
		return null;
	}

	return SaveGuild(fetched);
}

/**
 * Evicts the given guild from cache
 */
export async function DiscardGuild(id: string) {
	if (INVALID_GUILD_IDS.has(id)) {
		return; // nothing to do
	}

	Database.prepare("DELETE FROM Guilds WHERE id = ?").run(id);
}
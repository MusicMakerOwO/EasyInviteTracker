import {SimpleGuild, SimpleInvite} from "../Typings/DatabaseTypes";
import {Database} from "../Utils/Database";
import {client} from "../Client";
import {ParseInvite} from "../Utils/Parsers";
import {Guild, Invite} from "discord.js";
import {Log} from "../Utils/Log";
import {SaveGuild} from "./Guild";

const INVALID_INVITE_CODES = new Set();

/**
 * Saves the given invite to the database.
 * Returns the parsed version for convenience.
 */
export function SaveInvite(invite: Invite | SimpleInvite): SimpleInvite {
	if (INVALID_INVITE_CODES.has(invite.code)) {
		throw new Error("Invite is already expired");
	}

	const parsed = invite instanceof Invite ? ParseInvite(invite) : invite;

	Database.prepare(`
		INSERT INTO Invites (code, guild_id, channel_id, owner_id, uses, created_at, expires_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT (code) DO UPDATE SET
			uses = excluded.uses
	`).run(
		parsed.code,
		parsed.guild_id,
		parsed.channel_id,
		parsed.owner_id,
		parsed.uses,
		parsed.created_at,
		parsed.expires_at
	);

	return parsed;
}

/**
 * Attempts to resolve invite code to an invite object in database, fetches otherwise.
 * Return `null` if invite does not exist.
 */
export async function GetInvite(code: string): Promise<SimpleInvite | null> {
	if (INVALID_INVITE_CODES.has(code)) {
		return null;
	}

	const db_invite = Database.prepare("SELECT * FROM Invites WHERE code = ?").get(code) as SimpleInvite | undefined;
	if (db_invite) return db_invite;

	const vanity_guild = Database.prepare("SELECT * FROM Guilds WHERE vanity_code = ?").get(code) as SimpleGuild | undefined;
	if (vanity_guild) {
		return {
			code: code,
			guild_id: vanity_guild.id,
			channel_id: null,
			owner_id: null,
			uses: 0,
			created_at: ~~(Date.now()/1000),
			expires_at: null
		}
	}

	try {
		const fetched = await client.fetchInvite(code);
		if (fetched.guild) SaveGuild(fetched.guild);
		if (fetched.guild?.vanityURLCode === code) return {
			code: code,
			guild_id: fetched.guild.id,
			channel_id: fetched.channelId,
			owner_id: null,
			uses: 0,
			created_at: ~~(fetched.guild.createdTimestamp/1000),
			expires_at: null
		}
		return SaveInvite(fetched);
	} catch (error) {
		Log('ERROR', error);
		INVALID_INVITE_CODES.add(code);
		return null;
	}
}

/**
 * Evicts the given invite from cache
 */
export async function DiscardInvite(code: string) {
	if (INVALID_INVITE_CODES.has(code)) {
		return; // nothing to do
	}

	Database.prepare("DELETE FROM Invites WHERE code = ?").run(code);
}

export function GetAllInvites(guild: Guild): SimpleInvite[] {
	return Database.prepare("SELECT * FROM Invites WHERE guild_id = ?").all(guild.id) as SimpleInvite[];
}

import {Guild} from "discord.js";
import {Log} from "./Log";
import {Database} from "../Database";
import {SaveUser} from "../CRUD/Users";
import config from "../config";

const MAX_FETCH_SIZE = 1000;

export async function SyncMembersForGuild(guild: Guild): Promise<void> {
	if (config.DEV_MODE) return;

	if (guild.memberCount > MAX_FETCH_SIZE) {
		return Log('TRACE', `[!] Skipping guild "${guild.name}" for large member count : ${guild.memberCount}`);
	}

	const start = process.hrtime.bigint();

	const members = await guild.members.fetch({ limit: MAX_FETCH_SIZE });

	const MemberUpdateQuery = Database.prepare(`
		INSERT INTO Members (id, guild_id, joined_at) VALUES (?, ?, ?)
		ON CONFLICT (id, guild_id) DO UPDATE SET joined_at = excluded.joined_at, left_at = NULL
	`);
	const MemberLeftQuery = Database.prepare("UPDATE Members SET left_at = ? WHERE guild_id = ? AND id = ?");

	const now = ~~(Date.now()/1000);

	Database.transaction(() => {
		for (const member of members.values()) {
			SaveUser(member.user);
			MemberUpdateQuery.run(member.user.id, guild.id,
				member.joinedTimestamp
					? ~~(member.joinedTimestamp/1000)
					: now
			);
		}

		// an incomplete fetch can't tell us who is missing
		if (members.size < guild.memberCount) return;

		// anyone still marked as present but not in the guild left while we weren't looking
		const presentIDs = Database.prepare("SELECT id FROM Members WHERE guild_id = ? AND left_at IS NULL").pluck().all(guild.id) as string[];
		for (const id of presentIDs) {
			if (!members.has(id)) MemberLeftQuery.run(now, guild.id, id);
		}
	})();

	const end = process.hrtime.bigint();
	const duration = Number(end - start) / 1e6;

	Log('TRACE', `[~] Fetch ${members.size} members for ${guild.name} (${guild.id}) in ${~~duration}ms`);
}
import {Guild} from "discord.js";
import {Log} from "./Log";
import {Database} from "./Database";
import {SaveUser} from "../CRUD/Users";
import config from "../config";

const MAX_FETCH_SIZE = 1000;

export async function SyncMembersForGuild(guild: Guild) {
	if (config.DEV_MODE) return;

	if (guild.memberCount > MAX_FETCH_SIZE) {
		return Log('TRACE', `[!] Skipping guild "${guild.name}" for large member count : ${guild.memberCount}`);
	}

	const start = process.hrtime.bigint();

	const members = await guild.members.fetch({ limit: MAX_FETCH_SIZE });

	const MemberUpdateQuery = Database.prepare(`
		INSERT INTO Members (id, guild_id, joined_at) VALUES (?, ?, ?)
		ON CONFLICT (id, guild_id) DO NOTHING
	`);

	for (const member of members.values()) {
		SaveUser(member.user);
		MemberUpdateQuery.run(member.user.id, guild.id,
			member.joinedTimestamp
				? ~~(member.joinedTimestamp!/1000)
				: ~~(Date.now()/1000)
		);
	}

	const end = process.hrtime.bigint();
	const duration = Number(end - start) / 1e6;

	Log('TRACE', `[~] Fetch ${members.size} members for ${guild.name} (${guild.id}) in ${~~duration}ms`);
}
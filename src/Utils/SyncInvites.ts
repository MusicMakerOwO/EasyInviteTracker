import {Guild} from "discord.js";
import {Database} from "./Database";
import {FetchInvites} from "./Parsers/FetchInvites";
import {Log} from "./Log";
import {SendLog} from "./Logs/SendLog";
import {COLOR, MAX_INVITES_PER_GUILD} from "./Constants";

export async function SyncInvitesForGuild(guild: Guild) {
	const start = process.hrtime.bigint();

	Database.prepare(`DELETE FROM Invites WHERE guild_id = ?`).run(guild.id);
	Database.prepare("INSERT INTO Guilds (id, name) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET name = excluded.name").run(guild.id, guild.name);

	const invites = await FetchInvites(guild);
	if (invites.length >= MAX_INVITES_PER_GUILD) {
		const deletableInvites = invites.filter(invite => invite.uses === 0).length;

		SendLog(guild, {
			embeds: [{
				color: COLOR.ERROR,
				title: "Excess Invites Detected",
				description: `
This server was found to have __${invites.length}/${MAX_INVITES_PER_GUILD}__ invites.
__Invite logging is disabled to prevent Discord rate limits__.

It is advised to delete invites that have no uses.

You may also press the button below to do this automatically.
**This operation will delete ${deletableInvites} invites**`.trim()
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					style: 4,
					label: 'Purge Invites',
					custom_id: 'purge-invites',
				}]
			}]
		});
	}

	const InviteQuery = Database.prepare(`
		INSERT INTO Invites (code, guild_id, channel_id, owner_id, uses, created_at, expires_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT (code) DO UPDATE SET
			uses = excluded.uses
	`);

	for (const invite of invites) {
		try {
			InviteQuery.run(
				invite.code,
				invite.guild_id,
				invite.channel_id,
				invite.owner_id,
				invite.uses,
				invite.created_at,
				invite.expires_at
			);
		} catch (error) {
			Log('ERROR', `[~] Failed to insert invite ${invite.code} for ${guild.name} (${guild.id})`);
			Log('ERROR', error);
		}
	}

	Database.prepare("UPDATE Guilds SET vanity_code = ? WHERE id = ?").run(guild.vanityURLCode, guild.id);

	const end = process.hrtime.bigint();
	const duration = Number(end - start) / 1e6;

	Log('DEBUG', `[~] Synced ${invites.length} invites for ${guild.name} (${guild.id}) in ${~~duration}ms`);
}
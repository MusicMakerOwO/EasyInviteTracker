import {Guild} from "discord.js";
import {Database} from "../Database";
import {FetchInvites} from "./Parsers/FetchInvites";
import {Log} from "./Log";
import {ReplaceInvites} from "../CRUD/Invites";
import {SendLog} from "./Logs/SendLog";
import {COLOR, MAX_INVITES_PER_GUILD} from "./Constants";

/**
 * Replaces the cached invites of the guild with the live list from Discord.
 * Returns `false` if the invites could not be fetched, the cache is left untouched in that case.
 */
export async function SyncInvitesForGuild(guild: Guild): Promise<boolean> {
	const start = process.hrtime.bigint();

	Database.prepare(`
		INSERT INTO Guilds (id, name, vanity_code) VALUES (?, ?, ?)
		ON CONFLICT (id) DO UPDATE SET name = excluded.name, vanity_code = excluded.vanity_code
	`).run(guild.id, guild.name, guild.vanityURLCode);

	// fetch before touching the cache, a failed fetch must not wipe what we already have
	const invites = await FetchInvites(guild);
	if (!invites) return false;

	if (invites.length > MAX_INVITES_PER_GUILD) {
		const deletableInvites = invites.filter(invite => invite.uses === 0).length;

		void SendLog(guild, {
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

	ReplaceInvites(guild.id, invites);

	const end = process.hrtime.bigint();
	const duration = Number(end - start) / 1e6;

	Log('DEBUG', `[~] Synced ${invites.length} invites for ${guild.name} (${guild.id}) in ${~~duration}ms`);

	return true;
}
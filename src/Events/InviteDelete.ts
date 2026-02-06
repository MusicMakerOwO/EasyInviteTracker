import {EventHandler} from "../Typings/HandlerTypes";
import {IClient} from "../Client";
import {Invite} from "discord.js";
import {DiscardInvite, GetInvite} from "../CRUD/Invites";
import {SendLog} from "../Utils/Logs/SendLog";
import {Log} from "../Utils/Log";
import {GetUser, SaveUser} from "../CRUD/Users";
import {COLOR, INVITE_PURGE_REASON} from "../Utils/Constants";
import {AuditLogEvent} from "discord-api-types/v10";
import {SyncInvitesForGuild} from "../Utils/SyncInvites";
import {ParseUser} from "../Utils/Parsers";
import {SimpleUser} from "../Typings/DatabaseTypes";

export default {
	name: 'inviteDelete',
	execute: async (client: IClient, invite: Invite) => {
		if (!invite.guild) return Log('ERROR', invite);

		const guild = client.guilds.cache.get(invite.guild.id)!;
		const parsed = await GetInvite(invite.code); // it's a partial so need to find the remaining metadata in cache
		DiscardInvite(invite.code);

		// cache miss, database is out of sync :(
		if (!parsed) {
			SendLog(guild, {
				embeds: [{
					color: COLOR.INVITE_DELETE,
					title: "Invite Deleted",
					description: `
An invite was deleted but I couldn't find any information about it :(

This is likely a discord issue but please contact support if it continues to happen`.trim()
				}]
			})
			SyncInvitesForGuild(guild);
			return;
		}

		const user = parsed.owner_id ? await GetUser(parsed.owner_id) : null;
		if (user) SaveUser(user);

		let deletingUser: SimpleUser | null;
		if (client.invite_delete_ownership.has(invite.code)) {
			deletingUser = await GetUser( client.invite_delete_ownership.get(invite.code)! );
		} else {
			const recentAuditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.InviteDelete, limit: 1 });
			const latestLog = recentAuditLogs.entries.first()!;

			if (latestLog.executor?.id === client.user!.id && latestLog.reason?.startsWith(INVITE_PURGE_REASON)) return; // nothing to log

			deletingUser = ParseUser(latestLog.executor!);
		}

		const embed = {
			color: COLOR.INVITE_DELETE,
			title: "Invite Deleted",
			description: `
**Invite**: \`${parsed.code}\`
**Channel**: <#${parsed.channel_id}>

**Expires**: ${parsed.expires_at ? `<t:${parsed.expires_at}:R>` : '`Never`'}

**Owner**: ${user ? `@${user.username} (${user.id})` : `Unknown`}

**Deleted By**: ${deletingUser ? `@${deletingUser.username} (${deletingUser.id})` : '`Unknown`'}`
		}

		SendLog(guild, { embeds: [embed] });
	}
} as EventHandler;
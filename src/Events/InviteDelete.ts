import {EventHandler} from "../Typings/HandlerTypes";
import { client } from "../Client";
import {AuditLogEvent, Guild, GuildAuditLogsEntry, Invite} from "discord.js";
import {DiscardInvite, GetInvite} from "../CRUD/Invites";
import {SendLog} from "../Utils/Logs/SendLog";
import {Log} from "../Utils/Log";
import {GetUser, SaveUser} from "../CRUD/Users";
import {COLOR, INVITE_PURGE_REASON} from "../Utils/Constants";
import {SyncInvitesForGuild} from "../Utils/SyncInvites";
import {ParseUser} from "../Utils/Parsers";
import {SimpleUser} from "../Typings/DatabaseTypes";

const AUDIT_LOG_RETRY_DELAY = 1000; // milliseconds

function Wait(ms: number): Promise<void> {
	return new Promise(r => setTimeout(r, ms).unref());
}

/**
 * Finds the audit log entry for the deletion of this exact invite.
 * The latest entry is not good enough, it may belong to a different invite.
 */
async function FindAuditLog(guild: Guild, code: string): Promise<GuildAuditLogsEntry<AuditLogEvent.InviteDelete> | null> {
	const recentAuditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.InviteDelete, limit: 5 });
	return recentAuditLogs.entries.find( entry => entry.changes.some(change => change.key === 'code' && change.old === code) ) ?? null;
}

export default {
	name: 'inviteDelete',
	execute: async (invite: Invite): Promise<void> => {
		if (!invite.guild) return Log('ERROR', invite);

		const guild = client.guilds.cache.get(invite.guild.id)!;

		// deleted by the purge button, nothing to log
		if (client.invite_purge_codes.delete(invite.code)) {
			void DiscardInvite(invite.code);
			return;
		}

		const parsed = await GetInvite(invite.code); // it's a partial so need to find the remaining metadata in cache
		void DiscardInvite(invite.code);

		// cache miss, database is out of sync :(
		if (!parsed) {
			void SendLog(guild, {
				embeds: [{
					color: COLOR.INVITE_DELETE,
					title: "Invite Deleted",
					description: `
An invite was deleted but I couldn't find any information about it :(

This is likely a discord issue but please contact support if it continues to happen`.trim()
				}]
			})
			void SyncInvitesForGuild(guild);
			return;
		}

		const user = parsed.owner_id ? await GetUser(parsed.owner_id) : null;
		if (user) SaveUser(user);

		let deletingUser: SimpleUser | null = null;
		if (client.invite_delete_ownership.has(invite.code)) {
			deletingUser = await GetUser( client.invite_delete_ownership.get(invite.code)! );
		} else {
			try {
				// the audit log can lag behind the event, give it a second chance
				const auditLog = await FindAuditLog(guild, invite.code) ?? await Wait(AUDIT_LOG_RETRY_DELAY).then( () => FindAuditLog(guild, invite.code) );

				if (auditLog) {
					if (auditLog.executor?.id === client.user!.id && auditLog.reason?.startsWith(INVITE_PURGE_REASON)) return; // nothing to log

					if (auditLog.executor) deletingUser = ParseUser(auditLog.executor);
				}
			} catch (error) {
				// most likely missing the audit log permission, the deletion is still worth logging
				Log('WARN', `[!] Could not read audit logs in guild (${guild.id})`);
				Log('WARN', error);
			}
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

		void SendLog(guild, { embeds: [embed] });
	}
} as EventHandler;
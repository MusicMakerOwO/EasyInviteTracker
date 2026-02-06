import {EventHandler} from "../Typings/HandlerTypes";
import {IClient} from "../Client";
import {Invite} from "discord.js";
import {SaveInvite} from "../CRUD/Invites";
import {SendLog} from "../Utils/Logs/SendLog";
import {Log} from "../Utils/Log";
import {SaveUser} from "../CRUD/Users";
import {COLOR} from "../Utils/Constants";

export default {
	name: 'inviteCreate',
	execute: async (client: IClient, invite: Invite) => {
		if (!invite.guild) return Log('ERROR', invite);

		const guild = client.guilds.cache.get(invite.guild.id)!;
		const parsed = SaveInvite(invite);

		const user = client.users.cache.get(invite.inviterId!);
		if (user) SaveUser(user);

		const embed = {
			color: COLOR.INVITE_CREATE,
			thumbnail: { url: user? user.displayAvatarURL() : '' },
			title: "Invite Created",
			description: `
**Invite**: \`${parsed.code}\`
**Channel**: <#${parsed.channel_id}>

**Expires**: ${parsed.expires_at ? `<t:${parsed.expires_at}:R>` : '`Never`'}

**Owner**: ${user ? `@${user.username} (${user.id})` : `Unknown`}
`
		}

		const button = {
			type: 1,
			components: [{
				type: 2,
				style: 2,
				label: 'Invite Info',
				custom_id: `invite-info_${invite.code}`,
				emoji: '📨'
			}]
		}

		SendLog(guild, {
			embeds: [embed],
			components: [button]
		});
	}
} as EventHandler;
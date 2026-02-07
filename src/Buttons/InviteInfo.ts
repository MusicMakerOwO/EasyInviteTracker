import {ButtonHandler} from "../Typings/HandlerTypes";
import {GetInvite} from "../CRUD/Invites";
import {COLOR} from "../Utils/Constants";
import {GetUser} from "../CRUD/Users";
import {GetGuild} from "../CRUD/Guild";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	customID: "invite-info",
	execute: async function (interaction, client, args) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		const code = args[0];

		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferReply({ ephemeral: true });
		}

		const invite = await GetInvite(code);
		if (!invite) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `Invite not found :(`
				}]
			});
		}

		const inviteChannel = invite.channel_id ? client.channels.cache.get(invite.channel_id) ?? await client.channels.fetch(invite.channel_id).catch(() => null) : null;
		if (inviteChannel && !('name' in inviteChannel)) throw new Error("Shut up typescript");

		const inviteGuild = await GetGuild(invite.guild_id);
		const inviteOwner = invite.owner_id ? await GetUser(invite.owner_id) : null;

		const embed = {
			color: COLOR.PRIMARY,
			description: `
**Code**: \`${invite.code}\`

**Server**: ${inviteGuild ? `\`${inviteGuild?.name ?? 'Unknown'}\` (${invite.guild_id})` : '`Unknown`'}
**Channel**: ${inviteChannel ? `\`#${inviteChannel?.name ?? 'Unknown'}\` (${invite.channel_id})` : '`Unknown`'}`.trim()
		}

		if (invite.code !== inviteGuild?.vanity_code) {
			embed.description += `
**Owner**: ${inviteOwner ? `\`@${inviteOwner.username}\` (${inviteOwner.id})` : '`Unknown`'}

**Uses**: \`${invite.uses}\`

**Vanity**: ${inviteGuild ? '❌' : '`Unknown`'}`;
		} else {
			embed.description += `\n\n**Vanity**: ✅`;
		}

		const buttons = {
			type: 1,
			components: [
				{
					type: 2,
					style: 4,
					label: 'Delete Invite',
					custom_id: `invite-delete_${invite.code}`,
					disabled: invite.guild_id !== interaction.guildId
				},
				{
					type: 2,
					style: 2,
					label: 'User Info',
					custom_id: `user-info_${invite.owner_id}`,
					disabled: invite.owner_id === null,
					emoji: '👤'
				}
			]
		}

		interaction.editReply({
			embeds: [embed],
			// only include button if guild IDs match, meaning invite can be managed from this context
			components: [buttons]
		})
	}
} as ButtonHandler;
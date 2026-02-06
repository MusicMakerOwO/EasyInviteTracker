import {ButtonHandler} from "../Typings/HandlerTypes";
import {GetAllInvites} from "../CRUD/Invites";
import {COLOR} from "../Utils/Constants";
import {CheckPermissions} from "../Utils/CheckPermissions";

const PAGE_SIZE = 10;

export default {
	customID: 'list-invites',
	execute: async (interaction, client, args) => {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		let targetPage = args[0];

		if (!interaction.deferred && !interaction.replied) {
			interaction.deferUpdate ? await interaction.deferUpdate({}) : await interaction.deferReply({ ephemeral: true });
		}

		// sort by uses descending
		const inviteList = GetAllInvites(interaction.guild!).sort( (x, y) => y.uses - x.uses );
		if (inviteList.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: "No invites found in this server :("
				}]
			})
		}

		const maxPages = ~~(inviteList.length / PAGE_SIZE);

		const page =
			targetPage === 'first' ? 0 :
			targetPage === 'last' ? maxPages :
				parseInt(targetPage, 10);

		const embed = {
			color: COLOR.PRIMARY,
			title: `Invite List (${inviteList.length} total)`,
			description: ""
		}

		const selectMenu = {
			type: 1,
			components: [{
				type: 3,
				custom_id: 'invite-info',
				options: new Array(PAGE_SIZE)
			}]
		}

		for (let i = page * PAGE_SIZE; i < Math.min( (page + 1) * PAGE_SIZE, inviteList.length); i++) {
			const invite = inviteList[i];
			embed.description += `**Code**: \`${invite.code}\` | **Uses**: \`${invite.uses}\``;
			if (invite.expires_at) embed.description += `\nExpires <t:${invite.expires_at}:R>`;
			if (invite.owner_id) embed.description += `\nOwner: <@${invite.owner_id}>`;
			embed.description += `\n\n`;

			selectMenu.components[0].options[i - page * PAGE_SIZE] = {
				label: `Code: ${invite.code} | Uses: ${invite.uses}`,
				value: invite.code
			}
		}

		const navButtons = {
			type: 1,
			components: [
				{
					type: 2,
					style: 1,
					label: '<<<',
					custom_id: `list-invites_first`,
					disabled: page === 0
				},
				{
					type: 2,
					style: 1,
					label: '<',
					custom_id: `list-invites_${page - 1}`,
					disabled: page === 0
				},
				{
					type: 2,
					style: 2,
					label: `${page + 1} / ${maxPages + 1}`,
					custom_id: 'null',
					disabled: true
				},
				{
					type: 2,
					style: 1,
					label: '>',
					custom_id: `list-invites_${page + 1}`,
					disabled: page === maxPages
				},
				{
					type: 2,
					style: 1,
					label: '>>>',
					custom_id: `list-invites_last`,
					disabled: page === maxPages
				}
			]
		}

		interaction.editReply({
			embeds: [embed],
			components: [navButtons, selectMenu]
		})
	}
} as ButtonHandler;
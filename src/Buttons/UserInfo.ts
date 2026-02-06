import {ButtonHandler} from "../Typings/HandlerTypes";
import {GetUser} from "../CRUD/Users";
import {COLOR} from "../Utils/Constants";
import {Database} from "../Utils/Database";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	customID: 'user-info',
	execute: async function(interaction, client, args) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		const targetID = args[0];

		await interaction.deferReply({ ephemeral: true });

		const user = await GetUser(targetID);
		if (!user) {
			return await interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: "Something went wrong - User not found :("
				}]
			})
		}

		const memberMetadata = Database.prepare("SELECT joined_at, left_at FROM Members WHERE guild_id = ? AND id = ?").get(interaction.guildId, targetID) as { joined_at: number; left_at: number } | undefined
			?? { joined_at: -1, left_at: -1 };

		const joinedTimestamp = memberMetadata.joined_at === -1 ? null : `<t:${memberMetadata.joined_at}:f>`;
		const leftTimestamp = memberMetadata.left_at === -1 ? null : `<t:${memberMetadata.left_at}:f>`;

		const embed = {
			color: COLOR.PRIMARY,
			thumbnail: { url: `https://cdn.discordapp.com/avatars/${user.id}/${user.icon_hash}.png?size=256` },
			description: `
@${user.username} (${user.id})
Bot: ${user.bot ? '❌' : '✅'}`.trim()
		}

		if (joinedTimestamp) {
			embed.description += `\n\nJoined at: <t:${joinedTimestamp}:f>`;
			if (leftTimestamp) {
				embed.description += `\nLeft at <t:${leftTimestamp}:f>`;
			}
		}

		await interaction.editReply({
			embeds: [embed]
		});
	}
} as ButtonHandler;
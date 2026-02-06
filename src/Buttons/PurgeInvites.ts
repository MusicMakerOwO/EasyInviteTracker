import {ButtonHandler} from "../Typings/HandlerTypes";
import {COLOR, EMOJI, INVITE_PURGE_REASON} from "../Utils/Constants";
import {Log} from "../Utils/Log";
import {GetAllInvites} from "../CRUD/Invites";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	customID: 'purge-invites',
	execute: async function(interaction, client, args) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		const inviteList = GetAllInvites(interaction.guild!);
		const unusedInvites = inviteList.filter(x => x.uses === 0);

		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferUpdate();
		}

		await interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `${EMOJI.LOADING} Deleting ${unusedInvites.length} invites ...`
			}],
			components: []
		});

		const promises = [];
		for (const invite of unusedInvites) {
			promises.push(
				interaction.guild!.invites.delete(invite.code, `${INVITE_PURGE_REASON} | @${interaction.user.username}`)
			);
		}

		try {
			await Promise.all(promises);
		} catch (error) {
			Log('ERROR', error);
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `${EMOJI.FATAL} Something went wrong`
				}]
			})
		}

		interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `${EMOJI.SUCCESS} Successfully deleted ${unusedInvites.length} invites`
			}]
		})
	}
} as ButtonHandler;
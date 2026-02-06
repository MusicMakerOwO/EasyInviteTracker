import {ButtonHandler} from "../Typings/HandlerTypes";
import {COLOR, EMOJI} from "../Utils/Constants";
import {DiscardInvite, GetInvite} from "../CRUD/Invites";
import {Routes} from "discord-api-types/v10";
import {Log} from "../Utils/Log";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	customID: 'invite-delete',
	execute: async function(interaction, client, args){
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		const code = args[0];
		const confirm = args[1] as string | undefined;

		const invite = await GetInvite(code);
		if (!invite) {
			return interaction.reply({
				ephemeral: true,
				embeds: [{
					color: COLOR.ERROR,
					description: `Invite no longer exists :(`
				}]
			})
		}

		if (!confirm) {
			return await interaction.reply({
				ephemeral: true,
				embeds: [{
					color: COLOR.ERROR,
					description: `
**Are you sure you want to delete this invite?**
__This cannot be undone!__

**Code** : \`${invite.code}\` | **Uses** : \`${invite.uses}\``.trim()
				}],
				components: [{
					type: 1,
					components: [
						{
							type: 2,
							style: 3,
							label: 'Take me back!',
							custom_id: 'close'
						},
						{
							type: 2,
							style: 4,
							label: 'Delete',
							custom_id: 'close'
						}
					]
				}]
			})
		}

		await interaction.deferUpdate();

		try {
			await client.rest.delete(Routes.invite(invite.code),  { reason: `Deleted by @${interaction.user.username})` })
		} catch (error) {
			Log('ERROR', error);
			await interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `Something went wrong :(\nMake sure I have the required permissions`
				}]
			});
			return;
		}

		DiscardInvite(invite.code);

		await interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `${EMOJI.CANCEL} Invite successfully deleted`
			}]
		});
	}
} as ButtonHandler;
import { EventHandler } from "../../Typings/HandlerTypes";
import { ModalSubmitInteraction } from "discord.js";
import { COLOR } from "../../Utils/Constants";
import { Log } from "../../Utils/Log";

export default {
	name: 'modal-interaction',
	execute: async (client, interaction: ModalSubmitInteraction) => {

		const args = interaction.customId.split('_');
		const customId = args.shift()!;

		const handler = client.modals.get(customId);
		if (!handler) {
			Log('ERROR', 'Modal not found');
			return interaction.reply({
				embeds: [{
					color: COLOR.ERROR,
					description: "Modal not found :("
				}]
			});
		}

		try {
			await handler.execute(interaction, client, args);
		} catch (error) {
			Log('ERROR', error);
		}
	}
} as EventHandler;
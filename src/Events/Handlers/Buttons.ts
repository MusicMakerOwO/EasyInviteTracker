import { EventHandler } from "../../Typings/HandlerTypes";
import { ButtonInteraction } from "discord.js";
import { COLOR } from "../../Utils/Constants";
import { Log } from "../../Utils/Log";

export default {
	name: 'button-interaction',
	execute: async (client,interaction: ButtonInteraction) => {

		const args = interaction.customId.split('_');
		const customId = args.shift()!;

		const handler = client.buttons.get(customId);
		if (!handler) {
			Log('ERROR', 'Button not found');
			return interaction.reply({
				embeds: [{
					color: COLOR.ERROR,
					description: "Button not found :("
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
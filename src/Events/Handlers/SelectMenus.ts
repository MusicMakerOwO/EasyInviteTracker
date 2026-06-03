import { EventHandler } from "../../Typings/HandlerTypes";
import { SelectMenuInteraction } from "discord.js";
import { COLOR } from "../../Utils/Constants";
import { Log } from "../../Utils/Log";

export default {
	name: 'menu-interaction',
	execute: async (client, interaction: SelectMenuInteraction) => {

		const args = interaction.customId.split('_');
		const customId = args.shift()!;

		const handler = client.menus.get(customId);
		if (!handler) {
			Log('ERROR', 'Select menu not found');
			return interaction.reply({
				embeds: [{
					color: COLOR.ERROR,
					description: "Dropdown not found :("
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
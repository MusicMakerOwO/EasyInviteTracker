import { EventHandler } from "../../Typings/HandlerTypes";
import { AutocompleteInteraction, ChatInputCommandInteraction as CommandInteraction } from "discord.js";
import { COLOR } from "../../Utils/Constants";
import { Log } from "../../Utils/Log";

export default {
	name: 'command-interaction',
	execute: async (client, interaction: CommandInteraction | AutocompleteInteraction) => {
		const handler = client.commands.get(interaction.commandName);
		if (!handler) {
			Log('ERROR', 'Command not found');
			if (interaction instanceof CommandInteraction) {
				void interaction.reply({
					embeds: [{
						color: COLOR.ERROR,
						description: "Command not found :("
					}]
				});
			}
			return;
		}

		if (interaction instanceof AutocompleteInteraction) {
			if (!('autocomplete' in handler)) {
				return Log('ERROR', 'Autocomplete interaction but no callback function was found');
			} else {
				try {
					await handler.autocomplete(interaction, client)
				} catch (error) {
					Log('ERROR', error);
				}
			}
			return;
		}

		try {
			await handler.execute(interaction, client);
		} catch (error) {
			Log('ERROR', error);
		}
	}
} as EventHandler;
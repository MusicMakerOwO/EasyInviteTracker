import {EventHandler} from "../../Typings/HandlerTypes";
import {Log} from "../../Utils/Log";
import {Interaction} from "discord.js";

export default {
	name: 'interactionCreate',
	execute: async function (client, interaction: Interaction) {
		switch (interaction.type) {
			case 4: // Autocomplete
			case 2: // Slash Commands + Context Menus
				if (interaction.commandType === 1) {
					// @ts-expect-error | Private properties
					const subcommand: string = interaction.options._subcommand || "";
					// @ts-expect-error | Private properties
					const subcommandGroup: string = interaction.options._subcommandGroup || "";
					// @ts-expect-error | Private properties
					const commandArgs: { value: string }[] = interaction.options._hoistedOptions || [];
					const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
					Log('INFO', `${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
					client.emit('command-interaction', interaction);
				} else {
					Log('INFO', `${interaction.user.tag} (${interaction.user.id}) > :${interaction.commandName}:`);
					client.emit('context-interaction', interaction);
				}
				break;
			case 3: // Message Components
				if (interaction.isButton()) {
					Log('INFO', `${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
					client.emit('button-interaction', interaction);
				} else if (interaction.isAnySelectMenu()) {
					Log('INFO', `${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId} : ${interaction.values.join(', ')}>`);
					client.emit('menu-interaction', interaction);
				}
				break;
			case 5: // Modal submit
				Log('INFO', `${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
				client.emit('modal-interaction', interaction);
				break;
			default:
				// @ts-expect-error | "Property 'type' does not exist on type 'never'"
				// That's kind of the point of this default case lmao
				//
				// This error only occurs with TypeScript 7.0
				Log('WARN', `Unknown interaction type: ${interaction.type} - Unsure how to handle this...`);
				break;
		}
	}
} as EventHandler;
import {SelectMenuHandler} from "../Typings/HandlerTypes";
import {ButtonInteraction} from "discord.js";

export default {
	customID: 'invite-info',
	execute: async function(interaction, client, args) {
		const code = interaction.values[0] as string;
		const button = client.buttons.get('invite-info')!;
		button.execute(interaction as unknown as ButtonInteraction, client, [code]);
	}
} as SelectMenuHandler;
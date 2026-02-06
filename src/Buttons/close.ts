import {ButtonHandler} from "../Typings/HandlerTypes";

export default {
	customID: 'close',
	execute: async function(interaction) {
		await interaction.deferUpdate();
		await interaction.deleteReply();
	}
} as ButtonHandler;
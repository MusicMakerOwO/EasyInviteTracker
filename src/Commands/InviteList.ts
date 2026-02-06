import {CommandHandler} from "../Typings/HandlerTypes";
import {ButtonInteraction, SlashCommandBuilder} from "discord.js";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	data: new SlashCommandBuilder()
	.setName('list-invites')
	.setDescription('Browse and manage invites in this server'),
	execute: async function(interaction, client) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;
		const button = client.buttons.get('list-invites')!;
		button.execute(interaction as unknown as ButtonInteraction, client, ['first']);
	}
} as CommandHandler;
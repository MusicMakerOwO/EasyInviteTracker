import {ButtonInteraction, Invite, SlashCommandBuilder} from "discord.js";
import {CommandHandler} from "../Typings/HandlerTypes";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	data: new SlashCommandBuilder()
	.setName('invite-info')
	.setDescription('Get information about an invite code')
	.addStringOption( x => x
		.setName('code')
		.setDescription('The code of the invite info')
		.setMinLength(3)
		.setRequired(true)
	),
	execute: async function(interaction, client) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;
		const input = interaction.options.getString('code')!;
		const code = (Invite.InvitesPattern.exec(input) ?? /[\w-]{3,}/g.exec(input) ?? []).pop();
		if (!code) throw new Error(`Could not extract code : ${input}`);

		const inviteInfoButton = client.buttons.get('invite-info')!;
		inviteInfoButton.execute(interaction as unknown as ButtonInteraction, client, [code]);
	}
} as CommandHandler;
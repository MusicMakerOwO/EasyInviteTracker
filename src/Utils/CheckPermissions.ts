import {AutocompleteInteraction, GuildMember, Interaction} from "discord.js";
import {PermissionFlagsBits} from "discord-api-types/v10";
import {COLOR} from "./Constants";

export function CheckPermissions(interaction: Exclude<Interaction, AutocompleteInteraction>, requiredPermissions: (keyof typeof PermissionFlagsBits)[]) {
	const memberPermissions = (interaction.member as GuildMember).permissions
	const missingPermissions = requiredPermissions.filter(x => !memberPermissions.has(x));
	if (missingPermissions.length === 0) return true;

	interaction.reply({
		ephemeral: true,
		embeds: [{
			color: COLOR.ERROR,
			description: `
You cannot use this feature at this time :(
You are missing the following perissions:
${missingPermissions.map(permission => '\\- ' + permission).join("\n")}`
		}]
	})

	return false;
}
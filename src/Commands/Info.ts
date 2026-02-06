import {CommandHandler} from "../Typings/HandlerTypes";
import {SlashCommandBuilder} from "discord.js";
import {Database} from "../Utils/Database";
import {COLOR} from "../Utils/Constants";

export default {
	aliases: ['about', 'botinfo'],
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('General information about the bot'),
	execute: async function(interaction, client) {
		const inviteCount = Database.prepare("SELECT COUNT(*) FROM Invites").pluck().get() as number;

		const embed = {
			color: COLOR.PRIMARY,
			title: 'Easier Invite Tracker',
			description: `
**Owner** : @musicmaker
**Version** : 3.0.0

**Servers** : ${client.guilds.cache.size}
**Users** : ${client.users.cache.size}

**Invites** : ${inviteCount}

**Support** : https://discord.gg/q7bUuVq4vB`
		}

		await interaction.reply({ embeds: [embed] });
	}
} as CommandHandler;
import {SlashCommandBuilder} from "discord.js";
import {COLOR} from "../Utils/Constants";
import {CommandHandler} from "../Typings/HandlerTypes";

const CHANGELOG: Record<string, {date: string, changes: string[]}> = {
	"3.0.0": {
		date: "2026 February 6th",
		changes: [
			"Initial release, the 3rd rewrite of this bot over the years <3"
		]
	}
}

export const OLDEST_VERSION = Object.keys(CHANGELOG).sort((a, b) => a.localeCompare(b))[0];
export const LATEST_VERSION = Object.keys(CHANGELOG).sort((a, b) => b.localeCompare(a))[0];

export default {
	data: new SlashCommandBuilder()
	.setName('changelog')
	.setDescription('New here? Check out what has changed!')
	.addStringOption(x => x
		.setName('version')
		.setDescription('The version you want to check')
		.setRequired(false)
		.addChoices([
			{ name: 'Latest', value: 'latest' },
			{ name: 'All', value: 'all' },
			... Object.keys(CHANGELOG).sort(
				(a, b) => b.localeCompare(a)
			).map(
				(version) => ({ name: 'v' + version, value: version })
			),
		])
	),
	execute: async function(interaction, client) {
		const input = interaction.options.getString('version') || 'latest';

		if (input === 'all') {
			// show all versions
			const embed = {
				color: COLOR.PRIMARY,
				title: `Easy Invite Tracker : Historical Changelogs`,
				description: ''
			}

			for (const [version, data] of Object.entries(CHANGELOG).sort((a, b) => b[0].localeCompare(a[0]))) {
				embed.description += `**${version}** - \`${data.date}\`\n`;
				embed.description += `${data.changes.map(x => `\\- ${x}`).join('\n')}\n\n`;
			}

			return interaction.reply({
				embeds: [embed]
			});
		}

		const version = input === 'latest' ? LATEST_VERSION : input;

		const data = CHANGELOG[version];
		if (!data) {
			console.error(`Changelog for version "${input}" not found`);
			return interaction.reply({
				content: `No changelog found for version \`${input}\``,
				ephemeral: true
			});
		}

		const embed = {
			color: COLOR.PRIMARY,
			title: `Easy Invite Tracker : v${version}`,
			description: `
Updated: \`${data.date}\`

${data.changes.map(x => `\\- ${x}`).join('\n')}

https://github.com/MusicMakerOwO/EasyInviteTracker/commits/main`
		};

		return interaction.reply({
			embeds: [embed]
		});
	}
} as CommandHandler;
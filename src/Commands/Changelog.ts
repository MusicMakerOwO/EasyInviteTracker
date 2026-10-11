import {APIEmbed, SlashCommandBuilder} from "discord.js";
import {COLOR} from "../Utils/Constants";
import {CommandHandler} from "../Typings/HandlerTypes";

const CHANGELOG: Record<string, {date: string, changes: string[]}> = {
	"3.0.0": {
		date: "2026 February 6th",
		changes: [
			"Initial release, the 3rd rewrite of this bot over the years <3"
		]
	},
	"3.0.1": {
		date: "2026 February 7th",
		changes: [
			"Added a user info button in invite info page",
			"Fixed user leave dates showing null",
			"Fixed an index out of bounds error on invite listing",
			"Fixed deletion logs to show the responsible user when using the delete button",
		]
	},
	"4.0.0": {
		date: "2026 June 3rd",
		changes: [
			"Complete overhaul under the hood",
			"Delete an invite now makes the event display the user instead of \"Deleted by EIT\"",
			"Updated log colors to be less confusing",
			"Fixed a bug showing every user as a bot",
			"Fixed a small memory leak",
			"Delete invite button now disappears after user"
		]
	},
	"4.0.1": {
		date: "2026 October 11th",
		changes: [
			"Changelog can now show every release of a major version, replacing the \"all\" option",
			"Fixed joins sometimes being credited to the wrong invite",
			"Fixed joins showing as unknown in newly added servers or after a temporary Discord hiccup",
			"Fixed joins not being logged in servers without any invites",
			"Fixed deleted invites not being logged when the bot can't view the audit log",
			"Fixed invite deletions sometimes naming the wrong person",
			"Fixed members who rejoined still showing as having left",
			"Fixed members who left not always showing as having left",
			"Fixed the last page of the invite list not opening",
			"Fixed user info not working for some users",
			"Fixed setup not saving the log channel in newly added servers",
			"Fixed sync saying invites were refreshed when it couldn't load them",
			"Fixed invites and users staying \"not found\" after a temporary Discord hiccup",
			"Updated this changelog command"
		]
	}
}

function ParseSemver(input: string): [major: string, minor: string, patch: string] {
	const parts = input.split('.');
	if (parts.length !== 3) throw new Error(`Invalid semver: ${input}`);
	return parts as ReturnType<typeof ParseSemver>;
}

/** Oldest first. Compares each part as a number - as text, 4.10.0 sorts below 4.9.0 */
export function CompareSemver(a: string, b: string): number {
	const partsA = ParseSemver(a).map(Number);
	const partsB = ParseSemver(b).map(Number);
	return (partsA[0] - partsB[0]) || (partsA[1] - partsB[1]) || (partsA[2] - partsB[2]);
}

export const OLDEST_VERSION = Object.keys(CHANGELOG).sort(CompareSemver)[0];
export const LATEST_VERSION = Object.keys(CHANGELOG).sort((a, b) => CompareSemver(b, a))[0];

const EMBED_DESCRIPTION_LIMIT = 4096;
/** Discord's cap on the text of every embed in one message combined */
const MESSAGE_EMBED_LIMIT = 6000;
/** Room kept for the "older releases not shown" line */
const OLDER_NOTE_RESERVE = 100;

export default {
	data: new SlashCommandBuilder()
	.setName('changelog')
	.setDescription('New here? Check out what has changed!')
	.addStringOption(x => x
		.setName('version')
		.setDescription('The version you want to check')
		.setRequired(false)
		.setAutocomplete(true)
	),
	autocomplete: async function(interaction) {
		let input = interaction.options.getFocused(false);
		if (input.startsWith('v')) input = input.replace(/^[A-Za-z]+/, '');

		if (!input) {
			const majors = Array.from( new Set(Object.keys(CHANGELOG).map(v => ParseSemver(v)[0] )) );
			return interaction.respond([
				{ name: 'Latest', value: 'latest' },
				// `N.0` is what execute reads as "every release of this major"
				... majors.map(major => ({ name: `v${major}`, value: `${major}.0` }))
			]);
		}

		const versions = Object.keys(CHANGELOG).filter(v => v.startsWith(input) || v.startsWith(`v${input}`)).sort(CompareSemver).slice(0, 25);
		return interaction.respond( versions.map(v => ({ name: `v${v} - ${CHANGELOG[v].date}`, value: v })) );
	},
	execute: async function(interaction) {
		const input = interaction.options.getString('version') || 'latest';

		const majorMatch = input.match(/^(\d+)\.0$/);
		if (majorMatch) {
			const majorNum = majorMatch[1];
			const entries = Object.entries(CHANGELOG)
			.filter(([v]) => v.startsWith(`${majorNum}.`))
			.sort((a, b) => CompareSemver(b[0], a[0]));

			if (!entries.length) {
				return interaction.reply({
					ephemeral: true,
					embeds: [{
						color: COLOR.ERROR,
						description: `No changelog found for major version \`${majorNum}.x\``
					}]
				});
			}

			const title = `Easy Invite Tracker : v${majorNum}.x`;
			const embeds: APIEmbed[] = [{ color: COLOR.PRIMARY, title, description: '' }];

			// A whole major does not fit one description. Spill into further embeds, and stop at
			// Discord's total for a message - the newest releases are the ones that make it
			let budget = MESSAGE_EMBED_LIMIT - title.length - OLDER_NOTE_RESERVE;
			let shown = 0;
			for (const [ver, data] of entries) {
				const block = `**${ver}** - \`${data.date}\`\n${data.changes.map(x => `\\- ${x}`).join('\n')}\n\n`;
				if (block.length > budget || block.length > EMBED_DESCRIPTION_LIMIT) break;

				if (embeds.at(-1)!.description!.length + block.length > EMBED_DESCRIPTION_LIMIT) {
					embeds.push({ color: COLOR.PRIMARY, description: '' });
				}
				embeds.at(-1)!.description += block;
				budget -= block.length;
				shown++;
			}

			if (shown < entries.length) {
				const note = `-# ${entries.length - shown} older release(s) not shown, use \`/changelog <version>\` to view one`;
				if (embeds.at(-1)!.description!.length + note.length > EMBED_DESCRIPTION_LIMIT) {
					embeds.push({ color: COLOR.PRIMARY, description: '' });
				}
				embeds.at(-1)!.description += note;
			}

			return interaction.reply({ embeds });
		}

		const version = input === 'latest' ? LATEST_VERSION : input;

		const data = CHANGELOG[version];
		if (!data) {
			return interaction.reply( {
				ephemeral: true,
				embeds: [{
					color: COLOR.ERROR,
					description: `No changelog found for version \`${input}\``
				}]
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
} satisfies CommandHandler as CommandHandler;
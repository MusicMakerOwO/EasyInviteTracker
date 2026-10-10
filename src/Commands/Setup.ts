import {SlashCommandBuilder, TextChannel} from "discord.js";
import {CommandHandler} from "../Typings/HandlerTypes";
import {COLOR, EMOJI} from "../Utils/Constants";
import {Database} from "../Database";
import {SaveGuild} from "../CRUD/Guild";
import {SyncInvitesForGuild} from "../Utils/SyncInvites";
import {CheckPermissions} from "../Utils/CheckPermissions";

export default {
	aliases: ['log'],
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup the bot invite tracking')
		.addChannelOption( x => x
			.setName('channel')
			.setDescription('The channel to send the logs to')
			.setRequired(true)
			.addChannelTypes(0)
		),
	execute: async function(interaction, client) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		await interaction.reply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: "Setting everything up ..."
			}]
		});

		const channel = interaction.options.getChannel('channel')!;

		// fake loading lol
		await new Promise(r => setTimeout(r, 2000).unref());

		if (channel.type !== 0) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `${EMOJI.ERROR} Only text channels can be used for logs`
				}]
			})
		}

		// This will always return *something* because it is impossible to resolve a channel without also being a guild member
		// Internally it first checks if the given ID is a guild member, then checks roles, and only returns null if not a member and no roles in cache
		const permissions = (channel as TextChannel).permissionsFor(client.user!.id)!;
		if (
			!permissions.has("ViewChannel") ||
			!permissions.has("SendMessages") ||
			!permissions.has("EmbedLinks") ||
			!permissions.has("ManageGuild")
		) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `
${EMOJI.ERROR} Please make sure I have the following permissions:
\\- Manage Server
\\- View Channel
\\- Send Messages
\\- Embed Links
`.trim()
				}]
			})
		}

		SaveGuild(interaction.guild!); // the bot may have been added after startup, no row yet
		const saved = Database.prepare("UPDATE Guilds SET log_channel = ? WHERE id = ?").run(channel.id, interaction.guildId);
		if (saved.changes === 0) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `${EMOJI.ERROR} Something went wrong - I couldn't save the log channel, please try again`
				}]
			})
		}

		// counts are not kept up to date while logging is off, start from a fresh list
		void SyncInvitesForGuild(interaction.guild!);

		let description = `
${EMOJI.SUCCESS} Setup successful!
-# Logs will appear as people interact with your server`.trim();

		if (!permissions.has("ViewAuditLog")) {
			description += `\n-# Give me \`View Audit Log\` if you want to see who deleted an invite`;
		}

		void interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: description
			}]
		});
	}
} satisfies CommandHandler as CommandHandler;
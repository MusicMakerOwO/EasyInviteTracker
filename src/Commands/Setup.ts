import {SlashCommandBuilder, TextChannel} from "discord.js";
import {CommandHandler} from "../Typings/HandlerTypes";
import {COLOR, EMOJI} from "../Utils/Constants";
import {Database} from "../Utils/Database";
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
		await new Promise(r => setTimeout(r, 2000));

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
			!permissions.has("EmbedLinks")
		) {
			return interaction.editReply({
				embeds: [{
					color: COLOR.ERROR,
					description: `
${EMOJI.ERROR} Please make sure I have the following permissions in that channel:
\\- View Channel
\\- Send Messages
\\- Embed Links
`.trim()
				}]
			})
		}

		Database.prepare("UPDATE Guilds SET log_channel = ? WHERE id = ?").run(channel.id, interaction.guildId);

		interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `
${EMOJI.SUCCESS} Setup successful!
-# Logs will appear as people interact with your server`.trim()
			}]
		})
	}
} as CommandHandler;
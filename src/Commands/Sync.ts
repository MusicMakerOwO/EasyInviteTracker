import {SlashCommandBuilder} from "discord.js";
import {CommandHandler} from "../Typings/HandlerTypes";
import {Database} from "../Utils/Database";
import {COLOR, EMOJI} from "../Utils/Constants";
import {SyncInvitesForGuild} from "../Utils/SyncInvites";
import {CheckPermissions} from "../Utils/CheckPermissions";

const SYNC_COOLDOWN = 60; // seconds

export default {
	data: new SlashCommandBuilder()
	.setName('sync')
	.setDescription('Forcefully refresh invites for the server'),
	async execute(interaction, client) {
		if (!CheckPermissions(interaction, ['ManageGuild'])) return;

		const last_sync = Database.prepare("SELECT last_sync FROM Guilds WHERE id = ?").pluck().get(interaction.guildId) as number | undefined ?? 0;
		const unixEpoch = ~~(Date.now() / 1000);
		if (unixEpoch - last_sync < SYNC_COOLDOWN) {
			return await interaction.reply({
				embeds: [{
					color: COLOR.ERROR,
					description: `Please wait \`${SYNC_COOLDOWN - (unixEpoch - last_sync)} seconds\` before syncing again.`
				}]
			});
		}
		Database.prepare("UPDATE Guilds SET last_sync = ? WHERE id = ?").run(unixEpoch, interaction.guildId)

		await interaction.reply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `${EMOJI.LOADING} Loading — Please wait ...`
			}]
		})

		await SyncInvitesForGuild(interaction.guild!);

		interaction.editReply({
			embeds: [{
				color: COLOR.PRIMARY,
				description: `${EMOJI.SUCCESS} Invites have been refreshed in this server`
			}]
		})
	}
} as CommandHandler;
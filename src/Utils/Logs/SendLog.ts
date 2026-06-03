import {Guild, MessageCreateOptions} from "discord.js";
import {Database} from "../../Database";
import {client} from "../../Client";
import {inspect} from "node:util";
import config from "../../config";

export async function SendLog(guild: Guild, message: MessageCreateOptions): Promise<void> {
	if (config.DEV_MODE) console.log( inspect(message, {depth: undefined, colors: true}) );

	const channelID = Database.prepare("SELECT log_channel FROM Guilds WHERE id = ?").pluck().get(guild.id) as string | undefined;
	if (!channelID) return;

	const channel = client.channels.cache.get(channelID) ?? await client.channels.fetch(channelID).catch(() => null) ?? null;
	if (!channel || channel.type !== 0) return;

	try {
		await channel.send(message);
	} catch (error) {
		// @ts-expect-error | I don't care enough to do a full type check lmao
		if (error.code === 50013) {
			// Missing permissions
			return;
		}
		console.error(error);
	}
}
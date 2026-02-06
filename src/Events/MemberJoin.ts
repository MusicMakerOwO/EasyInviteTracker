import {EventHandler} from "../Typings/HandlerTypes";
import {DMChannel, GuildMember} from "discord.js";
import {FetchInvites} from "../Utils/Parsers/FetchInvites";
import {SimpleInvite} from "../Typings/DatabaseTypes";
import {Log} from "../Utils/Log";
import {GetAllInvites} from "../CRUD/Invites";
import {COLOR, EMOJI, MAX_INVITES_PER_GUILD} from "../Utils/Constants";
import {SendLog} from "../Utils/Logs/SendLog";
import {GetUser, SaveMember} from "../CRUD/Users";
import {GetGuild} from "../CRUD/Guild";
import config from "../config";

export default {
	name: 'guildMemberAdd',
	execute: async (client, member: GuildMember) => {
		const guild = member.guild;

		SaveMember(guild, member);

		if (!config.DEV_MODE) {
			const savedGuild = await GetGuild(guild.id);
			if (!savedGuild!.log_channel) return
		}

		// don't log bots joining, they don't use invites lol
		if (member.user.bot) return;

		const embed = {
			color: COLOR.MEMBER_JOIN,
			title: "Member Joined",
			description: `
**@${member.user.username}** (${member.user.id})	
**Bot**: ${member.user.bot ? '✅' : '❌'}
`.trim()
		}

		const oldInvites = GetAllInvites(guild);
		if (oldInvites.length > MAX_INVITES_PER_GUILD) {
			embed.description += `\n
⚠️ **Invite tracking is disabled for this server**
You have too many active invites (${oldInvites.length}/${MAX_INVITES_PER_GUILD}). It is recommended you delete invites with no uses. You may click the button below to do this automatically`;

			return SendLog(guild, {
				embeds: [embed],
				components: [{
					type: 1,
					components: [{
						type: 2,
						style: 4,
						label: "Purge Invites",
						custom_id: "purge-invites"
					}]
				}]
			})
		}

		const newInvites = await FetchInvites(guild);
		if (newInvites.length === 0) {
			return Log('WARN', `[!] Could not resolve invite list in guild (${guild.id})`);
		}

		const oldInviteCache = Object.fromEntries( oldInvites.map(x => [x.code, x]) );

		let usedInvite: SimpleInvite | undefined;
		for (const comparingInvite of newInvites) {
			const oldInvite = oldInviteCache[comparingInvite.code];
			if (!oldInvite) {
				Log('ERROR', `Could not find invite in lookup | Guild ID : ${guild.id}, Invite Code : ${comparingInvite.code}`);
				continue;
			}

			if (oldInvite.uses !== comparingInvite.uses) {
				// Found a match :D
				usedInvite = comparingInvite;
				break;
			}
		}

		const buttons = {
			type: 1,
			components: [
				{
					type: 2,
					style: 2,
					label: 'Invite Info',
					custom_id: `invite-info_${usedInvite?.code}`,
					emoji: '📨',
					disabled: !usedInvite,
				},
				{
					type: 2,
					style: 2,
					label: "User Info",
					custom_id: `user-info_${member.user.id}`,
					emoji: '👤'
				}
			]
		}

		if (!usedInvite) {
			// no match
			if (guild.vanityURLCode !== null) {
				// assume vanity
				embed.description += `\n\n**Code**: \`${guild.vanityURLCode}\`\n\n__Note: This is a vanity URL, it cannot be managed.`;
			} else {
				// unknown invite
				embed.description += `\n
**Inviter**: \`Unknown\`
**Channel**: \`Unknown\`

${EMOJI.WARNING} I couldn't find the invite this person used`
			}
		} else {
			const owner = await GetUser(usedInvite.owner_id!) ?? null;
			const channel = client.channels.cache.get(usedInvite.channel_id!) ?? null;
			if (channel instanceof DMChannel || channel?.partial) throw new Error("Shut up typescript");
			embed.description += `\n
**Inviter**: ${usedInvite.owner_id ? owner ? `@${owner.username} (${owner.id})` : `\`Unknown\` (${usedInvite.owner_id})` : '`Unknown`'}
**channel**: ${usedInvite.channel_id ? channel ? `#${channel.name} (${channel.id})` : `\`Unknown\` (${usedInvite.channel_id})` : '`Unknown`'}

**Code**: \`${usedInvite.code}\` | **Uses**: \`${usedInvite.uses}\``
		}

		return SendLog(guild, {
			embeds: [embed],
			components: [buttons]
		});
	}
} as EventHandler;
import {EventHandler} from "../Typings/HandlerTypes";
import {GuildMember, PartialGuildMember} from "discord.js";
import {SaveGuild} from "../CRUD/Guild";
import {SaveMember, SaveUser} from "../CRUD/Users";
import {Database} from "../Database";

export default {
	name   : 'guildMemberRemove',
	execute: async function (member: GuildMember | PartialGuildMember): Promise<void> {
		const guild = member.guild;
		SaveGuild(guild);
		if (member.partial) {
			// uncached member, no join date available so leave that column alone
			SaveUser(member.user);
		} else {
			SaveMember(guild, member);
		}

		Database.prepare("UPDATE Members SET left_at = ? WHERE guild_id = ? AND id = ?")
		.run(~~(Date.now() / 1000), member.guild.id, member.user.id);
	}
} as EventHandler;
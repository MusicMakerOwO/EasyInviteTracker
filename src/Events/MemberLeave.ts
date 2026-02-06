import {EventHandler} from "../Typings/HandlerTypes";
import {GuildMember} from "discord.js";
import {SaveGuild} from "../CRUD/Guild";
import {SaveMember} from "../CRUD/Users";
import {Database} from "../Utils/Database";

export default {
	name: 'guildMemberRemove',
	execute: async function(client, member: GuildMember) {
		const guild = member.guild;
		SaveGuild(guild);
		SaveMember(guild, member);

		Database.prepare("UPDATE Members SET left_at = ? WHERE guild_id = ? AND id = ?").run(~~(Date.now()/1000), member.guild.id, member.user.id);
	}
} as EventHandler;
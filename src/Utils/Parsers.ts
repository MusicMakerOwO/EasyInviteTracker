import {AnonymousGuild, Invite, User} from "discord.js";
import {SimpleGuild, SimpleInvite, SimpleUser} from "../Typings/DatabaseTypes";

export function ParseInvite(invite: Invite): SimpleInvite {
	if (!invite.guild) throw new Error("Missing guild in invite object");

	if (invite.guild.vanityURLCode === invite.code) {
		throw new Error("Unable to save vanity invites");
	}

	return {
		code       : invite.code,
		guild_id   : invite.guild!.id,
		channel_id : invite.channelId,
		owner_id   : invite.inviterId,
		uses       : invite.uses ?? 0,
		created_at : invite.createdTimestamp ? ~~(invite.createdTimestamp/1000) : ~~(Date.now()/1000),
		expires_at : invite.expiresTimestamp ? ~~(invite.expiresTimestamp/1000) : null
	};
}

export function ParseUser(user: User): SimpleUser {
	return {
		id       : user.id,
		username : user.username,
		bot      : user.bot ? 1 : 0,
		icon_hash: user.avatar
	}
}

// The omitted fields are defined in the database and are thus not obtainable at this level
// See CRUD/Guild.ts for the full structure
export function ParseGuild(guild: AnonymousGuild): Pick<SimpleGuild, 'id' | 'name' | 'icon_hash' | 'vanity_code'> {
	return {
		id          : guild.id,
		name        : guild.name,
		icon_hash   : guild.icon,
		vanity_code : guild.vanityURLCode
	}
}
import {Log} from "../Log";
import {Guild} from "discord.js";
import {ParseInvite} from "../Parsers";
import {SimpleInvite} from "../../Typings/DatabaseTypes";
import {SaveUser} from "../../CRUD/Users";

export async function FetchInvites(guild: Guild): Promise<SimpleInvite[]> {
	try {
		var activeInvites = await guild.invites.fetch();
	} catch (error) {
		// @ts-ignore
		if (error.code === 50013) {
			Log('ERROR', `[~] Missing permissions to fetch invites in ${guild.name} (${guild.id})`);
		} else {
			Log('ERROR', `[~] Failed to fetch invites in ${guild.name} (${guild.id})`);
			Log('ERROR', error);
		}
		return [];
	}

	for (const invite of activeInvites.values()) {
		if (!invite.inviter) continue;
		SaveUser(invite.inviter)
	}

	return Array.from(activeInvites.values()).map(ParseInvite);
}
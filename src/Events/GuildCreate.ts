import {EventHandler} from "../Typings/HandlerTypes";
import {Guild} from "discord.js";
import {SyncInvitesForGuild} from "../Utils/SyncInvites";
import {SyncMembersForGuild} from "../Utils/SyncMemers";

export default {
	name   : 'guildCreate',
	execute: async (guild: Guild): Promise<void> => {
		// only emitted for guilds added after startup, everything else is synced on ready
		void SyncInvitesForGuild(guild);
		void SyncMembersForGuild(guild);
	}
} as EventHandler;

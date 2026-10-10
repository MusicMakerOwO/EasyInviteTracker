import { Client, Partials } from 'discord.js';
import {ButtonHandler, CommandHandler, ModalHandler, SelectMenuHandler} from "./Typings/HandlerTypes";
import config, {IConfig} from "./config";
import { FIFOCache } from "./Utils/FIFOCache";

interface IClient extends Client {
	config: IConfig;

	commands: Map<string, CommandHandler>;
	buttons: Map<string, ButtonHandler>;
	menus: Map<string, SelectMenuHandler>;
	modals: Map<string, ModalHandler>;

	/** invite code -> user who deleted (don't trust audit log) */
	invite_delete_ownership: FIFOCache<string, string>;
	/** invite codes currently being deleted by a purge, nothing to log for these */
	invite_purge_codes: Set<string>;
}

const client = new Client({
	intents: [
		'Guilds',
		'GuildInvites',
		'GuildMembers',
	],
	// members who joined before startup are not cached, without this their leave events are dropped
	partials: [
		Partials.GuildMember,
	]
}) as IClient;

client.config = config;
client.commands = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();

client.invite_delete_ownership = new FIFOCache(10);
client.invite_purge_codes = new Set();

export { client, IClient }
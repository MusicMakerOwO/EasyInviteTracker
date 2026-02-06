import { Client } from 'discord.js';
import {ButtonHandler, CommandHandler, ModalHandler, SelectMenuHandler} from "./Typings/HandlerTypes";
import config, {IConfig} from "./config";

interface IClient extends Client {
	config: IConfig;

	commands: Map<string, CommandHandler>;
	buttons: Map<string, ButtonHandler>;
	menus: Map<string, SelectMenuHandler>;
	modals: Map<string, ModalHandler>;
	context: Map<string, CommandHandler>;

	/** invite code -> user who deleted (don't trust audit log) */
	invite_delete_ownership: Map<string, string>;
}

const client = new Client({
	intents: [
		'Guilds',
		'GuildInvites',
		'GuildMembers',
	]
}) as IClient;

client.config = config;
client.commands = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();
client.context = new Map();

client.invite_delete_ownership = new Map();

export { client, IClient }
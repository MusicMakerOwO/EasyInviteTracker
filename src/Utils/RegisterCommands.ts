import config from '../config';
import https from 'node:https';
import { Log } from './Log';
import {InteractionContextType, SlashCommandBuilder} from "discord.js";
import { IClient } from "../Client";

// This is all that the Routes.applicationCommands() method does, but we don't need the extra dependency if it's literally just a string lmao
// https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
const PUBLIC_ROUTE = `https://discord.com/api/v10/applications/${config.APP_ID}/commands`;

const DEFAULT_COMMAND_ACCESS = [ InteractionContextType.Guild ];

export async function RegisterCommands(client: IClient) {

	Log('INFO', `Started refreshing application (/) commands`);

	const commands = [];
	const commandNames: string[] = [];
	const localCommands = [...client.commands.values(), ...client.context.values()];
	for (let i = 0; i < localCommands.length; i++) {
		const command = localCommands[i];
		const commandData: ReturnType<SlashCommandBuilder['toJSON']> = command.data instanceof SlashCommandBuilder ? command.data.toJSON() : command.data;

		if (commandNames.includes(commandData.name)) continue;

		commandNames.push(commandData.name);
		commandData.contexts ??= DEFAULT_COMMAND_ACCESS;
		commands.push(commandData);
	}

	try {
		await MakeRequest('PUT', PUBLIC_ROUTE, commands);
		Log('INFO', `Successfully reloaded application (/) commands`);
	} catch (error) {
		Log('ERROR', error);
	}
}

async function MakeRequest(method: Capitalize<string>, route: string, body?: unknown): Promise<any> {
	return new Promise((resolve, reject) => {
		const req = https.request(route, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${config.TOKEN}`
			}
		});
		req.on('error', error => reject(error));
		req.on('timeout', () => reject(new Error('Request timed out')));
		req.on('response', res => {
			const data: string[] = [];
			res.on('data', data.push.bind(data));
			res.on('end', () => {
				try {
					if (!res.statusCode) throw new Error('No status code returned - This is likely a network error');
					if (res.statusCode < 200 || res.statusCode >= 300) {
						const response = JSON.parse(data.join(''));
						throw new Error(`[ Discord API : ${res.statusCode}] ${response.message}`);
					}
					resolve(JSON.parse(data.join('')));
				} catch(error) {
					reject(error);
				}
			});
		});
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}
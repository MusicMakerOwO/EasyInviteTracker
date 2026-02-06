import fs from 'fs';
import { Events } from './DiscordConstants';
import { ReadFolder } from './ReadFolder';
import { Log } from './Log';

import config from '../config';
import {IClient} from "../Client";
import {EventHandler} from "../Typings/HandlerTypes";

const IGNORED_EVENTS: string[] = []

export function EventLoader(client: IClient, folderPath: string) {
	if (!fs.existsSync(`${__dirname}/../${folderPath}`)) {
		Log('WARN', 'Events folder not found, skipping...');
		return;
	}

	const filePaths = ReadFolder(`${__dirname}/../${folderPath}`);

	for (let i = 0; i < filePaths.length; i++) {
		const path = filePaths[i];
		if (!path.endsWith('.js')) continue;

		let data = require(path) as { default: EventHandler } | EventHandler;
		if ('default' in data) data = data.default;

		try {
			if (!data.name) throw new Error(`Event is missing a name!`);
			if (typeof data.name !== 'string') throw new Error(`Event name must be a string!`);

			if (config.CHECK_EVENT_NAMES && !IGNORED_EVENTS.includes(data.name) && !Object.values(Events).includes(data.name)) {
				Log('WARN', `Possibly invalid event name "${data.name}" - Unless it is a custom event this will never be called!`);
			}

			if (typeof data.execute !== 'function') throw new Error(`Event is missing an execute function!`);

			const callback = data.execute.bind(null, client);
			// @ts-ignore - complaining that I don't support all possible events
			if (data.once) client.once(data.name, callback);
			// @ts-ignore
			else client.on(data.name, callback);
		} catch (error) {
			Log('ERROR', `Failed to load event ${path}`);
			Log('ERROR', error);
		}
	}
};
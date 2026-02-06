import { ReadFolder } from './ReadFolder';
import { existsSync } from 'node:fs';
import { SlashCommandBuilder } from 'discord.js';
import {ButtonHandler, CommandHandler, ModalHandler, SelectMenuHandler} from "../Typings/HandlerTypes";

type ComponentHandler = CommandHandler | ButtonHandler | SelectMenuHandler | ModalHandler;

export function ComponentLoader(folder: string, cache: Map<string, ComponentHandler>) {
	if (typeof folder !== 'string') throw new TypeError(`Folder must be a string - Received ${typeof folder}`);

	if (!existsSync(`${__dirname}/../${folder}`)) {
		throw new Error(`No "${folder}" folder found`);
	}

	const filePaths = ReadFolder(`${__dirname}/../${folder}`);
	for (let i = 0; i < filePaths.length; i++) {
		if (!filePaths[i].endsWith('.js')) continue;

		try {
			let data = require(filePaths[i]) as { default: ComponentHandler } | ComponentHandler;
			if ('default' in data) {
				data = data.default;
			}

			if (!data.execute) throw `No execute function found`;
			if (typeof data.execute !== 'function') throw `Execute is not a function`;

			if ('aliases' in data) {
				if (!Array.isArray(data.aliases) && typeof data.aliases !== 'string') throw 'Invalid alias type - Must be a string or an array';
				for (let i = 0; i < data.aliases.length; i++) {
					const alias = data.aliases[i];
					if (typeof alias !== 'string') throw 'Invalid alias - Must be a string';
					if (alias.length > 32) throw 'Alias is too long - Must be less than 32 characters';
					if (alias.includes(' ')) throw 'Alias cannot contain spaces';
				}
			}

			const type = PredictComponentType(data);

			switch (type) {
				// @ts-expect-error - Intential fallthrough
				case 'command':
					data = data as CommandHandler;
					if ('aliases' in data) {
						for (let i = 0; i < data.aliases.length; i++) {
							const alias = data.aliases[i];
							addComponent(cache, alias, {
								... data,
								// @ts-expect-error - Overriding name
								data: { ... data.data, name: alias }
							}, filePaths[i]);
						}
					}
					// fallthrough to context since they share the same structure
				case 'context':
					data = data as CommandHandler;
					if (!data.data) throw 'No data property found';
					addComponent(cache, data.data.name, data, filePaths[i]);
					break;
				case 'component':
					data = data as ButtonHandler | SelectMenuHandler | ModalHandler;
					if (!data.customID) throw 'No custom ID has been set';
					if (typeof data.customID !== 'string') throw 'Invalid custom ID type - Must be string';
					addComponent(cache, data.customID, data, filePaths[i]);
					break;
			}
		} catch (error) {
			console.error(`[${folder.toUpperCase()}] Failed to load ./${filePaths[i]}:`, error);
		}

	}
};

function PredictComponentType(data: ComponentHandler): 'command' | 'context' | 'component' | 'message' | 'unknown' {
	if ('data' in data && typeof data.data === 'object') {
		return data.data instanceof SlashCommandBuilder ? 'command' : 'context';
	}
	if ('customID' in data && typeof data.customID === 'string') return 'component';
	if ('name' in data && typeof data.name === 'string') return 'message';
	return 'unknown';
}

function addComponent(cache: Map<string, any>, id: string, data: ComponentHandler, filePath: string) {
	const duplicateIDs = [];

	if (cache.has(id)) duplicateIDs.push(id);
	cache.set(id, data);

	if (duplicateIDs.length > 0) throw `Duplicate IDs found: ${duplicateIDs.join(', ')}`;
};
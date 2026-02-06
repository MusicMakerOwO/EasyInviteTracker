import {Log} from "./Utils/Log";

export type IConfig = {
	TOKEN: string;
	APP_ID: string;

	DEV_MODE: boolean;

	HOT_RELOAD: boolean;
	PROCESS_HANDLERS: boolean;
	CHECK_INTENTS: boolean;
	CHECK_EVENT_NAMES: boolean;
	REGISTER_COMMANDS: boolean;
	FANCY_ERRORS: boolean;
}

const ConfigTemplate: { [K in keyof IConfig]: IConfig[K] extends string ? 'string' : 'boolean' } = {
	TOKEN: 'string',
	APP_ID: 'string',

	DEV_MODE: 'boolean',

	HOT_RELOAD: 'boolean',
	PROCESS_HANDLERS: 'boolean',
	CHECK_INTENTS: 'boolean',
	CHECK_EVENT_NAMES: 'boolean',
	REGISTER_COMMANDS: 'boolean',
	FANCY_ERRORS: 'boolean'
}

const config = require('../config.json') as IConfig;

for (const [key, type] of Object.entries(ConfigTemplate)) {
	if (!(key in config)) {
		Log('ERROR', `[~] Missing ${key} in config.json`);
		process.exit(1);
	}

	// @ts-ignore - The key will always be valid here
	if (typeof config[key] !== type) {
		// @ts-ignore
		Log('ERROR', `[~] Expected ${key} to be a ${type} in config.json - Got ${typeof config[key]} instead`);
		process.exit(1);
	}
}

export default config;
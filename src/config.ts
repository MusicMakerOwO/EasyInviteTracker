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

/* eslint-disable @typescript-eslint/no-require-imports */
const config = require('../config.json') as IConfig;
/* eslint-enable @typescript-eslint/no-require-imports */

for (const [key, type] of Object.entries(ConfigTemplate) as [ keyof typeof ConfigTemplate, 'string' | 'boolean' ][]) {
	if (!(key in config)) {
		Log('ERROR', `[~] Missing ${key} in config.json`);
		process.exit(1);
	}

	if (typeof config[key] !== type) {
		Log('ERROR', `[~] Expected ${key} to be a ${type} in config.json - Got ${typeof config[key]} instead`);
		process.exit(1);
	}
}

export default config;
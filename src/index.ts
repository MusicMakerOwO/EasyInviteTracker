import {SyncMembersForGuild} from "./Utils/SyncMemers";

const preloadStart = process.hrtime.bigint();

import "source-map-support/register";

import { existsSync } from 'node:fs';

import config from './config';
import { Log } from './Utils/Log';
import { ComponentLoader } from './Utils/ComponentLoader';
import { EventLoader } from './Utils/EventLoader';
import { RegisterCommands } from './Utils/RegisterCommands';
import { TaskScheduler } from "./Utils/TaskScheduler";
import { Database } from "./Utils/Database";
import { ActivityType } from "discord.js";

const preloadEnd = process.hrtime.bigint();
const preloadTime = Number(preloadEnd - preloadStart) / 1e6;
Log('DEBUG', `Preload time: ${~~preloadTime}ms`);

import { client } from './Client';
import {SyncInvitesForGuild} from "./Utils/SyncInvites";

client.config = config;

// These are all empty but need to be defined for the ComponentLoader
// They will be populated automatically, see below
client.commands = new Map();
client.context = new Map();
client.buttons = new Map();
client.menus = new Map();
client.modals = new Map();

// file path : [component type, component cache]
const COMPONENT_FOLDERS = {
	'./Commands': client.commands,
	'./Buttons' : client.buttons,
	'./Menus'   : client.menus,
	'./Modals'  : client.modals,
	'./Context' : client.context,

	'./Events'  : null // handled separately
}

for (const [path, cache] of Object.entries(COMPONENT_FOLDERS)) {
	const fullPath = `${__dirname}/${path}`;
	if (cache === null) {
		ResetEvents(path);
		continue;
	}

	if (!cache) {
		Log('ERROR', `No cache found for ${path}`);
		continue;
	}

	if (!existsSync(fullPath)) {
		Log('ERROR', `The '${path.split('/')[1]}' folder does not exist - Check the relative path!`);
		delete COMPONENT_FOLDERS[path as keyof typeof COMPONENT_FOLDERS]; // remove it from the lookup so it doesn't get checked later
		continue;
	}

	ComponentLoader(path, cache);
	Log('DEBUG', `Loaded ${cache.size} ${path.split('/')[1]}`);
}

RegisterCommands(client);

function ResetEvents(path: string) {
	client.removeAllListeners();
	EventLoader(client, path);
	let ListenerCount = 0;
	// @ts-ignore - Accessing private properties, still valid JS though
	for (const listeners of Object.values(client._events)) {
		// @ts-ignore
		ListenerCount += listeners.length;
	}
	Log('DEBUG', `Loaded ${ListenerCount} events`);
}

Log('INFO', `Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
	Log('DEBUG', `Logged in as ${client.user!.tag}!`);

	for (const guild of client.guilds.cache.values()) {
		SyncInvitesForGuild(guild);
		SyncMembersForGuild(guild);
	}

	TaskScheduler.schedule(RefreshServers, 60 * 60 * 1000); // every hour
	TaskScheduler.schedule(RefreshStatus, 10 * 1000, 60 * 1000);
});

async function RefreshServers() {
	const currentHour = new Date().getHours(); // 0-23
	for (const [id, guild] of client.guilds.cache) {
		// every server gets a dedicated hour to refresh
		if (Number(BigInt(id) % 24n) === currentHour) {
			SyncInvitesForGuild(guild);
		}
	}
}

async function RefreshStatus() {
	const totalInvites = Database.prepare("SELECT COUNT(*) FROM Invites").pluck().get() as number;

	client.user!.setActivity(`${totalInvites} invites`, { type: ActivityType.Watching });
}

async function Shutdown() {
	console.log();

	Log('WARN', 'Shutting down...');
	await client.destroy();

	Log('WARN', 'Stopping tasks...');
	TaskScheduler.destroy();

	Log('WARN', 'Optimising database...');
	Database.pragma('analysis_limit = 8000');
	Database.exec('ANALYZE'); // Optimise the database and add indecies
	Database.close();

	process.exit(0);
}

process.on('SIGINT', Shutdown); // ctrl+c
process.on('SIGTERM', Shutdown); // docker stop

// ctrl+z is not a graceful shutdown, it's a pause but we don't want to pause lol
process.on('SIGTSTP', Shutdown);

// standard uncaught errors
process.on('uncaughtException', Log.bind(null, 'ERROR'));
process.on('unhandledRejection', Log.bind(null, 'ERROR'));
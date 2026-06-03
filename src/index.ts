
const preloadStart = process.hrtime.bigint();

import "source-map-support/register";

import { Log } from './Utils/Log';
import { RegisterCommands } from './Utils/RegisterCommands';
import { TaskScheduler } from "./Utils/TaskScheduler";
import { Database } from "./Database";
import { ActivityType } from "discord.js";
import { client } from './Client';
import { SyncInvitesForGuild } from "./Utils/SyncInvites";
import { SyncMembersForGuild } from "./Utils/SyncMemers";

const preloadEnd = process.hrtime.bigint();
const preloadTime = Number(preloadEnd - preloadStart) / 1e6;
Log('DEBUG', `Preload time: ${~~preloadTime}ms`);

import * as Commands from "./Commands";
import * as Buttons from "./Buttons";
import * as Menus from "./Menus";
import * as Events from "./Events";

for (const command of Object.values(Commands)) {
	client.commands.set(command.data.name, command);
	if ('aliases' in command) {
		for (const alias of command.aliases) {
			client.commands.set(alias, command);
		}
	}
}
for (const button of Object.values(Buttons)) {
	client.buttons.set(button.customID, button);
}
for (const menu of Object.values(Menus)) {
	client.menus.set(menu.customID, menu);
}
for (const event of Object.values(Events)) {
	client.on(event.name, event.execute);
}

void RegisterCommands(client);

Log('INFO', `Logging in...`);
void client.login(client.config.TOKEN);
client.on('ready', function () {
	Log('DEBUG', `Logged in as ${client.user!.tag}!`);

	for (const guild of client.guilds.cache.values()) {
		void SyncInvitesForGuild(guild);
		void SyncMembersForGuild(guild);
	}

	TaskScheduler.schedule(RefreshServers, 60 * 60 * 1000); // every hour
	TaskScheduler.schedule(RefreshStatus, 10 * 1000, 60 * 1000);
});

async function RefreshServers() {
	const currentHour = new Date().getHours(); // 0-23
	for (const [id, guild] of client.guilds.cache) {
		// every server gets a dedicated hour to refresh
		if (Number(BigInt(id) % 24n) === currentHour) {
			void SyncInvitesForGuild(guild);
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

// ctrl+z is not a graceful shutdown, it's a pause, but we don't want to pause lol
process.on('SIGTSTP', Shutdown);

// standard uncaught errors
process.on('uncaughtException', Log.bind(null, 'ERROR'));
process.on('unhandledRejection', Log.bind(null, 'ERROR'));
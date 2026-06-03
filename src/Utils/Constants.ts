export const ROOT_FOLDER = __dirname + '/..';

export const DB_SETUP_FILE = `${ROOT_FOLDER}/../DB_SETUP.sql`;
export const DB_FILE = `${ROOT_FOLDER}/../database.sqlite`;

export const SECONDS = {
	MINUTE : 60,
	HOUR   : 60 * 60,
	DAY    : 60 * 60 * 24,
	WEEK   : 60 * 60 * 24 * 7,
	MONTH  : 60 * 60 * 24 * 30,
	YEAR   : 60 * 60 * 24 * 365
} as const;

export const COLOR = {
	PRIMARY       : 0x039BE5, // light blue
	ERROR         : 0xFF0000,

	MEMBER_JOIN   : 0x43B581, // green

	INVITE_CREATE : 0x5378FF, // light blue
	INVITE_DELETE : 0xF44336, // red
} as const;

export const EMOJI = {
	ERROR   : '❌',
	FATAL   : '💔',
	WARNING : '⚠️',
	CANCEL  : '🗑️',
	SUCCESS : '🔌',
	LOADING : '📡'
} as const;

export const INVITE_PURGE_REASON = "Purging invites";
export const MAX_INVITES_PER_GUILD = 300;
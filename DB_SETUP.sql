CREATE TABLE IF NOT EXISTS Guilds (
	id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon_hash TEXT, -- null = no icon
	log_channel TEXT, -- null = no logs :(
    last_sync INTEGER NOT NULL DEFAULT 0,
    vanity_code TEXT -- null = no vanity link provided
) STRICT;

CREATE TABLE IF NOT EXISTS Users (
	id TEXT PRIMARY KEY,
	username TEXT NOT NULL,
	bot INTEGER NOT NULL,
    icon_hash TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS Members (
	id TEXT NOT NULL,
	guild_id TEXT NOT NULL,
	joined_at INTEGER NOT NULL,
	left_at INTEGER, -- null = still in guild
	PRIMARY KEY (id, guild_id)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_members_guild_id ON Members(guild_id);

CREATE TABLE IF NOT EXISTS Invites (
	code TEXT NOT NULL PRIMARY KEY,
	guild_id TEXT NOT NULL,
	channel_id TEXT,
	owner_id TEXT,
	uses INTEGER NOT NULL,
	created_at INTEGER NOT NULL, -- UNIX timestamp
	expires_at INTEGER -- null = never expires
) STRICT;
CREATE INDEX IF NOT EXISTS idx_invites_guild_id ON Invites(guild_id);
CREATE INDEX IF NOT EXISTS idx_invites_owner_id ON Invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON Invites(code);

-- clear on restart
DELETE FROM Invites;
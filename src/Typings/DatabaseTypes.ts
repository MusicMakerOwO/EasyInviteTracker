export type SimpleInvite = {
	code: string,
	guild_id: string,
	channel_id: string | null,
	owner_id: string | null,
	uses: number,
	/** Unix epoch in seconds */
	created_at: number,
	/** Unix epoch in seconds */
	expires_at: number | null,
}

export type SimpleUser = {
	id: string,
	username: string,
	bot: 1 | 0,
	icon_hash: string | null,
}

export type SimpleMember = {
	id: string,
	guild_id: string,
	joined_at: number | undefined,
	left_at: number | undefined,
}

export type SimpleGuild = {
	id: string,
	name: string,
	icon_hash: string | null,
	log_channel: string | null,
	last_sync: number,
	vanity_code: string | null,
}
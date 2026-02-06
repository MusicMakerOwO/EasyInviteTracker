import {
	AutocompleteInteraction,
	ButtonInteraction,
	ChatInputCommandInteraction,
	Interaction,
	SlashCommandBuilder
} from "discord.js";
import {IClient} from "../Client";
import {ObjectValues} from "./Helpers";
import {Events} from "../Utils/DiscordConstants";

export interface CommandHandler {
	data: SlashCommandBuilder;
	aliases?: string[];
	autocomplete?: (interaction: AutocompleteInteraction, client: IClient) => Promise<any>;
	execute: (interaction: ChatInputCommandInteraction, client: IClient) => Promise<any>;
}

export interface ButtonHandler {
	customID: string;
	execute: (interaction: ButtonInteraction, client: IClient, args: string[]) => Promise<any>;
}

export interface SelectMenuHandler {
	customID: string;
	execute: (interaction: Interaction, client: IClient, args: string[]) => Promise<any>;
}

export interface ModalHandler {
	customID: string;
	execute: (interaction: Interaction, client: IClient, args: string[]) => Promise<any>;
}

export interface EventHandler {
	name: ObjectValues<typeof Events>;
	once?: boolean;
	execute: (client: IClient, ...args: any[]) => Promise<any>;
}
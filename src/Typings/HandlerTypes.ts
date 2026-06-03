import {
	AutocompleteInteraction,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ModalSubmitInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	StringSelectMenuInteraction
} from "discord.js";
import { IClient } from "../Client";

export interface CommandHandler {
	data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	aliases?: string[];
	autocomplete?: (interaction: AutocompleteInteraction, client: IClient) => Promise<unknown>;
	execute: (interaction: ChatInputCommandInteraction, client: IClient) => Promise<unknown>;
}

export interface ButtonHandler {
	customID: string;
	execute: (interaction: ButtonInteraction, client: IClient, args: string[]) => Promise<unknown>;
}

export interface SelectMenuHandler {
	customID: string;
	execute: (interaction: StringSelectMenuInteraction, client: IClient, args: string[]) => Promise<unknown>;
}

export interface ModalHandler {
	customID: string;
	execute: (interaction: ModalSubmitInteraction, client: IClient, args: string[]) => Promise<unknown>;
}

export interface EventHandler {
	name: string;
	once?: boolean;
	execute: (client: IClient, ... args: unknown[]) => Promise<unknown>;
}
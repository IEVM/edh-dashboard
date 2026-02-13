import type { Deck, Games, Stats } from '$lib/data/restructure';

export type DeckStatsRow = {
	id: string;
	name: string;
	games: number;
	wins: number;
	losses: number;
	winRate: number;
	usagePercent: number;
	avgFunSelf: number | null;
	avgFunOthers: number | null;
};

export type DashboardStats = {
	stats: Stats | null;
	deckStats: DeckStatsRow[];
};

export type DeckInput = {
	deckName: string;
	targetBracket: number | null;
	summary: string | null;
	archidektLink: string | null;
};

export type GameInput = {
	deckName: string;
	winner: number | null;
	fun: number | null;
	p2Fun: number | null;
	p3Fun: number | null;
	p4Fun: number | null;
	notes: string | null;
	estBracket: number | null;
};

export type DeckUpdateInput = DeckInput & {
	deckId: string;
	originalName: string;
};

export type GameUpdateInput = GameInput & {
	gameId: string;
};

export class DataManagerError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export abstract class DataManager {
	abstract getDecks(): Promise<Deck[]>;
	abstract getGames(): Promise<Games>;
	abstract getDeckById(deckId: string): Promise<Deck | null>;
	abstract getDashboardStats(): Promise<DashboardStats>;
	abstract appendDeck(input: DeckInput): Promise<void>;
	abstract appendGame(input: GameInput): Promise<void>;
	abstract updateDeck(input: DeckUpdateInput): Promise<void>;
	abstract updateGame(input: GameUpdateInput): Promise<void>;
	abstract deleteGame(gameId: string): Promise<void>;
	abstract deleteDeck(deckId: string, deckName: string): Promise<number>;
}

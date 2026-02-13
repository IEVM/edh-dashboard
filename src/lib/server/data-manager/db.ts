import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import {
	getDeckJson,
	getGamesJsonFromRows,
	withGames,
	withStatsFromGames,
	type Deck,
	type Games
} from '$lib/data/restructure';
import { E2E_DECKS_SHEET, E2E_GAMES_SHEET } from '$lib/server/e2e-fixtures';
import { ensureUserProfile, type UserProfile } from '$lib/server/google';
import { getSessionData } from '$lib/server/session';
import {
	DataManager,
	DataManagerError,
	type DeckInput,
	type DeckUpdateInput,
	type GameInput,
	type GameUpdateInput
} from './base';

type SqlClient = typeof import('@vercel/postgres').sql;
let sqlClient: SqlClient | null = null;

const getSql = async () => {
	if (!env.POSTGRES_URL) {
		throw new DataManagerError('Database not configured', 500);
	}

	if (!sqlClient) {
		const mod = await import('@vercel/postgres');
		sqlClient = mod.sql;
	}

	return sqlClient;
};

export class DbDataManager extends DataManager {
	spreadsheetId = 'db';
	private user: UserProfile;
	private useFixtures: boolean;

	private constructor(user: UserProfile, useFixtures: boolean) {
		super();
		this.user = user;
		this.useFixtures = useFixtures;
	}

	static async create(sessionId: string) {
		let user = await getSessionData<UserProfile>(sessionId, 'userProfile');
		if (!user?.id) {
			user = await ensureUserProfile(sessionId);
		}
		if (!user?.id) {
			throw new DataManagerError('Not authenticated', 401);
		}

		const useFixtures = env.E2E_TEST_MODE === '1';
		const manager = new DbDataManager(user, useFixtures);

		if (!useFixtures) {
			const sql = await getSql();
			await sql`
				insert into users (id, email, name, avatar_url)
				values (${user.id}, ${user.email}, ${user.name}, ${user.picture})
				on conflict (id) do update
				set email = excluded.email,
					name = excluded.name,
					avatar_url = excluded.avatar_url,
					updated_at = now()
			`;
		}

		return manager;
	}

	private fixtureDecks(): Deck[] {
		const [headerRow, ...rows] = E2E_DECKS_SHEET;
		return rows.map((row, index) => ({
			...getDeckJson([headerRow, row]),
			id: `deck-${index + 1}`
		}));
	}

	private fixtureGames(): Games {
		const headerRow = E2E_GAMES_SHEET[0];
		const rows = E2E_GAMES_SHEET.slice(1).map((row, index) => ({
			rowNumber: index + 2,
			row
		}));

		return getGamesJsonFromRows(headerRow, rows);
	}

	async getDecks(): Promise<Deck[]> {
		if (this.useFixtures) {
			return this.fixtureDecks();
		}

		const sql = await getSql();
		const { rows } = await sql`
			select id, name, target_bracket, summary, archidekt_link
			from decks
			where user_id = ${this.user.id}
			order by name asc
		`;

		return rows.map((row) => ({
			id: row.id,
			deckName: row.name,
			targetBracket: row.target_bracket ?? null,
			summary: row.summary ?? null,
			archidektLink: row.archidekt_link ?? null
		}));
	}

	async getGames(): Promise<Games> {
		if (this.useFixtures) {
			return this.fixtureGames();
		}

		const sql = await getSql();
		const { rows } = await sql`
			select g.id,
				g.winner,
				g.fun,
				g.p2_fun,
				g.p3_fun,
				g.p4_fun,
				g.notes,
				g.est_bracket,
				d.name as deck_name
			from games g
			join decks d on d.id = g.deck_id
			where g.user_id = ${this.user.id}
			order by g.created_at asc
		`;

		return rows.map((row) => ({
			id: row.id,
			deck: row.deck_name ?? '',
			winner: row.winner ?? null,
			fun: row.fun ?? null,
			p2Fun: row.p2_fun ?? null,
			p3Fun: row.p3_fun ?? null,
			p4Fun: row.p4_fun ?? null,
			notes: row.notes ?? null,
			estBracket: row.est_bracket ?? null
		}));
	}

	async getDeckByName(name: string): Promise<Deck | null> {
		if (this.useFixtures) {
			const deck = this.fixtureDecks().find((d) => d.deckName === name);
			if (!deck) return null;
			return withStatsFromGames(withGames(deck, E2E_GAMES_SHEET));
		}

		const sql = await getSql();
		const { rows: deckRows } = await sql`
			select id, name, target_bracket, summary, archidekt_link
			from decks
			where user_id = ${this.user.id}
				and name = ${name}
			limit 1
		`;

		if (!deckRows.length) return null;

		const deck: Deck = {
			id: deckRows[0].id,
			deckName: deckRows[0].name,
			targetBracket: deckRows[0].target_bracket ?? null,
			summary: deckRows[0].summary ?? null,
			archidektLink: deckRows[0].archidekt_link ?? null
		};

		const { rows: gameRows } = await sql`
			select id,
				winner,
				fun,
				p2_fun,
				p3_fun,
				p4_fun,
				notes,
				est_bracket
			from games
			where user_id = ${this.user.id}
				and deck_id = ${deck.id}
			order by created_at asc
		`;

		const games: Games = gameRows.map((row) => ({
			id: row.id,
			deck,
			winner: row.winner ?? null,
			fun: row.fun ?? null,
			p2Fun: row.p2_fun ?? null,
			p3Fun: row.p3_fun ?? null,
			p4Fun: row.p4_fun ?? null,
			notes: row.notes ?? null,
			estBracket: row.est_bracket ?? null
		}));

		return withStatsFromGames({ ...deck, games });
	}

	async appendDeck(input: DeckInput): Promise<void> {
		if (this.useFixtures) return;

		const sql = await getSql();
		await sql`
			insert into decks (id, user_id, name, target_bracket, summary, archidekt_link)
			values (
				${randomUUID()},
				${this.user.id},
				${input.deckName},
				${input.targetBracket},
				${input.summary},
				${input.archidektLink}
			)
		`;
	}

	async appendGame(input: GameInput): Promise<void> {
		if (this.useFixtures) return;

		const sql = await getSql();
		const { rows } = await sql`
			select id from decks
			where user_id = ${this.user.id}
				and name = ${input.deckName}
			limit 1
		`;

		if (!rows.length) {
			throw new DataManagerError('Deck not found', 404);
		}

		await sql`
			insert into games (
				id,
				user_id,
				deck_id,
				winner,
				fun,
				p2_fun,
				p3_fun,
				p4_fun,
				notes,
				est_bracket
			)
			values (
				${randomUUID()},
				${this.user.id},
				${rows[0].id},
				${input.winner},
				${input.fun},
				${input.p2Fun},
				${input.p3Fun},
				${input.p4Fun},
				${input.notes},
				${input.estBracket}
			)
		`;
	}

	async updateDeck(input: DeckUpdateInput): Promise<void> {
		if (this.useFixtures) return;

		const sql = await getSql();
		const result = await sql`
			update decks
			set name = ${input.deckName},
				target_bracket = ${input.targetBracket},
				summary = ${input.summary},
				archidekt_link = ${input.archidektLink},
				updated_at = now()
			where user_id = ${this.user.id}
				and id = ${input.deckId}
		`;

		if (!result.rowCount) {
			throw new DataManagerError('Deck not found', 404);
		}
	}

	async updateGame(input: GameUpdateInput): Promise<void> {
		if (this.useFixtures) return;

		const sql = await getSql();
		const result = await sql`
			update games
			set winner = ${input.winner},
				fun = ${input.fun},
				p2_fun = ${input.p2Fun},
				p3_fun = ${input.p3Fun},
				p4_fun = ${input.p4Fun},
				notes = ${input.notes},
				est_bracket = ${input.estBracket}
			where user_id = ${this.user.id}
				and id = ${input.gameId}
		`;

		if (!result.rowCount) {
			throw new DataManagerError('Game not found', 404);
		}
	}

	async deleteGame(gameId: string): Promise<void> {
		if (this.useFixtures) return;

		const sql = await getSql();
		const result = await sql`
			delete from games
			where user_id = ${this.user.id}
				and id = ${gameId}
		`;

		if (!result.rowCount) {
			throw new DataManagerError('Game not found', 404);
		}
	}

	async deleteDeck(deckId: string, _deckName: string): Promise<number> {
		if (this.useFixtures) return 0;

		const sql = await getSql();
		const { rows } = await sql`
			select count(*)::int as count
			from games
			where user_id = ${this.user.id}
				and deck_id = ${deckId}
		`;

		const result = await sql`
			delete from decks
			where user_id = ${this.user.id}
				and id = ${deckId}
		`;

		if (!result.rowCount) {
			throw new DataManagerError('Deck not found', 404);
		}

		return rows[0]?.count ?? 0;
	}
}

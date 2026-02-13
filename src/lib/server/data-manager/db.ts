import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import {
	getDeckJson,
	getGamesJsonFromRows,
	statsFromGames,
	withGames,
	type Deck,
	type Games,
	type Stats
} from '$lib/data/restructure';
import { E2E_DECKS_SHEET, E2E_GAMES_SHEET } from '$lib/server/e2e-fixtures';
import type { AuthUser } from '$lib/server/auth';
import { getPrisma } from '$lib/server/prisma';
import {
	DataManager,
	DataManagerError,
	type DashboardStats,
	type DeckInput,
	type DeckStatsRow,
	type DeckUpdateInput,
	type GameInput,
	type GameUpdateInput
} from './base';

export class DbDataManager extends DataManager {
	private user: AuthUser;
	private useFixtures: boolean;

	private constructor(user: AuthUser, useFixtures: boolean) {
		super();
		this.user = user;
		this.useFixtures = useFixtures;
	}

	static async create(user: AuthUser) {
		const useFixtures = env.E2E_TEST_MODE === '1';
		const manager = new DbDataManager(user, useFixtures);

		if (!useFixtures) {
			const isVercel = env.VERCEL === '1' || env.VERCEL === 'true';
			const hasOverride = !isVercel && !!env.POSTGRES_URL_OVERRIDE;
			if (
				!hasOverride &&
				!env.POSTGRES_URL_NON_POOLING &&
				!env.POSTGRES_PRISMA_URL &&
				(!isVercel && !env.POSTGRES_URL)
			) {
				throw new DataManagerError('Database not configured', 500);
			}

			const prisma = getPrisma();
			await prisma.user.upsert({
				where: { id: user.id },
				create: {
					id: user.id,
					email: user.email ?? null,
					name: user.name ?? null,
					avatarUrl: user.picture ?? null
				},
				update: {
					email: user.email ?? null,
					name: user.name ?? null,
					avatarUrl: user.picture ?? null
				}
			});
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

	private toNumber(value: unknown): number | null {
		if (value === null || value === undefined) return null;
		const n = Number(value);
		return Number.isNaN(n) ? null : n;
	}

	private toInt(value: unknown): number {
		const n = Number(value ?? 0);
		return Number.isNaN(n) ? 0 : n;
	}

	private statsFromRow(row: Record<string, unknown>): Stats | null {
		const totalGames = this.toInt(row.total_games);
		if (!totalGames) return null;

		const wins = this.toInt(row.wins);
		const losses = this.toInt(row.losses);
		const expectedWins = this.toNumber(row.expected_wins) ?? 0;

		return {
			totalGames,
			wins,
			losses,
			winRate: totalGames ? wins / totalGames : 0,
			expectedWinrate: totalGames ? expectedWins / totalGames : 0,
			avgFunSelf: this.toNumber(row.avg_fun_self),
			stdFunSelf: this.toNumber(row.std_fun_self),
			avgFunOthers: this.toNumber(row.avg_fun_others),
			avgFunWins: this.toNumber(row.avg_fun_wins),
			avgFunLosses: this.toNumber(row.avg_fun_losses),
			avgEstBracket: this.toNumber(row.avg_est_bracket)
		};
	}

	private db() {
		return getPrisma();
	}

	async getDecks(): Promise<Deck[]> {
		if (this.useFixtures) {
			return this.fixtureDecks();
		}

		const prisma = this.db();
		const decks = await prisma.deck.findMany({
			where: { userId: this.user.id },
			orderBy: { name: 'asc' }
		});

		return decks.map((deck) => ({
			id: deck.id,
			deckName: deck.name,
			targetBracket: deck.targetBracket ?? null,
			summary: deck.summary ?? null,
			archidektLink: deck.archidektLink ?? null
		}));
	}

	async getGames(): Promise<Games> {
		if (this.useFixtures) {
			return this.fixtureGames();
		}

		const prisma = this.db();
		const games = await prisma.game.findMany({
			where: { userId: this.user.id },
			orderBy: { createdAt: 'asc' },
			include: { deck: { select: { name: true } } }
		});

		return games.map((game) => ({
			id: game.id,
			deck: game.deck?.name ?? '',
			winner: game.winner ?? null,
			fun: game.fun ?? null,
			p2Fun: game.p2Fun ?? null,
			p3Fun: game.p3Fun ?? null,
			p4Fun: game.p4Fun ?? null,
			notes: game.notes ?? null,
			estBracket: game.estBracket ?? null
		}));
	}

	async getDashboardStats(): Promise<DashboardStats> {
		if (this.useFixtures) {
			const fixtureDecks = this.fixtureDecks();
			const deckIdByName = new Map(
				fixtureDecks.map((deck) => [deck.deckName, deck.id ?? deck.deckName])
			);
			const games = this.fixtureGames();
			if (!games.length) {
				return { stats: null, deckStats: [] };
			}

			const stats = statsFromGames(games);

			const average = (values: number[]) => {
				if (!values.length) return null;
				const sum = values.reduce((acc, v) => acc + v, 0);
				return sum / values.length;
			};

			const deckMap = new Map<
				string,
				{ games: number; wins: number; losses: number; funSelf: number[]; funOthers: number[] }
			>();

			for (const g of games) {
				const deckName = typeof g.deck === 'string' ? g.deck.trim() : g.deck.deckName.trim();
				if (!deckName) continue;

				const current = deckMap.get(deckName) ?? {
					games: 0,
					wins: 0,
					losses: 0,
					funSelf: [],
					funOthers: []
				};
				current.games += 1;

				if (g.winner === 1) current.wins += 1;
				else if (g.winner && g.winner >= 2 && g.winner <= 4) current.losses += 1;

				if (g.fun !== null) current.funSelf.push(g.fun);
				if (g.p2Fun !== null) current.funOthers.push(g.p2Fun);
				if (g.p3Fun !== null) current.funOthers.push(g.p3Fun);
				if (g.p4Fun !== null) current.funOthers.push(g.p4Fun);

				deckMap.set(deckName, current);
			}

			const deckStats: DeckStatsRow[] = [];
			for (const [name, { games: gCount, wins, losses, funSelf, funOthers }] of deckMap.entries()) {
				deckStats.push({
					id: deckIdByName.get(name) ?? name,
					name,
					games: gCount,
					wins,
					losses,
					winRate: gCount > 0 ? (wins / gCount) * 100 : 0,
					usagePercent: 0,
					avgFunSelf: average(funSelf),
					avgFunOthers: average(funOthers)
				});
			}

			const totalGamesForUsage = deckStats.reduce((sum, d) => sum + d.games, 0);
			for (const deck of deckStats) {
				deck.usagePercent = totalGamesForUsage > 0 ? (deck.games / totalGamesForUsage) * 100 : 0;
			}

			deckStats.sort((a, b) => b.games - a.games);

			return { stats, deckStats };
		}

	const prisma = this.db();
	const statRows = (await prisma.$queryRaw`
		select
			count(*)::int as total_games,
			count(*) filter (where winner = 1)::int as wins,
			count(*) filter (where winner between 2 and 4)::int as losses,
			avg(fun)::float as avg_fun_self,
			stddev_samp(fun)::float as std_fun_self,
			avg(case when winner = 1 then fun end)::float as avg_fun_wins,
			avg(case when winner between 2 and 4 then fun end)::float as avg_fun_losses,
			avg(est_bracket)::float as avg_est_bracket,
			sum(
				1.0
				/
				(
					1
					+ (case when p2_fun is not null then 1 else 0 end)
					+ (case when p3_fun is not null then 1 else 0 end)
					+ (case when p4_fun is not null then 1 else 0 end)
				)
			)::float as expected_wins,
			(
				select avg(val)::float
				from (
					select unnest(array[p2_fun, p3_fun, p4_fun]) as val
					from games
					where user_id = ${this.user.id}
				) vals
				where val is not null
			) as avg_fun_others
		from games
		where user_id = ${this.user.id}
	`) as Array<Record<string, unknown>>;

	const stats = statRows.length ? this.statsFromRow(statRows[0]) : null;
	if (!stats) {
		return { stats: null, deckStats: [] };
	}

	const deckRows = (await prisma.$queryRaw`
		with base as (
			select
				d.id,
				d.name,
				count(g.id)::int as games,
				count(*) filter (where g.winner = 1)::int as wins,
				count(*) filter (where g.winner between 2 and 4)::int as losses,
				avg(g.fun)::float as avg_fun_self
			from decks d
			join games g on g.deck_id = d.id and g.user_id = ${this.user.id}
			where d.user_id = ${this.user.id}
			group by d.id, d.name
		),
		others as (
			select
				d.id,
				avg(val)::float as avg_fun_others
			from decks d
			join games g on g.deck_id = d.id and g.user_id = ${this.user.id}
			left join lateral unnest(array[g.p2_fun, g.p3_fun, g.p4_fun]) as u(val) on true
			where d.user_id = ${this.user.id}
			group by d.id
		)
		select
			base.id,
			base.name,
			base.games,
			base.wins,
			base.losses,
			base.avg_fun_self,
			others.avg_fun_others
		from base
		left join others on others.id = base.id
		order by base.games desc, base.name asc
	`) as Array<Record<string, unknown>>;

		const deckStats: DeckStatsRow[] = deckRows.map((row) => ({
			id: String(row.id ?? row.name ?? ''),
			name: String(row.name ?? ''),
			games: this.toInt(row.games),
			wins: this.toInt(row.wins),
			losses: this.toInt(row.losses),
			winRate: this.toInt(row.games) > 0 ? (this.toInt(row.wins) / this.toInt(row.games)) * 100 : 0,
			usagePercent: 0,
			avgFunSelf: this.toNumber(row.avg_fun_self),
			avgFunOthers: this.toNumber(row.avg_fun_others)
		}));

		const totalGamesForUsage = deckStats.reduce((sum, d) => sum + d.games, 0);
		for (const deck of deckStats) {
			deck.usagePercent = totalGamesForUsage > 0 ? (deck.games / totalGamesForUsage) * 100 : 0;
		}

		return { stats, deckStats };
	}

	async getDeckById(deckId: string): Promise<Deck | null> {
		if (this.useFixtures) {
			const deck = this.fixtureDecks().find((d) => d.id === deckId);
			if (!deck) return null;
			const deckWithGames = withGames(deck, E2E_GAMES_SHEET);
			if (!deckWithGames.games || !deckWithGames.games.length) return deckWithGames;
			return { ...deckWithGames, stats: statsFromGames(deckWithGames.games) };
		}

		const prisma = this.db();
		const deckRecord = await prisma.deck.findFirst({
			where: { userId: this.user.id, id: deckId },
			select: {
				id: true,
				name: true,
				targetBracket: true,
				summary: true,
				archidektLink: true
			}
		});

		if (!deckRecord) return null;

		const deck: Deck = {
			id: deckRecord.id,
			deckName: deckRecord.name,
			targetBracket: deckRecord.targetBracket ?? null,
			summary: deckRecord.summary ?? null,
			archidektLink: deckRecord.archidektLink ?? null
		};

		const gameRecords = await prisma.game.findMany({
			where: { userId: this.user.id, deckId: deckRecord.id },
			orderBy: { createdAt: 'asc' }
		});

		const games: Games = gameRecords.map((row) => ({
			id: row.id,
			deck,
			winner: row.winner ?? null,
			fun: row.fun ?? null,
			p2Fun: row.p2Fun ?? null,
			p3Fun: row.p3Fun ?? null,
			p4Fun: row.p4Fun ?? null,
			notes: row.notes ?? null,
			estBracket: row.estBracket ?? null
		}));

		const stats = await this.getStatsForDeck(deckRecord.id);
		return stats ? { ...deck, games, stats } : { ...deck, games };
	}

	private async getStatsForDeck(deckId: string): Promise<Stats | null> {
		if (this.useFixtures) return null;

		const prisma = this.db();
		const rows = (await prisma.$queryRaw`
			select
				count(*)::int as total_games,
				count(*) filter (where winner = 1)::int as wins,
				count(*) filter (where winner between 2 and 4)::int as losses,
				avg(fun)::float as avg_fun_self,
				stddev_samp(fun)::float as std_fun_self,
				avg(case when winner = 1 then fun end)::float as avg_fun_wins,
				avg(case when winner between 2 and 4 then fun end)::float as avg_fun_losses,
				avg(est_bracket)::float as avg_est_bracket,
				sum(
					1.0
					/
					(
						1
						+ (case when p2_fun is not null then 1 else 0 end)
						+ (case when p3_fun is not null then 1 else 0 end)
						+ (case when p4_fun is not null then 1 else 0 end)
					)
				)::float as expected_wins,
				(
					select avg(val)::float
					from (
						select unnest(array[p2_fun, p3_fun, p4_fun]) as val
						from games
						where user_id = ${this.user.id}
							and deck_id = ${deckId}
					) vals
					where val is not null
				) as avg_fun_others
			from games
			where user_id = ${this.user.id}
				and deck_id = ${deckId}
		`) as Array<Record<string, unknown>>;

		return rows.length ? this.statsFromRow(rows[0]) : null;
	}

	async appendDeck(input: DeckInput): Promise<void> {
		if (this.useFixtures) return;

		const prisma = this.db();
		await prisma.deck.create({
			data: {
				id: randomUUID(),
				userId: this.user.id,
				name: input.deckName,
				targetBracket: input.targetBracket,
				summary: input.summary,
				archidektLink: input.archidektLink
			}
		});
	}

	async appendGame(input: GameInput): Promise<void> {
		if (this.useFixtures) return;

		const prisma = this.db();
		const deck = await prisma.deck.findFirst({
			where: { userId: this.user.id, name: input.deckName },
			select: { id: true }
		});

		if (!deck) {
			throw new DataManagerError('Deck not found', 404);
		}

		await prisma.game.create({
			data: {
				id: randomUUID(),
				userId: this.user.id,
				deckId: deck.id,
				winner: input.winner,
				fun: input.fun,
				p2Fun: input.p2Fun,
				p3Fun: input.p3Fun,
				p4Fun: input.p4Fun,
				notes: input.notes,
				estBracket: input.estBracket
			}
		});
	}

	async updateDeck(input: DeckUpdateInput): Promise<void> {
		if (this.useFixtures) return;

		const prisma = this.db();
		const result = await prisma.deck.updateMany({
			where: { userId: this.user.id, id: input.deckId },
			data: {
				name: input.deckName,
				targetBracket: input.targetBracket,
				summary: input.summary,
				archidektLink: input.archidektLink,
				updatedAt: new Date()
			}
		});

		if (!result.count) {
			throw new DataManagerError('Deck not found', 404);
		}
	}

	async updateGame(input: GameUpdateInput): Promise<void> {
		if (this.useFixtures) return;

		const prisma = this.db();
		const result = await prisma.game.updateMany({
			where: { userId: this.user.id, id: input.gameId },
			data: {
				winner: input.winner,
				fun: input.fun,
				p2Fun: input.p2Fun,
				p3Fun: input.p3Fun,
				p4Fun: input.p4Fun,
				notes: input.notes,
				estBracket: input.estBracket
			}
		});

		if (!result.count) {
			throw new DataManagerError('Game not found', 404);
		}
	}

	async deleteGame(gameId: string): Promise<void> {
		if (this.useFixtures) return;

		const prisma = this.db();
		const result = await prisma.game.deleteMany({
			where: { userId: this.user.id, id: gameId }
		});

		if (!result.count) {
			throw new DataManagerError('Game not found', 404);
		}
	}

	async deleteDeck(deckId: string, _deckName: string): Promise<number> {
		if (this.useFixtures) return 0;

		const prisma = this.db();
		const gameCount = await prisma.game.count({
			where: { userId: this.user.id, deckId }
		});

		const result = await prisma.deck.deleteMany({
			where: { userId: this.user.id, id: deckId }
		});

		if (!result.count) {
			throw new DataManagerError('Deck not found', 404);
		}

		return gameCount;
	}
}

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import DeckStatsTable from '$lib/components/DeckStatsTable.svelte';
import type { DeckStatsColumn, DeckStatsRow } from '$lib/components/deck-stats';

describe('DeckStatsTable', () => {
	const columns: DeckStatsColumn[] = [
		{ key: 'games', label: 'Games', align: 'right', format: 'number' },
		{ key: 'winRate', label: 'Win rate', align: 'right', format: 'percent' }
	];

	const rows: DeckStatsRow[] = [
		{
			name: 'Deck A',
			games: 5,
			wins: 3,
			losses: 2,
			winRate: 60,
			usagePercent: 10
		},
		{
			name: 'Deck B',
			games: 2,
			wins: 2,
			losses: 0,
			winRate: 100,
			usagePercent: 20
		},
		{
			name: 'Deck C',
			games: 10,
			wins: 1,
			losses: 9,
			winRate: 10,
			usagePercent: 30
		}
	];

	it('sorts by initial sort key and toggles direction', async () => {
		const { getAllByRole, getByRole } = render(DeckStatsTable, {
			props: {
				rows,
				columns,
				sortable: true,
				initialSortKey: 'games',
				initialSortDir: 'desc'
			}
		});

		const deckOrder = () => getAllByRole('link').map((el) => el.textContent);

		expect(deckOrder()).toEqual(['Deck C', 'Deck A', 'Deck B']);

		await getByRole('button', { name: /Win rate/i }).click();
		await tick();
		expect(deckOrder()).toEqual(['Deck B', 'Deck A', 'Deck C']);

		await getByRole('button', { name: /Win rate/i }).click();
		await tick();
		expect(deckOrder()).toEqual(['Deck C', 'Deck A', 'Deck B']);
	});
});

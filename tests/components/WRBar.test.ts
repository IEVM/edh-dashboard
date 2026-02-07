/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import WRBar from '$lib/components/WRBar.svelte';

describe('WRBar', () => {
	it('shows win rate summary and overperforming copy', () => {
		const { getByText } = render(WRBar, {
			props: {
				winRate: 0.6,
				expectedWinrate: 0.25,
				width: 2
			}
		});

		expect(getByText('Overall vs target')).toBeInTheDocument();
		expect(getByText('60.0% / 25.0%')).toBeInTheDocument();
		expect(
			getByText("You're winning 35.0 percentage points more than a perfectly fair deck.")
		).toBeInTheDocument();
	});

	it('shows underperforming copy when below expected', () => {
		const { getByText } = render(WRBar, {
			props: {
				winRate: 0.2,
				expectedWinrate: 0.35,
				width: 2
			}
		});

		expect(
			getByText("You're winning 15.0 percentage points less than a fair deck.")
		).toBeInTheDocument();
	});
});

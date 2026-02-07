/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import CommanderPreview from '$lib/components/CommanderPreview.svelte';

vi.mock('$app/environment', () => ({ browser: true }));

describe('CommanderPreview', () => {
	afterEach(() => cleanup());

	it('renders deck name and summary when provided', () => {
		const { getByText, queryByText } = render(CommanderPreview, {
			props: {
				deckName: 'Zimone Landfall',
				summary: 'Simic landfall value engine',
				deckUrl: '-'
			}
		});

		expect(getByText('Zimone Landfall')).toBeInTheDocument();
		expect(getByText('Simic landfall value engine')).toBeInTheDocument();
		expect(queryByText('Open on Archidekt')).not.toBeInTheDocument();
	});

	it('shows an error when an invalid deck link is provided', () => {
		const { getByText } = render(CommanderPreview, {
			props: {
				deckName: '',
				summary: null,
				deckUrl: 'https://example.com/not-archidekt'
			}
		});

		expect(getByText('Unsupported deck link.')).toBeInTheDocument();
	});
});

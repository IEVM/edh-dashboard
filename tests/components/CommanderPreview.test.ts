/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import CommanderPreview from '$lib/components/CommanderPreview.svelte';

describe('CommanderPreview', () => {
  afterEach(() => cleanup());

  it('renders deck name and summary when provided', () => {
    const { getByText, queryByText } = render(CommanderPreview, {
      props: {
        deckName: 'Zimone Landfall',
        summary: 'Simic landfall value engine',
        archidektUrl: '-'
      }
    });

    expect(getByText('Zimone Landfall')).toBeInTheDocument();
    expect(getByText('Simic landfall value engine')).toBeInTheDocument();
    expect(queryByText('Open on Archidekt')).not.toBeInTheDocument();
  });

  it('shows an error when an invalid Archidekt link is provided', async () => {
    const { getByText } = render(CommanderPreview, {
      props: {
        deckName: '',
        summary: null,
        archidektUrl: 'https://example.com/not-archidekt'
      }
    });

    await tick();
    await waitFor(() => {
      expect(getByText('Invalid or missing Archidekt link.')).toBeInTheDocument();
    });
  });
});

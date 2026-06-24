import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Explorer } from '@/components/views/Explorer';
import { installFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

describe('API Explorer', () => {
  it('runs the default endpoint and shows status, timing and JSON', async () => {
    installFetch([
      {
        match: '/v1/health',
        status: 200,
        body: resource({ status: 'ok', apiVersion: 'v1', dataSourceConfigured: true, timestamp: 't' }),
        headers: { 'x-request-id': 'req_abc', 'cache-control': 'no-store' },
      },
    ]);

    render(<Explorer />);
    fireEvent.click(screen.getByRole('button', { name: /ejecutar solicitud/i }));

    expect(await screen.findByText('200')).toBeInTheDocument();
    // Response JSON is rendered.
    await waitFor(() => expect(screen.getByText(/"apiVersion": "v1"/)).toBeInTheDocument());
    // A non-sensitive header is surfaced.
    expect(screen.getByText(/req_abc/)).toBeInTheDocument();
  });

  it('disables Run until required path params are filled', async () => {
    render(<Explorer />);
    // Switch to an endpoint that requires a path param.
    fireEvent.change(screen.getByLabelText('Endpoint'), { target: { value: 'league' } });
    expect(screen.getByRole('button', { name: /ejecutar solicitud/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/leagueId/i), { target: { value: '262' } });
    expect(screen.getByRole('button', { name: /ejecutar solicitud/i })).toBeEnabled();
  });

  it('only offers predefined endpoints (no arbitrary URL field)', () => {
    render(<Explorer />);
    const select = screen.getByLabelText('Endpoint') as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThan(3);
    // No free-form URL input exists.
    expect(screen.queryByPlaceholderText(/https?:\/\//)).not.toBeInTheDocument();
  });
});

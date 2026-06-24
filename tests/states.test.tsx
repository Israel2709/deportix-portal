import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSection, EmptyState, ErrorState, LoadingState } from '@/components/states/States';

describe('state components', () => {
  it('LoadingState exposes a status role', () => {
    render(<LoadingState label="Loading coverage…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading coverage…');
  });

  it('ErrorState shows message and triggers retry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Boom" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('EmptyState renders title + hint', () => {
    render(<EmptyState title="No data" hint="Nothing loaded yet" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing loaded yet')).toBeInTheDocument();
  });
});

describe('DataSection state machine', () => {
  const base = { onRetry: () => {}, emptyTitle: 'Empty' };

  it('renders loading first', () => {
    render(
      <DataSection {...base} loading error={null} isEmpty={false}>
        <p>content</p>
      </DataSection>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error over content', () => {
    render(
      <DataSection {...base} loading={false} error="nope" isEmpty={false}>
        <p>content</p>
      </DataSection>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders empty when not loading and empty', () => {
    render(
      <DataSection {...base} loading={false} error={null} isEmpty>
        <p>content</p>
      </DataSection>,
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders children when populated', () => {
    render(
      <DataSection {...base} loading={false} error={null} isEmpty={false}>
        <p>content</p>
      </DataSection>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

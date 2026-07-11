import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { ToastProvider } from '@/components/notifications/ToastProvider';
import { createTestQueryClient, QueryClientWrapper } from './query-client';

export function renderWithAppProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { client?: QueryClient; withToast?: boolean },
) {
  const client = options?.client ?? createTestQueryClient();
  const withToast = options?.withToast ?? false;

  function Wrapper({ children }: { children: ReactNode }) {
    const content = withToast ? <ToastProvider>{children}</ToastProvider> : children;
    return <QueryClientWrapper client={client}>{content}</QueryClientWrapper>;
  }

  return {
    client,
    ...render(ui, { ...options, wrapper: Wrapper }),
  };
}

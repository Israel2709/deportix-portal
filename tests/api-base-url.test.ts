import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses env URL on the server', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
    const { getApiBaseUrl } = await import('@/lib/api');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses same hostname as portal when env is localhost', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_API_PORT', '3000');
    vi.stubGlobal('window', {
      location: { protocol: 'http:', hostname: '192.168.100.7' },
    } as Window & typeof globalThis);

    const { getApiBaseUrl } = await import('@/lib/api');
    expect(getApiBaseUrl()).toBe('http://192.168.100.7:3000');
  });

  it('keeps non-localhost env in the browser', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
    vi.stubGlobal('window', {
      location: { protocol: 'http:', hostname: '192.168.100.7' },
    } as Window & typeof globalThis);

    const { getApiBaseUrl } = await import('@/lib/api');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses NEXT_PUBLIC_API_LAN_HOST when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_API_LAN_HOST', '10.0.0.5');
    vi.stubEnv('NEXT_PUBLIC_API_PORT', '3000');
    vi.stubGlobal('window', {
      location: { protocol: 'http:', hostname: '192.168.100.7' },
    } as Window & typeof globalThis);

    const { getApiBaseUrl } = await import('@/lib/api');
    expect(getApiBaseUrl()).toBe('http://10.0.0.5:3000');
  });
});

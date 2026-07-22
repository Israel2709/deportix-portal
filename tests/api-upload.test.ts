import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUploadImage } from '@/lib/api';

afterEach(() => vi.unstubAllGlobals());

describe('apiUploadImage', () => {
  it('does not send Accept header on multipart upload (avoids CORS preflight issues)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { url: 'https://cdn.example/logo.png' },
          meta: { apiVersion: 'v1' },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');

    const file = new File(['png'], 'logo.png', { type: 'image/png' });
    const url = await apiUploadImage(file, { purpose: 'alt_logo', entityId: 'team-1' });

    expect(url).toBe('https://cdn.example/logo.png');
    expect(fetchMock).toHaveBeenCalledOnce();

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init?.headers as Headers;
    expect(headers.get('Accept')).toBeNull();
    expect(init?.body).toBeInstanceOf(FormData);
  });
});

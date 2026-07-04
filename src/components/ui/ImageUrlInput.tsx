'use client';

import { useRef, useState } from 'react';
import { ApiClientError, apiUploadImage } from '@/lib/api';
import { NFL_BUTTON_SECONDARY } from '@/lib/nfl-forms/shared';

export type ImageUploadPurpose =
  | 'logo'
  | 'alt_logo'
  | 'flag'
  | 'league_logo'
  | 'team_logo'
  | 'asset';

export function ImageUrlInput({
  label,
  value,
  onChange,
  purpose = 'asset',
  entityId,
  hint,
  onUploadError,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  purpose?: ImageUploadPurpose;
  entityId?: string;
  hint?: string;
  onUploadError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const normalizedValue = value ?? '';

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const url = await apiUploadImage(file, { purpose, entityId });
      onChange(url);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'No se pudo subir la imagen.';
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        <input
          type="url"
          value={normalizedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={NFL_BUTTON_SECONDARY}
        >
          {uploading ? 'Subiendo…' : 'Subir archivo'}
        </button>
        {normalizedValue.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizedValue.trim()}
            alt=""
            className="h-10 w-10 rounded border border-slate-700 object-contain bg-slate-950"
          />
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

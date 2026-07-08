'use client';

import { useRef, useState } from 'react';
import { ApiClientError, apiUploadImage } from '@/lib/api';
import { AMERICAN_FOOTBALL_BUTTON_SECONDARY } from '@/lib/american-football-forms/shared';

export type ImageUploadPurpose =
  | 'logo'
  | 'alt_logo'
  | 'flag'
  | 'league_logo'
  | 'team_logo'
  | 'asset';

function PreviewBox({ url }: { url: string }) {
  const trimmed = url.trim();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-950"
      aria-hidden={!trimmed}
    >
      {trimmed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trimmed} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="text-[10px] text-slate-600">—</span>
      )}
    </div>
  );
}

export function ImageUrlInput({
  label,
  value,
  onChange,
  purpose = 'asset',
  entityId,
  hint,
  onUploadError,
  className = 'sm:col-span-3',
  layout = 'row',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  purpose?: ImageUploadPurpose;
  entityId?: string;
  hint?: string;
  onUploadError?: (message: string) => void;
  /** Grid column span when placed inside AmericanFootballFieldGrid (default: full row). */
  className?: string;
  /** `row`: URL, upload and preview on one line (full-width fields). `stack`: compact cell for 3-column grids. */
  layout?: 'row' | 'stack';
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

  const uploadButton = (
    <>
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
        className={`${AMERICAN_FOOTBALL_BUTTON_SECONDARY} shrink-0 whitespace-nowrap`}
      >
        {uploading ? 'Subiendo…' : 'Subir archivo'}
      </button>
    </>
  );

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      {layout === 'stack' ? (
        <>
          <input
            type="url"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <div className="flex items-center gap-2">
            {uploadButton}
            <PreviewBox url={normalizedValue} />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          {uploadButton}
          <PreviewBox url={normalizedValue} />
        </div>
      )}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

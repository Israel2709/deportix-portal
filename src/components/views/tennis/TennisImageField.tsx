'use client';

import { useRef, useState } from 'react';
import { ApiClientError, apiUploadImage } from '@/lib/api';
import { AMERICAN_FOOTBALL_BUTTON_SECONDARY } from '@/lib/american-football-forms/shared';

const INPUT_CLASS =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';

/** Two grid cells: URL + file picker. Place inside AmericanFootballFieldGrid. */
export function TennisImageField({
  urlLabel = 'URL imagen',
  fileLabel = 'Archivo',
  value,
  onChange,
  entityId,
  onUploadError,
}: {
  urlLabel?: string;
  fileLabel?: string;
  value: string;
  onChange: (value: string) => void;
  entityId?: string;
  onUploadError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const normalizedValue = value ?? '';

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    try {
      const url = await apiUploadImage(file, { purpose: 'asset', entityId });
      onChange(url);
    } catch (err) {
      setFileName('');
      const message =
        err instanceof ApiClientError ? err.message : 'No se pudo subir la imagen.';
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  }

  const status = uploading
    ? 'Subiendo…'
    : fileName
      ? fileName
      : normalizedValue.trim()
        ? 'Imagen cargada'
        : 'Sin archivo seleccionado';

  return (
    <>
      <label className="block">
        <span className="block text-sm font-medium text-slate-200">{urlLabel}</span>
        <input
          type="url"
          value={normalizedValue}
          onChange={(e) => {
            setFileName('');
            onChange(e.target.value);
          }}
          placeholder="https://…"
          className={INPUT_CLASS}
        />
      </label>
      <div>
        <span className="block text-sm font-medium text-slate-200">{fileLabel}</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={`${AMERICAN_FOOTBALL_BUTTON_SECONDARY} shrink-0`}
          >
            Seleccionar archivo
          </button>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-400" title={status}>
            {status}
          </p>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-950">
            {normalizedValue.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={normalizedValue.trim()} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-600">—</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">PNG, JPEG, WebP o SVG</p>
      </div>
    </>
  );
}

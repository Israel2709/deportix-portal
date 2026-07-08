'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  hint,
  emptyMessage = 'Sin resultados',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  emptyMessage?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) || option.value.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery(selected?.label ?? '');
  }, [open, selected]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <div ref={containerRef} className="relative mt-1">
        <input
          type="text"
          value={open ? query : (selected?.label ?? '')}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.label ?? '');
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
        />
        {open && !disabled && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-700 bg-slate-950 shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                      option.value === value ? 'bg-slate-800/80 text-blue-300' : 'text-slate-100'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

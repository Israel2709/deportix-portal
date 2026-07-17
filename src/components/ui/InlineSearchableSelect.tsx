'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MENU_ATTR = 'data-inline-select-menu';

export function isInlineSelectMenuTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  const element = target instanceof Element ? target : target.parentElement;
  return element?.closest(`[${MENU_ATTR}]`) != null;
}

function optionLabel(option: { value: string; label: string }): string {
  return option.label.trim() || option.value;
}

export function InlineSearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled,
  emptyMessage = 'Sin resultados',
  autoFocus,
  'aria-label': ariaLabel,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const selectedLabel = selected ? optionLabel(selected) : '';

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => {
      const label = optionLabel(option).toLowerCase();
      return label.includes(normalized) || option.value.toLowerCase().includes(normalized);
    });
  }, [options, query]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputRef.current?.focus();
    setOpen(true);
    setQuery('');
  }, [autoFocus, disabled]);

  useLayoutEffect(() => {
    if (!open || disabled) {
      setMenuBox(null);
      return;
    }

    function updatePosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 240);
      const preferredTop = rect.bottom + 4;
      const menuHeight = 224;
      const fitsBelow = preferredTop + menuHeight <= window.innerHeight;
      setMenuBox({
        top: fitsBelow ? preferredTop : Math.max(8, rect.top - menuHeight - 4),
        left: Math.min(rect.left, window.innerWidth - width - 8),
        width,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, disabled, filtered.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (isInlineSelectMenuTarget(target)) return;
      setOpen(false);
      setQuery('');
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function chooseOption(option: { value: string; label: string }) {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  }

  const menu =
    open && !disabled && menuBox
      ? createPortal(
          <ul
            data-inline-select-menu=""
            role="listbox"
            className="fixed z-50 max-h-56 overflow-auto rounded-md border border-slate-600 bg-slate-900 shadow-xl"
            style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>
            ) : (
              filtered.map((option) => {
                const label = optionLabel(option);
                const isActive = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm ${
                        isActive
                          ? 'bg-slate-800 text-blue-300'
                          : 'text-slate-100 hover:bg-slate-800'
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        chooseOption(option);
                      }}
                    >
                      {label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
        value={open ? query : selectedLabel}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        placeholder={selectedLabel || placeholder}
        disabled={disabled}
        autoComplete="off"
        className={className}
      />
      {menu}
    </div>
  );
}

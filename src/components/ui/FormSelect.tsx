import type { SelectHTMLAttributes } from 'react';

function SelectChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Native select with the system chevron hidden and a custom icon inset from the right edge. */
export function FormSelect({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`form-select-control w-full appearance-none pr-10 ${className}`.trim()}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400"
      >
        <SelectChevron />
      </span>
    </div>
  );
}

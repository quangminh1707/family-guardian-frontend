import { useEffect, useRef, useState } from 'react';

interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  color?: string;
}

interface FilterDropdownProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  align?: 'left' | 'right';
}

export function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  align = 'left',
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isFiltered = value !== options[0]?.value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
          isFiltered
            ? 'border-brand-DEFAULT/50 bg-brand-DEFAULT/10 text-brand-DEFAULT'
            : 'border-border-base bg-bg-subtle text-tx-secondary hover:border-border-base/80 hover:text-tx-primary'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M13 16h-2" />
        </svg>

        <span>{isFiltered ? selected?.label ?? label : label}</span>

        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-full z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-border-base bg-bg-elevated py-1 shadow-xl shadow-black/20 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                value === opt.value
                  ? 'bg-brand-DEFAULT/10 text-brand-DEFAULT'
                  : 'text-tx-secondary hover:bg-bg-subtle hover:text-tx-primary'
              }`}
            >
              <span className={`h-3.5 w-3.5 flex-shrink-0 ${value === opt.value ? 'opacity-100' : 'opacity-0'}`}>
                ✓
              </span>
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

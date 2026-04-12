import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  disabled = false,
  className = '',
  size = 'md',
}: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // focus search on open
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const py = size === 'sm' ? 'py-1.5' : 'py-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(!open); setSearch(''); }}
        className={`
          w-full flex items-center justify-between gap-2 ${py} px-3 ${textSize}
          bg-white border border-gray-200 rounded-xl
          transition-all duration-150
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? 'ring-2 ring-primary/30 border-primary' : ''}
        `}
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200/80 rounded-xl shadow-lg shadow-black/[0.08] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full text-sm bg-transparent outline-none placeholder:text-gray-300"
              />
            </div>
          )}
          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1 scroll-thin">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400 text-center">No results</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); setSearch(''); } }}
                    disabled={opt.disabled}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      transition-colors duration-100
                      ${opt.disabled
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : opt.value === value
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="truncate flex-1">{opt.label}</span>
                    {opt.value === value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

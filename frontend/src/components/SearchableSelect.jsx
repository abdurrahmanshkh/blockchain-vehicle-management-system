import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect — A searchable dropdown for selecting users.
 * Props:
 *   options: [{ value, label, sublabel }]
 *   value: currently selected value
 *   onChange: (value) => void
 *   placeholder: string
 *   id: string (for accessibility)
 *   accentColor: 'blue' | 'amber' | 'violet' | 'emerald' (default 'blue')
 */
function SearchableSelect({ options = [], value, onChange, placeholder = 'Select...', id, accentColor = 'blue' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const accentRing = {
    blue: 'focus:ring-blue-500/40 focus:border-blue-400',
    amber: 'focus:ring-amber-500/40 focus:border-amber-400',
    violet: 'focus:ring-violet-500/40 focus:border-violet-400',
    emerald: 'focus:ring-emerald-500/40 focus:border-emerald-400',
  }[accentColor] || 'focus:ring-blue-500/40 focus:border-blue-400';

  const selectedOption = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-left flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 ${accentRing} ${isOpen ? 'ring-2 ' + accentRing : ''}`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-600">
                {selectedOption.label.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-sm text-gray-900 font-medium block truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs text-gray-400 block truncate">{selectedOption.sublabel}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              onClick={handleClear}
              className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                placeholder="Search by name..."
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No results found
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors duration-100 ${option.value === value ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {option.label.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-900 font-medium block truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-gray-400 block truncate">{option.sublabel}</span>
                    )}
                  </div>
                  {option.value === value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;

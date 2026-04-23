import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — drop-in replacement for native <select>.
 *
 * Props:
 *   value       — currently selected value (string)
 *   onChange    — (value: string) => void
 *   options     — [{ value, label }]
 *   placeholder — text shown when nothing is selected (default: '— Выберите —')
 *   size        — 'sm' | 'md' (default: 'md')
 *   style       — extra inline styles for the root wrapper
 *   className   — extra class for the root wrapper
 *   disabled    — boolean
 */
export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = '— Выберите —',
    size = 'md',
    style,
    className = '',
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    /* close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* close on Escape */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const selected = options.find(o => String(o.value) === String(value));

    const triggerClass = size === 'sm'
        ? 'custom-select-trigger custom-select-trigger--sm'
        : 'custom-select-trigger';

    return (
        <div
            ref={ref}
            className={`custom-select-root ${className}`}
            style={style}
        >
            <button
                type="button"
                className={triggerClass}
                onClick={() => !disabled && setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                disabled={disabled}
            >
                <span className={selected ? 'custom-select-value' : 'custom-select-placeholder'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={size === 'sm' ? 14 : 16}
                    className={`custom-select-chevron${open ? ' open' : ''}`}
                />
            </button>

            {open && (
                <div className="dropdown-list" role="listbox" style={{ zIndex: 200 }}>
                    {options.map(opt => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                            <div
                                key={opt.value}
                                className={`dropdown-item${isSelected ? ' dropdown-item--selected' : ''}`}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                            >
                                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {opt.label}
                                </span>
                                {isSelected && (
                                    <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginLeft: '0.5rem' }} />
                                )}
                            </div>
                        );
                    })}
                    {options.length === 0 && (
                        <div style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Нет вариантов
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

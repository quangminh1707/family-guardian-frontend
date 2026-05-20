import React from 'react';

interface TimeInput24hProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function TimeInput24h({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: TimeInput24hProps) {
  const [hStr, mStr] = (value || '00:00').split(':');
  const hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let nextHours = parseInt(event.target.value, 10);
    if (Number.isNaN(nextHours)) nextHours = 0;
    nextHours = Math.max(0, Math.min(23, nextHours));
    onChange(`${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let nextMinutes = parseInt(event.target.value, 10);
    if (Number.isNaN(nextMinutes)) nextMinutes = 0;
    nextMinutes = Math.max(0, Math.min(59, nextMinutes));
    onChange(`${String(hours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`);
  };

  const periodLabel =
    hours < 12 ? '(Sáng)' :
    hours < 18 ? '(Chiều)' :
    '(Tối)';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium uppercase tracking-wide text-tx-secondary">
          {label}
        </label>
      )}
      <div
        className={`
          flex items-center gap-1 rounded-lg border px-3 py-2
          bg-bg-subtle border-border-base
          focus-within:border-brand-DEFAULT/60 focus-within:ring-1 focus-within:ring-brand-DEFAULT/20
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="number"
          min={0}
          max={23}
          value={String(hours).padStart(2, '0')}
          onChange={handleHourChange}
          disabled={disabled}
          inputMode="numeric"
          className="w-10 text-center bg-transparent text-tx-primary text-sm font-mono focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="HH"
        />
        <span className="select-none text-sm font-bold text-tx-secondary">:</span>
        <input
          type="number"
          min={0}
          max={59}
          step={5}
          value={String(minutes).padStart(2, '0')}
          onChange={handleMinuteChange}
          disabled={disabled}
          inputMode="numeric"
          className="w-10 text-center bg-transparent text-tx-primary text-sm font-mono focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="MM"
        />
        <span className="ml-1 select-none whitespace-nowrap text-xs text-tx-secondary">
          {periodLabel}
        </span>
      </div>
    </div>
  );
}

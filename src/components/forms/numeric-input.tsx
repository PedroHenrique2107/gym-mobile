import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type BaseInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'pattern' | 'value' | 'onChange'
>;

export function IntegerInput({
  value,
  onValueChange,
  min = 0,
  max,
  ...props
}: BaseInputProps & {
  readonly value: number;
  readonly onValueChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
}) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(event) => {
        const digits = event.currentTarget.value.replace(/\D/g, '');
        if (!digits) {
          onValueChange(min);
          return;
        }
        const parsed = Number(digits);
        onValueChange(Math.min(max ?? parsed, Math.max(min, parsed)));
      }}
    />
  );
}

export function DecimalInput({
  value,
  onValueChange,
  ...props
}: BaseInputProps & {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      pattern="[0-9]+([,.][0-9]{1,2})?"
      value={value}
      onChange={(event) => onValueChange(normalizeDecimalInput(event.currentTarget.value))}
    />
  );
}

export function WeightInput({
  value,
  onValueChange,
  className,
  ...props
}: BaseInputProps & {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <DecimalInput
        {...props}
        value={value}
        onValueChange={onValueChange}
        className={cn('pr-12 tabular', className)}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        kg
      </span>
      <span className="sr-only" aria-live="polite">
        {value ? formatKilograms(value) : 'Carga vazia'}
      </span>
    </div>
  );
}

export function normalizeDecimalInput(value: string): string {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const separator = cleaned.indexOf('.');
  if (separator === -1) return cleaned;
  return `${cleaned.slice(0, separator)}.${cleaned
    .slice(separator + 1)
    .replace(/\./g, '')
    .slice(0, 2)}`;
}

export function decimalToApi(value: string): string {
  const parsed = Number(normalizeDecimalInput(value));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

export function formatKilograms(value: string): string {
  const parsed = Number(decimalToApi(value));
  if (!Number.isFinite(parsed)) return '0 kg';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(parsed)} kg`;
}

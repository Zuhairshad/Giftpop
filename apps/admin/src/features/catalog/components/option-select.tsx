"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

interface OptionSelectProps {
  id: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  disabled?: boolean;
  className?: string;
}

/** A select over plain `{ value, label }` options. */
export function OptionSelect({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Choose one",
  invalid = false,
  describedBy,
  disabled = false,
  className,
}: OptionSelectProps) {
  return (
    <Select
      value={value === "" ? null : value}
      items={options.map((option) => ({ value: option.value, label: option.label }))}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onValueChange(String(next));
      }}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className ?? "w-full"}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

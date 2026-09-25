import { ReactNode } from "react";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export default function SelectField({ id, label, value, onChange, children }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        {children}
      </select>
    </div>
  );
}

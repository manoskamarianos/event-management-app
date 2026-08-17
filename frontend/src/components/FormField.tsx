interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
}

export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      />
    </div>
  );
}

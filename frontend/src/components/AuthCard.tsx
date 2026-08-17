import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  maxWidthClassName?: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  description,
  maxWidthClassName = "max-w-sm",
  children,
}: AuthCardProps) {
  return (
    <div
      className={`w-full ${maxWidthClassName} rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900`}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children}
    </div>
  );
}

export default function Header() {
  return (
    <header className="border-b border-black/[.08] bg-white px-6 py-4 dark:border-white/[.145] dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          EventHub
        </span>
        <nav className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <span>Events</span>
          <span>About</span>
          <span>Contact</span>
        </nav>
      </div>
    </header>
  );
}

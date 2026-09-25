export default function Footer() {
  return (
    <footer className="border-t border-black/[.08] bg-white px-6 py-6 dark:border-white/[.145] dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row">
        <span>© 2026 EventHub. All rights reserved.</span>
        <div className="flex gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </div>
    </footer>
  );
}

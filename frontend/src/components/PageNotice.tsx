import Link from "next/link";
import { ReactNode } from "react";

interface PageNoticeProps {
  children: ReactNode;
  href: string;
  linkLabel: string;
}

/** Centered message with a way back, for missing / forbidden / failed pages. */
export default function PageNotice({ children, href, linkLabel }: PageNoticeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-zinc-600 dark:text-zinc-400">{children}</p>
      <Link href={href} className="font-medium text-zinc-950 hover:underline dark:text-zinc-50">
        {linkLabel}
      </Link>
    </div>
  );
}

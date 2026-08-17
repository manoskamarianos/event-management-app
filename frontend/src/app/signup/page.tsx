import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthCard
        title="Create an account"
        description="Sign up to start planning or joining events"
        maxWidthClassName="max-w-lg"
      >
        <form className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField id="name" label="Name" placeholder="John" />
            <FormField id="surename" label="Surname" placeholder="Doe" />
          </div>

          <FormField id="username" label="Username" placeholder="johndoe" />
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
          />
          <FormField
            id="telephone"
            label="Telephone"
            type="tel"
            placeholder="6900000000"
          />
          <FormField
            id="address"
            label="Address"
            placeholder="123 Main St, City"
          />
          <FormField
            id="taxNumber"
            label="Tax number"
            placeholder="123456789"
          />

          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-950 dark:text-zinc-50"
          >
            Log in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}

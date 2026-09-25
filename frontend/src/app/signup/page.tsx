"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, describeError, fieldErrors } from "@/api";
import type { RegisterPayload } from "@/api";
import AuthCard from "@/components/AuthCard";
import FormField from "@/components/FormField";
import SelectField from "@/components/SelectField";

type RequestedRole = NonNullable<RegisterPayload["requested_role"]>;

const ROLE_OPTIONS: { value: RequestedRole; label: string }[] = [
  { value: "participant", label: "Participant — browse events and book tickets" },
  { value: "organizer", label: "Organiser — create and manage events" },
  { value: "guest", label: "Guest — browse and search events only" },
];

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    telephone: "",
    address: "",
    city: "",
    country: "",
    postcode: "",
    latitude: "",
    longitude: "",
    taxNumber: "",
    requested_role: "participant" as RequestedRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function fillFromBrowserLocation() {
    if (!navigator.geolocation) {
      setFormError("Your browser cannot share its location. Enter the coordinates by hand.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setFormError("");
      },
      () => setFormError("Could not get your location. Enter the coordinates by hand instead."),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: "Passwords do not match." });
      return;
    }
    if (!/^\d{5}$/.test(form.postcode)) {
      setErrors({ postcode: "Enter a 5-digit postcode." });
      return;
    }

    const hasLatitude = form.latitude.trim() !== "";
    const hasLongitude = form.longitude.trim() !== "";
    if (hasLatitude !== hasLongitude) {
      setErrors({ latitude: "Enter both latitude and longitude, or leave both empty." });
      return;
    }
    if (hasLatitude && (Number.isNaN(Number(form.latitude)) || Number.isNaN(Number(form.longitude)))) {
      setErrors({ latitude: "Latitude and longitude must be numbers." });
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.register({
        username: form.username.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        address: [form.address, form.city, form.country].map((part) => part.trim()).join(", "),
        taxNumber: form.taxNumber.trim(),
        postcode: Number(form.postcode),
        latitude: hasLatitude ? Number(Number(form.latitude).toFixed(6)) : null,
        longitude: hasLongitude ? Number(Number(form.longitude).toFixed(6)) : null,
        requested_role: form.requested_role,
      });
      router.push("/signup/pending");
    } catch (error) {
      const found = fieldErrors(error);
      if (Object.keys(found).length > 0) {
        setErrors({
          ...found,
          ...(found.username ? { username: `${found.username} Please choose another username.` } : {}),
        });
        if (found.non_field_errors) setFormError(found.non_field_errors);
      } else {
        setFormError(describeError(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthCard
        title="Create an account"
        description="Sign up to start planning or joining events"
        maxWidthClassName="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="first_name"
              label="Name"
              placeholder="John"
              value={form.first_name}
              onChange={(v) => update("first_name", v)}
              error={errors.first_name}
              required
            />
            <FormField
              id="last_name"
              label="Surname"
              placeholder="Doe"
              value={form.last_name}
              onChange={(v) => update("last_name", v)}
              error={errors.last_name}
              required
            />
          </div>

          <FormField
            id="username"
            label="Username"
            placeholder="johndoe"
            value={form.username}
            onChange={(v) => update("username", v)}
            error={errors.username}
            required
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(v) => update("email", v)}
            error={errors.email}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(v) => update("password", v)}
              error={errors.password}
              required
            />
            <FormField
              id="password_confirm"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={form.password_confirm}
              onChange={(v) => update("password_confirm", v)}
              error={errors.password_confirm}
              required
            />
          </div>
          <FormField
            id="telephone"
            label="Telephone"
            type="tel"
            placeholder="6900000000"
            value={form.telephone}
            onChange={(v) => update("telephone", v)}
            error={errors.telephone}
            required
          />
          <FormField
            id="address"
            label="Address"
            placeholder="123 Main St"
            value={form.address}
            onChange={(v) => update("address", v)}
            error={errors.address}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              id="city"
              label="City"
              placeholder="Athens"
              value={form.city}
              onChange={(v) => update("city", v)}
              required
            />
            <FormField
              id="country"
              label="Country"
              placeholder="Greece"
              value={form.country}
              onChange={(v) => update("country", v)}
              required
            />
            <FormField
              id="postcode"
              label="Postcode"
              placeholder="10431"
              value={form.postcode}
              onChange={(v) => update("postcode", v)}
              error={errors.postcode}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="latitude"
                label="Latitude (optional)"
                placeholder="37.9838"
                value={form.latitude}
                onChange={(v) => update("latitude", v)}
                error={errors.latitude}
              />
              <FormField
                id="longitude"
                label="Longitude (optional)"
                placeholder="23.7275"
                value={form.longitude}
                onChange={(v) => update("longitude", v)}
                error={errors.longitude}
              />
            </div>
            <button
              type="button"
              onClick={fillFromBrowserLocation}
              className="self-start text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50"
            >
              Use my current location
            </button>
          </div>
          <FormField
            id="taxNumber"
            label="Tax number (ΑΦΜ)"
            placeholder="123456789"
            value={form.taxNumber}
            onChange={(v) => update("taxNumber", v)}
            error={errors.taxNumber}
            required
          />
          <SelectField
            id="requested_role"
            label="I want to join as"
            value={form.requested_role}
            onChange={(v) => update("requested_role", v as RequestedRole)}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-950 dark:text-zinc-50">
            Log in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { describeError } from "@/api";
import FormField from "@/components/FormField";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import TicketTypesEditor, { TicketTypeDraft } from "@/components/TicketTypesEditor";
import { EventFormValues } from "@/lib/eventMappers";

// The API stores event types in upper case, so the choices are kept the same way.
const BASE_EVENT_TYPES = ["CONCERT", "CONFERENCE", "WORKSHOP", "SEMINAR", "THEATRE", "FESTIVAL", "MEETUP"];

const EMPTY_VALUES: EventFormValues = {
  title: "",
  categories: [],
  eventType: BASE_EVENT_TYPES[0],
  venue: "",
  address: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
  startDateTime: "",
  endDateTime: "",
  description: "",
  ticketTypes: [{ name: "General Admission", price: 0, quantity: 0 }],
  photos: [],
};

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const MAX_PHOTOS = 10;

interface EventFormProps {
  initialValues?: EventFormValues;
  /** Photos the event already has (edit); picking new ones replaces them. */
  existingPhotos?: string[];
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

export default function EventForm({
  initialValues = EMPTY_VALUES,
  existingPhotos = [],
  submitLabel,
  submittingLabel,
  onSubmit,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [categories, setCategories] = useState(initialValues.categories.join(", "));
  const [eventType, setEventType] = useState(initialValues.eventType);
  const [venue, setVenue] = useState(initialValues.venue);
  const [address, setAddress] = useState(initialValues.address);
  const [city, setCity] = useState(initialValues.city);
  const [country, setCountry] = useState(initialValues.country);
  const [latitude, setLatitude] = useState(initialValues.latitude);
  const [longitude, setLongitude] = useState(initialValues.longitude);
  const [startDateTime, setStartDateTime] = useState(initialValues.startDateTime);
  const [endDateTime, setEndDateTime] = useState(initialValues.endDateTime);
  const [description, setDescription] = useState(initialValues.description);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>(initialValues.ticketTypes);
  const [photos, setPhotos] = useState<File[]>(initialValues.photos);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const eventTypes = BASE_EVENT_TYPES.includes(eventType)
    ? BASE_EVENT_TYPES
    : [...BASE_EVENT_TYPES, eventType];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !venue.trim() || !address.trim() || !city.trim() || !country.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!startDateTime || !endDateTime) {
      setError("Please choose a start and an end date/time.");
      return;
    }
    if (endDateTime <= startDateTime) {
      setError("The end date/time must be after the start date/time.");
      return;
    }
    if (!description.trim()) {
      setError("Please add a description.");
      return;
    }
    const categoryList = categories
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean);
    if (categoryList.length === 0) {
      setError("Please add at least one category.");
      return;
    }
    const cleanTicketTypes = ticketTypes.filter((tt) => tt.name.trim() !== "");
    if (cleanTicketTypes.length === 0) {
      setError("Please add at least one ticket type.");
      return;
    }
    if (cleanTicketTypes.some((tt) => !Number.isInteger(tt.quantity) || tt.quantity < 1 || tt.price < 0)) {
      setError("Every ticket type needs a whole quantity of at least 1 and a price of 0 or more.");
      return;
    }
    if ((latitude === "") !== (longitude === "")) {
      setError("Enter both latitude and longitude, or leave both empty.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        categories: categoryList,
        eventType,
        venue,
        address,
        city,
        country,
        latitude,
        longitude,
        startDateTime,
        endDateTime,
        description,
        ticketTypes: cleanTicketTypes,
        photos,
      });
    } catch (submitError) {
      setError(describeError(submitError));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <FormField id="title" label="Title" value={title} onChange={setTitle} placeholder="Event title" />
      <FormField
        id="categories"
        label="Categories (comma separated)"
        value={categories}
        onChange={setCategories}
        placeholder="Music, Live Performance"
      />
      <SelectField id="eventType" label="Event type" value={eventType} onChange={setEventType}>
        {eventTypes.map((type) => (
          <option key={type} value={type}>
            {label(type)}
          </option>
        ))}
      </SelectField>

      <FormField id="venue" label="Venue" value={venue} onChange={setVenue} placeholder="City Theatre" />
      <FormField id="address" label="Address" value={address} onChange={setAddress} placeholder="25 Kentriki Ave" />
      <div className="grid grid-cols-2 gap-4">
        <FormField id="city" label="City" value={city} onChange={setCity} placeholder="Athens" />
        <FormField id="country" label="Country" value={country} onChange={setCountry} placeholder="Greece" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="latitude"
          label="Latitude (optional)"
          type="number"
          value={latitude}
          onChange={setLatitude}
          placeholder="37.9838"
        />
        <FormField
          id="longitude"
          label="Longitude (optional)"
          type="number"
          value={longitude}
          onChange={setLongitude}
          placeholder="23.7275"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="startDateTime"
          label="Start"
          type="datetime-local"
          value={startDateTime}
          onChange={setStartDateTime}
        />
        <FormField
          id="endDateTime"
          label="End"
          type="datetime-local"
          value={endDateTime}
          onChange={setEndDateTime}
        />
      </div>

      <TicketTypesEditor value={ticketTypes} onChange={setTicketTypes} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="photos" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Photos (optional)
        </label>
        {existingPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {existingPhotos.map((photo) => (
              // Served by the API host, so next/image would need it whitelisted.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo} src={photo} alt="" className="h-16 rounded-md border border-black/[.08] object-cover dark:border-white/[.145]" />
            ))}
          </div>
        )}
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))}
          className="text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-950 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-50"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {photos.length > 0
            ? `${photos.length} photo${photos.length === 1 ? "" : "s"} selected${existingPhotos.length > 0 ? " — they replace the current ones" : ""}.`
            : `Up to ${MAX_PHOTOS} images.${existingPhotos.length > 0 ? " Leave empty to keep the current photos." : ""}`}
        </p>
      </div>

      <TextareaField
        id="description"
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Describe the event..."
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}

interface MapEmbedProps {
  latitude: number;
  longitude: number;
  label?: string;
}

export default function MapEmbed({ latitude, longitude, label }: MapEmbedProps) {
  const delta = 0.01;
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(
    "%2C",
  );
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className="overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.145]">
      <iframe
        title={label ?? "Event location map"}
        src={src}
        className="h-72 w-full"
        loading="lazy"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-zinc-50 px-3 py-2 text-xs text-zinc-600 hover:underline dark:bg-zinc-900 dark:text-zinc-400"
      >
        View larger map
      </a>
    </div>
  );
}

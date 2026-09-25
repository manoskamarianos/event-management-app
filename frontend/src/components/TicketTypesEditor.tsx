export interface TicketTypeDraft {
  name: string;
  price: number;
  quantity: number;
}

interface TicketTypesEditorProps {
  value: TicketTypeDraft[];
  onChange: (value: TicketTypeDraft[]) => void;
}

export default function TicketTypesEditor({ value, onChange }: TicketTypesEditorProps) {
  const totalQuantity = value.reduce((sum, tt) => sum + (Number(tt.quantity) || 0), 0);

  function update(index: number, patch: Partial<TicketTypeDraft>) {
    onChange(value.map((tt, i) => (i === index ? { ...tt, ...patch } : tt)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, { name: "", price: 0, quantity: 0 }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ticket types</span>
        <button
          type="button"
          onClick={add}
          className="text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50"
        >
          + Add ticket type
        </button>
      </div>

      {value.map((ticketType, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_100px_100px_auto] items-end gap-2 rounded-md border border-black/[.08] p-3 dark:border-white/[.145]"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Name</label>
            <input
              value={ticketType.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="General Admission"
              className="rounded-md border border-black/[.08] bg-white px-2 py-1.5 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Price (€)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={ticketType.price}
              onChange={(e) => update(index, { price: Number(e.target.value) })}
              className="rounded-md border border-black/[.08] bg-white px-2 py-1.5 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Quantity</label>
            <input
              type="number"
              min={0}
              value={ticketType.quantity}
              onChange={(e) => update(index, { quantity: Number(e.target.value) })}
              className="rounded-md border border-black/[.08] bg-white px-2 py-1.5 text-sm text-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="h-9 rounded-md px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Remove
          </button>
        </div>
      ))}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Total capacity: {totalQuantity} (the event&apos;s capacity is the total of all ticket
        quantities)
      </p>
    </div>
  );
}

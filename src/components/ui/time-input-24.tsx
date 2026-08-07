import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});

function parseTime(value: string | null | undefined): {
  hour: string;
  minute: string;
} {
  if (!value) return { hour: "09", minute: "00" };
  const [hourPart, minutePart] = value.split(":");
  return {
    hour: hourPart?.padStart(2, "0").slice(0, 2) ?? "09",
    minute: minutePart?.padStart(2, "0").slice(0, 2) ?? "00",
  };
}

interface TimeInput24Props {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeInput24({
  value,
  onChange,
  className,
  disabled = false,
}: TimeInput24Props) {
  const { hour, minute } = parseTime(value);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select
        value={hour}
        onValueChange={(h) => onChange(`${h}:${minute}`)}
        options={HOUR_OPTIONS}
        disabled={disabled}
        className="h-9 w-[4.5rem]"
      />
      <span className="text-gray-400">:</span>
      <Select
        value={minute}
        onValueChange={(m) => onChange(`${hour}:${m}`)}
        options={MINUTE_OPTIONS}
        disabled={disabled}
        className="h-9 w-[4.5rem]"
      />
    </div>
  );
}

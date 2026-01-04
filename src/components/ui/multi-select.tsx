import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useTranslation } from "@/lib/utils/translationLoader";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 font-normal",
            !value.length && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {selectedOptions.length > 0 ? (
              <span className="truncate">
                {selectedOptions.length === 1
                  ? selectedOptions[0].label
                  : `${selectedOptions.length} ${t("selected")}`}
              </span>
            ) : (
              placeholder
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] p-0">
        <div className="p-1">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <DropdownMenuItem
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  handleSelect(option.value);
                }}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border-1",
                    isSelected
                      ? "border-primary  text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {isSelected && (
                    <Check className="h-1 w-1 text-primary stroke-2" />
                  )}
                </div>
                <span className="flex-1">{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

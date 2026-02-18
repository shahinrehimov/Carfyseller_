import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

interface AutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchEndpoint: string;
  renderOption: (option: any) => React.ReactNode;
  getOptionLabel: (option: any) => string;
  getOptionValue: (option: any) => string;
  disabled?: boolean;
  className?: string;
  initialOption?: any;
}

export function Autocomplete({
  value,
  onValueChange,
  placeholder = "Search...",
  searchEndpoint,
  renderOption,
  getOptionLabel,
  getOptionValue,
  disabled = false,
  className,
  initialOption,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(initialOption || null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set selectedOption from initialOption when it arrives
  useEffect(() => {
    if (initialOption && !selectedOption) {
      setSelectedOption(initialOption);
    }
  }, [initialOption]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch options
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const searchParam =
          debouncedQuery && debouncedQuery.trim() !== ""
            ? `search=${encodeURIComponent(debouncedQuery)}&`
            : "";
        const response = await controlPrivateApi.get(
          `${searchEndpoint}${searchEndpoint.includes("?") ? "&" : "?"}${searchParam}`
        );
        setOptions(response.data.data || []);
      } catch (error) {
        console.error("Error fetching options:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchOptions();
    }
  }, [debouncedQuery, searchEndpoint, isOpen]);

  // Find selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => getOptionValue(opt) === value);
      if (option) setSelectedOption(option);
    } else if (!value) {
      setSelectedOption(null);
    }
    // If value exists but options are empty (not yet loaded), keep existing selectedOption
  }, [value, options, getOptionValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: any) => {
    const optionValue = getOptionValue(option);
    onValueChange(optionValue);
    setSelectedOption(option);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between h-10 font-normal",
          !selectedOption && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded border px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : options.length > 0 ? (
              options.map((option) => (
                <button
                  key={getOptionValue(option)}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full rounded px-2 py-2 text-left text-sm hover:bg-accent transition-colors",
                    getOptionValue(option) === value && "bg-accent"
                  )}
                >
                  {renderOption(option)}
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

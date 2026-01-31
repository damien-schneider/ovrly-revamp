import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FONT_CATEGORIES,
  type FontCategory,
  getFontsByCategory,
} from "@/lib/fonts/google-fonts";
import { loadFont } from "@/lib/fonts/use-load-font";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea, ScrollBar } from "./scroll-area";

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FontPicker({ value, onChange, className }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FontCategory>("all");
  const [search, setSearch] = useState("");

  // Load the currently selected font
  useEffect(() => {
    if (value) {
      loadFont(value);
    }
  }, [value]);

  const fonts = getFontsByCategory(category);

  const handleSelect = useCallback(
    (fontFamily: string) => {
      onChange(fontFamily);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        className={cn(
          "flex h-6 w-full items-center justify-between rounded-md border border-border/60 bg-secondary/50 px-2 text-[11px] transition-colors hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
          className
        )}
      >
        <span className="truncate" style={{ fontFamily: value }}>
          {value}
        </span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Search fonts..."
            value={search}
          />
          <ScrollArea className="w-full border-b border-border/50">
            <div className="flex gap-1 p-1">
              {FONT_CATEGORIES.map((cat) => (
                <button
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                    category === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  type="button"
                >
                  {cat.value === "all" ? "All" : cat.label.split(" ")[0]}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <CommandList className="max-h-60">
            <CommandEmpty>No fonts found.</CommandEmpty>
            <CommandGroup>
              {fonts
                .filter((font) =>
                  font.family.toLowerCase().includes(search.toLowerCase())
                )
                .map((font) => (
                  <FontItem
                    family={font.family}
                    isSelected={value === font.family}
                    key={font.family}
                    onSelect={handleSelect}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface FontItemProps {
  family: string;
  isSelected: boolean;
  onSelect: (family: string) => void;
}

function FontItem({ family, isSelected, onSelect }: FontItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Load font when item becomes visible
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            loadFont(family);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "50px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [family]);

  return (
    <CommandItem
      className="data-[checked=true]:bg-muted data-selected:bg-transparent"
      data-checked={isSelected}
      onSelect={() => onSelect(family)}
      ref={ref}
      value={family}
    >
      <span
        className="truncate"
        style={{
          fontFamily: isVisible ? family : "inherit",
        }}
      >
        {family}
      </span>
    </CommandItem>
  );
}

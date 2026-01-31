import { Slider } from "@/components/ui/slider";
import type { FilterSettings, OverlayElement } from "@/features/canvas/types";
import {
  getSliderValue,
  OptionalPropertySection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface FiltersSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

const defaultFilters: FilterSettings = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  saturate: 100,
  hueRotate: 0,
  invert: 0,
  sepia: 0,
};

export function FiltersSection({ element, onUpdate }: FiltersSectionProps) {
  const hasFilters = element.filters !== undefined;
  const filters = element.filters ?? defaultFilters;

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    onUpdate(element.id, {
      filters: { ...filters, [key]: value },
    });
  };

  return (
    <OptionalPropertySection
      isSet={hasFilters}
      onAdd={() => onUpdate(element.id, { filters: { ...defaultFilters } })}
      onRemove={() => onUpdate(element.id, { filters: undefined })}
      title="Filters"
    >
      <div className="space-y-2">
        <PropertyRow label="Blur">
          <ScrubInput
            max={50}
            min={0}
            onChange={(v) => updateFilter("blur", v)}
            suffix="px"
            value={filters.blur ?? 0}
          />
        </PropertyRow>

        <PropertyRow label="Brightness">
          <Slider
            className="flex-1"
            max={200}
            min={0}
            onValueChange={(v) => updateFilter("brightness", getSliderValue(v))}
            step={1}
            value={[filters.brightness ?? 100]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.brightness ?? 100}%
          </span>
        </PropertyRow>

        <PropertyRow label="Contrast">
          <Slider
            className="flex-1"
            max={200}
            min={0}
            onValueChange={(v) => updateFilter("contrast", getSliderValue(v))}
            step={1}
            value={[filters.contrast ?? 100]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.contrast ?? 100}%
          </span>
        </PropertyRow>

        <PropertyRow label="Grayscale">
          <Slider
            className="flex-1"
            max={100}
            min={0}
            onValueChange={(v) => updateFilter("grayscale", getSliderValue(v))}
            step={1}
            value={[filters.grayscale ?? 0]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.grayscale ?? 0}%
          </span>
        </PropertyRow>

        <PropertyRow label="Saturate">
          <Slider
            className="flex-1"
            max={200}
            min={0}
            onValueChange={(v) => updateFilter("saturate", getSliderValue(v))}
            step={1}
            value={[filters.saturate ?? 100]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.saturate ?? 100}%
          </span>
        </PropertyRow>

        <PropertyRow label="Hue">
          <Slider
            className="flex-1"
            max={360}
            min={0}
            onValueChange={(v) => updateFilter("hueRotate", getSliderValue(v))}
            step={1}
            value={[filters.hueRotate ?? 0]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.hueRotate ?? 0}°
          </span>
        </PropertyRow>

        <PropertyRow label="Invert">
          <Slider
            className="flex-1"
            max={100}
            min={0}
            onValueChange={(v) => updateFilter("invert", getSliderValue(v))}
            step={1}
            value={[filters.invert ?? 0]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.invert ?? 0}%
          </span>
        </PropertyRow>

        <PropertyRow label="Sepia">
          <Slider
            className="flex-1"
            max={100}
            min={0}
            onValueChange={(v) => updateFilter("sepia", getSliderValue(v))}
            step={1}
            value={[filters.sepia ?? 0]}
          />
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {filters.sepia ?? 0}%
          </span>
        </PropertyRow>
      </div>
    </OptionalPropertySection>
  );
}

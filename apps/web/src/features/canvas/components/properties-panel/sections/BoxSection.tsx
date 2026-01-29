import type { BoxElement, OverlayElement } from "@/features/canvas/types";
import {
  ColorSwatch,
  CornerRadiusInput,
  OptionalPropertySection,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface BoxSectionProps {
  element: BoxElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function BoxFillSection({ element, onUpdate }: BoxSectionProps) {
  const hasFill = element.backgroundColor !== null;

  return (
    <OptionalPropertySection
      isSet={hasFill}
      onAdd={() =>
        onUpdate(element.id, {
          backgroundColor: "#3b82f6",
        } as Partial<BoxElement>)
      }
      onRemove={() =>
        onUpdate(element.id, {
          backgroundColor: null,
        } as Partial<BoxElement>)
      }
      title="Fill"
    >
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={element.backgroundColor ?? "#000000"}
            onChange={(color) =>
              onUpdate(element.id, {
                backgroundColor: color,
              } as Partial<BoxElement>)
            }
          />
        </PropertyRow>
      </div>
    </OptionalPropertySection>
  );
}

export function BoxStrokeSection({ element, onUpdate }: BoxSectionProps) {
  const hasStroke =
    element.borderColor !== null && element.borderWidth !== null;

  return (
    <OptionalPropertySection
      isSet={hasStroke}
      onAdd={() =>
        onUpdate(element.id, {
          borderColor: "#1d4ed8",
          borderWidth: 2,
        } as Partial<BoxElement>)
      }
      onRemove={() =>
        onUpdate(element.id, {
          borderColor: null,
          borderWidth: null,
        } as Partial<BoxElement>)
      }
      title="Stroke"
    >
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={element.borderColor ?? "#000000"}
            onChange={(color) =>
              onUpdate(element.id, {
                borderColor: color,
              } as Partial<BoxElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Width">
          <ScrubInput
            min={0}
            onChange={(v) =>
              onUpdate(element.id, {
                borderWidth: v,
              } as Partial<BoxElement>)
            }
            suffix="px"
            value={element.borderWidth ?? 0}
          />
        </PropertyRow>
      </div>
    </OptionalPropertySection>
  );
}

export function BoxCornerRadiusSection({ element, onUpdate }: BoxSectionProps) {
  return (
    <PanelSection title="Corner Radius">
      <CornerRadiusInput
        linked={element.borderRadiusLinked}
        onChange={(corner, value) => {
          const cornerKey = `borderRadius${corner.toUpperCase()}` as
            | "borderRadiusTL"
            | "borderRadiusTR"
            | "borderRadiusBL"
            | "borderRadiusBR";
          onUpdate(element.id, {
            [cornerKey]: value,
          } as Partial<BoxElement>);
        }}
        onLinkChange={(linked) =>
          onUpdate(element.id, {
            borderRadiusLinked: linked,
          } as Partial<BoxElement>)
        }
        values={{
          tl: element.borderRadiusTL,
          tr: element.borderRadiusTR,
          bl: element.borderRadiusBL,
          br: element.borderRadiusBR,
        }}
      />
    </PanelSection>
  );
}

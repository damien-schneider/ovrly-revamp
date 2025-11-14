import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { ArrowDown, Sparkle, Television } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { FireworkPositionSelector, type FireworkPosition } from "@/components/firework-position-selector";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { EmojiWallEffect, GravityRemovalMode } from "@/components/emoji-wall-display";

type WallEmoteSettingsProps = {
  overlayId: Id<"overlays">;
};

type WallEmoteSettingsData = {
  effect?: EmojiWallEffect;
  emojiSize?: number;
  maxEmojis?: number;
  minEmojiLifetime?: number;
  maxEmojiLifetime?: number;
  emojiLifetime?: number;
  gravityPower?: number;
  gravityInitialVelocity?: number;
  gravityRemovalMode?: GravityRemovalMode;
  minGravityBounceCount?: number;
  maxGravityBounceCount?: number;
  gravityBounceCount?: number;
  bouncingPower?: number;
  bouncingSpeed?: number;
  fireworkExplosionRadius?: number;
  fireworkRadius?: number;
  fireworkSpeed?: number;
  fireworkPosition?: FireworkPosition;
  previewEmojisEnabled?: boolean;
  emojisPerSecond?: number;
};

const DEFAULT_EMOJI_SIZE = 48;
const DEFAULT_MAX_EMOJIS = 50;
const DEFAULT_GRAVITY_POWER = 25;
const DEFAULT_GRAVITY_INITIAL_VELOCITY = 30;
const DEFAULT_BOUNCING_POWER = 50;
const DEFAULT_BOUNCING_SPEED = 2;
const DEFAULT_FIREWORK_RADIUS = 200;
const DEFAULT_EMOJI_LIFETIME = 5;
const DEFAULT_MIN_EMOJI_LIFETIME = 2;
const DEFAULT_MAX_EMOJI_LIFETIME = 8;
const DEFAULT_GRAVITY_BOUNCE_COUNT = 3;
const DEFAULT_MIN_GRAVITY_BOUNCE_COUNT = 1;
const DEFAULT_MAX_GRAVITY_BOUNCE_COUNT = 5;
const DEFAULT_EMOJIS_PER_SECOND = 1;

export function WallEmoteSettings({ overlayId }: WallEmoteSettingsProps) {
  const overlay = useQuery(api.overlays.getById, { id: overlayId });
  const updateOverlay = useMutation(api.overlays.update);

  const [settings, setSettings] = useState<WallEmoteSettingsData>({});

  // Load settings from overlay
  useEffect(() => {
    if (overlay?.settings) {
      const loadedSettings = overlay.settings as WallEmoteSettingsData;
      setSettings(loadedSettings);
    }
  }, [overlay]);

  // Local state for sliders to prevent focus loss during dragging
  const [localGravityPower, setLocalGravityPower] = useState(
    settings.gravityPower ?? DEFAULT_GRAVITY_POWER
  );
  const [localGravityInitialVelocity, setLocalGravityInitialVelocity] =
    useState(settings.gravityInitialVelocity ?? DEFAULT_GRAVITY_INITIAL_VELOCITY);
  const [localGravityBounceCountRange, setLocalGravityBounceCountRange] =
    useState([
      settings.minGravityBounceCount ?? DEFAULT_MIN_GRAVITY_BOUNCE_COUNT,
      settings.maxGravityBounceCount ?? DEFAULT_MAX_GRAVITY_BOUNCE_COUNT,
    ]);
  const [localBouncingPower, setLocalBouncingPower] = useState(
    settings.bouncingPower ?? DEFAULT_BOUNCING_POWER
  );
  const [localEmojiSize, setLocalEmojiSize] = useState(
    settings.emojiSize ?? DEFAULT_EMOJI_SIZE
  );
  const [localMaxEmojis, setLocalMaxEmojis] = useState(
    settings.maxEmojis ?? DEFAULT_MAX_EMOJIS
  );
  const [localEmojiLifetimeRange, setLocalEmojiLifetimeRange] = useState([
    settings.minEmojiLifetime ?? DEFAULT_MIN_EMOJI_LIFETIME,
    settings.maxEmojiLifetime ?? DEFAULT_MAX_EMOJI_LIFETIME,
  ]);
  const [localBouncingSpeed, setLocalBouncingSpeed] = useState(
    settings.bouncingSpeed ?? DEFAULT_BOUNCING_SPEED
  );
  const [localFireworkExplosionRadius, setLocalFireworkExplosionRadius] =
    useState(settings.fireworkExplosionRadius ?? DEFAULT_FIREWORK_RADIUS);
  const [localEmojisPerSecond, setLocalEmojisPerSecond] = useState(
    settings.emojisPerSecond ?? DEFAULT_EMOJIS_PER_SECOND
  );

  // Sync local state with settings when they change externally
  useEffect(() => {
    setLocalGravityPower(settings.gravityPower ?? DEFAULT_GRAVITY_POWER);
  }, [settings.gravityPower]);

  useEffect(() => {
    setLocalGravityInitialVelocity(
      settings.gravityInitialVelocity ?? DEFAULT_GRAVITY_INITIAL_VELOCITY
    );
  }, [settings.gravityInitialVelocity]);

  useEffect(() => {
    setLocalGravityBounceCountRange([
      settings.minGravityBounceCount ?? DEFAULT_MIN_GRAVITY_BOUNCE_COUNT,
      settings.maxGravityBounceCount ?? DEFAULT_MAX_GRAVITY_BOUNCE_COUNT,
    ]);
  }, [settings.minGravityBounceCount, settings.maxGravityBounceCount]);

  useEffect(() => {
    setLocalBouncingPower(settings.bouncingPower ?? DEFAULT_BOUNCING_POWER);
  }, [settings.bouncingPower]);

  useEffect(() => {
    setLocalEmojiSize(settings.emojiSize ?? DEFAULT_EMOJI_SIZE);
  }, [settings.emojiSize]);

  useEffect(() => {
    setLocalMaxEmojis(settings.maxEmojis ?? DEFAULT_MAX_EMOJIS);
  }, [settings.maxEmojis]);

  useEffect(() => {
    setLocalEmojiLifetimeRange([
      settings.minEmojiLifetime ?? DEFAULT_MIN_EMOJI_LIFETIME,
      settings.maxEmojiLifetime ?? DEFAULT_MAX_EMOJI_LIFETIME,
    ]);
  }, [settings.minEmojiLifetime, settings.maxEmojiLifetime]);

  useEffect(() => {
    setLocalBouncingSpeed(settings.bouncingSpeed ?? DEFAULT_BOUNCING_SPEED);
  }, [settings.bouncingSpeed]);

  useEffect(() => {
    setLocalFireworkExplosionRadius(
      settings.fireworkExplosionRadius ?? DEFAULT_FIREWORK_RADIUS
    );
  }, [settings.fireworkExplosionRadius]);

  useEffect(() => {
    setLocalEmojisPerSecond(
      settings.emojisPerSecond ?? DEFAULT_EMOJIS_PER_SECOND
    );
  }, [settings.emojisPerSecond]);

  const updateSetting = async (updates: Partial<WallEmoteSettingsData>) => {
    if (!overlay) return;

    const currentSettings = (overlay.settings || {}) as Record<string, unknown>;
    const newSettings = { ...currentSettings, ...settings, ...updates };
    setSettings(newSettings as WallEmoteSettingsData);

    try {
      await updateOverlay({
        id: overlayId,
        settings: newSettings,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      // Revert on error - reload from overlay
      if (overlay?.settings) {
        setSettings(overlay.settings as WallEmoteSettingsData);
      }
    }
  };

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const effect = settings.effect ?? "gravity";
  const isFireworkEffect = effect === "firework";
  const isBouncingEffect = effect === "bouncing-dvd";
  const isGravityEffect = effect === "gravity";
  const gravityRemovalMode = settings.gravityRemovalMode ?? "time";

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <ScrollBar orientation="vertical" />
        <div className="p-4">
          <div className="space-y-6">
            {/* Effect Type Selection */}
            <div className="space-y-3">
              <div>
                <Label className="font-medium text-sm">Effect Type</Label>
                <p className="text-muted-foreground text-xs">
                  Choose how emojis animate on screen
                </p>
              </div>
              <Tabs
                onValueChange={(value) =>
                  updateSetting({ effect: value as EmojiWallEffect })
                }
                value={effect}
              >
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="gravity">
                    <ArrowDown className="mr-2 h-4 w-4" weight="regular" />
                    Gravity
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="bouncing-dvd">
                    <Television className="mr-2 h-4 w-4" weight="regular" />
                    Bouncing DVD
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="firework">
                    <Sparkle className="mr-2 h-4 w-4" weight="regular" />
                    Firework
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator />

            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">General</h3>

              {/* Emoji Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Emoji Size</Label>
                  <span className="text-muted-foreground text-xs">
                    {localEmojiSize}px
                  </span>
                </div>
                <Slider
                  max={128}
                  min={24}
                  onValueChange={(value) =>
                    setLocalEmojiSize(value[0] || DEFAULT_EMOJI_SIZE)
                  }
                  onValueCommit={(value) =>
                    updateSetting({ emojiSize: value[0] || DEFAULT_EMOJI_SIZE })
                  }
                  step={4}
                  value={[localEmojiSize]}
                  variant="horizontal-thumb"
                />
              </div>

              {/* Max Emojis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Max Emojis on Screen</Label>
                  <span className="text-muted-foreground text-xs">
                    {localMaxEmojis}
                  </span>
                </div>
                <Slider
                  max={200}
                  min={10}
                  onValueChange={(value) =>
                    setLocalMaxEmojis(value[0] || DEFAULT_MAX_EMOJIS)
                  }
                  onValueCommit={(value) =>
                    updateSetting({ maxEmojis: value[0] || DEFAULT_MAX_EMOJIS })
                  }
                  step={10}
                  value={[localMaxEmojis]}
                  variant="horizontal-thumb"
                />
              </div>

              {/* Emoji Lifetime/Bounce Count - with tabs for gravity effect */}
              {isGravityEffect ? (
                <Tabs
                  onValueChange={(value) =>
                    updateSetting({
                      gravityRemovalMode: value as GravityRemovalMode,
                    })
                  }
                  value={gravityRemovalMode}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="time">Time-based</TabsTrigger>
                    <TabsTrigger value="bounce">Bounce Count</TabsTrigger>
                  </TabsList>
                  <TabsContent className="mt-2 space-y-2" value="time">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Emoji Lifetime Range</Label>
                      <span className="text-muted-foreground text-xs">
                        {localEmojiLifetimeRange[0]}s -{" "}
                        {localEmojiLifetimeRange[1]}s
                      </span>
                    </div>
                    <Slider
                      max={15}
                      min={0.5}
                      minStepsBetweenThumbs={1}
                      onValueChange={(value) => {
                        if (
                          value.length === 2 &&
                          value[0] !== undefined &&
                          value[1] !== undefined
                        ) {
                          setLocalEmojiLifetimeRange([value[0], value[1]]);
                        }
                      }}
                      onValueCommit={(value) => {
                        if (
                          value.length === 2 &&
                          value[0] !== undefined &&
                          value[1] !== undefined
                        ) {
                          updateSetting({
                            minEmojiLifetime: value[0],
                            maxEmojiLifetime: value[1],
                          });
                        }
                      }}
                      step={0.5}
                      value={localEmojiLifetimeRange}
                      variant="horizontal-thumb"
                    />
                  </TabsContent>
                  <TabsContent className="mt-2 space-y-2" value="bounce">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Bounce Count Range</Label>
                      <span className="text-muted-foreground text-xs">
                        {localGravityBounceCountRange[0]} -{" "}
                        {localGravityBounceCountRange[1]}
                      </span>
                    </div>
                    <Slider
                      max={20}
                      min={1}
                      minStepsBetweenThumbs={1}
                      onValueChange={(value) => {
                        if (
                          value.length === 2 &&
                          value[0] !== undefined &&
                          value[1] !== undefined
                        ) {
                          setLocalGravityBounceCountRange([value[0], value[1]]);
                        }
                      }}
                      onValueCommit={(value) => {
                        if (
                          value.length === 2 &&
                          value[0] !== undefined &&
                          value[1] !== undefined
                        ) {
                          updateSetting({
                            minGravityBounceCount: value[0],
                            maxGravityBounceCount: value[1],
                          });
                        }
                      }}
                      step={1}
                      value={localGravityBounceCountRange}
                      variant="horizontal-thumb"
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Emoji Lifetime Range</Label>
                    <span className="text-muted-foreground text-xs">
                      {localEmojiLifetimeRange[0]}s - {localEmojiLifetimeRange[1]}s
                    </span>
                  </div>
                  <Slider
                    max={15}
                    min={0.5}
                    minStepsBetweenThumbs={1}
                    onValueChange={(value) => {
                      if (
                        value.length === 2 &&
                        value[0] !== undefined &&
                        value[1] !== undefined
                      ) {
                        setLocalEmojiLifetimeRange([value[0], value[1]]);
                      }
                    }}
                    onValueCommit={(value) => {
                      if (
                        value.length === 2 &&
                        value[0] !== undefined &&
                        value[1] !== undefined
                      ) {
                        updateSetting({
                          minEmojiLifetime: value[0],
                          maxEmojiLifetime: value[1],
                        });
                      }
                    }}
                    step={0.5}
                    value={localEmojiLifetimeRange}
                    variant="horizontal-thumb"
                  />
                </div>
              )}
            </div>

            {/* Gravity Settings */}
            {isGravityEffect && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Gravity Settings</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Gravity Power</Label>
                      <span className="text-muted-foreground text-xs">
                        {localGravityPower}
                      </span>
                    </div>
                    <Slider
                      max={100}
                      min={1}
                      onValueChange={(value) =>
                        setLocalGravityPower(value[0] || DEFAULT_GRAVITY_POWER)
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          gravityPower: value[0] || DEFAULT_GRAVITY_POWER,
                        })
                      }
                      step={1}
                      value={[localGravityPower]}
                      variant="horizontal-thumb"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Bouncing Power</Label>
                      <span className="text-muted-foreground text-xs">
                        {localBouncingPower}
                      </span>
                    </div>
                    <Slider
                      max={100}
                      min={0}
                      onValueChange={(value) =>
                        setLocalBouncingPower(value[0] || DEFAULT_BOUNCING_POWER)
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          bouncingPower: value[0] || DEFAULT_BOUNCING_POWER,
                        })
                      }
                      step={5}
                      value={[localBouncingPower]}
                      variant="horizontal-thumb"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Initial Velocity</Label>
                      <span className="text-muted-foreground text-xs">
                        {localGravityInitialVelocity}
                      </span>
                    </div>
                    <Slider
                      max={100}
                      min={0}
                      onValueChange={(value) =>
                        setLocalGravityInitialVelocity(
                          value[0] || DEFAULT_GRAVITY_INITIAL_VELOCITY
                        )
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          gravityInitialVelocity:
                            value[0] || DEFAULT_GRAVITY_INITIAL_VELOCITY,
                        })
                      }
                      step={5}
                      value={[localGravityInitialVelocity]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Bouncing Settings */}
            {isBouncingEffect && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Bouncing Settings</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Bouncing Speed</Label>
                      <span className="text-muted-foreground text-xs">
                        {localBouncingSpeed}
                      </span>
                    </div>
                    <Slider
                      max={10}
                      min={1}
                      onValueChange={(value) =>
                        setLocalBouncingSpeed(value[0] || DEFAULT_BOUNCING_SPEED)
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          bouncingSpeed: value[0] || DEFAULT_BOUNCING_SPEED,
                        })
                      }
                      step={1}
                      value={[localBouncingSpeed]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Firework Settings */}
            {isFireworkEffect && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Firework Settings</h3>

                  <FireworkPositionSelector
                    onChange={(position) =>
                      updateSetting({ fireworkPosition: position })
                    }
                    value={settings.fireworkPosition ?? "center-center"}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Explosion Radius</Label>
                      <span className="text-muted-foreground text-xs">
                        {localFireworkExplosionRadius}px
                      </span>
                    </div>
                    <Slider
                      max={500}
                      min={50}
                      onValueChange={(value) =>
                        setLocalFireworkExplosionRadius(
                          value[0] || DEFAULT_FIREWORK_RADIUS
                        )
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          fireworkExplosionRadius:
                            value[0] || DEFAULT_FIREWORK_RADIUS,
                        })
                      }
                      step={10}
                      value={[localFireworkExplosionRadius]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Preview Settings */}
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Preview</h3>

              <div className="flex items-center justify-between">
                <Label className="text-xs" htmlFor="preview-emojis">
                  Show test emojis
                </Label>
                <Switch
                  checked={settings.previewEmojisEnabled ?? false}
                  id="preview-emojis"
                  onCheckedChange={(checked) =>
                    updateSetting({ previewEmojisEnabled: checked })
                  }
                />
              </div>

              {settings.previewEmojisEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Emojis per Second</Label>
                    <span className="text-muted-foreground text-xs">
                      {localEmojisPerSecond}
                    </span>
                  </div>
                  <Slider
                    max={10}
                    min={0.1}
                    onValueChange={(value) =>
                      setLocalEmojisPerSecond(value[0] || DEFAULT_EMOJIS_PER_SECOND)
                    }
                    onValueCommit={(value) =>
                      updateSetting({
                        emojisPerSecond: value[0] || DEFAULT_EMOJIS_PER_SECOND,
                      })
                    }
                    step={0.1}
                    value={[localEmojisPerSecond]}
                    variant="horizontal-thumb"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}


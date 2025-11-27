import { atom } from "jotai";

export type EmoteStyle =
  | "pixel-art"
  | "cartoon"
  | "realistic"
  | "3d-render"
  | "watercolor"
  | "sketch"
  | "anime";

export interface GeneratedAsset {
  id: string;
  url: string;
  prompt: string;
  style: EmoteStyle;
  createdAt: number;
  type: "emote" | "badge";
}

export const generatedAssetsAtom = atom<GeneratedAsset[]>([]);
export const selectedAssetAtom = atom<GeneratedAsset | null>(null);

// Module A State
export const creatorPromptAtom = atom("");
export const creatorStyleAtom = atom<EmoteStyle>("cartoon");
export const isGeneratingAtom = atom(false);

// Module B State
export const packReferenceAtom = atom<string | null>(null);
export const packEmoteListAtom = atom<string[]>([
  "Love",
  "Hype",
  "Sad",
  "GG",
  "Lurk",
]);
export const isGeneratingPackAtom = atom(false);

// Module C State
export const editorImageAtom = atom<string | null>(null);
export const editorInstructionAtom = atom("");
export const isEditingAtom = atom(false);

export const activeTabAtom = atom("creator");

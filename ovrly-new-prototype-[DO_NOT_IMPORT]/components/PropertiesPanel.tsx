import {
  Copy,
  Download,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Wand2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { generateChatTheme } from "../services/geminiService";
import { type ChatElement, ElementType, type OverlayElement } from "../types";

interface PropertiesPanelProps {
  elements: OverlayElement[];
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
  onDelete: (id: string) => void;
  onExport: (id?: string) => void;
  onPreview: (id: string) => void;
  onCopyLink: (id: string) => void;
  onDeselect: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  elements,
  selectedIds,
  onUpdate,
  onDelete,
  onExport,
  onPreview,
  onCopyLink,
  onDeselect,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const element = selectedElements[0];

  const handleAiTheme = async () => {
    if (!(aiPrompt && element) || element.type !== ElementType.CHAT) {
      return;
    }
    setIsGenerating(true);
    const theme = await generateChatTheme(aiPrompt);
    if (theme) {
      onUpdate(element.id, {
        style: { ...(element as ChatElement).style, ...theme },
      } as any);
    }
    setIsGenerating(false);
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xl">
        <button
          className="p-2 text-gray-400 transition-colors hover:text-gray-900"
          onClick={onToggleCollapse}
        >
          <PanelRightOpen size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 bottom-6 z-[90] flex w-80 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-300">
      {element ? (
        <>
          <div className="flex h-16 items-center justify-between border-gray-100 border-b bg-gray-50/50 p-5">
            <input
              className="w-40 rounded bg-transparent px-2 py-1 font-bold text-gray-900 text-sm ring-blue-500/20 focus:outline-none focus:ring-2"
              onChange={(e) => onUpdate(element.id, { name: e.target.value })}
              value={element.name}
            />
            <div className="flex items-center gap-1">
              <button
                className="rounded-xl p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                onClick={() => onDelete(element.id)}
              >
                <Trash2 size={18} />
              </button>
              <button
                className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900"
                onClick={onToggleCollapse}
              >
                <PanelRightClose size={16} />
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
            <section className="space-y-3">
              <h3 className="mb-1 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                Source Integration
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 font-bold text-white text-xs shadow-sm transition-all hover:bg-black"
                  onClick={() => onPreview(element.id)}
                >
                  <ExternalLink size={14} /> Live Preview
                </button>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-bold text-white text-xs shadow-blue-100 shadow-md transition-all hover:bg-blue-700"
                  onClick={() => onCopyLink(element.id)}
                >
                  <Copy size={14} /> Copy OBS Data URI
                </button>
              </div>
              <p className="px-1 text-[9px] text-gray-400 italic">
                Tip: Use the Data URI in an OBS browser source URL field.
              </p>
              <div className="my-4 h-px bg-gray-100" />
            </section>

            <section>
              <h3 className="mb-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                Position & Size
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <PropInput
                  label="X"
                  onChange={(v) => onUpdate(element.id, { x: v })}
                  value={Math.round(element.x)}
                />
                <PropInput
                  label="Y"
                  onChange={(v) => onUpdate(element.id, { y: v })}
                  value={Math.round(element.y)}
                />
                <PropInput
                  label="Width"
                  onChange={(v) => onUpdate(element.id, { width: v })}
                  value={Math.round(element.width)}
                />
                <PropInput
                  label="Height"
                  onChange={(v) => onUpdate(element.id, { height: v })}
                  value={Math.round(element.height)}
                />
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {element.type === ElementType.OVERLAY && (
              <section>
                <h3 className="mb-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  Overlay Settings
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <span className="font-bold text-gray-600 text-xs">
                    Background
                  </span>
                  <input
                    className="h-8 w-8 cursor-pointer rounded-lg border-2 border-white shadow-sm"
                    onChange={(e) =>
                      onUpdate(element.id, {
                        backgroundColor: e.target.value,
                      } as any)
                    }
                    type="color"
                    value={(element as any).backgroundColor}
                  />
                </div>
              </section>
            )}

            {element.type === ElementType.TEXT && (
              <section className="space-y-4">
                <h3 className="mb-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  Content
                </h3>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-gray-900 text-sm ring-blue-500/10 focus:ring-2"
                  onChange={(e) =>
                    onUpdate(element.id, { content: e.target.value } as any)
                  }
                  value={(element as any).content}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="px-1 font-bold text-[10px] text-gray-400">
                      Color
                    </label>
                    <input
                      className="h-10 w-full cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-1"
                      onChange={(e) =>
                        onUpdate(element.id, { color: e.target.value } as any)
                      }
                      type="color"
                      value={(element as any).color}
                    />
                  </div>
                  <PropInput
                    label="Font Size"
                    onChange={(v) =>
                      onUpdate(element.id, { fontSize: v } as any)
                    }
                    value={(element as any).fontSize}
                  />
                </div>
              </section>
            )}

            {element.type === ElementType.CHAT && (
              <section className="space-y-4">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-[10px] text-purple-400 uppercase tracking-widest">
                  <Wand2 size={12} /> AI Designer
                </h3>
                <div className="space-y-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <textarea
                    className="h-20 w-full resize-none rounded-xl border border-purple-100 bg-white p-3 text-gray-700 text-xs shadow-inner"
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'Soft glassmorphism with blue neon text'"
                    value={aiPrompt}
                  />
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 font-bold text-[11px] text-white shadow-lg shadow-purple-100 hover:bg-purple-700 disabled:opacity-50"
                    disabled={isGenerating || !aiPrompt}
                    onClick={handleAiTheme}
                  >
                    {isGenerating ? "Designing..." : "Magic Generate"}
                  </button>
                </div>
              </section>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-1 flex-col p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-black text-2xl text-gray-900 italic tracking-tight">
              Ovrly
            </h2>
            <button
              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900"
              onClick={onToggleCollapse}
            >
              <PanelRightClose size={16} />
            </button>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <p className="mb-8 text-gray-500 text-sm leading-relaxed">
              Design pixel-perfect stream overlays. Select a layer to customize
              or add one from the tool dock.
            </p>

            <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <h3 className="mb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">
                Quick Shortcuts
              </h3>
              <ul className="space-y-3 font-medium text-gray-600 text-xs">
                <li className="flex justify-between">
                  <span>Pan Canvas</span>
                  <kbd className="rounded border bg-white px-1.5 py-0.5 font-sans shadow-sm">
                    H
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span>Select Tool</span>
                  <kbd className="rounded border bg-white px-1.5 py-0.5 font-sans shadow-sm">
                    V
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span>Undo Action</span>
                  <kbd className="rounded border bg-white px-1.5 py-0.5 font-sans shadow-sm">
                    Ctrl+Z
                  </kbd>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-4">
            <h3 className="px-1 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
              Browser Sources
            </h3>
            <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
              {elements.length === 0 ? (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 py-4 font-bold text-gray-700 text-sm shadow-sm transition-all hover:bg-gray-200"
                  onClick={() => onExport()}
                >
                  <Download size={16} /> Export Project
                </button>
              ) : (
                elements.map((el) => (
                  <button
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 font-bold text-gray-700 text-xs shadow-sm transition-all hover:bg-gray-50"
                    key={el.id}
                    onClick={() => onExport(el.id)}
                  >
                    <span className="max-w-[140px] truncate text-left">
                      {el.name}
                    </span>
                    <Download
                      className="flex-shrink-0 text-gray-400"
                      size={14}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PropInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1">
    <label className="px-1 font-bold text-[10px] text-gray-400 uppercase">
      {label}
    </label>
    <input
      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 font-mono text-gray-900 text-sm ring-blue-500/10 focus:ring-2"
      onChange={(e) => onChange(Number(e.target.value))}
      type="number"
      value={value}
    />
  </div>
);

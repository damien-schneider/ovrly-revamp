"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { elementsAtom, updateElementsAtom } from "@/atoms/canvas-atoms";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  bringForward,
  bringToFront,
  canBringForward,
  canSendBackward,
  sendBackward,
  sendToBack,
} from "../lib/z-index-utils";

interface CanvasContextMenuProps {
  children: ReactNode;
  selectedIds: string[];
}

export function CanvasContextMenu({
  children,
  selectedIds,
}: CanvasContextMenuProps) {
  const elements = useAtomValue(elementsAtom);
  const updateElements = useSetAtom(updateElementsAtom);

  const hasSelection = selectedIds.length > 0;
  const canMoveForward = hasSelection && canBringForward(selectedIds, elements);
  const canMoveBackward =
    hasSelection && canSendBackward(selectedIds, elements);

  const handleBringToFront = () => {
    if (!hasSelection) {
      return;
    }
    const newElements = bringToFront(selectedIds, elements);
    updateElements(newElements);
  };

  const handleBringForward = () => {
    if (!canMoveForward) {
      return;
    }
    const newElements = bringForward(selectedIds, elements);
    updateElements(newElements);
  };

  const handleSendBackward = () => {
    if (!canMoveBackward) {
      return;
    }
    const newElements = sendBackward(selectedIds, elements);
    updateElements(newElements);
  };

  const handleSendToBack = () => {
    if (!hasSelection) {
      return;
    }
    const newElements = sendToBack(selectedIds, elements);
    updateElements(newElements);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="h-full w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {hasSelection ? (
          <>
            <ContextMenuItem
              disabled={!canMoveForward}
              onClick={handleBringToFront}
            >
              <ArrowUpToLine className="mr-2 h-4 w-4" />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!canMoveForward}
              onClick={handleBringForward}
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Bring Forward
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={!canMoveBackward}
              onClick={handleSendBackward}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Send Backward
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!canMoveBackward}
              onClick={handleSendToBack}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Send to Back
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem disabled>No element selected</ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

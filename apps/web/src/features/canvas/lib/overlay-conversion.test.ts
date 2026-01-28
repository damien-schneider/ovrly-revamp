import { describe, expect, it } from "vitest";
import type { OverlayElement } from "../types";
import { ElementType } from "../types";
import {
  elementToOverlayCreate,
  elementToOverlayUpdate,
  type OverlayRow,
  overlayRowToElement,
} from "./overlay-conversion";

describe("overlay-conversion", () => {
  describe("overlayRowToElement", () => {
    it("converts a TEXT overlay row to element", () => {
      const row: OverlayRow = {
        _id: "j123abc" as OverlayRow["_id"],
        _creationTime: 1_234_567_890,
        userId: "juser123" as OverlayRow["userId"],
        type: "TEXT",
        name: "My Text",
        parentId: null,
        x: 100,
        y: 200,
        width: 300,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        properties: {
          content: "Hello World",
          fontFamily: "Inter",
          fontSize: 24,
          color: "#ffffff",
          fontWeight: "normal",
          textAlign: "left",
        },
        createdAt: 1_234_567_890,
        updatedAt: 1_234_567_890,
      };

      const element = overlayRowToElement(row);

      expect(element.id).toBe("j123abc");
      expect(element.type).toBe("TEXT");
      expect(element.name).toBe("My Text");
      expect(element.x).toBe(100);
      expect(element.y).toBe(200);
      expect(element.width).toBe(300);
      expect(element.height).toBe(50);
      expect(element.parentId).toBeNull();
      expect((element as { content: string }).content).toBe("Hello World");
      expect((element as { fontSize: number }).fontSize).toBe(24);
    });

    it("converts a CHAT overlay row with style properties", () => {
      const row: OverlayRow = {
        _id: "j456def" as OverlayRow["_id"],
        _creationTime: 1_234_567_890,
        userId: "juser123" as OverlayRow["userId"],
        type: "CHAT",
        name: "Chat Widget",
        parentId: null,
        x: 50,
        y: 100,
        width: 400,
        height: 600,
        rotation: 0,
        opacity: 0.9,
        zIndex: 2,
        locked: false,
        visible: true,
        properties: {
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            textColor: "#ffffff",
            fontSize: 14,
          },
          mockMessages: [],
          previewEnabled: false,
        },
        createdAt: 1_234_567_890,
        updatedAt: 1_234_567_890,
      };

      const element = overlayRowToElement(row);

      expect(element.id).toBe("j456def");
      expect(element.type).toBe("CHAT");
      expect(element.opacity).toBe(0.9);
      expect(
        (element as { style: { textColor: string } }).style.textColor
      ).toBe("#ffffff");
    });

    it("preserves parentId for nested elements", () => {
      const row: OverlayRow = {
        _id: "jchild123" as OverlayRow["_id"],
        _creationTime: 1_234_567_890,
        userId: "juser123" as OverlayRow["userId"],
        type: "BOX",
        name: "Nested Box",
        parentId: "jparent456" as OverlayRow["parentId"],
        x: 10,
        y: 20,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        locked: false,
        visible: true,
        properties: {
          backgroundColor: "#3b82f6",
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 8,
        },
        createdAt: 1_234_567_890,
        updatedAt: 1_234_567_890,
      };

      const element = overlayRowToElement(row);

      expect(element.parentId).toBe("jparent456");
    });
  });

  describe("elementToOverlayCreate", () => {
    it("extracts base fields and collects remaining as properties", () => {
      const element: OverlayElement = {
        id: "temp-id",
        type: ElementType.TEXT,
        name: "New Text",
        parentId: null,
        x: 50,
        y: 100,
        width: 200,
        height: 40,
        rotation: 15,
        opacity: 0.8,
        zIndex: 3,
        locked: true,
        visible: true,
        content: "Sample text",
        fontFamily: "Inter",
        fontSize: 18,
        color: "#ff0000",
        fontWeight: "bold",
        textAlign: "center",
      };

      const createArgs = elementToOverlayCreate(element);

      expect(createArgs.type).toBe("TEXT");
      expect(createArgs.name).toBe("New Text");
      expect(createArgs.parentId).toBeNull();
      expect(createArgs.x).toBe(50);
      expect(createArgs.y).toBe(100);
      expect(createArgs.rotation).toBe(15);
      expect(createArgs.opacity).toBe(0.8);
      expect(createArgs.locked).toBe(true);

      // Properties should contain type-specific fields
      expect((createArgs.properties as { content: string }).content).toBe(
        "Sample text"
      );
      expect((createArgs.properties as { fontSize: number }).fontSize).toBe(18);
      expect((createArgs.properties as { color: string }).color).toBe(
        "#ff0000"
      );

      // Base fields should NOT be in properties
      expect(
        (createArgs.properties as Record<string, unknown>).id
      ).toBeUndefined();
      expect(
        (createArgs.properties as Record<string, unknown>).type
      ).toBeUndefined();
      expect(
        (createArgs.properties as Record<string, unknown>).x
      ).toBeUndefined();
    });

    it("handles BOX element with style properties", () => {
      const element: OverlayElement = {
        id: "box-temp",
        type: ElementType.BOX,
        name: "Styled Box",
        parentId: null,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        locked: false,
        visible: true,
        backgroundColor: "#3b82f6",
        borderColor: "#1d4ed8",
        borderWidth: 2,
        borderRadius: 12,
      };

      const createArgs = elementToOverlayCreate(element);

      expect(createArgs.type).toBe("BOX");
      const props = createArgs.properties as {
        backgroundColor: string;
        borderRadius: number;
      };
      expect(props.backgroundColor).toBe("#3b82f6");
      expect(props.borderRadius).toBe(12);
    });
  });

  describe("elementToOverlayUpdate", () => {
    it("returns only id when no changedFields provided", () => {
      const element: OverlayElement = {
        id: "j123abc",
        type: ElementType.TEXT,
        name: "Text",
        parentId: null,
        x: 100,
        y: 200,
        width: 300,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        content: "Hello",
        fontFamily: "Inter",
        fontSize: 24,
        color: "#ffffff",
        fontWeight: "normal",
        textAlign: "left",
      };

      const updateArgs = elementToOverlayUpdate(element);

      expect(updateArgs.id).toBe("j123abc");
      expect(Object.keys(updateArgs)).toEqual(["id"]);
    });

    it("includes only changed transform fields", () => {
      const element: OverlayElement = {
        id: "j123abc",
        type: ElementType.BOX,
        name: "Box",
        parentId: null,
        x: 100,
        y: 200,
        width: 300,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        backgroundColor: "#000",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 0,
      };

      const changedFields = {
        x: 150,
        y: 250,
        width: 350,
      };

      const updateArgs = elementToOverlayUpdate(element, changedFields);

      expect(updateArgs.id).toBe("j123abc");
      expect(updateArgs.x).toBe(150);
      expect(updateArgs.y).toBe(250);
      expect(updateArgs.width).toBe(350);
      expect(updateArgs.height).toBeUndefined();
      expect(updateArgs.rotation).toBeUndefined();
    });

    it("includes properties when type-specific fields change", () => {
      const element: OverlayElement = {
        id: "j123abc",
        type: ElementType.TEXT,
        name: "Text",
        parentId: null,
        x: 100,
        y: 200,
        width: 300,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        content: "Hello",
        fontFamily: "Inter",
        fontSize: 24,
        color: "#ffffff",
        fontWeight: "normal",
        textAlign: "left",
      };

      const changedFields = {
        content: "Updated text",
        fontSize: 32,
      };

      const updateArgs = elementToOverlayUpdate(element, changedFields);

      expect(updateArgs.id).toBe("j123abc");
      expect(updateArgs.properties).toEqual({
        content: "Updated text",
        fontSize: 32,
      });
    });

    it("handles mixed transform and property changes", () => {
      const element: OverlayElement = {
        id: "j123abc",
        type: ElementType.TEXT,
        name: "Text",
        parentId: null,
        x: 100,
        y: 200,
        width: 300,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        content: "Hello",
        fontFamily: "Inter",
        fontSize: 24,
        color: "#ffffff",
        fontWeight: "normal",
        textAlign: "left",
      };

      const changedFields = {
        x: 150,
        opacity: 0.5,
        content: "New content",
      };

      const updateArgs = elementToOverlayUpdate(element, changedFields);

      expect(updateArgs.id).toBe("j123abc");
      expect(updateArgs.x).toBe(150);
      expect(updateArgs.opacity).toBe(0.5);
      expect(updateArgs.properties).toEqual({ content: "New content" });
    });
  });
});

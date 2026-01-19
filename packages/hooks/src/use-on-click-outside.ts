import { useEffect } from "react";

interface RefObject<T extends Node = HTMLElement> {
  current: T | null;
}

const extractHtmlElements = (ref: RefObject<Node> | RefObject<Node>[]) => {
  if (Array.isArray(ref)) {
    return ref.map((r) => r.current).filter((el) => el !== null);
  }
  if (ref.current) {
    return [ref.current];
  }
  return [];
};

export function useOnClickOutside(
  ref: RefObject<Node> | RefObject<Node>[],
  handler: (event: MouseEvent) => void
): void {
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const refElements = extractHtmlElements(ref);
      if (refElements.length === 0) return;

      const target = event.target as Node | null;
      if (!target || !target.isConnected) return;

      const path = event.composedPath();
      const isInside = refElements.some(
        (el) => path.includes(el) || el.contains(target)
      );

      if (!isInside) {
        handler(event);
      }
    };

    window.addEventListener("mousedown", onMouseDown, { capture: true });
    return () => {
      window.removeEventListener("mousedown", onMouseDown, { capture: true });
    };
  }, [ref, handler]);
}

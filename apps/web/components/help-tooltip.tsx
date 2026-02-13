"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";

type HelpTooltipProps = {
  content: string;
  title?: string;
  side?: "top" | "bottom";
  className?: string;
};

export function HelpTooltip({ content, title = "Ayuda", side = "top", className }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const contentId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const panelPosition = side === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <span ref={containerRef} className={`relative inline-flex items-center ${className ?? ""}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
        aria-label={title}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((previous) => !previous)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>

      <span
        id={contentId}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-30 w-72 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md transition ${panelPosition} ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        {content}
      </span>
    </span>
  );
}

export function LabelWithHelp({ label, help, htmlFor }: { label: string; help: string; htmlFor?: string }) {
  return (
    <div className="flex items-center gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <HelpTooltip content={help} title={`Ayuda: ${label}`} />
    </div>
  );
}

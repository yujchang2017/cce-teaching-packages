"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

interface Props {
  event: string;
  resource?: string;
  meta?: Record<string, unknown>;
}

/** 掛在 page 任一處，render 時送一次 page-view */
export default function TrackPageView({ event, resource, meta }: Props) {
  useEffect(() => {
    track({ event, resource, meta });
  }, [event, resource, meta]);
  return null;
}

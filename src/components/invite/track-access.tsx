"use client";

import { trackAccessAction } from "@/actions/rsvp";
import { useEffect } from "react";

export function TrackAccess({ slug }: { slug: string }) {
  useEffect(() => {
    trackAccessAction(slug, navigator.userAgent);
  }, [slug]);

  return null;
}

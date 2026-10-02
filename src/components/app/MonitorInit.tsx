"use client";

import { useEffect } from "react";
import { startMonitoring } from "@/lib/monitor";

export default function MonitorInit() {
  useEffect(() => {
    startMonitoring();
  }, []);
  return null;
}

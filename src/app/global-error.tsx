"use client";

import { useEffect } from "react";
import { reportBrowserError } from "@/lib/monitor";

// The last safety net, for a crash in the page shell itself. It must bring its own <html>.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportBrowserError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff9eb", color: "#1a1a1a", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <main>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 20px", color: "#555" }}>The team has been told. Please reload the page.</p>
          <button onClick={() => window.location.reload()} style={{ font: "inherit", fontWeight: 600, padding: "10px 20px", border: "1px solid #1a1a1a", background: "#f4a5c0", borderRadius: 6, cursor: "pointer" }}>
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}

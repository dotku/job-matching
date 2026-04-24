import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 50%, #1e3a8a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
              borderRadius: 12,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            JM
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>
            Job Matching
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Find a paid summer internship.
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 500,
              color: "#a5b4fc",
              letterSpacing: -0.5,
            }}
          >
            Auto-apply with one click.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#94a3b8",
          }}
        >
          <span>Live Summer 2026 listings · F-1 friendly</span>
          <span>jobmatching.us</span>
        </div>
      </div>
    ),
    size,
  );
}

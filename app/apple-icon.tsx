import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
          color: "white",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        JM
      </div>
    ),
    size,
  );
}

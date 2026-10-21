import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "#74ae4e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "14px",
            background: "#e0924a",
            border: "2px solid #3a2a22",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/font's Google Font output isn't accessible to ImageResponse the way
// it is to page components, and fetching the Fraunces file over the network
// at image-generation time would be fragile here — so this generated image
// falls back to a bold system serif for the wordmark, matching the Fraunces
// treatment in spirit (high-contrast serif, tight tracking) without
// depending on an external font fetch.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#f6f1e7",
          padding: "90px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "6px",
            backgroundColor: "#bc562e",
            marginBottom: "40px",
          }}
        />
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: "#9c4423",
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Stage List
        </div>
        <div
          style={{
            marginTop: "28px",
            fontSize: 34,
            color: "#4a4238",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Inventory &amp; job allocation for property stagers
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

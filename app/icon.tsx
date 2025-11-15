export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#0f172a"/>
  <text x="16" y="21" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#f8fafc">M</text>
</svg>`;

export default function Icon() {
  return new Response(svg, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}



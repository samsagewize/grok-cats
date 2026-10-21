import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next treats localhost and 127.0.0.1 as different dev origins. The browser
  // waits on the dev socket before hydrating, so a blocked socket leaves the
  // garden on its server HTML: a green canvas, "Reconnecting", and no cats.
  allowedDevOrigins: ["127.0.0.1", "::1"],
};

export default nextConfig;

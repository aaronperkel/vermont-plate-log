import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The Open Graph route reads its font files from assets/ at request time.
   * That path is built at runtime, so file tracing cannot infer it and would
   * leave the fonts out of the serverless bundle.
   */
  outputFileTracingIncludes: {
    '/plate/[plate]/opengraph-image': ['./assets/fonts/**'],
  },
  /* The floating dev badge overlaps form fields on a phone-sized viewport. */
  devIndicators: false,
};

export default nextConfig;

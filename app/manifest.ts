import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGNUM 312",
    short_name: "SIGNUM 312",
    description: "Um símbolo que atravessa o tempo.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a09",
    theme_color: "#090a09",
  };
}

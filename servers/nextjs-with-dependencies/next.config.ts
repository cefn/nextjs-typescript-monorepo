import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, _options) => {
    const packagesPath = path.resolve(__dirname, "../../packages");

    config.resolve.extensions.push(".ts", ".tsx");

    const localAliases = Object.fromEntries(
      ["sum", "multiply"].map(
        (name) =>
          [
            `@myrepo/${name}`,
            path.resolve(packagesPath, `${name}/src`),
          ] as const,
      ),
    );

    config.resolve.alias = {
      ...config.resolve.alias,
      ...localAliases,
    };

    config.resolve.conditionNames = ["@myrepo", "import", "require", "default"];

    return config;
  },
};

export default nextConfig;

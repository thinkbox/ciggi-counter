import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The calculation files use Node's require() and module.exports so the
// tests can load them. The dev server speaks JavaScript modules, so this
// rewrites those two forms while Vite is serving the files. The files on
// disk stay as they are, and `npm test` is unchanged.
function clientModulesForVite() {
  return {
    name: "client-modules-for-vite",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (file.includes("node_modules")) return null;
      if (!file.includes("/client/") && !file.includes("/shared/")) return null;
      if (!code.includes("module.exports")) return null;

      let next = code.replace(
        /(^|\n)([ \t]*)const\s+\{([\s\S]*?)\}\s*=\s*require\((["'])([^"']+)\4\);?/g,
        (match, lead, indent, names, quote, spec) => {
          const compact = names.replace(/\s+/g, " ").trim();
          return `${lead}${indent}import { ${compact} } from ${quote}${addJsExtension(spec)}${quote};`;
        },
      );
      next = next.replace(
        /(^|\n)([ \t]*)const\s+([A-Za-z0-9_]+)\s*=\s*require\((["'])([^"']+)\4\);?/g,
        (match, lead, indent, name, quote, spec) => {
          return `${lead}${indent}import ${name} from ${quote}${addJsExtension(spec)}${quote};`;
        },
      );

      const names = exportedNames(next);
      if (!names) return null;
      next = next.replace(/module\.exports\s*=\s*(?:\{[^}]+\}|[A-Za-z0-9_]+);?\n?/g, "");
      next += `\nexport { ${names.join(", ")} };\n`;
      return { code: next, map: null };
    },
  };
}

function addJsExtension(spec) {
  if (spec.startsWith(".") && !spec.endsWith(".js")) return `${spec}.js`;
  return spec;
}

function exportedNames(code) {
  const direct = code.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (direct) return splitNames(direct[1]);
  const ident = code.match(/module\.exports\s*=\s*([A-Za-z0-9_]+)/);
  if (!ident) return null;
  const assigned = code.match(new RegExp(`const\\s+${ident[1]}\\s*=\\s*\\{([^}]+)\\}`));
  if (!assigned) return null;
  return splitNames(assigned[1]);
}

function splitNames(list) {
  return list
    .split(",")
    .map((part) => part.trim().split(":")[0].trim())
    .filter(Boolean);
}

export default defineConfig({
  plugins: [clientModulesForVite(), react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

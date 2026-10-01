# 0011. Build Tailwind CSS with the CLI and serve it locally

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The panel uses Tailwind CSS. Options: Tailwind CLI build, the Play CDN script, or generated CSS in git.

## Decision

Use `@tailwindcss/cli` v4 to build `public/admin/admin.css` from `src/admin/styles/input.css`. `@fastify/static` serves `public/admin` under `/admin/assets`. The generated CSS is in `.gitignore`. The folder stays in git with a `.gitkeep`. Load the Bungee and Rubik fonts from `@fontsource` packages, copied into the same folder at build time. `npm run dev` runs `tsx watch` and the Tailwind watcher (`--watch=always`) together with a shell `&`.

## Consequences

- No third-party requests from the panel.
- `npm run build` (or `build:css`) is necessary before `npm start`.
- `npm run dev` does not work in Windows `cmd`.
- The Tailwind watcher uses `--watch=always`. A shell `&` job has a closed stdin, and Tailwind v4 `--watch` stops when stdin closes. With `--watch=always`, the watcher ignores stdin and continues to rebuild the CSS.
- The old `public` rule in `.gitignore` (from a Gatsby template) is removed, so that `public/admin/.gitkeep` is in git.
- Biome parses the Tailwind directives (`css.parser.tailwindDirectives` in `biome.json`).

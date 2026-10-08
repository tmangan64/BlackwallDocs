# BlackwallDocs

Documentation for Blackwall and other projects, built with [mdBook](https://rust-lang.github.io/mdBook/).

Published to <https://docs.blackwall.cam> by `.github/workflows/deploy.yml` on
every push to `main`.

## Development

The repo ships a [devenv](https://devenv.sh/) shell with `mdbook` already on
`PATH`. With direnv installed, `cd` into the repo; otherwise run `devenv shell`.

| Command | Action                                     |
| ------- | ------------------------------------------ |
| `dev`   | serve with live reload and open a browser  |
| `serve` | serve with live reload                     |
| `build` | build into `book/`                         |
| `clear` | delete `book/`                             |

`devenv up` also runs the dev server.

Without devenv, install [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html)
and run `mdbook serve`.

## Layout

```
book.toml          # mdBook configuration
src/
  SUMMARY.md       # table of contents - every page must be listed here
  index.md         # landing page
  CNAME            # custom domain, copied verbatim into the build
  blackwall/       # Blackwall section
  frontier/        # Frontier section
```

## Adding a page

1. Create the markdown file under the relevant section directory.
2. Add it to `src/SUMMARY.md`. Pages not listed there are not built —
   `create-missing = false` means a `SUMMARY.md` entry with no file behind it
   fails the build rather than generating a blank page.

Nest a page under another by indenting its `SUMMARY.md` bullet by two spaces.

## Adding a section

Sections are mdBook [parts](https://rust-lang.github.io/mdBook/format/summary.html).
Create a directory under `src/`, then add a `# Section Name` header in
`src/SUMMARY.md` followed by that section's pages:

```markdown
# My New Section

- [Introduction](./my-new-section/intro.md)
```

## Markdown notes

- Footnotes use `[^name]` with a matching `[^name]: text` definition.
- mdBook has no admonition syntax; use a blockquote with a bold label.
- Diagrams are not rendered. `src/blackwall/architecture/topology.md` holds a
  ` ```mermaid ` block that currently displays as source. To render it, add
  [mdbook-mermaid](https://github.com/badboy/mdbook-mermaid) to `devenv.nix`
  and the deploy workflow, run `mdbook-mermaid install .`, then add
  `additional-js = ["mermaid.min.js", "mermaid-init.js"]` under `[output.html]`
  and a `[preprocessor.mermaid]` section to `book.toml`.

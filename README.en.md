# doc2md: convert Word, Excel, PowerPoint, PDF, EPUB to clean Markdown for Claude Code, Cursor, Codex and other AI agents

> A skill for AI agents. Runs a batch of mixed-format documents through a single converter and hands the agent clean GitHub-Flavored Markdown — instead of a dozen format-specific readers on the fly. One file, a list of paths, or a whole folder (recursive). A wrapper over [firecrawl/anydoc](https://github.com/firecrawl/anydoc).

> [Русская версия](README.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-blueviolet)](CHANGELOG.md)
[![Stars](https://img.shields.io/github/stars/ilyautov/doc2md?style=social)](https://github.com/ilyautov/doc2md/stargazers)

<p align="center">
  <img src="assets/social-preview.png" alt="doc2md: Word, Excel, PowerPoint, PDF, EPUB into clean Markdown before the agent reads them" width="720">
</p>

## Why

An AI agent usually reads `.docx`, `.xlsx`, `.pptx`, `.pdf` with a separate reader each. Across 10–20 files that's dozens of extra tool calls and a different output shape per type. doc2md pushes everything through one converter, so the output is always clean GitHub-Flavored Markdown regardless of the input.

It's **not** a replacement for the dedicated `docx`/`pdf`/`xlsx`/`pptx` skills when you edit or extract images from a single file — use those there. doc2md is for "read a batch of documents and work with them", especially when there are many and the formats are mixed: contracts, invoices, decks, exports.

## Install

**Claude Code / Cowork / API:**

```
/plugin marketplace add ilyautov/doc2md
/plugin install doc2md@ilyautov-plugins
```

**skills.sh CLI:**

```bash
npx skills add ilyautov/doc2md
```

Manifests are also provided for **Codex** (`.codex-plugin/`), **Cursor** (`.cursor-plugin/`) and **Gemini CLI** (`gemini-extension.json`). Any agent that understands the `SKILL.md` format can pick up `skills/doc2md/SKILL.md` directly.

The only runtime dependency is **Node.js 18+** (already needed for `npx`). The `@firecrawl/anydoc` engine is downloaded automatically on first run; for offline use install it up front: `npm install -g @firecrawl/anydoc`.

## Usage

```bash
node skills/doc2md/scripts/convert.js contract.docx
node skills/doc2md/scripts/convert.js ~/Downloads/acts/ -o ~/Downloads/acts-md/
node skills/doc2md/scripts/convert.js a.pdf b.xlsx "march report.pptx"
```

On Unix a bash version is available with identical behavior:

```bash
bash skills/doc2md/scripts/convert.sh contract.docx
```

Without `-o`, each `<name>.<ext>.md` is written next to the source — the extension is kept in the name on purpose, otherwise `report.docx` and `report.csv` in one folder would both land in `report.md` and overwrite each other.

## Supported formats

| Group | Extensions |
|---|---|
| Word | `.doc` `.docx` `.docm` |
| PowerPoint | `.ppt` `.pps` `.pot` `.pptx` `.pptm` `.ppsx` `.ppsm` |
| Excel | `.xls` `.xlsx` `.xlsm` `.xlsb` |
| OpenDocument | `.odt` `.ods` `.odp` |
| Other | `.rtf` `.epub` `.csv` `.pdf` |

Scans and image-only PDFs with no text layer aren't read (the engine has no OCR) — they go to "SKIP" and the batch doesn't fail. Run OCR first for those.

## Outcome categories

- **OK** — anydoc returned exit code `0`.
- **ERROR** — couldn't even launch `npx`/anydoc (not on PATH, code 126/127): an environment failure, not "the file is unreadable" — OCR won't help.
- **SKIP** — anydoc ran but the file didn't convert: almost always a scan / encrypted / corrupt file.

> anydoc's exit-code contract isn't formally documented; the wrapper treats it conservatively (see `SKILL.md`).

## Tested / not tested

Tested (2026-08-06, Cowork sandbox, Node 22, Linux/macOS): `.csv` and `.docx` with Cyrillic, name-collision folder, paths with spaces, missing paths, recursive folders — for both `convert.js` and `convert.sh`.

**Not tested live:** `.pptx`, `.xlsx`, `.pdf`, `.epub`, a real client document batch, and a live Windows run. The Windows code path is reasoned about, not verified. Verified a format or OS? [Open an issue](https://github.com/ilyautov/doc2md/issues).

## Source

A wrapper over [firecrawl/anydoc](https://github.com/firecrawl/anydoc) (MIT, Rust). The upstream also ships a minimal single-file skill; doc2md adds batch processing, an honest OK/SKIP/ERROR summary, OCR routing, a cross-platform Node version and docs. Benchmark numbers are the vendor's own — see [SOURCES.md](SOURCES.md).

## Author

Ilya Utov — [t.me/gorilla_under_hood](https://t.me/gorilla_under_hood)

## License

MIT — see [LICENSE](LICENSE).

---

## Who built this

[Ilya Utov](https://github.com/ilyautov), the [AI Frontier](https://aifrontier.tech) lab. I write about how these tools work inside on [Telegram](https://t.me/gorilla_under_hood) and [LinkedIn](https://www.linkedin.com/in/ilyautov).

**Nearby:**

- [**humanizer-ru**](https://github.com/ilyautov/humanizer-ru): strips the AI fingerprint out of Russian text
- [**marketplaces-mcp-ru**](https://github.com/ilyautov/marketplaces-mcp-ru): Wildberries, Ozon, Yandex Market and Avito straight from the agent
- [**small-business-ru**](https://github.com/ilyautov/small-business-ru): 34 skills for Russian small business, the numbers computed in code
- [**consilium-principis**](https://github.com/ilyautov/consilium-principis): a board of thinkers where every quote is checked word for word
- [**hefest**](https://github.com/ilyautov/hefest): chemical safety for an industrial plant, kept inside the plant's own network

Everything else: [github.com/ilyautov](https://github.com/ilyautov). Useful? Star it, that is how other people find it.

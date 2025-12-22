# TrackForge partner documents

This folder contains **partner-facing** documents (Markdown sources) and a **repeatable** PDF export workflow.

## How to export to PDF

1. Ensure Google Chrome is installed (macOS path assumed by default):
   - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

2. Run:

```bash
python3 scripts/export_docs_to_pdf.py \
  --input docs/partner/TrackForge_Partner_Plan.md \
  --output docs/pdf/TrackForge_Partner_Plan.pdf \
  --css docs/pdf/theme.css

python3 scripts/export_docs_to_pdf.py \
  --input docs/proposals/TrackForge_Commercial_Proposal_2025-12-22.md \
  --output docs/pdf/TrackForge_Commercial_Proposal_2025-12-22.pdf \
  --css docs/pdf/theme.css
```

## Notes

- The PDF export uses **headless Chrome** (`--print-to-pdf`) after converting Markdown → HTML using Python’s `markdown` package.
- Mermaid diagrams are exported as code blocks (not rendered) unless we later add Mermaid rendering.



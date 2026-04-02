# PixelKit 🛠️

A clean, minimal image and PDF toolkit that runs entirely in your browser. No uploads, no server, no account needed — all processing happens locally using native Web APIs.

---

## ✨ Features

| Tool                     | Description                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| 📄 **Image → PDF**       | Convert one or multiple images into a single PDF. Supports A4, Letter, and fit-to-image page sizes |
| 🗜️ **Compress Image**    | Reduce file size with quality control. Supports JPEG, PNG, WebP output                             |
| 📐 **Resize Image**      | Scale by pixels, percentage, or hit a target file size (KB) using binary search                    |
| 🔄 **Format Converter**  | Convert between JPG, PNG, WebP, BMP, GIF, ICO, and SVG                                             |
| ✂️ **Remove Background** | Flood-fill edge detection removes solid/plain backgrounds                                          |
| 📎 **Merge PDFs**        | Combine multiple PDF files into one. Reorder before merging                                        |
| 💧 **Add Watermark**     | Stamp text watermarks with custom position, opacity, rotation, and color. Live preview             |

---

## 🏗️ Project Structure

```
pixelkit/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Routes + TOOLS registry
    ├── index.css             # Design system (CSS variables)
    ├── components/
    │   ├── Sidebar.jsx       # Navigation sidebar (mobile responsive)
    │   ├── Topbar.jsx        # Header with hamburger menu
    │   ├── Home.jsx          # Tool cards grid
    │   ├── ToolPage.jsx      # Dynamic tool renderer
    │   ├── Dropzone.jsx      # Shared drag & drop component
    │   └── Footer.jsx        # Fixed bottom footer
    ├── tools/
    │   ├── ImageToPdf.jsx
    │   ├── Compress.jsx
    │   ├── Resize.jsx
    │   ├── FormatConverter.jsx
    │   ├── RemoveBg.jsx
    │   ├── MergePdf.jsx
    │   └── Watermark.jsx
    └── utils/
        └── helpers.js        # Shared utility functions
```

---

## ⚙️ How It Works Internally

All image processing uses native browser APIs — no external processing servers.

### Core Pipeline

```
User drops file
      ↓
FileReader.readAsDataURL()     → converts file to base64 string
      ↓
new Image() + img.src          → loads pixels, gives naturalWidth/Height
      ↓
canvas.drawImage(img, w, h)    → draws pixels onto HTML canvas
      ↓
canvas.toBlob(cb, mime, quality) → re-encodes with compression
      ↓
URL.createObjectURL(blob)      → creates in-memory download URL
      ↓
<a download>.click()           → triggers browser file download
```

### Tool-Specific Internals

**Compress** — `canvas.toBlob()` with a lower quality value (0–1). Lower quality = smaller file. JPEG/WebP are lossy; PNG is always lossless.

**Resize** — draws the image onto a canvas with different dimensions. For target KB mode, a binary search algorithm bisects quality between 5–95 over 12 iterations until blob size is within 3% of the target.

**Remove Background** — flood-fill BFS from all 4 image edges. Samples corner pixels to detect background color, then walks outward setting matching pixels to `alpha = 0` (transparent). Tolerance controls color distance threshold.

**Image → PDF** — uses [jsPDF](https://github.com/parallax/jsPDF). Each image gets its own page, scaled to fit with aspect ratio preserved.

**Merge PDFs** — uses [pdf-lib](https://github.com/Hopding/pdf-lib). Loads each PDF as `ArrayBuffer`, copies pages into a new `PDFDocument`, exports as merged blob.

**Format Converter** — same canvas pipeline with different MIME type passed to `toBlob()`. SVG is special — wraps the image dataUrl inside an `<svg><image href="..."/>` XML string.

**Watermark** — uses Canvas 2D text API. `ctx.save()` → set `globalAlpha`, `font`, `fillStyle` → `translate` to position → `rotate` → `fillText` → `ctx.restore()`.

---

## 🧰 Tech Stack

| Technology            | Purpose                 |
| --------------------- | ----------------------- |
| React 18              | UI framework            |
| Vite 5                | Build tool & dev server |
| React Router v6       | Client-side routing     |
| jsPDF                 | Image to PDF conversion |
| pdf-lib               | PDF merging             |
| HTML5 Canvas API      | Image processing        |
| FileReader API        | File ingestion          |
| CSS Custom Properties | Design system & theming |

---

## 👨‍💻 Author

**Shivam Anand**

[![GitHub](https://img.shields.io/badge/GitHub-shivamanand9009-181717?style=flat&logo=github)](https://github.com/shivamanand9009)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shivam_Anand-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/shivam-anand-649878228)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<p align="center">Made with ❤️ by Shivam Anand</p>

# Document Converter

A modern, responsive, browser-based tool to convert between PDF, Word, Excel, and PNG formats. Supports drag-and-drop upload, live preview, light/dark theme toggle, and multiple conversion options.

## 🌟 Features

- ✅ Convert:
  - PDF ➡️ PNG
  - PNG ➡️ PDF
  - Word (DOCX) ➡️ PDF / PNG
  - Excel (XLSX) ➡️ PDF / PNG
- 🖼 Live preview (for PDFs and images)
- 🎨 Light/Dark theme toggle
- 📁 Drag-and-drop & multi-file support
- 📐 Select PNG quality or PDF page size
- 🔧 Uses browser-side libraries — **no backend required**

## 🛠️ Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [PDF-Lib](https://pdf-lib.js.org/)
- [html2canvas](https://html2canvas.hertzen.com/)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) (Word to HTML)
- [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs)

## 🚀 How to Run

1. Clone the repository or download the files.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, etc.).
3. Drag and drop supported files or click to upload.
4. Choose output format and settings.
5. Click **Convert All** to start the conversion.
6. Converted files will be downloaded automatically.

## 📂 Supported Formats

| Input        | Output        |
|--------------|---------------|
| PDF          | PNG           |
| PNG          | PDF           |
| Word (DOCX)  | PDF, PNG      |
| Excel (XLSX) | PDF, PNG      |

> ⚠️ Note: Previews are only available for PDFs and images due to browser limitations.

d)*

## 🧠 Interview-Ready Explanations

- **Why is it client-side only?**  
  It avoids privacy concerns by doing all conversions in-browser using JS libraries. No file is uploaded to any server.

- **Why async/await?**  
  Many file processing operations (like reading PDFs or rendering with html2canvas) are asynchronous, so `async/await` makes the code cleaner and easier to debug.

- **What libraries are used for conversion?**  
  - `PDF-Lib` for creating PDFs.
  - `html2canvas` for rendering HTML into image for export.
  - `pdf.js` for rendering PDF pages.
  - `Mammoth.js` to read DOCX files as HTML.
  - `xlsx` (SheetJS) to render Excel files as HTML.

## 📄 License

This project is open-source and free to use. Feel free to adapt or extend it as needed.

---

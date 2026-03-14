const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Install dependencies ────────────────────────────────────────────────────
console.log('📦 Installing dependencies...');
try {
    execSync('npm install mammoth pdf-parse', { stdio: 'inherit' });
    console.log('✅ Dependencies installed.\n');
} catch (e) {
    console.error('❌ Failed to install dependencies:', e.message);
    process.exit(1);
}

// ─── Config — UPDATE THESE PATHS ────────────────────────────────────────────
const DOCX_PATH = 'd:\\Feedinprod-master\\smart-farm-frontend\\FEEDINGREEN_Website_Revision_Brief.docx';
const PDF_PATH = 'd:\\Feedinprod-master\\smart-farm-frontend\\remarque site web.pdf';

const OUT_DIR = path.join(__dirname, 'extracted_output');
const DOCX_IMG_DIR = path.join(OUT_DIR, 'docx_images');
const PDF_IMG_DIR = path.join(OUT_DIR, 'pdf_images');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(emoji, msg) {
    console.log(`${emoji}  ${msg}`);
}

// ─── Shared: render a PDF to per-page PNG images ─────────────────────────────
// Tries pdftoppm (Poppler) → mutool (MuPDF) → Ghostscript — first one that works wins.
function renderPdfToImages(pdfPath, outDir, prefix) {
    const tools = [
        {
            check: 'pdftoppm -v',
            cmd: `pdftoppm -png -r 150 "${pdfPath}" "${path.join(outDir, prefix)}"`,
            label: 'pdftoppm (Poppler)',
        },
        {
            check: 'mutool -v',
            cmd: `mutool draw -o "${path.join(outDir, `${prefix}_%03d.png`)}" -r 150 "${pdfPath}"`,
            label: 'mutool (MuPDF)',
        },
        {
            check: 'gswin64c --version',
            cmd: `gswin64c -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 -sOutputFile="${path.join(outDir, `${prefix}_%03d.png`)}" "${pdfPath}"`,
            label: 'Ghostscript (Windows)',
        },
        {
            check: 'gs --version',
            cmd: `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 -sOutputFile="${path.join(outDir, `${prefix}_%03d.png`)}" "${pdfPath}"`,
            label: 'Ghostscript (gs)',
        },
    ];

    for (const tool of tools) {
        try {
            execSync(tool.check, { stdio: 'pipe' });
            execSync(tool.cmd, { stdio: 'pipe' });
            const count = fs.readdirSync(outDir).filter(f => f.startsWith(prefix) && f.endsWith('.png')).length;
            log('✅', `Used: ${tool.label} → ${count} page image(s) saved`);
            return count;
        } catch (_) {
            continue;
        }
    }

    // Nothing found — tell the user what to install
    log('⚠️ ', 'No PDF renderer found. Install one of the following, then re-run:');
    log('   ', '  • Poppler     → https://github.com/oschwartz10612/poppler-windows/releases');
    log('   ', '  • MuPDF       → https://mupdf.com/releases');
    log('   ', '  • Ghostscript → https://www.ghostscript.com/releases/gsdnld.html');
    return 0;
}

// ─── DOCX: text + convert to PDF then render pages as images ─────────────────
async function extractDocx() {
    log('📄', 'Extracting DOCX text...');
    const mammoth = require('mammoth');

    // 1. Plain text via mammoth
    try {
        const raw = await mammoth.extractRawText({ path: DOCX_PATH });
        fs.writeFileSync(path.join(OUT_DIR, 'docx_text.txt'), raw.value, 'utf8');
        log('✅', `DOCX text → docx_text.txt  (${raw.value.length.toLocaleString()} chars)`);
    } catch (e) {
        log('❌', `DOCX text extraction failed: ${e.message}`);
    }

    // 2. Convert DOCX → PDF with LibreOffice, then render pages as PNG
    log('🔄', 'Converting DOCX → PDF via LibreOffice...');
    ensureDir(DOCX_IMG_DIR);

    const docxPdfPath = path.join(OUT_DIR, 'docx_converted.pdf');
    const librePaths = [
        '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"',
        '"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"',
        'soffice',   // works if LibreOffice is on PATH
    ];

    let converted = false;
    for (const soffice of librePaths) {
        try {
            execSync(
                `${soffice} --headless --convert-to pdf --outdir "${OUT_DIR}" "${DOCX_PATH}"`,
                { stdio: 'pipe' }
            );
            // LibreOffice names the output after the source file
            const autoName = path.join(OUT_DIR, path.basename(DOCX_PATH).replace(/\.docx$/i, '.pdf'));
            if (fs.existsSync(autoName) && autoName !== docxPdfPath) {
                fs.renameSync(autoName, docxPdfPath);
            }
            converted = true;
            log('✅', 'DOCX → PDF conversion done.');
            break;
        } catch (_) { continue; }
    }

    if (!converted) {
        log('❌', 'LibreOffice not found — skipping DOCX page images.');
        log('💡', 'Install LibreOffice from https://www.libreoffice.org and re-run.');
        return;
    }

    // 3. Render the converted PDF to PNG images (one per page)
    log('🖼️ ', 'Rendering DOCX pages as PNG images...');
    renderPdfToImages(docxPdfPath, DOCX_IMG_DIR, 'docx_page');
}

// ─── PDF: text + render pages as images ──────────────────────────────────────
async function extractPdf() {
    log('📑', 'Extracting PDF text...');
    const pdfParse = require('pdf-parse');
    ensureDir(PDF_IMG_DIR);

    // 1. Plain text
    try {
        const buffer = fs.readFileSync(PDF_PATH);
        const data = await pdfParse(buffer);
        fs.writeFileSync(path.join(OUT_DIR, 'pdf_text.txt'), data.text, 'utf8');
        log('✅', `PDF text → pdf_text.txt  (${data.numpages} pages, ${data.text.length.toLocaleString()} chars)`);
    } catch (e) {
        log('❌', `PDF text extraction failed: ${e.message}`);
    }

    // 2. Render every page as a PNG image
    log('🖼️ ', 'Rendering PDF pages as PNG images...');
    renderPdfToImages(PDF_PATH, PDF_IMG_DIR, 'pdf_page');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function printSummary() {
    const docxImgs = fs.existsSync(DOCX_IMG_DIR)
        ? fs.readdirSync(DOCX_IMG_DIR).filter(f => f.endsWith('.png')).length : 0;
    const pdfImgs = fs.existsSync(PDF_IMG_DIR)
        ? fs.readdirSync(PDF_IMG_DIR).filter(f => f.endsWith('.png')).length : 0;

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         FEED IN GREEN — Extraction Complete                  ║
╚══════════════════════════════════════════════════════════════╝

  Output folder : ${OUT_DIR}

  DOCX
  ├── docx_text.txt      ← full plain text
  └── docx_images/       ← ${docxImgs} page(s) as PNG

  PDF
  ├── pdf_text.txt       ← full plain text
  └── pdf_images/        ← ${pdfImgs} page(s) as PNG
`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
    ensureDir(OUT_DIR);
    console.log(`\n🚀 FEED IN GREEN — Content Extractor\n${'─'.repeat(50)}\n`);

    for (const [label, p] of [['DOCX', DOCX_PATH], ['PDF', PDF_PATH]]) {
        if (!fs.existsSync(p)) {
            console.error(`❌ ${label} not found: ${p}`);
            console.error('   → Update the path constants at the top of this file.');
            process.exit(1);
        }
    }

    await extractDocx();
    console.log('');
    await extractPdf();
    console.log('');
    printSummary();
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});

import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { TailoredCv } from "./claude.js";

const M = { top: 40, bottom: 40, left: 46, right: 46 };
const NAVY = "#1F3864";
const GREY = "#7F7F7F";

/** The built-in PDF fonts only cover Western European characters; swap or drop the rest. */
const safe = (s: string) =>
  s
    .replace(/₹\s?/g, "Rs. ")
    .replace(/[‐‑]/g, "-")
    .replace(/[^\x20-\x7E -ÿ–—‘’“”•…\n]/g, "");

/** Renders the tailored CV as a one-column, ATS-friendly PDF (the version that gets emailed). */
export function writeCvPdf(cv: TailoredCv, file: string): Promise<void> {
  const doc = new PDFDocument({ size: "A4", margins: M, info: { Title: `${cv.name} — CV`, Author: cv.name } });
  const out = fs.createWriteStream(file);
  doc.pipe(out);
  const width = doc.page.width - M.left - M.right;

  const ensureSpace = (h: number) => {
    if (doc.y + h > doc.page.height - M.bottom) doc.addPage();
  };
  const heading = (t: string) => {
    ensureSpace(40);
    doc.moveDown(0.6).font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text(t.toUpperCase(), M.left, doc.y);
    const y = doc.y + 1;
    doc.moveTo(M.left, y).lineTo(M.left + width, y).lineWidth(0.6).strokeColor(GREY).stroke();
    doc.y = y + 4;
    doc.fillColor("black");
  };
  const bullet = (parts: { text: string; bold?: boolean }[]) => {
    ensureSpace(14);
    const y = doc.y;
    doc.font("Helvetica").fontSize(9.5).text("•", M.left + 6, y);
    doc.y = y;
    parts.forEach((p, i) =>
      doc
        .font(p.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9.5)
        .text(safe(p.text), i === 0 ? M.left + 18 : undefined, i === 0 ? y : undefined, {
          width: width - 18,
          continued: i < parts.length - 1,
          lineGap: 1,
        }),
    );
    doc.moveDown(0.15);
  };

  doc.font("Helvetica-Bold").fontSize(17).text(safe(cv.name.toUpperCase()), { align: "center" });
  doc.font("Helvetica").fontSize(9.5).text(safe(cv.contact_line), { align: "center" });
  doc.moveDown(0.15).font("Helvetica-Bold").fontSize(9.5).text(safe(cv.headline), { align: "center" });

  heading("Professional Summary");
  doc.font("Helvetica").fontSize(9.5).text(safe(cv.summary), { align: "justify", lineGap: 1 });

  heading("Core Competencies");
  for (const c of cv.competencies) bullet([{ text: `${c.area}: `, bold: true }, { text: c.detail }]);

  heading("Professional Experience");
  for (const role of cv.experience) {
    ensureSpace(36);
    doc.moveDown(0.3);
    const y = doc.y;
    doc.font("Helvetica-Oblique").fontSize(9.5);
    const dates = safe(role.dates);
    const dw = doc.widthOfString(dates);
    doc.text(dates, M.left, y, { width, align: "right" });
    doc.y = y;
    doc.font("Helvetica-Bold").text(safe(role.title), M.left, y, { width: width - dw - 12, continued: true });
    doc.font("Helvetica").text(safe(` | ${role.company}`));
    doc.moveDown(0.15);
    for (const b of role.bullets) bullet([{ text: b }]);
  }

  heading("Education");
  for (const e of cv.education) bullet([{ text: e }]);

  heading("Tools & Languages");
  bullet([{ text: "Tools: ", bold: true }, { text: cv.tools.join(", ") }]);
  bullet([{ text: "Languages: ", bold: true }, { text: cv.languages.join(", ") }]);

  doc.end();
  return new Promise((resolve, reject) => {
    out.on("finish", () => resolve());
    out.on("error", reject);
  });
}

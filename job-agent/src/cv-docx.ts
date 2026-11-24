import fs from "node:fs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import type { TailoredCv } from "./claude.js";

const FONT = "Calibri";
// A4 in twips, with 0.6" side margins; the right tab stop sits on the right margin so dates align flush.
const PAGE = { width: 11906, height: 16838, side: 860, topBottom: 720 };
const pt = (n: number) => n * 2; // docx sizes are in half-points

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "7F7F7F", space: 1 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: pt(11), font: FONT, color: "1F3864" })],
  });
}

function bullet(runs: TextRun[]): Paragraph {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: runs });
}

const run = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
  new TextRun({ text, font: FONT, size: pt(opts.size ?? 10.5), bold: opts.bold, italics: opts.italics });

/** Renders a tailored CV as an editable, ATS-friendly Word document (single column, no tables or images). */
export async function writeCvDocx(cv: TailoredCv, file: string): Promise<void> {
  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [run(cv.name.toUpperCase(), { bold: true, size: 18 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [run(cv.contact_line, { size: 10 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run(cv.headline, { bold: true, size: 10 })] }),

    heading("Professional Summary"),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, children: [run(cv.summary)] }),

    heading("Core Competencies"),
    ...cv.competencies.map((c) => bullet([run(`${c.area}: `, { bold: true }), run(c.detail)])),

    heading("Professional Experience"),
    ...cv.experience.flatMap((role) => [
      new Paragraph({
        spacing: { before: 120, after: 40 },
        tabStops: [{ type: TabStopType.RIGHT, position: PAGE.width - 2 * PAGE.side }],
        keepNext: true,
        children: [run(role.title, { bold: true }), run(` | ${role.company}`), run(`\t${role.dates}`, { italics: true })],
      }),
      ...role.bullets.map((b) => bullet([run(b)])),
    ]),

    heading("Education"),
    ...cv.education.map((e) => bullet([run(e)])),

    heading("Tools & Languages"),
    bullet([run("Tools: ", { bold: true }), run(cv.tools.join(", "))]),
    bullet([run("Languages: ", { bold: true }), run(cv.languages.join(", "))]),
  ];

  const doc = new Document({
    creator: cv.name,
    title: `${cv.name} — CV`,
    styles: { default: { document: { run: { font: FONT, size: pt(10.5) } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.topBottom, bottom: PAGE.topBottom, left: PAGE.side, right: PAGE.side },
          },
        },
        children,
      },
    ],
  });
  fs.writeFileSync(file, await Packer.toBuffer(doc));
}

/**
 * Player install guide for Crease PWA → Word (.docx)
 * Usage: node scripts/generate-install-guide.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(
  __dirname,
  "../docs/Crease-Install-Guide-Players.docx",
);

const APP_URL = "https://crease-app-flagship.vercel.app/";

const green = "0B5D2A";
const clubhouse = "082417";
const muted = "4B5563";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({ text, bold: true, color: clubhouse, font: "Calibri" }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: green,
        font: "Calibri",
        size: 28,
      }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: clubhouse,
        font: "Calibri",
        size: 24,
      }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 22,
        color: muted,
        ...opts,
      }),
    ],
  });
}

function bullet(text, reference = "bullets") {
  return new Paragraph({
    numbering: { reference, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: muted })],
  });
}

function numbered(text, reference) {
  return new Paragraph({
    numbering: { reference, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: muted })],
  });
}

function callout(title, text) {
  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: green, space: 8 },
      },
      indent: { left: convertInchesToTwip(0.15) },
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: "Calibri",
          size: 22,
          color: green,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: green, space: 8 },
      },
      indent: { left: convertInchesToTwip(0.15) },
      children: [
        new TextRun({ text, font: "Calibri", size: 20, color: muted }),
      ],
    }),
  ];
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [
          {
            id: "Normal",
            run: { font: "Calibri", size: 22 },
          },
        ],
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.35),
                  hanging: convertInchesToTwip(0.2),
                },
              },
            },
          },
        ],
      },
      {
        reference: "ios-steps",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.35),
                  hanging: convertInchesToTwip(0.25),
                },
              },
            },
          },
        ],
      },
      {
        reference: "android-chrome",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.35),
                  hanging: convertInchesToTwip(0.25),
                },
              },
            },
          },
        ],
      },
      {
        reference: "android-samsung",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.35),
                  hanging: convertInchesToTwip(0.25),
                },
              },
            },
          },
        ],
      },
      {
        reference: "login-steps",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.35),
                  hanging: convertInchesToTwip(0.25),
                },
              },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.85),
            bottom: convertInchesToTwip(0.85),
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      children: [
        h1("Crease — Install Guide for Players"),
        body(
          "Ranches Thunders uses Crease to manage weekend matches, availability, carpool, and payments. Install it on your phone like a normal app so you can vote and settle fees quickly.",
        ),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Open this link on your phone: ",
              font: "Calibri",
              size: 22,
              color: muted,
            }),
            new TextRun({
              text: APP_URL,
              font: "Calibri",
              size: 22,
              bold: true,
              color: green,
            }),
          ],
        }),
        ...callout(
          "Before you start",
          "You must already be added by a team Admin. Crease is invite-only — if you are not on the squad list, login will not work. Use Safari on iPhone/iPad, and Chrome (or Samsung Internet) on Android.",
        ),

        h2("1. iPhone / iPad (iOS)"),
        body(
          "Apple only allows full “Add to Home Screen” from Safari. Do not use Chrome or Instagram’s in-app browser for this step.",
        ),
        h3("Install steps"),
        numbered("Open Safari and go to " + APP_URL, "ios-steps"),
        numbered(
          "Tap the Share button (square with an upward arrow) at the bottom of the screen.",
          "ios-steps",
        ),
        numbered(
          "Scroll the share sheet and tap Add to Home Screen.",
          "ios-steps",
        ),
        numbered(
          "Confirm the name shows as Crease, then tap Add.",
          "ios-steps",
        ),
        numbered(
          "Find the Crease icon on your Home Screen and open it. It launches full-screen like an app.",
          "ios-steps",
        ),
        ...callout(
          "iOS tip",
          "If you do not see “Add to Home Screen”, swipe left on the share sheet’s bottom row of actions, or tap Edit Actions to enable it. After installing, always open Crease from the Home Screen icon — not from a Safari tab — so it feels like a native app.",
        ),

        h2("2. Android"),
        body(
          "Chrome is the most reliable browser. Samsung Internet also works on many Galaxy phones.",
        ),
        h3("Chrome"),
        numbered("Open Chrome and go to " + APP_URL, "android-chrome"),
        numbered(
          "Tap the three-dot menu (⋮) in the top-right corner.",
          "android-chrome",
        ),
        numbered(
          "Tap Install app or Add to Home screen (wording varies by phone).",
          "android-chrome",
        ),
        numbered(
          "Confirm Install / Add. Crease appears with the team icon on your Home Screen or app drawer.",
          "android-chrome",
        ),
        numbered("Open Crease from that icon going forward.", "android-chrome"),
        h3("Samsung Internet (optional)"),
        numbered(
          "Open Samsung Internet and visit " + APP_URL,
          "android-samsung",
        ),
        numbered(
          "Tap the menu, then Add page to → Home screen (or similar).",
          "android-samsung",
        ),
        numbered(
          "Confirm, then open Crease from the Home Screen.",
          "android-samsung",
        ),
        ...callout(
          "Android tip",
          "If Install app does not appear, use Add to Home screen instead — both put Crease on your phone. Keep Chrome updated from the Play Store if the option is missing.",
        ),

        h2("3. First login"),
        numbered(
          "Open the installed Crease app and enter your Indian mobile number (+91).",
          "login-steps",
        ),
        numbered(
          "Enter the OTP you receive (or the test OTP if Admin shared one for local/dev).",
          "login-steps",
        ),
        numbered(
          "If asked, complete your profile (full name + mobile).",
          "login-steps",
        ),
        numbered(
          "You land on Home — vote availability and carpool for the next weekend from the match ticket.",
          "login-steps",
        ),
        ...callout(
          "Access denied?",
          "Ask a Ranches Thunders Admin to add your number to the team. Only active members can use Crease.",
        ),

        h2("4. What you can do in Crease"),
        bullet("See this weekend’s match(es) on Home"),
        bullet("Vote Playing / Not playing and Carpool / Coming own"),
        bullet("Check notifications for squad and payment alerts"),
        bullet("Pay weekend fees with UPI, UTR, and a payment screenshot"),
        bullet("Update your name and profile photo under Profile"),

        h2("5. Quick troubleshooting"),
        bullet(
          "iOS: Install only works from Safari. Copy the link into Safari if you opened it elsewhere.",
        ),
        bullet(
          "Android: Try Chrome → ⋮ → Add to Home screen if Install app is hidden.",
        ),
        bullet(
          "Wrong icon or old look after an update: remove the Home Screen shortcut, reopen the URL, and install again.",
        ),
        bullet(
          "Cannot log in: confirm Admin has added your +91 number and that you typed it correctly.",
        ),
        bullet(
          "Notifications: allow notifications when the phone asks, and open Crease from the Home Screen icon (not a browser tab).",
        ),

        h2("Need help?"),
        body(
          "Message a Ranches Thunders Admin on WhatsApp. Share a screenshot of the screen you are stuck on — that usually solves it fastest.",
        ),
        new Paragraph({
          spacing: { before: 280 },
          children: [
            new TextRun({
              text: "Crease · Ranches Thunders",
              font: "Calibri",
              size: 18,
              color: green,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: APP_URL,
              font: "Calibri",
              size: 18,
              color: muted,
            }),
          ],
        }),
      ],
    },
  ],
});

await mkdir(path.dirname(outPath), { recursive: true });
const buffer = await Packer.toBuffer(doc);
await writeFile(outPath, buffer);
console.log(`Wrote ${outPath}`);

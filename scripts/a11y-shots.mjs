import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const out = "/tmp/a11y-shots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

async function shot(name, width, height, steps = async () => {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await steps(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png` });
  if (errs.length) console.log(`!! ${name}:`, errs);
  await page.close();
}

const openPanel = async (p) => { await p.click("#a11y-btn"); await p.waitForTimeout(400); };

await shot("01-chiuso-desktop", 1280, 860);
await shot("02-aperto-desktop", 1280, 860, openPanel);
await shot("03-hyper", 1280, 860, async (p) => {
  await openPanel(p);
  await p.click('.a11y-radio:has(input[value="hyper"])');
  await p.waitForTimeout(900);
  await p.click("#a11y-close");
});
await shot("04-dyslexic", 1280, 860, async (p) => {
  await openPanel(p);
  await p.click('.a11y-radio:has(input[value="dyslexic"])');
  await p.waitForTimeout(900);
  await p.click("#a11y-close");
});
await shot("05-tutto-attivo", 1280, 860, async (p) => {
  await openPanel(p);
  await p.click('.a11y-radio:has(input[value="hyper"])');
  for (const t of ["big", "spaced", "calm", "still"]) await p.click(`.a11y-switch:has([data-a11y-toggle="${t}"])`);
  await p.waitForTimeout(900);
  await p.click("#a11y-close");
});
await shot("06-mobile-chiuso", 390, 844);
await shot("07-mobile-aperto", 390, 844, openPanel);

// Le preferenze NON persistono: un reload deve riportare tutto al predefinito.
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.click("#a11y-btn");
await page.click('.a11y-radio:has(input[value="dyslexic"])');
await page.click('.a11y-switch:has([data-a11y-toggle="big"])');
await page.waitForTimeout(300);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
console.log("dopo reload (deve essere default/null) -> font:", await page.getAttribute("html", "data-font"), "| big:", await page.getAttribute("html", "data-big"));
await page.click("#a11y-btn");
await page.click("#a11y-reset");
await page.waitForTimeout(300);
console.log("dopo reset  -> font:", await page.getAttribute("html", "data-font"), "| big:", await page.getAttribute("html", "data-big"));
console.log("radio predefinito ricontrollato:", await page.isChecked('input[value="default"]'));
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
console.log("Escape chiude:", await page.isHidden("#a11y-panel"), "| focus torna al bottone:", await page.evaluate(() => document.activeElement.id));
await browser.close();

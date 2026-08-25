import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const out = "/tmp/gloria-shots";
mkdirSync(out, { recursive: true });

const chrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
});

async function shoot(name, width, height, extra = async () => {}) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "[data-reveal]{opacity:1!important;translate:none!important}",
  });
  await extra(page);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
}

await shoot("desktop-hero", 1440, 900);
await shoot("mobile-hero", 390, 844);

await shoot("desktop-who", 1440, 900, (p) =>
  p.locator("#chi-e").scrollIntoViewIfNeeded()
);
await shoot("desktop-work", 1440, 900, (p) =>
  p.locator("#cosa-fa").scrollIntoViewIfNeeded()
);
await shoot("desktop-creds", 1440, 900, (p) =>
  p.locator("#qualifiche").scrollIntoViewIfNeeded()
);
await shoot("desktop-reviews", 1440, 900, (p) =>
  p.locator("#recensioni").scrollIntoViewIfNeeded()
);
await shoot("desktop-close", 1440, 900, (p) =>
  p.locator("#contatti").scrollIntoViewIfNeeded()
);

await shoot("mobile-who", 390, 844, (p) =>
  p.locator("#chi-e").scrollIntoViewIfNeeded()
);
await shoot("mobile-work", 390, 844, (p) =>
  p.locator("#cosa-fa").scrollIntoViewIfNeeded()
);
await shoot("mobile-reviews", 390, 844, (p) =>
  p.locator("#recensioni").scrollIntoViewIfNeeded()
);
await shoot("mobile-close", 390, 844, (p) =>
  p.locator("#contatti").scrollIntoViewIfNeeded()
);

await shoot("desktop-full", 1440, 900, (p) =>
  p.screenshot({ path: `${out}/desktop-full.png`, fullPage: true })
);

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
const href = await page.locator("[data-wa]").first().getAttribute("href");
const navH = await page.locator(".nav").evaluate((el) => el.getBoundingClientRect().height);
const heroCta = await page.locator(".cta-hero").first().boundingBox();
console.log(JSON.stringify({ href, navH, heroCta }, null, 2));
await page.close();

await browser.close();
console.log("shots written to", out);

import { chromium } from "playwright";
import { readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";

const BASE = "http://localhost:8080/";
mkdirSync("Icon", { recursive: true });

// Games that already have any icon (Icon folder or root .icon file) are skipped
const have = new Set([
  ...readdirSync("Icon"),
  ...readdirSync(".").filter(f => f.endsWith(".icon")),
].map(f => f.replace(/\.[^.]+$/, "").toLowerCase()));

const games = readdirSync(".").filter(f =>
  f.endsWith(".html") && !/^(index|readme|feed|extra|links)\.html$/i.test(f));

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

for (const f of games) {
  const name = f.replace(/\.html$/i, "");
  if (have.has(name.toLowerCase())) continue;
  try {
    await page.goto(BASE + encodeURIComponent(f), { timeout: 20000 });
    await page.waitForTimeout(4000);          // let the game load
    await page.mouse.click(400, 300);         // many games wait for a click on the title screen
    await page.waitForTimeout(1500);
    const img = await page.screenshot({ type: "jpeg", quality: 70 });
    if (img.length < 8000) { console.log("blank, skipped:", f); continue; }   // flat black/white images are tiny
    writeFileSync(`Icon/${name}.jpg`, img);
    console.log("saved:", name);
  } catch (e) {
    console.log("failed:", f, e.message);
  }
}
await browser.close();

import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3100";
const routes = ["/", "/board", "/ledger/est_holt", "/kit"];
const widths = [390, 1024, 1440];
const b = await chromium.launch(); const p = await b.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
for (const r of routes) for (const w of widths) {
  await p.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
  await p.goto(base + r, { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await p.screenshot({ path: `qa/${r.replace(/\W/g, "_") || "home"}-${w}.png`, fullPage: r !== "/board" });
  console.log(`${r} @${w} hscroll=${hscroll}`);
}
console.log("console errors:", errors.length ? errors.slice(0, 5) : "none");
await b.close();

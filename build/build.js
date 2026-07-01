// Builds the standalone single-file app (index.html) by inlining shared core.js
// into the Quiet Ritual template and applying the Twilight lavender theme.
// To change the routine, edit core.js and re-run. To re-theme, edit the palette
// / extraCSS below (or add more THEMES entries).
const fs = require("fs");
const path = require("path");

const core = fs.readFileSync(path.join(__dirname, "core.js"), "utf8");
const read = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const write = (f, s) => { fs.writeFileSync(path.join(__dirname, f), s); console.log("built", f); };

const spa = read("design-spa.template.html").replace("/*__CORE__*/", () => core);

const THEMES = [
  {
    out: "../index.html", title: "Quiet Ritual", brand: "Quiet Ritual", short: "Ritual",
    statusbar: "default", themeColor: "#DCCFEE", markbg: "332751", markfg: "DDCFEE",
    palette: `
    --paper:#E9E3F0; --card:#F7F3FC; --blush:#DDD4EC; --line:#CFC4E2;
    --plum:#382C53; --plum-soft:#5E5080; --rose:#8E76BC; --ink:#2E2742;
    --muted:#867E9C; --clay:#9A5E84; --clay-bg:#E8D7E6;
    --ac-retinol:#7FA589; --ac-repair:#B383C2; --ac-bha:#7F94CC; --ac-sleep:#8470BE; --ac-calm:#84A8C0; --ac-session:#B06A96;
    --btn-bg:#473776; --btn-fg:#fff;
    --prompt-a:#473776; --prompt-b:#6A5A9C; --prompt-fg:#fff;
    --prompt-yes-bg:#fff; --prompt-yes-fg:#473776; --prompt-no-bg:rgba(255,255,255,.20); --prompt-no-fg:#fff;`,
    extraCSS: `
    /* Twilight — deeper dusk; card lifts off a saturated lilac-grey field */
    body{
      background:
        radial-gradient(130% 60% at 50% -8%, #DBCEED 0%, rgba(219,206,237,0) 58%),
        radial-gradient(120% 52% at 85% 4%, #E6D3E5 0%, rgba(230,211,229,0) 52%),
        var(--paper);
      background-attachment:fixed;
    }
    .brand b{letter-spacing:.3px;}
    nav.seg button.on,.phase button.on{box-shadow:0 2px 10px rgba(70,50,120,.18);}
    .card{
      background:linear-gradient(180deg,#FAF6FE 0%,#F4EFFB 100%);
      box-shadow:0 14px 38px rgba(60,42,110,.14);border-color:#DFD4EE;
    }
    ol.rail li::after{
      background:radial-gradient(circle at 34% 30%,#BCA6E4 0%,#8068BE 78%);
      border-color:transparent;box-shadow:0 1px 6px rgba(80,56,150,.40);
    }
    ol.rail li.wait::after{
      background:radial-gradient(circle at 34% 30%,#7860A6 0%,#473776 80%);
      box-shadow:0 1px 7px rgba(60,42,110,.55);
    }
    ol.rail li::before{background:repeating-linear-gradient(#CDBFE4 0 3px,transparent 3px 9px);}
    .note{border-left-color:var(--rose);}
    .acc.today{box-shadow:0 8px 24px rgba(90,60,160,.24);}`,
  },
];

const PALETTE_RE = /\/\*__PALETTE__\*\/[\s\S]*?\/\*__END_PALETTE__\*\//;

for (const t of THEMES) {
  let html = spa
    .replace(PALETTE_RE, `/*__PALETTE__*/${t.palette}\n    /*__END_PALETTE__*/`)
    .replace("/*__THEMECSS__*/", () => t.extraCSS || "")
    .replaceAll("__TITLE__", t.title)
    .replaceAll("__BRAND__", t.brand)
    .replaceAll("__SHORT__", t.short)
    .replaceAll("__STATUSBAR__", t.statusbar)
    .replaceAll("__THEMECOLOR__", t.themeColor)
    .replaceAll("__MARKBG_ENC__", t.markbg)
    .replaceAll("__MARKFG_ENC__", t.markfg)
    .replaceAll("__MARKBG__", t.markbg)
    .replaceAll("__MARKFG__", t.markfg);
  write(t.out, html);
}

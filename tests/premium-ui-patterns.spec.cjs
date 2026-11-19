const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("premium navigation has five primary tabs and preserves every original destination", () => {
 const html=read("index.html"),app=read("js/app.js");
 const nav=html.match(/<nav class="home-section-nav"[\s\S]*?<\/nav>/)?.[0]||"";
 expect((nav.match(/data-home-target=/g)||[]).length).toBe(4);
 expect(nav).toContain("home-more-toggle");
 for(const id of ["home-overview","home-our-world","home-messages","home-games","home-plans","home-routine","home-pets"]) expect(html).toContain('id="'+id+'"');
 expect(app).toContain('.home-more-menu [data-home-target]');
});

test("premium patterns provide Lucide, accessible progress, toast variants and reduced motion", () => {
 const html=read("index.html"),ui=read("js/ui-enhancements.js"),css=read("css/premium-ui-patterns.css"),worker=read("service-worker.js");
 expect(html).toContain("lucide@0.468.0");
 expect(ui).toContain("game-progress-ring");
 expect(ui).toContain("unreadCount");
 expect(ui).toContain("data-presence");
 expect(ui).toContain('["success","error","warning","info"]');
 expect(css).toContain("@media(prefers-reduced-motion:reduce)");
 expect(css).toContain(".message-bubble.sent");
 expect(worker).toContain("premium-ui-patterns.css");
 expect(worker).toContain("ui-enhancements.js");
});

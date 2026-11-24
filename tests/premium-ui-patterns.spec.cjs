const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("premium navigation has five primary tabs and preserves every original destination", () => {
 const html=read("index.html"),app=read("js/app.js");
 const nav=html.match(/<nav class="home-section-nav"[\s\S]*?<\/nav>/)?.[0]||"";
 expect((nav.match(/data-home-target=/g)||[]).length).toBe(5);
 expect(nav).toContain('data-home-target="home-more-page"');
 expect(html).toContain("home-quick-grid");
 expect(html).toContain('data-home-shortcut="stars"');
 for(const id of ["home-overview","home-our-world","home-messages","home-games","home-plans","home-routine","home-pets"]) expect(html).toContain('id="'+id+'"');
 expect(app).toContain('.home-section-nav [data-home-target]');
 expect(app).toContain('"home-more-page"');
});

test("premium patterns provide Lucide, accessible progress, toast variants and reduced motion", () => {
 const html=read("index.html"),ui=read("js/ui-enhancements.js"),css=read("css/premium-ui-patterns.css"),worker=read("service-worker.js");
 expect(html).toContain("lucide@0.468.0");
 expect(ui).toContain("game-progress-ring");
 expect(ui).toContain("unreadCount");
 expect(ui).toContain("dataset.presence");
 expect(css).toContain("data-presence");
 expect(ui).toContain("enhanceEmptyStates");
 expect(ui).toContain(".game-chat-avatar");
 expect(html).toContain("home-quick-grid");
 expect(ui).toContain('["success","error","warning","info"]');
 expect(css).toContain("@media(prefers-reduced-motion:reduce)");
 expect(css).toContain(".message-bubble.sent");
 expect(worker).toContain("premium-ui-patterns.css");
 expect(worker).toContain("ui-enhancements.js");
});

test("mobile home sections cannot shrink and overlap their content", () => {
 const html=read("index.html"),worker=read("service-worker.js"),css=read("css/home-layout-stability.css");
 expect(html).toContain("css/home-layout-stability.css?v=1");
 expect(worker).toContain("ayfar-world-shell-v152");
 expect(worker).toContain("home-layout-stability.css?v=1");
 expect(html).toContain("css/visual-resources-refresh.css?v=1");
 expect(html).toContain("js/numeric-legibility.js?v=2");
 expect(worker).toContain("visual-resources-refresh.css?v=1");
 expect(html).toContain("css/final-mobile-clarity.css?v=3");
 expect(worker).toContain("final-mobile-clarity.css?v=3");
 expect(worker).toContain("numeric-legibility.js?v=2");
 expect(css).toContain("flex-shrink:0!important");
 expect(css).toContain("#home-overview>*");
 expect(css).toContain("flex:0 0 auto!important");
 expect(css).toContain("overflow-y:auto!important");
});

test("mobile home viewport gives the content a flexible scroll area above slide controls", () => {
 const layout=read("css/horizontal-layout.css");
 expect(layout).toContain("#home-pages{\n  flex:1 1 0%!important;");
 expect(layout).toContain("height:auto!important;");
 expect(layout).toContain("padding-bottom:calc(42px + env(safe-area-inset-bottom,0px))");
});
test("More page intro stacks kicker, title and description without header flex collision", () => {
 const clarity=read("css/final-mobile-clarity.css");
 expect(clarity).toContain("#home-more-page>header.more-page-intro");
 expect(clarity).toContain("flex-direction:column!important");
 expect(clarity).toContain("white-space:normal!important");
});

test("More page intro no longer uses a global header element and has explicit vertical layout", () => {
 const html=read("index.html"),css=read("css/visual-readability-v152.css");
 expect(html).toContain('<div class="more-page-intro">');
 expect(html).not.toContain('<header class="more-page-intro">');
 expect(css).toContain("#home-more-page>.more-page-intro");
 expect(css).toContain("#home-more-page>.more-page-grid");
});
test("countdown and match numbers use high-contrast text numerals", () => {
 const css=read("css/visual-readability-v152.css"),script=read("js/numeric-legibility.js"),games=read("js/games.js");
 expect(css).toContain("font-variant-emoji:text");
 expect(css).toContain("opacity:1!important");
 expect(script).toContain("if(/[٠-٩۰-۹]/.test(value))");
 expect(games).toContain('class="ayfar-numeric"');
});

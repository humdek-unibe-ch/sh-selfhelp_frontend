// Mantine color-scheme bootstrap, served from /public so it can be included
// in the document head via `<script src>`. React 19 hoists external scripts
// as resources (no inline-<script> warning), unlike inline scripts rendered
// from React components.
//
// Resolution order (first match wins):
//   1. If the server has already stamped `<html data-mantine-color-scheme>`
//      (explicit light/dark from the `sh_color_scheme` cookie), we leave it
//      alone and exit. No flash, no work.
//   2. The `sh_color_scheme` cookie — the only client-readable source of
//      truth for the user's explicit choice.
//   3. Fallback `light`.
//
// `auto` is expanded to `light` or `dark` via `matchMedia` before the
// attribute is written so Mantine's CSS variables bind correctly on the
// first painted frame.
(function () {
    try {
        var html = document.documentElement;
        var serverScheme = html.getAttribute("data-mantine-color-scheme");
        if (serverScheme === "light" || serverScheme === "dark") {
            // Server already resolved; nothing to do.
            return;
        }

        var cookieScheme = null;
        var cookieMatch = document.cookie.match(/(?:^|;\s*)sh_color_scheme=([^;]+)/);
        if (cookieMatch) {
            var raw = decodeURIComponent(cookieMatch[1]);
            if (raw === "light" || raw === "dark" || raw === "auto") {
                cookieScheme = raw;
            }
        }

        var colorScheme = cookieScheme || "light";
        var computed =
            colorScheme !== "auto"
                ? colorScheme
                : window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light";
        html.setAttribute("data-mantine-color-scheme", computed);
    } catch (e) {
        // ignore — worst case the page renders in light mode until Mantine
        // re-applies the scheme after hydration.
    }
})();

// Mantine color-scheme bootstrap, served from /public so it can be included
// in the document head via `<script src>`. React 19 hoists external scripts
// as resources (no inline-<script> warning), unlike inline scripts rendered
// from React components.
//
// Byte-for-byte equivalent to the snippet @mantine/core's <ColorSchemeScript>
// would otherwise generate. Must be kept in sync with Mantine's upstream
// implementation (see packages/@mantine/core/src/core/MantineProvider/
// ColorSchemeScript/ColorSchemeScript.tsx).
(function () {
    try {
        var key = "mantine-color-scheme-value";
        var stored = window.localStorage.getItem(key);
        var colorScheme =
            stored === "light" || stored === "dark" || stored === "auto"
                ? stored
                : "light";
        var computed =
            colorScheme !== "auto"
                ? colorScheme
                : window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light";
        document.documentElement.setAttribute("data-mantine-color-scheme", computed);
    } catch (e) {
        // ignore — worst case the page renders in light mode until Mantine
        // re-applies the scheme after hydration.
    }
})();

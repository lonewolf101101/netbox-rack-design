/*
 * CSRF-token resolution and the shared Bootstrap toast helper -- extracted
 * verbatim from editor.js.
 *
 * Both closed over template-derived state that stays behind in editor.js
 * (`root`, `toastContainer`); since neither export can take that state as an
 * argument without changing its signature or every call site, each re-derives
 * it with a lazy `document.getElementById` lookup instead, exactly as those
 * elements are looked up once at editor.js load time.
 */

// Shared HTML-escaping helper for the string-built dialogs elsewhere in the
// editor (see editor/power.js). Encodes every character with special meaning
// in BOTH element-text and quoted-attribute contexts (`&`, `<`, `>`, `"`,
// `'`), unlike the ad-hoc `.replace(/&/g,"&amp;").replace(/</g,"&lt;")`
// idiom that used to be copy-pasted at each call site -- that idiom left
// quotes unescaped, so a value landing in an attribute (e.g. `value="..."`)
// could still break out of it. Prefer building new markup with
// `document.createElement`/`textContent` instead of string concatenation;
// use this only where a call site already builds an HTML string.
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getCsrfToken() {
    // Guarded, unlike the closure version: editor.js returned early when
    // #rd-editor was absent, so `root` was never null by the time this ran.
    // This module has no such gate, and the whole point of the function is the
    // fallback chain below -- a throw on the first step would defeat it.
    var rootEl = document.getElementById("rd-editor");
    var fromAttr = rootEl && rootEl.getAttribute("data-csrf-token");
    if (fromAttr) { return fromAttr; }
    if (typeof window.netbox_csrf_token !== "undefined" && window.netbox_csrf_token) {
        return window.netbox_csrf_token;
    }
    var input = document.querySelector("[name=csrfmiddlewaretoken]");
    return input ? input.value : "";
}

function createToast(level, title, message) {
    var icon = "mdi-alert";
    if (level === "success") { icon = "mdi-check-circle"; }
    else if (level === "info") { icon = "mdi-information"; }

    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "alert");
    el.setAttribute("aria-live", "assertive");
    el.setAttribute("aria-atomic", "true");

    var header = document.createElement("div");
    header.className = "toast-header bg-" + level;
    var i = document.createElement("i");
    i.className = "mdi " + icon + " me-1";
    var strong = document.createElement("strong");
    strong.className = "me-auto";
    strong.textContent = title;
    var close = document.createElement("button");
    close.type = "button";
    close.className = "btn-close";
    close.setAttribute("data-bs-dismiss", "toast");
    close.setAttribute("aria-label", "Close");
    header.appendChild(i);
    header.appendChild(strong);
    header.appendChild(close);

    var body = document.createElement("div");
    body.className = "toast-body";
    body.textContent = (message || "").trim();

    el.appendChild(header);
    el.appendChild(body);
    (document.getElementById("rd-editor-toasts") || document.body).appendChild(el);

    var ctor = (window.bootstrap && window.bootstrap.Toast) || window.Toast;
    if (ctor) {
        var t = new ctor(el, { delay: 6000 });
        el.addEventListener("hidden.bs.toast", function () { el.remove(); });
        t.show();
    } else {
        // Fallback if Bootstrap's JS isn't present: leave it on screen.
        el.classList.add("show");
    }
}


export { getCsrfToken, createToast, escapeHtml };

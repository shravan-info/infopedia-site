/* Infopedia — client behaviour (no dependencies) */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- theme ---------------- */
  var root = document.documentElement;
  var toggle = $("#themeToggle");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("infopedia-theme", t); } catch (e) {}
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------------- toast ---------------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  /* ---------------- search palette ---------------- */
  var IDX = window.INFOPEDIA_INDEX || [];
  var palette = $("#palette");
  var input = $("#paletteInput");
  var results = $("#paletteResults");
  var sel = 0;
  var shown = [];
  var inPage = location.pathname.indexOf("/page/") !== -1;

  function link(u) { return (inPage ? "../" : "./") + u; }

  function score(item, q) {
    var t = item.t.toLowerCase(), s = item.s.toLowerCase(), k = item.k.toLowerCase();
    var n = 0, words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return 1;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (t === w) n += 100;
      else if (t.indexOf(w) === 0) n += 60;
      else if (t.indexOf(w) !== -1) n += 40;
      else if (k.indexOf(w) !== -1) n += 12;
      else if (s.indexOf(w) !== -1) n += 8;
      else return 0;
    }
    return n - item.t.length * 0.05;
  }

  function render(q) {
    var list = IDX.map(function (it) { return { it: it, sc: score(it, q.toLowerCase().trim()) }; })
      .filter(function (x) { return x.sc > 0; })
      .sort(function (a, b) { return b.sc - a.sc; })
      .slice(0, 8)
      .map(function (x) { return x.it; });
    shown = list;
    sel = 0;
    if (!q.trim()) {
      results.innerHTML = '<div class="p-empty">Type to search 16 articles, or press Esc to close.</div>';
      return;
    }
    if (!list.length) {
      results.innerHTML = '<div class="p-empty">No articles match “' + q.replace(/</g, "&lt;") + '”.</div>';
      return;
    }
    results.innerHTML = list.map(function (it, i) {
      return '<a class="p-row' + (i === 0 ? " sel" : "") + '" href="' + link(it.u) + '">' +
        '<div class="p-top"><span class="p-title">' + it.t + '</span><span class="p-cat">' + it.c + '</span></div>' +
        '<div class="p-snip">' + it.s + "</div></a>";
    }).join("");
  }

  function openPalette(q) {
    if (!palette) return;
    palette.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = q || "";
    render(input.value);
    setTimeout(function () { input.focus(); input.select(); }, 10);
  }
  function closePalette() {
    if (!palette) return;
    palette.hidden = true;
    document.body.style.overflow = "";
  }
  function move(d) {
    if (!shown.length) return;
    sel = (sel + d + shown.length) % shown.length;
    $$(".p-row", results).forEach(function (r, i) { r.classList.toggle("sel", i === sel); });
    var el = $$(".p-row", results)[sel];
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  if (palette) {
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        if (shown[sel]) { e.preventDefault(); location.href = link(shown[sel].u); }
      } else if (e.key === "Escape") { closePalette(); }
    });
    $$("[data-search-open]").forEach(function (b) {
      b.addEventListener("click", function () { openPalette(""); });
    });
    $$("[data-search-close]").forEach(function (b) {
      b.addEventListener("click", closePalette);
    });
    $$(".chip").forEach(function (c) {
      c.addEventListener("click", function () { openPalette(c.getAttribute("data-q") || ""); });
    });
    var hero = $("#heroSearch");
    if (hero) {
      hero.addEventListener("submit", function (e) { e.preventDefault(); openPalette($("#heroInput").value); });
      $("#heroInput").addEventListener("focus", function () { openPalette(""); });
    }
    document.addEventListener("keydown", function (e) {
      var k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        palette.hidden ? openPalette("") : closePalette();
      } else if (k === "/" && palette.hidden && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault(); openPalette("");
      }
    });
  }

  /* ---------------- shelf scroll ---------------- */
  var shelf = $("#shelf");
  $$("[data-shelf]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!shelf) return;
      shelf.scrollBy({ left: parseInt(b.getAttribute("data-shelf"), 10) * 260, behavior: "smooth" });
    });
  });

  /* ---------------- article: toc, progress, anchors ---------------- */
  var article = $("[data-article]");
  if (article) {
    var heads = $$("section[id] h2", article);
    var links = $$("[data-toc]");
    var bar = $("#progressBar");

    function onScroll() {
      var top = window.scrollY;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (h > 0 ? Math.min(100, (top / h) * 100) : 0) + "%";

      var current = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= 140) current = heads[i].parentNode.id;
      }
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-toc") === current);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    $$(".anchor").forEach(function (a) {
      a.addEventListener("click", function () {
        var url = location.origin + location.pathname + a.getAttribute("href");
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Section link copied"); });
      });
    });
  }

  /* ---------------- copy key facts ---------------- */
  var copyFacts = $("[data-copy-facts]");
  if (copyFacts) {
    copyFacts.addEventListener("click", function () {
      var dl = $(".keyfacts dl");
      var txt = $$(".fact", dl).map(function (f) {
        return $("dt", f).textContent + ": " + $("dd", f).textContent;
      }).join("\n");
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Key facts copied"); });
    });
  }

  /* ---------------- selection toolbar ---------------- */
  var tool = $("#seltool");
  if (tool && article) {
    document.addEventListener("mouseup", function (e) {
      if (tool.contains(e.target)) return;
      var s = window.getSelection();
      var text = s ? s.toString().trim() : "";
      if (!text || text.length < 8 || !s.rangeCount || !article.contains(s.anchorNode)) {
        tool.hidden = true;
        return;
      }
      var r = s.getRangeAt(0).getBoundingClientRect();
      tool.hidden = false;
      var tw = tool.offsetWidth || 190;
      tool.style.top = (r.top + window.scrollY - 46) + "px";
      tool.style.left = Math.max(12, Math.min(window.innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + "px";
    });
    tool.addEventListener("mousedown", function (e) { e.preventDefault(); });
    $$("button", tool).forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        var text = window.getSelection().toString().trim();
        if (act === "copy" && navigator.clipboard) {
          navigator.clipboard.writeText(text);
          toast("Copied to clipboard");
        } else if (act === "ask") {
          toast("Ask: this is a static demo — no model is attached");
        } else if (act === "wrong") {
          openSuggest();
        }
        tool.hidden = true;
      });
    });
  }

  /* ---------------- suggest an edit ---------------- */
  var modal = null;
  function openSuggest() {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "palette";
      modal.innerHTML =
        '<div class="palette-scrim" data-close></div>' +
        '<div class="palette-panel" role="dialog" aria-modal="true" aria-label="Suggest an edit">' +
        '<div class="palette-field"><span class="s-icon"></span>' +
        '<input id="sugInput" type="text" placeholder="Describe the correction and paste a source link…">' +
        "<kbd>Esc</kbd></div>" +
        '<div style="padding:14px 18px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--line)">' +
        '<button class="btn" data-close>Cancel</button>' +
        '<button class="btn" id="sugSend">Submit suggestion</button></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-close")) { modal.hidden = true; document.body.style.overflow = ""; }
      });
      modal.querySelector("#sugSend").addEventListener("click", function () {
        var v = modal.querySelector("#sugInput").value.trim();
        modal.hidden = true;
        document.body.style.overflow = "";
        toast(v ? "Suggestion queued for review (demo only)" : "Add a description first");
      });
      modal.querySelector("#sugInput").addEventListener("keydown", function (e) {
        if (e.key === "Escape") { modal.hidden = true; document.body.style.overflow = ""; }
      });
    }
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { modal.querySelector("#sugInput").focus(); }, 10);
  }
  $$("[data-suggest]").forEach(function (b) {
    b.addEventListener("click", openSuggest);
  });
})();

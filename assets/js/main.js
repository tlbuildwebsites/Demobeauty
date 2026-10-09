/* ==========================================================================
   Demobeauty – Interaktionen & Animationen
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Seitenübergang ---------- */
  function pageLoaded() { root.classList.add("is-loaded"); root.classList.remove("is-leaving"); }
  if (document.readyState === "complete") pageLoaded();
  else window.addEventListener("load", pageLoaded);
  setTimeout(pageLoaded, 1800); // Sicherheitsnetz bei langsamen Medien
  window.addEventListener("pageshow", function (e) { if (e.persisted) pageLoaded(); });

  if (!reduceMotion) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("download") ||
          /^(mailto:|tel:|https?:)/i.test(href) || /\.(txt|pdf)$/i.test(href)) return;
      // Nur Wechsel auf andere Seiten animieren
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(function () { location.href = a.href; }, 430);
    });
  }

  /* ---------- Header beim Scrollen ---------- */
  var header = $(".site-header");
  function onScrollHeader() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 40); }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Hamburger-Menü ---------- */
  var toggle = $(".nav-toggle");
  if (toggle) {
    $$(".main-nav li").forEach(function (li, i) { li.firstElementChild.style.setProperty("--i", i); });
    var setNav = function (open) {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    };
    toggle.addEventListener("click", function () { setNav(!root.classList.contains("nav-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
    $$(".main-nav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1180) setNav(false); });
  }

  /* ---------- Titel Buchstabe für Buchstabe ---------- */
  $$("[data-split]").forEach(function (el) {
    var ci = 0;
    var build = function (node) {
      var out = document.createDocumentFragment();
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.className = "word";
            Array.from(part).forEach(function (ch) {
              var c = document.createElement("span");
              c.className = "char";
              c.textContent = ch;
              c.style.setProperty("--ci", ci++);
              w.appendChild(c);
            });
            out.appendChild(w);
          });
        } else if (child.nodeType === 1) {
          var clone = child.cloneNode(false);
          clone.appendChild(build(child));
          out.appendChild(clone);
        }
      });
      return out;
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var frag = build(el);
    el.textContent = "";
    el.appendChild(frag);
    $$(".word", el).forEach(function (w) { w.setAttribute("aria-hidden", "true"); });
    el.classList.add("split");
  });

  /* ---------- Reveal beim Scrollen ---------- */
  var revealEls = $$("[data-reveal], .img-reveal, .split, [data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          if (en.target.hasAttribute("data-count")) countUp(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
      if (el.hasAttribute("data-count")) el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null, dur = 1800;
    var step = function (t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("de-CH") + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Parallax ---------- */
  var parallaxEls = $$("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        var target = el.querySelector("img") || el;
        target.style.translate = "0 " + offset.toFixed(1) + "px";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Hero-Video (wechselnde Clips) ---------- */
  var heroMedia = $(".hero-media");
  if (heroMedia) {
    var videos = $$("video", heroMedia);
    var dots = $$(".hero-dots button");
    var vToggle = $(".video-toggle");
    var small = window.matchMedia("(max-width: 900px)").matches;
    var current = 0, paused = false;

    if (reduceMotion) {
      var still = $("img", heroMedia);
      if (still) still.classList.add("is-active");
    } else {
      var load = function (v) {
        if (v.dataset.loaded) return;
        v.src = small && v.dataset.srcSm ? v.dataset.srcSm : v.dataset.src;
        v.dataset.loaded = "1";
      };
      var show = function (i) {
        var prev = videos[current];
        current = (i + videos.length) % videos.length;
        var v = videos[current];
        load(v);
        v.currentTime = 0;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        videos.forEach(function (x) { x.classList.toggle("is-active", x === v); });
        dots.forEach(function (d, k) { d.setAttribute("aria-current", k === current ? "true" : "false"); });
        if (prev && prev !== v) setTimeout(function () { prev.pause(); }, 1600);
        load(videos[(current + 1) % videos.length]); // nächsten Clip vorladen
      };
      videos.forEach(function (v, i) {
        v.muted = true;
        v.addEventListener("timeupdate", function () {
          if (i === current && !paused && v.duration && v.currentTime > Math.min(v.duration - 1.2, 9)) show(i + 1);
        });
        v.addEventListener("ended", function () { if (i === current) show(i + 1); });
      });
      dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
      if (vToggle) {
        vToggle.addEventListener("click", function () {
          paused = !paused;
          var v = videos[current];
          if (paused) v.pause(); else v.play();
          vToggle.setAttribute("aria-pressed", paused ? "true" : "false");
          vToggle.setAttribute("aria-label", paused ? "Video abspielen" : "Video pausieren");
          vToggle.innerHTML = paused
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';
        });
      }
      show(0);
    }
  }

  /* ---------- Vorher/Nachher-Schieberegler ---------- */
  $$(".ba").forEach(function (ba) {
    var range = $("input[type=range]", ba);
    var set = function (v) { ba.style.setProperty("--pos", v + "%"); };
    range.addEventListener("input", function () { set(range.value); });
    set(range.value);
    // sanfte Demo-Bewegung beim ersten Erscheinen
    if (!reduceMotion && "IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        o.disconnect();
        var t0 = null;
        var anim = function (t) {
          if (!t0) t0 = t;
          var p = (t - t0) / 1800;
          if (p >= 1 || ba.dataset.touched) { if (!ba.dataset.touched) { range.value = 50; set(50); } return; }
          var v = 50 + Math.sin(p * Math.PI * 2) * 22;
          range.value = v; set(v);
          requestAnimationFrame(anim);
        };
        setTimeout(function () { requestAnimationFrame(anim); }, 500);
      }, { threshold: 0.5 });
      o.observe(ba);
      range.addEventListener("pointerdown", function () { ba.dataset.touched = "1"; });
      range.addEventListener("keydown", function () { ba.dataset.touched = "1"; });
    }
  });

  /* ---------- Behandlungen: aktive Kategorie ---------- */
  var catLinks = $$(".cat-nav a");
  if (catLinks.length && "IntersectionObserver" in window) {
    var catIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          catLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$(".price-cat").forEach(function (s) { catIo.observe(s); });
  }

  /* ---------- Galerie: Filter & Lightbox ---------- */
  var gallery = $(".gallery");
  if (gallery) {
    var items = $$(".g-item", gallery);
    $$(".filter-bar .chip").forEach(function (btn, _, all) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        all.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        items.forEach(function (it) {
          var show = f === "alle" || it.getAttribute("data-cat") === f;
          if (show && it.classList.contains("is-hidden")) {
            it.classList.remove("is-hidden");
            it.classList.add("is-entering");
            requestAnimationFrame(function () { requestAnimationFrame(function () { it.classList.remove("is-entering"); }); });
          } else if (!show) {
            it.classList.add("is-hidden");
          }
        });
      });
    });

    var lb = $(".lightbox");
    var lbImg = $("img", lb), lbCap = $("p", lb);
    var idx = 0;
    var visible = function () { return items.filter(function (i) { return !i.classList.contains("is-hidden"); }); };
    var open = function (i) {
      var list = visible();
      idx = (i + list.length) % list.length;
      var it = list[idx], img = $("img", it);
      lbImg.src = img.src; lbImg.alt = img.alt;
      lbCap.textContent = $("figcaption", it) ? $("figcaption", it).childNodes[0].textContent.trim() : "";
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      $(".lightbox-close", lb).focus();
    };
    var close = function () { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); if (visible()[idx]) visible()[idx].focus(); };
    items.forEach(function (it) { it.addEventListener("click", function () { open(visible().indexOf(it)); }); });
    $(".lightbox-close", lb).addEventListener("click", close);
    $(".lightbox-nav--prev", lb).addEventListener("click", function () { open(idx - 1); });
    $(".lightbox-nav--next", lb).addEventListener("click", function () { open(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(idx - 1);
      if (e.key === "ArrowRight") open(idx + 1);
    });
  }

  /* ---------- Öffnungszeiten: heute + Status ---------- */
  var hours = { 0: null, 1: null, 2: [9, 19], 3: [9, 19], 4: [9, 20], 5: [9, 19], 6: [9, 16] };
  var now = new Date();
  $$(".hours-table tr[data-day]").forEach(function (tr) {
    if (parseInt(tr.getAttribute("data-day"), 10) === now.getDay()) tr.classList.add("is-today");
  });
  $$(".status-pill").forEach(function (pill) {
    var h = hours[now.getDay()], t = now.getHours() + now.getMinutes() / 60;
    var open = h && t >= h[0] && t < h[1];
    pill.classList.toggle("is-open", !!open);
    $("span", pill).textContent = open ? "Jetzt geöffnet – bis " + h[1] + ":00 Uhr" : "Momentan geschlossen";
  });

  /* ---------- Online-Termin (Demo) ---------- */
  var booking = $("#booking-form");
  if (booking) {
    var sel = $("#behandlung", booking), date = $("#datum", booking), slotWrap = $(".slots", booking);
    var hint = $(".slots-hint", booking);
    var sum = {
      t: $("#sum-treatment"), d: $("#sum-date"), z: $("#sum-time"), dur: $("#sum-duration"), p: $("#sum-price")
    };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var today = new Date();
    date.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());

    var buildSlots = function () {
      slotWrap.innerHTML = "";
      if (!date.value) { hint.textContent = "Bitte zuerst ein Datum wählen."; return; }
      var d = new Date(date.value + "T12:00:00");
      var h = hours[d.getDay()];
      if (!h) { hint.textContent = "An diesem Tag ist das Studio geschlossen (So & Mo). Bitte wähle einen anderen Tag."; updateSummary(); return; }
      hint.textContent = "Verfügbare Zeiten (Demo):";
      var seed = d.getDate() * 7 + d.getMonth();
      for (var m = h[0] * 60; m <= h[1] * 60 - 60; m += 30) {
        var label = pad(Math.floor(m / 60)) + ":" + pad(m % 60);
        var taken = ((m / 30 + seed) % 5) === 0; // ein paar Zeiten als „belegt“ markieren
        var l = document.createElement("label");
        l.className = "slot";
        l.innerHTML = '<input type="radio" name="uhrzeit" value="' + label + '"' + (taken ? " disabled" : "") + ' required><span>' + label + "</span>";
        slotWrap.appendChild(l);
      }
      updateSummary();
    };

    var updateSummary = function () {
      var opt = sel.options[sel.selectedIndex];
      sum.t.textContent = opt && opt.value ? opt.value : "–";
      sum.dur.textContent = opt && opt.dataset.dur ? opt.dataset.dur + " Min." : "–";
      sum.p.textContent = opt && opt.dataset.price ? "CHF " + opt.dataset.price : "–";
      if (date.value) {
        var d = new Date(date.value + "T12:00:00");
        sum.d.textContent = d.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      } else sum.d.textContent = "–";
      var t = $("input[name=uhrzeit]:checked", booking);
      sum.z.textContent = t ? t.value + " Uhr" : "–";
    };

    sel.addEventListener("change", updateSummary);
    date.addEventListener("change", buildSlots);
    slotWrap.addEventListener("change", updateSummary);
    // Behandlung per URL vorwählen (?b=…)
    var pre = new URLSearchParams(location.search).get("b");
    if (pre) { $$("option", sel).forEach(function (o) { if (o.value === pre) sel.value = pre; }); }
    buildSlots();

    booking.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!booking.checkValidity()) { booking.reportValidity(); return; }
      var ok = $("#booking-success");
      $("#ok-text").textContent = sum.t.textContent + " am " + sum.d.textContent + " um " + sum.z.textContent + ".";
      booking.hidden = true;
      ok.classList.add("is-shown");
      ok.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- Kontaktformular (Demo) ---------- */
  var contact = $("#contact-form");
  if (contact) {
    contact.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contact.checkValidity()) { contact.reportValidity(); return; }
      contact.hidden = true;
      $("#contact-success").classList.add("is-shown");
    });
  }

  /* ---------- Jahr im Footer ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

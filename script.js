/* Independent Expert — progressive enhancement only.
   Everything degrades gracefully: without JS, nav is open, FAQ panels
   are visible, "show more" content is shown, carousel scrolls natively. */
(function () {
  "use strict";

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.getElementById("primary-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.getAttribute("data-open") === "true";
      mainNav.setAttribute("data-open", String(!open));
      navToggle.setAttribute("aria-expanded", String(!open));
    });
  }

  /* ---------- FAQ accordion ---------- */
  var triggers = document.querySelectorAll(".faq-trigger");
  Array.prototype.forEach.call(triggers, function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    // collapse by default once JS is active
    btn.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });

  /* ---------- Show more ---------- */
  var moreBtns = document.querySelectorAll(".show-more-btn");
  Array.prototype.forEach.call(moreBtns, function (btn) {
    var target = document.getElementById(btn.getAttribute("aria-controls"));
    if (!target) return;
    target.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    var labelMore = btn.getAttribute("data-label-more") || "Show more";
    var labelLess = btn.getAttribute("data-label-less") || "Show less";
    btn.textContent = labelMore;
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      target.hidden = expanded;
      btn.textContent = expanded ? labelMore : labelLess;
    });
  });

  /* ---------- Open/closed status (Calgary time, America/Edmonton, DST-aware) ---------- */
  function calgaryNow() {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23"
    }).formatToParts(new Date());
    var day = "", hh = 0, mm = 0;
    parts.forEach(function (p) {
      if (p.type === "weekday") day = p.value;
      if (p.type === "hour") hh = parseInt(p.value, 10) % 24;
      if (p.type === "minute") mm = parseInt(p.value, 10);
    });
    var mins = hh * 60 + mm;
    var isOpen = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(day) !== -1 && mins >= 8 * 60 + 30 && mins < 17 * 60;
    return { day: day, isOpen: isOpen };
  }

  var openEl = document.querySelector(".ybiz-open .open");
  var hoursRows = document.querySelectorAll(".hours-table tr[data-day]");
  if ((openEl || hoursRows.length) && window.Intl && Intl.DateTimeFormat) {
    try {
      var now = calgaryNow();
      if (openEl) {
        if (now.isOpen) {
          openEl.textContent = "Open now";
        } else if (now.day === "Sat") {
          openEl.textContent = "By appointment";
          openEl.className = "open open--appt";
        } else {
          openEl.textContent = "Closed";
          openEl.className = "open open--closed";
        }
      }
      Array.prototype.forEach.call(hoursRows, function (row) {
        if (row.getAttribute("data-day") !== now.day) return;
        row.className = "is-today";
        var status = row.querySelector(".hours-status");
        if (!status) return;
        if (now.isOpen) {
          status.textContent = "Open now";
          status.className = "hours-status is-open";
        } else if (now.day !== "Sat") {
          status.textContent = "Closed now";
          status.className = "hours-status is-closed";
        }
      });
    } catch (e) { /* keep static fallback text */ }
  }
  /* ---------- Photos & media: wheel scroll + lightbox ---------- */
  var galleryTracks = document.querySelectorAll(".ybiz-gallery-track");
  Array.prototype.forEach.call(galleryTracks, function (track) {
    var imgs = Array.prototype.slice.call(track.querySelectorAll("img"));
    if (!imgs.length) return;

    // Mouse wheel scrolls the strip sideways while the pointer is over it.
    // At either end the wheel falls through so the page can keep scrolling.
    track.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;
      var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      var max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      var atStart = track.scrollLeft <= 0 && delta < 0;
      var atEnd = track.scrollLeft >= max - 1 && delta > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      track.scrollLeft += delta;
    }, { passive: false });

    // Lightbox
    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Photo viewer");
    dialog.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&#8249;</button>' +
      '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-count" aria-live="polite"></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(dialog);
    var lbImg = dialog.querySelector(".lb-img");
    var lbCount = dialog.querySelector(".lb-count");
    var current = 0, opener = null;

    function show(i) {
      current = (i + imgs.length) % imgs.length;
      var src = imgs[current];
      lbImg.src = src.currentSrc || src.src;
      lbImg.alt = src.alt;
      lbCount.textContent = (current + 1) + " / " + imgs.length;
      var item = imgs[current].parentNode;
      if (item && item.scrollIntoView) {
        track.scrollLeft = Math.max(0, item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2);
      }
    }

    imgs.forEach(function (img, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gal-item";
      btn.setAttribute("aria-label", "Open photo " + (i + 1) + " of " + imgs.length + " larger");
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener("click", function () {
        opener = btn;
        show(i);
        if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
      });
    });

    dialog.querySelector(".lb-close").addEventListener("click", function () { dialog.close(); });
    dialog.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    dialog.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
    });
    dialog.addEventListener("close", function () { if (opener) opener.focus(); });
  });
  /* ---------- Reviews carousel ---------- */
  var carousels = document.querySelectorAll(".reviews");
  Array.prototype.forEach.call(carousels, function (carousel) {
    var track = carousel.querySelector(".review-track");
    var prev = carousel.querySelector("[data-dir='prev']");
    var next = carousel.querySelector("[data-dir='next']");
    if (!track || !prev || !next) return;
    function step() {
      var card = track.querySelector(".review-card");
      return card ? card.getBoundingClientRect().width + 16 : 300;
    }
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: step(), behavior: "smooth" });
    });
  });
})();

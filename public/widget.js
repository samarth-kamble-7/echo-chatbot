(function () {
  var scriptEl =
    document.currentScript ||
    document.querySelector("script[data-org][src*='widget.js']");
  if (!scriptEl) return;

  var orgId = scriptEl.getAttribute("data-org");
  if (!orgId) return;

  var baseUrl = new URL(scriptEl.src).origin;

  function getLauncherSvg(iconType) {
    if (iconType === "bot") {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
    }
    if (iconType === "headphones") {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>';
    }
    if (iconType === "help") {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  function createWidget(config) {
    var host = document.createElement("div");
    host.id = "echo-support-widget-root";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    var isDark = config.theme !== "light";
    var isLeft = config.position === "bottom-left";
    var isPill = config.launcherStyle === "pill";
    var primary = config.primaryColor || "#10b981";

    var bg = isDark ? "#09090b" : "#ffffff";
    var bgSurface = isDark ? "#0c0c10" : "#f4f4f5";
    var border = isDark ? "#27272a" : "#e4e4e7";
    var textPrimary = isDark ? "#f4f4f5" : "#09090b";
    var textMuted = isDark ? "#a1a1aa" : "#71717a";

    var btnCss = isPill
      ? "height:44px;padding:0 16px;border-radius:9999px;gap:8px;font-size:13px;font-weight:600;"
      : "width:48px;height:48px;border-radius:10px;";

    var style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}" +
      ".echo-btn{position:fixed;bottom:20px;" +
      (isLeft ? "left:20px;" : "right:20px;") +
      "z-index:2147483000;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;background:" +
      primary +
      ";color:#09090b;box-shadow:0 8px 24px rgba(0,0,0,0.28);" +
      btnCss +
      "}" +
      ".echo-win{position:fixed;bottom:78px;" +
      (isLeft ? "left:20px;" : "right:20px;") +
      "z-index:2147483000;width:360px;max-width:calc(100vw - 32px);height:500px;max-height:calc(100vh - 104px);border-radius:12px;border:1px solid " +
      border +
      ";background:" +
      bg +
      ";color:" +
      textPrimary +
      ";display:none;flex-direction:column;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.35);}" +
      ".echo-win.open{display:flex;}" +
      ".echo-hdr{padding:12px 14px;background:" +
      bgSurface +
      ";border-bottom:1px solid " +
      border +
      ";display:flex;align-items:center;justify-content:space-between;}" +
      ".echo-hdr-l{display:flex;align-items:center;gap:10px;}" +
      ".echo-badge{width:28px;height:28px;border-radius:6px;background:" +
      primary +
      ";color:#09090b;display:flex;align-items:center;justify-content:center;}" +
      ".echo-title{font-size:13px;font-weight:600;}" +
      ".echo-sub{font-size:11px;color:" +
      textMuted +
      ";}" +
      ".echo-close{background:none;border:none;color:" +
      textMuted +
      ";cursor:pointer;font-size:18px;line-height:1;padding:4px;}" +
      ".echo-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}" +
      ".echo-msg{max-width:82%;padding:9px 12px;border-radius:8px;font-size:12.5px;line-height:1.45;white-space:pre-wrap;}" +
      ".echo-bot{align-self:flex-start;background:" +
      bgSurface +
      ";border:1px solid " +
      border +
      ";color:" +
      textPrimary +
      ";}" +
      ".echo-usr{align-self:flex-end;background:" +
      primary +
      ";color:#09090b;font-weight:500;}" +
      ".echo-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;}" +
      ".echo-chip{background:" +
      bgSurface +
      ";border:1px solid " +
      border +
      ";color:" +
      textPrimary +
      ";font-size:11.5px;padding:5px 9px;border-radius:6px;cursor:pointer;}" +
      ".echo-form{padding:10px;border-top:1px solid " +
      border +
      ";background:" +
      bgSurface +
      ";display:flex;gap:8px;}" +
      ".echo-inp{flex:1;height:34px;padding:0 10px;border-radius:6px;border:1px solid " +
      border +
      ";background:" +
      bg +
      ";color:" +
      textPrimary +
      ";font-size:12.5px;outline:none;}" +
      ".echo-send{height:34px;padding:0 12px;border-radius:6px;border:none;background:" +
      primary +
      ";color:#09090b;font-size:12px;font-weight:600;cursor:pointer;}";

    shadow.appendChild(style);

    var iconSvg = getLauncherSvg(config.launcherIcon || "message");

    var win = document.createElement("div");
    win.className = "echo-win";
    win.innerHTML =
      '<div class="echo-hdr">' +
      '<div class="echo-hdr-l">' +
      '<div class="echo-badge">' +
      iconSvg +
      "</div>" +
      '<div><div class="echo-title">' +
      escapeHtml(config.botName || "Echo Support") +
      '</div><div class="echo-sub">' +
      escapeHtml(config.subtitle || "Online") +
      "</div></div></div>" +
      '<button class="echo-close" type="button" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="echo-msgs"></div>' +
      '<div class="echo-chips"></div>' +
      '<form class="echo-form">' +
      '<input class="echo-inp" type="text" placeholder="' +
      escapeHtml(config.inputPlaceholder || "Ask a question...") +
      '" />' +
      '<button class="echo-send" type="submit">Send</button>' +
      "</form>";

    var btn = document.createElement("button");
    btn.className = "echo-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Open support chat");
    btn.innerHTML = isPill
      ? iconSvg +
        "<span>" +
        escapeHtml(config.launcherText || "Chat with us") +
        "</span>"
      : iconSvg;

    shadow.appendChild(win);
    shadow.appendChild(btn);

    var msgsEl = win.querySelector(".echo-msgs");
    var chipsEl = win.querySelector(".echo-chips");
    var formEl = win.querySelector(".echo-form");
    var inpEl = win.querySelector(".echo-inp");
    var closeBtn = win.querySelector(".echo-close");

    function appendMsg(role, text) {
      var div = document.createElement("div");
      div.className = "echo-msg " + (role === "user" ? "echo-usr" : "echo-bot");
      div.textContent = text;
      msgsEl.appendChild(div);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return div;
    }

    appendMsg(
      "bot",
      config.welcomeMessage || "Hi! Ask me anything about our documentation."
    );

    if (Array.isArray(config.suggestedQuestions)) {
      config.suggestedQuestions.forEach(function (q) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "echo-chip";
        chip.textContent = q;
        chip.addEventListener("click", function () {
          chipsEl.style.display = "none";
          sendQuestion(q);
        });
        chipsEl.appendChild(chip);
      });
    }

    function sendQuestion(text) {
      var trimmed = (text || "").trim();
      if (!trimmed) return;
      appendMsg("user", trimmed);
      var typing = appendMsg("bot", "Typing...");

      fetch(baseUrl + "/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: orgId, question: trimmed }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          typing.textContent =
            data.answer || data.error || "Unable to respond right now.";
        })
        .catch(function () {
          typing.textContent = "Sorry, something went wrong.";
        });
    }

    btn.addEventListener("click", function () {
      win.classList.toggle("open");
    });

    closeBtn.addEventListener("click", function () {
      win.classList.remove("open");
    });

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = inpEl.value;
      inpEl.value = "";
      if (chipsEl) chipsEl.style.display = "none";
      sendQuestion(val);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  fetch(baseUrl + "/api/widget/config?org=" + encodeURIComponent(orgId))
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      createWidget((data && data.config) || {});
    })
    .catch(function () {
      createWidget({});
    });
})();

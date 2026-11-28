(function () {
  var scriptEl =
    document.currentScript ||
    document.querySelector("script[data-org-id][src*='widget.js']") ||
    document.querySelector("script[data-org][src*='widget.js']");
  if (!scriptEl) return;

  var orgId =
    scriptEl.getAttribute("data-org-id") || scriptEl.getAttribute("data-org");
  if (!orgId) return;

  var baseUrl = new URL(scriptEl.src).origin;
  var storageKey = "echo_widget_session_" + orgId;

  function getStoredSession() {
    try {
      var raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.sessionToken || !parsed.expiresAt) return null;
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function saveStoredSession(session) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }

  function clearStoredSession() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

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
      "z-index:2147483000;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 104px);border-radius:12px;border:1px solid " +
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
      ";display:flex;align-items:center;justify-content:space-between;gap:8px;}" +
      ".echo-hdr-l{display:flex;align-items:center;gap:8px;min-width:0;}" +
      ".echo-hdr-r{display:flex;align-items:center;gap:6px;}" +
      ".echo-badge{width:28px;height:28px;border-radius:6px;background:" +
      primary +
      ";color:#09090b;display:flex;align-items:center;justify-content:center;shrink:0;}" +
      ".echo-title{font-size:13px;font-weight:600;}" +
      ".echo-sub{font-size:11px;color:" +
      textMuted +
      ";}" +
      ".echo-icon-btn{background:none;border:none;color:" +
      textMuted +
      ";cursor:pointer;font-size:16px;line-height:1;padding:4px 6px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;}" +
      ".echo-icon-btn:hover{color:" +
      textPrimary +
      ";background:" +
      border +
      ";}" +
      ".echo-new-btn{background:transparent;border:1px solid " +
      border +
      ";color:" +
      textPrimary +
      ";cursor:pointer;font-size:11px;font-weight:500;padding:4px 8px;border-radius:6px;display:none;align-items:center;gap:4px;}" +
      ".echo-new-btn:hover{background:" +
      border +
      ";}" +
      ".echo-back-btn{display:none;}" +
      ".echo-loader{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:" +
      textMuted +
      ";font-size:12px;}" +
      ".echo-spin{width:20px;height:20px;border:2px solid " +
      border +
      ";border-top-color:" +
      primary +
      ";border-radius:50%;animation:echoSpin 0.7s linear infinite;}" +
      "@keyframes echoSpin{to{transform:rotate(360deg);}}" +
      ".echo-prechat{flex:1;padding:20px 18px;display:none;flex-direction:column;justify-content:center;gap:14px;}" +
      ".echo-prechat-h{font-size:14px;font-weight:600;margin:0;}" +
      ".echo-prechat-p{font-size:12px;color:" +
      textMuted +
      ";margin:0;line-height:1.45;}" +
      ".echo-field{display:flex;flex-direction:column;gap:5px;}" +
      ".echo-lbl{font-size:11.5px;font-weight:500;color:" +
      textMuted +
      ";}" +
      ".echo-err{font-size:11.5px;color:#f87171;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);padding:7px 10px;border-radius:6px;display:none;}" +
      ".echo-home{flex:1;display:none;flex-direction:column;overflow-y:auto;}" +
      ".echo-home-hero{padding:22px 18px;background:" +
      primary +
      ";color:#09090b;}" +
      ".echo-home-hi{font-size:18px;font-weight:700;margin:0 0 4px 0;}" +
      ".echo-home-sub{font-size:12.5px;opacity:0.85;margin:0;}" +
      ".echo-home-list{padding:16px;display:flex;flex-direction:column;gap:10px;}" +
      ".echo-history{flex:1;display:none;flex-direction:column;overflow-y:auto;padding:14px;gap:8px;}" +
      ".echo-history-h{font-size:12px;font-weight:600;color:" +
      textMuted +
      ";margin:0 0 4px 0;}" +
      ".echo-card{width:100%;padding:12px 14px;border-radius:8px;border:1px solid " +
      border +
      ";background:" +
      bgSurface +
      ";color:" +
      textPrimary +
      ";cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;text-decoration:none;}" +
      ".echo-card:hover{border-color:" +
      primary +
      ";}" +
      ".echo-card-l{display:flex;align-items:center;gap:10px;min-width:0;flex:1;}" +
      ".echo-card-l>div{min-width:0;flex:1;}" +
      ".echo-card-t{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
      ".echo-card-s{font-size:11.5px;color:" +
      textMuted +
      ";margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
      ".echo-status{font-size:10.5px;padding:2px 6px;border-radius:4px;border:1px solid " +
      border +
      ";color:" +
      textMuted +
      ";text-transform:capitalize;shrink:0;}" +
      ".echo-bnav{display:none;grid-template-columns:1fr 1fr;border-top:1px solid " +
      border +
      ";background:" +
      bgSurface +
      ";height:46px;shrink:0;}" +
      ".echo-bnav.active{display:grid;}" +
      ".echo-btab{background:none;border:none;color:" +
      textMuted +
      ";cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.15s;}" +
      ".echo-btab.active{color:" +
      primary +
      ";}" +
      ".echo-chat-body{flex:1;display:none;flex-direction:column;min-height:0;}" +
      ".echo-chat-body.active{display:flex;}" +
      ".echo-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}" +
      ".echo-msg{max-width:82%;padding:9px 12px;border-radius:8px;font-size:12.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word;}" +
      ".echo-msg strong{font-weight:700;}" +
      ".echo-msg code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;padding:1px 4px;border-radius:4px;background:rgba(255,255,255,0.1);}" +
      ".echo-usr code{background:rgba(0,0,0,0.14);}" +
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
      ".echo-typing{display:inline-flex;align-items:center;gap:4px;padding:11px 14px;min-height:34px;}" +
      ".echo-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:0.4;animation:echoDot 1.2s infinite ease-in-out;}" +
      ".echo-dot:nth-child(2){animation-delay:0.18s;}" +
      ".echo-dot:nth-child(3){animation-delay:0.36s;}" +
      "@keyframes echoDot{0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-4px);opacity:1;}}" +
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
      ".echo-banner{padding:8px 12px;font-size:11.5px;border-top:1px solid " +
      border +
      ";background:" +
      bgSurface +
      ";color:" +
      textMuted +
      ";display:none;align-items:center;justify-content:space-between;gap:8px;}" +
      ".echo-banner.resolved{display:flex;color:#34d399;}" +
      ".echo-inp{width:100%;height:36px;padding:0 10px;border-radius:6px;border:1px solid " +
      border +
      ";background:" +
      bgSurface +
      ";color:" +
      textPrimary +
      ";font-size:12.5px;outline:none;}" +
      ".echo-chat-inp{flex:1;height:34px;padding:0 10px;border-radius:6px;border:1px solid " +
      border +
      ";background:" +
      bg +
      ";color:" +
      textPrimary +
      ";font-size:12.5px;outline:none;}" +
      ".echo-chat-inp:disabled{opacity:0.5;cursor:not-allowed;}" +
      ".echo-send:disabled{opacity:0.5;cursor:not-allowed;}" +
      ".echo-send,.echo-continue{height:36px;padding:0 14px;border-radius:6px;border:none;background:" +
      primary +
      ";color:#09090b;font-size:12.5px;font-weight:600;cursor:pointer;}" +
      ".echo-continue:disabled{opacity:0.6;cursor:not-allowed;}";

    shadow.appendChild(style);

    var iconSvg = getLauncherSvg(config.launcherIcon || "message");
    var homeSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    var inboxSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';

    var win = document.createElement("div");
    win.className = "echo-win";
    win.innerHTML =
      '<div class="echo-hdr">' +
      '<div class="echo-hdr-l">' +
      '<button class="echo-icon-btn echo-back-btn" type="button" aria-label="Back to home">&larr;</button>' +
      '<div class="echo-badge">' +
      iconSvg +
      "</div>" +
      '<div><div class="echo-title">' +
      escapeHtml(config.botName || "Echo Support") +
      '</div><div class="echo-sub">' +
      escapeHtml(config.subtitle || "Online") +
      "</div></div></div>" +
      '<div class="echo-hdr-r">' +
      '<button class="echo-new-btn" type="button">+ New chat</button>' +
      '<button class="echo-icon-btn echo-close" type="button" aria-label="Close">&times;</button>' +
      "</div>" +
      "</div>" +
      '<div class="echo-loader"><div class="echo-spin"></div><span>Loading conversation...</span></div>' +
      '<div class="echo-prechat">' +
      '<div><p class="echo-prechat-h">Start a conversation</p>' +
      '<p class="echo-prechat-p">Enter your name and email to begin chatting.</p></div>' +
      '<div class="echo-err"></div>' +
      '<div class="echo-field"><label class="echo-lbl">Name</label>' +
      '<input class="echo-inp echo-name-inp" type="text" required placeholder="Your name" /></div>' +
      '<div class="echo-field"><label class="echo-lbl">Email</label>' +
      '<input class="echo-inp echo-email-inp" type="email" required placeholder="you@example.com" /></div>' +
      '<button class="echo-continue" type="button">Continue</button>' +
      "</div>" +
      '<div class="echo-home">' +
      '<div class="echo-home-hero">' +
      '<p class="echo-home-hi">Hi there!</p>' +
      '<p class="echo-home-sub">How can we help you today?</p>' +
      "</div>" +
      '<div class="echo-home-list"></div>' +
      "</div>" +
      '<div class="echo-history"></div>' +
      '<div class="echo-chat-body">' +
      '<div class="echo-msgs"></div>' +
      '<div class="echo-chips"></div>' +
      '<div class="echo-banner"></div>' +
      '<form class="echo-form">' +
      '<input class="echo-chat-inp" type="text" placeholder="' +
      escapeHtml(config.inputPlaceholder || "Ask a question...") +
      '" />' +
      '<button class="echo-send" type="submit">Send</button>' +
      "</form>" +
      "</div>" +
      '<div class="echo-bnav">' +
      '<button class="echo-btab echo-tab-home" type="button" aria-label="Home">' +
      homeSvg +
      "</button>" +
      '<button class="echo-btab echo-tab-history" type="button" aria-label="Conversation history">' +
      inboxSvg +
      "</button>" +
      "</div>";

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

    var backBtn = win.querySelector(".echo-back-btn");
    var newChatBtn = win.querySelector(".echo-new-btn");
    var closeBtn = win.querySelector(".echo-close");

    var loaderEl = win.querySelector(".echo-loader");
    var prechatForm = win.querySelector(".echo-prechat");
    var prechatErr = win.querySelector(".echo-err");
    var nameInp = win.querySelector(".echo-name-inp");
    var emailInp = win.querySelector(".echo-email-inp");
    var continueBtn = win.querySelector(".echo-continue");

    var homeEl = win.querySelector(".echo-home");
    var homeHiEl = win.querySelector(".echo-home-hi");
    var homeListEl = win.querySelector(".echo-home-list");

    var historyEl = win.querySelector(".echo-history");
    var bnavEl = win.querySelector(".echo-bnav");
    var tabHomeBtn = win.querySelector(".echo-tab-home");
    var tabHistoryBtn = win.querySelector(".echo-tab-history");

    var chatBody = win.querySelector(".echo-chat-body");
    var msgsEl = win.querySelector(".echo-msgs");
    var chipsEl = win.querySelector(".echo-chips");
    var bannerEl = win.querySelector(".echo-banner");
    var formEl = win.querySelector(".echo-form");
    var inpEl = win.querySelector(".echo-chat-inp");
    var sendBtn = win.querySelector(".echo-send");

    var activeSession = null;
    var activeStatus = "unresolved";
    var cachedHistory = [];
    var conversationsList = [];
    var isVerifyingSession = false;
    var sessionVerified = false;
    var eventSource = null;

    function showLoader() {
      loaderEl.style.display = "flex";
      prechatForm.style.display = "none";
      homeEl.style.display = "none";
      historyEl.style.display = "none";
      bnavEl.classList.remove("active");
      chatBody.classList.remove("active");
      backBtn.style.display = "none";
      newChatBtn.style.display = "none";
    }

    function showPrechat(message) {
      activeSession = null;
      cachedHistory = [];
      conversationsList = [];
      clearStoredSession();
      loaderEl.style.display = "none";
      homeEl.style.display = "none";
      historyEl.style.display = "none";
      bnavEl.classList.remove("active");
      prechatForm.style.display = "flex";
      chatBody.classList.remove("active");
      backBtn.style.display = "none";
      newChatBtn.style.display = "none";
      if (message) {
        prechatErr.textContent = message;
        prechatErr.style.display = "block";
      } else {
        prechatErr.style.display = "none";
      }
    }

    function showHome() {
      loaderEl.style.display = "none";
      prechatForm.style.display = "none";
      historyEl.style.display = "none";
      chatBody.classList.remove("active");
      backBtn.style.display = "none";
      newChatBtn.style.display = "none";
      homeEl.style.display = "flex";
      bnavEl.classList.add("active");
      tabHomeBtn.classList.add("active");
      tabHistoryBtn.classList.remove("active");

      var firstName =
        activeSession && activeSession.visitorName
          ? activeSession.visitorName.split(" ")[0]
          : "";
      homeHiEl.textContent = firstName ? "Hi " + firstName + "!" : "Hi there!";

      homeListEl.innerHTML = "";

      var newCard = document.createElement("button");
      newCard.type = "button";
      newCard.className = "echo-card";
      newCard.innerHTML =
        '<div class="echo-card-l">' +
        getLauncherSvg("message") +
        '<div><div class="echo-card-t">' +
        (cachedHistory.length > 0 ? "Start a new chat" : "Start chat") +
        '</div><div class="echo-card-s">Ask our support assistant</div></div></div><span>&rsaquo;</span>';
      newCard.addEventListener("click", function () {
        if (cachedHistory.length > 0) {
          startFreshChatSession();
        } else {
          showChat([]);
        }
      });
      homeListEl.appendChild(newCard);

      if (config.supportEmail) {
        var mailCard = document.createElement("a");
        mailCard.className = "echo-card";
        mailCard.href = "mailto:" + config.supportEmail;
        mailCard.innerHTML =
          '<div class="echo-card-l">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' +
          '<div><div class="echo-card-t">Email support</div>' +
          '<div class="echo-card-s">' +
          escapeHtml(config.supportEmail) +
          "</div></div></div><span>&rsaquo;</span>";
        homeListEl.appendChild(mailCard);
      }
    }

    function showHistory() {
      loaderEl.style.display = "none";
      prechatForm.style.display = "none";
      homeEl.style.display = "none";
      chatBody.classList.remove("active");
      backBtn.style.display = "none";
      newChatBtn.style.display = "inline-flex";
      historyEl.style.display = "flex";
      bnavEl.classList.add("active");
      tabHomeBtn.classList.remove("active");
      tabHistoryBtn.classList.add("active");

      historyEl.innerHTML =
        '<p class="echo-history-h">Conversation history</p>';

      if (!conversationsList || conversationsList.length === 0) {
        var empty = document.createElement("div");
        empty.style.cssText =
          "padding:28px 12px;text-align:center;font-size:12px;color:" +
          textMuted;
        empty.textContent = "No conversations yet.";
        historyEl.appendChild(empty);
        return;
      }

      conversationsList.forEach(function (conv) {
        var previewText = (conv.lastMessage || "New conversation")
          .replace(/\s+/g, " ")
          .trim();
        var item = document.createElement("button");
        item.type = "button";
        item.className = "echo-card";
        item.innerHTML =
          '<div class="echo-card-l">' +
          getLauncherSvg("message") +
          '<div><div class="echo-card-t">' +
          escapeHtml(previewText) +
          '</div><div class="echo-card-s">' +
          escapeHtml(formatShortTime(conv.lastActiveAt)) +
          "</div></div></div>" +
          '<span class="echo-status">' +
          escapeHtml(conv.status || "unresolved") +
          "</span>";
        item.addEventListener("click", function () {
          activeSession = {
            sessionToken: conv.sessionToken,
            visitorName: activeSession.visitorName,
            visitorEmail: activeSession.visitorEmail,
            expiresAt: conv.expiresAt,
          };
          cachedHistory = Array.isArray(conv.messages) ? conv.messages : [];
          saveStoredSession(activeSession);
          showChat(cachedHistory, conv.status || "unresolved");
        });
        historyEl.appendChild(item);
      });
    }

    function formatShortTime(dateStr) {
      try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "";
      }
    }

    var operatorTypingEl = null;

    function setOperatorTyping(isTyping) {
      if (isTyping && activeStatus !== "resolved") {
        if (!operatorTypingEl || !operatorTypingEl.parentNode) {
          operatorTypingEl = appendTyping();
        }
      } else if (operatorTypingEl) {
        if (operatorTypingEl.parentNode) {
          operatorTypingEl.parentNode.removeChild(operatorTypingEl);
        }
        operatorTypingEl = null;
      }
    }

    function stopPolling() {
      setOperatorTyping(false);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    }

    function startPollingIfNeeded() {
      stopPolling();
      if (
        !activeSession ||
        !win.classList.contains("open") ||
        !chatBody.classList.contains("active") ||
        activeStatus === "resolved" ||
        typeof EventSource === "undefined"
      ) {
        return;
      }
      var streamUrl =
        baseUrl +
        "/api/widget/stream?org=" +
        encodeURIComponent(orgId) +
        "&token=" +
        encodeURIComponent(activeSession.sessionToken);
      eventSource = new EventSource(streamUrl);
      eventSource.onmessage = function (ev) {
        try {
          var data = JSON.parse(ev.data);
          if (!data) return;
          var newStatus = data.status || "unresolved";
          var serverMsgs = Array.isArray(data.messages) ? data.messages : [];
          if (
            serverMsgs.length !== cachedHistory.length ||
            newStatus !== activeStatus
          ) {
            cachedHistory = serverMsgs;
            operatorTypingEl = null;
            var cur = conversationsList.find(function (c) {
              return activeSession && c.sessionToken === activeSession.sessionToken;
            });
            if (cur) {
              var lastServerMsg = serverMsgs[serverMsgs.length - 1];
              cur.status = newStatus;
              cur.messageCount = serverMsgs.length;
              if (lastServerMsg) {
                cur.lastMessage = lastServerMsg.content;
                cur.lastActiveAt = lastServerMsg.createdAt || cur.lastActiveAt;
              }
              cur.messages = serverMsgs.slice();
            }
            showChat(cachedHistory, newStatus);
          }
          setOperatorTyping(Boolean(data.operatorTyping));
        } catch {
          // ignore parse error
        }
      };
    }

    function applyChatStatus(status) {
      activeStatus = status || "unresolved";
      bannerEl.className = "echo-banner";
      bannerEl.textContent = "";

      if (activeStatus === "resolved") {
        bannerEl.className = "echo-banner resolved";
        bannerEl.textContent =
          "This conversation is resolved. Start a new chat if you need more help.";
        inpEl.disabled = true;
        sendBtn.disabled = true;
        chipsEl.style.display = "none";
      } else {
        inpEl.disabled = false;
        sendBtn.disabled = false;
        inpEl.placeholder = config.inputPlaceholder || "Ask a question...";
      }
    }

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatMessageHtml(text) {
      var escaped = escapeHtml(text);
      var lines = escaped.split(/\r?\n/);
      var formatted = lines.map(function (line) {
        var bulletMatch = line.match(/^\s*[\*\-]\s+(.*)$/);
        var content = bulletMatch ? "• " + bulletMatch[1] : line;
        content = content.replace(/`([^`]+)`/g, "<code>$1</code>");
        content = content.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
        return content;
      });
      return formatted.join("<br>");
    }

    function appendMsg(role, text) {
      var div = document.createElement("div");
      div.className = "echo-msg " + (role === "user" ? "echo-usr" : "echo-bot");
      if (role === "user") {
        div.textContent = text;
      } else {
        div.innerHTML = formatMessageHtml(text);
      }
      msgsEl.appendChild(div);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return div;
    }

    function appendTyping() {
      var div = document.createElement("div");
      div.className = "echo-msg echo-bot echo-typing";
      div.setAttribute("aria-label", "Typing");
      for (var i = 0; i < 3; i++) {
        var dot = document.createElement("span");
        dot.className = "echo-dot";
        div.appendChild(dot);
      }
      msgsEl.appendChild(div);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return div;
    }

    function showChat(history, status) {
      loaderEl.style.display = "none";
      prechatForm.style.display = "none";
      homeEl.style.display = "none";
      historyEl.style.display = "none";
      bnavEl.classList.remove("active");
      chatBody.classList.add("active");
      backBtn.style.display = "inline-flex";
      newChatBtn.style.display = "inline-flex";
      msgsEl.innerHTML = "";

      appendMsg(
        "bot",
        config.welcomeMessage || "Hi! Ask me anything about our documentation."
      );

      if (Array.isArray(history) && history.length > 0) {
        chipsEl.style.display = "none";
        history.forEach(function (m) {
          appendMsg(
            m.role === "user"
              ? "user"
              : m.role === "operator"
              ? "operator"
              : "bot",
            m.content
          );
        });
      } else if (
        status !== "resolved" &&
        Array.isArray(config.suggestedQuestions) &&
        config.suggestedQuestions.length > 0
      ) {
        chipsEl.innerHTML = "";
        chipsEl.style.display = "flex";
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

      applyChatStatus(status || "unresolved");
      startPollingIfNeeded();
      msgsEl.scrollTop = msgsEl.scrollHeight;
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () {
          msgsEl.scrollTop = msgsEl.scrollHeight;
        });
      }
    }

    function collectVisitorMetadata() {
      var tz = "";
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        tz = "";
      }
      return {
        userAgent: navigator.userAgent || "",
        language: navigator.language || "",
        platform: navigator.platform || "",
        screenResolution:
          window.screen && window.screen.width
            ? window.screen.width + "x" + window.screen.height
            : "",
        viewportSize: window.innerWidth + "x" + window.innerHeight,
        timezone: tz,
        referrer: document.referrer || "",
        currentUrl: window.location.href || "",
      };
    }

    function startFreshChatSession() {
      if (!activeSession) {
        showPrechat();
        return;
      }
      showLoader();
      fetch(baseUrl + "/api/widget/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: orgId,
          name: activeSession.visitorName,
          email: activeSession.visitorEmail,
          metadata: collectVisitorMetadata(),
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.data || !res.data.sessionToken) {
            showPrechat();
            return;
          }
          activeSession = res.data;
          cachedHistory = [];
          conversationsList.unshift({
            sessionToken: res.data.sessionToken,
            status: "unresolved",
            lastActiveAt: new Date().toISOString(),
            expiresAt: res.data.expiresAt,
            lastMessage: null,
            messages: [],
          });
          saveStoredSession(activeSession);
          showChat([]);
        })
        .catch(function () {
          showHome();
        });
    }

    function initSessionIfAny() {
      if (sessionVerified || isVerifyingSession) return;
      var stored = getStoredSession();
      if (!stored) {
        sessionVerified = true;
        showPrechat();
        return;
      }

      isVerifyingSession = true;
      showLoader();

      fetch(
        baseUrl +
          "/api/widget/session?org=" +
          encodeURIComponent(orgId) +
          "&token=" +
          encodeURIComponent(stored.sessionToken)
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          sessionVerified = true;
          if (data && data.valid) {
            activeSession = {
              sessionToken: stored.sessionToken,
              visitorName: data.visitorName,
              visitorEmail: data.visitorEmail,
              expiresAt: data.expiresAt,
            };
            cachedHistory = Array.isArray(data.messages) ? data.messages : [];
            conversationsList = Array.isArray(data.conversations)
              ? data.conversations
              : [];
            saveStoredSession(activeSession);
            showHome();
          } else {
            showPrechat();
          }
        })
        .catch(function () {
          activeSession = stored;
          cachedHistory = [];
          showHome();
        })
        .finally(function () {
          isVerifyingSession = false;
        });
    }

    // Prefetch session in background as soon as widget loads
    initSessionIfAny();

    function sendQuestion(text) {
      var trimmed = (text || "").trim();
      if (!trimmed || !activeSession || activeStatus === "resolved") return;
      appendMsg("user", trimmed);
      cachedHistory.push({ role: "user", content: trimmed });

      var typing = activeStatus === "escalated" ? null : appendTyping();

      fetch(baseUrl + "/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: orgId,
          question: trimmed,
          sessionToken: activeSession.sessionToken,
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { status: r.status, data: data };
          });
        })
        .then(function (res) {
          if (res.status === 401 || (res.data && res.data.expired)) {
            stopPolling();
            showPrechat(
              (res.data && res.data.error) ||
                "Your 24-hour session expired. Please continue again."
            );
            return;
          }
          if (res.status === 403 || (res.data && res.data.resolved)) {
            if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
            applyChatStatus("resolved");
            stopPolling();
            return;
          }
          if (res.data && res.data.expiresAt) {
            activeSession.expiresAt = res.data.expiresAt;
            saveStoredSession(activeSession);
          }
          if (res.data && res.data.status && res.data.status !== activeStatus) {
            applyChatStatus(res.data.status);
            startPollingIfNeeded();
          }

          var cur = conversationsList.find(function (c) {
            return c.sessionToken === activeSession.sessionToken;
          });

          if (res.data && res.data.aiPaused && res.data.answer === null) {
            if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
            if (cur) {
              cur.status = "escalated";
              cur.lastMessage = trimmed;
              cur.lastActiveAt = new Date().toISOString();
              cur.messages = cachedHistory.slice();
            }
            return;
          }

          var replyText =
            (res.data && (res.data.answer || res.data.error)) ||
            "Unable to respond right now.";
          if (typing) {
            typing.classList.remove("echo-typing");
            typing.innerHTML = formatMessageHtml(replyText);
            msgsEl.scrollTop = msgsEl.scrollHeight;
          } else if (res.data && res.data.answer) {
            appendMsg("bot", replyText);
          }
          if (res.data && res.data.answer) {
            cachedHistory.push({ role: "assistant", content: replyText });
            if (cur) {
              cur.status = (res.data && res.data.status) || cur.status;
              cur.lastMessage = replyText;
              cur.lastActiveAt = new Date().toISOString();
              cur.messages = cachedHistory.slice();
            }
          }
        })
        .catch(function () {
          if (typing) {
            typing.classList.remove("echo-typing");
            typing.textContent = "Sorry, something went wrong.";
            msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        });
    }

    function handleStartSession() {
      prechatErr.style.display = "none";
      var visitorName = nameInp.value.trim();
      var visitorEmail = emailInp.value.trim();
      if (!visitorName || !visitorEmail) {
        prechatErr.textContent = "Please enter both your name and email.";
        prechatErr.style.display = "block";
        return;
      }

      continueBtn.disabled = true;
      continueBtn.textContent = "Starting...";

      fetch(baseUrl + "/api/widget/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: orgId,
          name: visitorName,
          email: visitorEmail,
          metadata: collectVisitorMetadata(),
        }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.data || !res.data.sessionToken) {
            prechatErr.textContent =
              (res.data && res.data.error) || "Unable to start chat session.";
            prechatErr.style.display = "block";
            return;
          }
          activeSession = res.data;
          cachedHistory = [];
          conversationsList = [
            {
              sessionToken: res.data.sessionToken,
              status: "unresolved",
              lastActiveAt: new Date().toISOString(),
              expiresAt: res.data.expiresAt,
              lastMessage: null,
              messages: [],
            },
          ];
          saveStoredSession(activeSession);
          showHome();
        })
        .catch(function () {
          prechatErr.textContent = "Unable to connect. Please try again.";
          prechatErr.style.display = "block";
        })
        .finally(function () {
          continueBtn.disabled = false;
          continueBtn.textContent = "Continue";
        });
    }

    continueBtn.addEventListener("click", handleStartSession);
    emailInp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleStartSession();
      }
    });
    nameInp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        emailInp.focus();
      }
    });

    tabHomeBtn.addEventListener("click", function () {
      showHome();
    });

    tabHistoryBtn.addEventListener("click", function () {
      showHistory();
    });

    backBtn.addEventListener("click", function () {
      stopPolling();
      showHome();
    });

    newChatBtn.addEventListener("click", function () {
      stopPolling();
      startFreshChatSession();
    });

    btn.addEventListener("click", function () {
      var isOpen = win.classList.toggle("open");
      if (isOpen) {
        initSessionIfAny();
        startPollingIfNeeded();
      } else {
        stopPolling();
      }
    });

    closeBtn.addEventListener("click", function () {
      stopPolling();
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

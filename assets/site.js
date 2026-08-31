(() => {
  const routes = [
    { title: "首页：Grok 国内充值", detail: "总路线与核验工具", href: "../index.html", aliases: "国内 充值 会员" },
    { title: "支付宝开通 Grok", detail: "支付宝与无海外卡", href: "../guides/grok-alipay.html", aliases: "支付宝 支付" },
    { title: "没有海外银行卡", detail: "本人账号与成品账号", href: "../guides/grok-no-overseas-card.html", aliases: "海外卡 账号" },
    { title: "充值要求清单", detail: "账号、支付与安全资料", href: "../guides/grok-recharge-requirements.html", aliases: "要求 清单 凭据" },
    { title: "Heavy 价格核对", detail: "1个月、3个月与历史发布价", href: "../guides/supergrok-heavy-price.html", aliases: "价格 300 380 580 900 一个月 三个月" },
    { title: "付款与订单售后", detail: "重复支付、查单与人工处理", href: "../guides/grok-payment-order-support.html", aliases: "订单 查询 售后 失败" }
  ];

  const rootDepth = location.pathname.includes("/guides/") ? "../" : "";
  const normalizeHref = (href) => href.replace("../", rootDepth);
  const trigger = document.querySelector("[data-cmdk-open]");
  const overlay = document.querySelector("[data-cmdk]");
  const input = document.querySelector("[data-cmdk-input]");
  const results = document.querySelector("[data-cmdk-results]");
  const closeButton = document.querySelector("[data-cmdk-close]");
  let active = 0;
  let previousFocus = null;

  const render = (query = "") => {
    const keyword = query.trim().toLowerCase();
    const matched = routes.filter((route) => `${route.title} ${route.detail} ${route.aliases}`.toLowerCase().includes(keyword));
    if (!results) return;
    results.replaceChildren();
    if (!matched.length) {
      const empty = document.createElement("p");
      empty.className = "cmdk__empty";
      empty.textContent = "没有匹配页面。试试“支付宝”“价格”或“订单”。";
      results.append(empty);
      return;
    }
    active = Math.min(active, matched.length - 1);
    matched.forEach((route, index) => {
      const button = document.createElement("button");
      button.className = `cmdk__item${index === active ? " is-active" : ""}`;
      button.type = "button";
      button.dataset.href = normalizeHref(route.href);
      const title = document.createElement("span");
      title.textContent = route.title;
      const detail = document.createElement("span");
      detail.textContent = route.detail;
      button.append(title, detail);
      button.addEventListener("click", () => { location.href = button.dataset.href; });
      results.append(button);
    });
  };

  const open = () => {
    if (!overlay) return;
    previousFocus = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    render(input?.value || "");
    requestAnimationFrame(() => input?.focus());
  };
  const close = () => {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    previousFocus?.focus?.();
  };
  trigger?.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  overlay?.addEventListener("click", (event) => { if (event.target === overlay) close(); });
  input?.addEventListener("input", () => { active = 0; render(input.value); });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); overlay?.classList.contains("is-open") ? close() : open(); return; }
    if (!overlay?.classList.contains("is-open")) return;
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    const items = [...results.querySelectorAll(".cmdk__item")];
    if (!items.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      active = (active + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((item, index) => item.classList.toggle("is-active", index === active));
      items[active].scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") { event.preventDefault(); items[active]?.click(); }
  });

  const form = document.querySelector("[data-preflight]");
  const result = document.querySelector("[data-preflight-result]");
  const outcomes = {
    own: { title: "优先核对本人账号方案", body: "由你在自己的设备上登录。不要提交密码、验证码、恢复码、Cookie、SSO、Session 或 Token。", href: "guides/grok-recharge-requirements.html", label: "查看本人账号要求 →" },
    ready: { title: "先看成品账号的控制权风险", body: "成品账号与 xAI 关于共享凭据、账号使用的条款存在风险；购买前确认初始凭证、找回边界与售后规则。", href: "guides/grok-no-overseas-card.html", label: "比较两种交付 →" },
    card: { title: "先核对官方结账渠道", body: "Web、Apple 与 Google 的结算、续费和退款渠道不同。登录方式和会员购买账号必须保持一致。", href: "guides/grok-recharge-requirements.html", label: "查看完整核对表 →" },
    alipay: { title: "支付宝属于第三方人民币结算", body: "xAI 公共结账页面并不是由 AIXiamo 代为声明支持支付宝。购买前核对第三方身份、价格、账号条件和订单查询。", href: "guides/grok-alipay.html", label: "查看支付宝说明 →" }
  };
  form?.addEventListener("change", () => {
    const selected = new FormData(form).get("route");
    const outcome = outcomes[selected];
    if (!outcome || !result) return;
    result.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = outcome.title;
    const body = document.createElement("p");
    body.textContent = outcome.body;
    const link = document.createElement("a");
    link.className = "result__link";
    link.href = outcome.href;
    link.textContent = outcome.label;
    result.append(title, body, link);
  });
})();

// ============================================================
//  コミケ簡易レジ (register_c108) - アプリロジック
//  完全クライアントサイド / データは localStorage
// ============================================================
(function () {
  "use strict";

  // ---- 定数 ----
  var LS_SALES = "register_c108_sales";
  var LS_CASHIER = "register_c108_cashier";
  var CASHIERS = ["A", "B", "C"];
  var PRODUCTS = window.PRODUCTS || [];

  // ---- 状態 ----
  var cart = {};        // { productId: qty }
  var cashier = "A";    // 現在の担当者
  var received = "";    // 支払い画面の受取金額（文字列で保持）
  var confirmCallback = null;

  // ---- DOM 参照 ----
  var $ = function (id) { return document.getElementById(id); };
  var productGrid, cartItems, cartEmpty, cartTotalEl, checkoutBtn;

  // ============================================================
  //  ユーティリティ
  // ============================================================
  function yen(n) { return "¥" + (n || 0).toLocaleString("ja-JP"); }

  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function firstChar(name) {
    return (name || "?").trim().charAt(0) || "?";
  }
  // 商品IDから安定した色を得る（フォールバックタイル用）
  function colorFor(id) {
    var colors = ["#e57373", "#64b5f6", "#81c784", "#ffb74d", "#ba68c8",
                  "#4db6ac", "#f06292", "#9575cd", "#7986cb", "#4dd0e1"];
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  }

  function loadSales() {
    try {
      var raw = localStorage.getItem(LS_SALES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveSales(sales) {
    localStorage.setItem(LS_SALES, JSON.stringify(sales));
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 1800);
  }

  // ============================================================
  //  カート計算
  // ============================================================
  function cartTotal() {
    var total = 0;
    for (var id in cart) {
      var p = getProduct(id);
      if (p) total += p.price * cart[id];
    }
    return total; // 整数円
  }
  function cartCount() {
    var c = 0;
    for (var id in cart) c += cart[id];
    return c;
  }

  // ============================================================
  //  商品グリッド描画
  // ============================================================
  function renderProducts() {
    productGrid.innerHTML = "";
    if (!PRODUCTS.length) {
      productGrid.innerHTML = '<p class="cart-empty">商品が登録されていません（products.js を編集してください）</p>';
      return;
    }
    PRODUCTS.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "product-card";
      card.dataset.id = p.id;

      // 画像 or フォールバックタイル
      var thumbHtml;
      if (p.image) {
        thumbHtml = '<img class="product-thumb" src="' + escAttr(p.image) +
          '" alt="' + escAttr(p.name) + '">';
      } else {
        thumbHtml = fallbackTile(p);
      }

      var qty = cart[p.id] || 0;
      card.innerHTML =
        thumbHtml +
        '<button class="product-detail-btn" data-detail="' + escAttr(p.id) + '">i</button>' +
        (qty ? '<span class="product-qty-badge">' + qty + '</span>' : '') +
        '<div class="product-info">' +
          '<div class="product-name">' + escHtml(p.name) + '</div>' +
          '<div class="product-price">' + yen(p.price) + '</div>' +
        '</div>';

      // 画像読み込み失敗時は頭文字タイルに差し替える。
      // inline onerror だとタイルHTML内の引用符が属性を壊すため、JSで登録する。
      if (p.image) {
        var thumb = card.querySelector(".product-thumb");
        if (thumb) {
          thumb.onerror = (function (prod) {
            return function () { this.outerHTML = fallbackTile(prod); };
          })(p);
        }
      }

      productGrid.appendChild(card);
    });
  }

  function fallbackTile(p) {
    return '<div class="product-thumb-fallback" style="background:' + colorFor(p.id) + '">' +
      escHtml(firstChar(p.name)) + '</div>';
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escAttr(s) { return escHtml(s); }

  // ============================================================
  //  カート操作
  // ============================================================
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    renderProducts();
    renderCart();
    toast(getProduct(id).name + " を追加");
  }
  function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    renderProducts();
    renderCart();
  }
  function clearCart() {
    cart = {};
    renderProducts();
    renderCart();
  }

  function renderCart() {
    var ids = Object.keys(cart);
    cartItems.innerHTML = "";
    if (!ids.length) {
      cartItems.appendChild(cartEmpty);
      cartEmpty.classList.remove("hidden");
    } else {
      ids.forEach(function (id) {
        var p = getProduct(id);
        if (!p) return;
        var qty = cart[id];
        var row = document.createElement("div");
        row.className = "cart-row";
        row.innerHTML =
          '<div class="cart-row-info">' +
            '<div class="cart-row-name">' + escHtml(p.name) + '</div>' +
            '<div class="cart-row-price">' + yen(p.price) + ' × ' + qty + '</div>' +
          '</div>' +
          '<div class="stepper">' +
            '<button class="step-btn" data-dec="' + escAttr(id) + '">−</button>' +
            '<span class="step-qty">' + qty + '</span>' +
            '<button class="step-btn" data-inc="' + escAttr(id) + '">+</button>' +
          '</div>' +
          '<div class="cart-row-subtotal">' + yen(p.price * qty) + '</div>';
        cartItems.appendChild(row);
      });
    }
    var total = cartTotal();
    cartTotalEl.textContent = yen(total);
    checkoutBtn.disabled = ids.length === 0;
  }

  // ============================================================
  //  担当者
  // ============================================================
  function loadCashier() {
    var c = localStorage.getItem(LS_CASHIER);
    cashier = CASHIERS.indexOf(c) >= 0 ? c : "A";
  }
  function setCashier(c) {
    if (CASHIERS.indexOf(c) < 0) return;
    cashier = c;
    localStorage.setItem(LS_CASHIER, c);
    renderCashier();
  }
  function renderCashier() {
    var btns = document.querySelectorAll(".cashier-btn");
    btns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.cashier === cashier);
    });
  }

  // ============================================================
  //  タブ切替
  // ============================================================
  function switchScreen(name) {
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("hidden", s.id !== "screen-" + name);
    });
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.screen === name);
    });
    if (name === "history") renderHistory();
    window.scrollTo(0, 0);
  }

  // ============================================================
  //  支払いモーダル
  // ============================================================
  function openPayment() {
    if (cartCount() === 0) return;
    received = "";
    updatePayment();
    $("paymentModal").classList.remove("hidden");
  }
  function closePayment() {
    $("paymentModal").classList.add("hidden");
  }
  function updatePayment() {
    var total = cartTotal();
    var rec = parseInt(received || "0", 10);
    var change = rec - total;
    $("payTotal").textContent = yen(total);
    $("payReceived").textContent = yen(rec);
    $("payChange").textContent = yen(change);
    var changeRow = document.querySelector(".change-row");
    changeRow.classList.toggle("negative", change < 0);
    // 受取が合計以上で確定可能
    $("confirmBtn").disabled = !(received !== "" && rec >= total);
  }
  function keypadInput(key) {
    if (key === "del") {
      received = received.slice(0, -1);
    } else {
      // 先頭の余計な0を防ぎつつ追記。桁上限8桁。
      var next = (received + key).replace(/^0+(?=\d)/, "");
      if (next.length <= 8) received = next;
    }
    updatePayment();
  }
  function quickInput(kind) {
    var total = cartTotal();
    if (kind === "exact") {
      received = String(total);
    } else {
      var add = parseInt(kind, 10);
      received = String(parseInt(received || "0", 10) + add);
    }
    updatePayment();
  }

  function confirmSale() {
    var total = cartTotal();
    var rec = parseInt(received || "0", 10);
    if (rec < total) return;
    var change = rec - total;

    var items = Object.keys(cart).map(function (id) {
      var p = getProduct(id);
      var qty = cart[id];
      return { id: id, name: p.name, price: p.price, qty: qty, subtotal: p.price * qty };
    });

    var sale = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      datetime: isoLocal(new Date()),
      cashier: cashier,
      items: items,
      total: total,
      received: rec,
      change: change
    };

    var sales = loadSales();
    sales.push(sale);
    saveSales(sales);

    closePayment();
    clearCart();
    // 担当者は維持（リセットしない）
    toast("会計完了  おつり " + yen(change));
  }

  // ローカルタイムを ISO8601（+09:00 等オフセット付き）で返す
  function isoLocal(d) {
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var off = -d.getTimezoneOffset(); // 分
    var sign = off >= 0 ? "+" : "-";
    var abs = Math.abs(off);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) +
      sign + pad(Math.floor(abs / 60)) + ":" + pad(abs % 60);
  }

  // ============================================================
  //  商品詳細モーダル
  // ============================================================
  function openDetail(id) {
    var p = getProduct(id);
    if (!p) return;
    var img = $("detailImg");
    if (p.image) {
      img.src = p.image;
      img.style.display = "";
      img.onerror = function () { img.style.display = "none"; };
    } else {
      img.style.display = "none";
    }
    $("detailName").textContent = p.name;
    $("detailDesc").textContent = p.desc || "";
    $("detailPrice").textContent = yen(p.price);
    $("detailAddBtn").dataset.id = id;
    $("detailModal").classList.remove("hidden");
  }
  function closeDetail() { $("detailModal").classList.add("hidden"); }

  // ============================================================
  //  履歴 / データ画面
  // ============================================================
  function renderHistory() {
    var sales = loadSales();
    var total = 0, byCashier = { A: 0, B: 0, C: 0 };
    sales.forEach(function (s) {
      total += s.total;
      if (byCashier[s.cashier] === undefined) byCashier[s.cashier] = 0;
      byCashier[s.cashier] += s.total;
    });

    $("statCount").textContent = sales.length;
    $("statTotal").textContent = yen(total);

    var cs = $("cashierStats");
    cs.innerHTML = "";
    CASHIERS.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "cashier-stat";
      el.innerHTML = '<div class="cashier-stat-name">担当 ' + c + '</div>' +
        '<div class="cashier-stat-val">' + yen(byCashier[c] || 0) + '</div>';
      cs.appendChild(el);
    });

    var list = $("historyList");
    list.innerHTML = "";
    if (!sales.length) {
      list.innerHTML = '<p class="cart-empty">まだ会計がありません</p>';
      return;
    }
    // 新しい順
    sales.slice().reverse().forEach(function (s) {
      var itemsText = s.items.map(function (it) {
        return it.name + "×" + it.qty;
      }).join("、");
      var qtyTotal = s.items.reduce(function (a, it) { return a + it.qty; }, 0);
      var el = document.createElement("div");
      el.className = "history-item";
      el.innerHTML =
        '<div class="history-top">' +
          '<span class="history-time">' + fmtTime(s.datetime) + '</span>' +
          '<span class="history-cashier">' + escHtml(s.cashier) + '</span>' +
          '<span class="history-amount">' + yen(s.total) + '</span>' +
        '</div>' +
        '<div class="history-detail">' +
          escHtml(itemsText) + '（' + qtyTotal + '点） / ' +
          'お預かり ' + yen(s.received) + ' / おつり ' + yen(s.change) +
        '</div>';
      list.appendChild(el);
    });
  }

  function fmtTime(iso) {
    // "2026-08-16T10:30:00+09:00" -> "08/16 10:30"
    var m = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
    if (!m) return iso || "";
    return m[2] + "/" + m[3] + " " + m[4] + ":" + m[5];
  }

  // ============================================================
  //  CSV 出力
  // ============================================================
  function csvField(v) {
    var s = String(v == null ? "" : v);
    if (/[",\r\n]/.test(s)) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  function downloadCSV() {
    var sales = loadSales();
    if (!sales.length) { toast("会計データがありません"); return; }

    var header = ["transaction_id", "datetime", "cashier", "product_id",
      "product_name", "unit_price", "quantity", "line_subtotal",
      "transaction_total", "received", "change"];
    var rows = [header.join(",")];

    sales.forEach(function (s) {
      s.items.forEach(function (it) {
        rows.push([
          s.id, s.datetime, s.cashier, it.id, it.name,
          it.price, it.qty, it.subtotal,
          s.total, s.received, s.change
        ].map(csvField).join(","));
      });
    });

    var bom = "﻿"; // UTF-8 BOM（Excel文字化け回避）
    var blob = new Blob([bom + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "register_c108_sales_" + fileStamp(new Date()) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("CSVをダウンロードしました");
  }
  function fileStamp(d) {
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "_" +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  // ============================================================
  //  確認ダイアログ
  // ============================================================
  function askConfirm(message, onOk) {
    $("confirmMessage").textContent = message;
    confirmCallback = onOk;
    $("confirmDialog").classList.remove("hidden");
  }
  function closeConfirm() {
    $("confirmDialog").classList.add("hidden");
    confirmCallback = null;
  }

  // ============================================================
  //  イベント登録
  // ============================================================
  function bindEvents() {
    // 担当者
    $("cashierSelector").addEventListener("click", function (e) {
      var btn = e.target.closest(".cashier-btn");
      if (btn) setCashier(btn.dataset.cashier);
    });

    // 商品グリッド（タップで追加 / iで詳細）
    productGrid.addEventListener("click", function (e) {
      var detailBtn = e.target.closest("[data-detail]");
      if (detailBtn) { openDetail(detailBtn.dataset.detail); return; }
      var card = e.target.closest(".product-card");
      if (card) addToCart(card.dataset.id);
    });

    // カート ステッパー
    cartItems.addEventListener("click", function (e) {
      var inc = e.target.closest("[data-inc]");
      var dec = e.target.closest("[data-dec]");
      if (inc) changeQty(inc.dataset.inc, 1);
      else if (dec) changeQty(dec.dataset.dec, -1);
    });

    $("clearCartBtn").addEventListener("click", function () {
      if (cartCount() === 0) return;
      askConfirm("カートを全て消去しますか？", clearCart);
    });
    $("checkoutBtn").addEventListener("click", openPayment);

    // タブ
    document.querySelector(".tabbar").addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (btn) switchScreen(btn.dataset.screen);
    });

    // 支払い
    $("paymentBackBtn").addEventListener("click", closePayment);
    document.querySelector(".keypad").addEventListener("click", function (e) {
      var k = e.target.closest(".key");
      if (k) keypadInput(k.dataset.key);
    });
    document.querySelector(".quick-buttons").addEventListener("click", function (e) {
      var q = e.target.closest(".quick-btn");
      if (q) quickInput(q.dataset.quick);
    });
    $("confirmBtn").addEventListener("click", confirmSale);

    // 詳細
    $("detailCloseBtn").addEventListener("click", closeDetail);
    $("detailAddBtn").addEventListener("click", function () {
      addToCart(this.dataset.id);
      closeDetail();
    });

    // データ
    $("csvBtn").addEventListener("click", downloadCSV);
    $("clearDataBtn").addEventListener("click", function () {
      askConfirm("全ての会計データを削除します。この操作は取り消せません。よろしいですか？", function () {
        localStorage.removeItem(LS_SALES);
        renderHistory();
        toast("全データを削除しました");
      });
    });

    // 確認ダイアログ
    $("confirmCancelBtn").addEventListener("click", closeConfirm);
    $("confirmOkBtn").addEventListener("click", function () {
      var cb = confirmCallback;
      closeConfirm();
      if (cb) cb();
    });

    // オーバーレイの外側タップで閉じる（確定系以外）
    [["paymentModal", closePayment], ["detailModal", closeDetail], ["confirmDialog", closeConfirm]]
      .forEach(function (pair) {
        $(pair[0]).addEventListener("click", function (e) {
          if (e.target === this) pair[1]();
        });
      });
  }

  // ============================================================
  //  Service Worker 登録（対応ブラウザのみ）
  // ============================================================
  function registerSW() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () { /* 未対応/失敗でも通常動作 */ });
      });
    }
  }

  // ============================================================
  //  初期化
  // ============================================================
  function init() {
    productGrid = $("productGrid");
    cartItems = $("cartItems");
    cartEmpty = $("cartEmpty");
    cartTotalEl = $("cartTotal");
    checkoutBtn = $("checkoutBtn");

    loadCashier();
    renderCashier();
    renderProducts();
    renderCart();
    bindEvents();
    registerSW();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

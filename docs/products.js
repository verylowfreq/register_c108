// ============================================================
// 商品データ定義（当日はこのファイルを編集して差し替える）
// ------------------------------------------------------------
//  - id    : 商品を一意に識別するID（重複しないこと）
//  - name  : 商品名（画面・CSVに表示）
//  - desc  : 説明（詳細ボタンで表示。空でも可）
//  - price : 値段（円・整数）
//  - image : 写真のパス（省略・空文字でも可。無い/読込失敗時は頭文字タイル表示）
//
//  写真を使う場合は docs/images/ に画像を置き、そのパスを指定する。
//  例: image: "images/p01.jpg"
// ============================================================
window.PRODUCTS = [
  { id: "p01", name: "新刊イラスト本",         desc: "B5フルカラー32P",   price: 1000, image: "images/p01.svg" },
  { id: "p02", name: "アクリルキーホルダー",   desc: "全5種ランダム",     price: 800,  image: "images/p02.svg" },
  { id: "p03", name: "ステッカーセット",       desc: "3枚組",             price: 300,  image: "images/p03.svg" },
  { id: "p04", name: "既刊まとめ本",           desc: "A5・過去作再録",    price: 1500, image: "images/p04.svg" },
  { id: "p05", name: "ポストカードセット",     desc: "5枚組",             price: 500,  image: "images/p05.svg" },
  { id: "p06", name: "缶バッジ",               desc: "57mm・全3種",       price: 400,  image: "images/p06.svg" },
  { id: "p07", name: "クリアファイル",         desc: "A4・両面印刷",      price: 600,  image: "images/p07.svg" },
  { id: "p08", name: "ミニ色紙",               desc: "サイン入り",        price: 2000, image: "images/p08.svg" },
];

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
  { id: "p01", name: "振っておうえんペンライト", desc: "ペンライト", price: 15000, image: "images/penlight.jpg" },

  { id: "ms01", name: "三峰スズ 光る！イラスト基板 完成品", desc: "組み立て済み", price: 1000, image: "images/suzuillustpcb_1.jpg" },
  { id: "ms02", name: "三峰スズ 光る！イラスト基板 基板のみ", desc: "基板単体（要組み立て）", price: 500, image: "images/suzuillustpcb_2.jpg" },

  { id: "sh01", name: "既刊 はつりちゃん ドキドキDIY♡", desc: "A5版のマンガ本", price: 500, image: "images/hatsuri_diy.jpg" },
  { id: "sh02", name: "東雲はつり キーアクセサリー", desc: "キーアクセサリー形状のフルカラー印刷基板", price: 300, image: "images/hatsuri_keyaccessory.jpg" },
  { id: "sh03", name: "東雲はつり アクスタ エアコンジオラマ", desc: "", price: 2000, image: "images/hatsuri_standing_1.jpg" },
  { id: "sh04", name: "東雲はつり アクスタ ビキニ", desc: "", price: 2000, image: "images/hatsuri_standing_2.jpg" },
  { id: "sh05", name: "東雲はつり アクスタ ぱんつ", desc: "", price: 2000, image: "images/hatsuri_standing_3.jpg" },

  { id: "ms03", name: "アクスタライトスタンド 完成品", desc: "SparkStage", price: 4000, image: "images/SparkStage.jpg" }
];

// 気温などから「どんな服を着たらいいか」を決めるファイルです。
// 画面の表示とは分けておくことで、ルールを変えたいときにここだけ直せば済みます。

/** 服装アドバイスの内容 */
export type ClothingAdvice = {
  emoji: string; // 見た目用の絵文字
  title: string; // ひとことで（例: 半袖で過ごせる）
  items: string[]; // おすすめの服
  tips: string[]; // 追加のアドバイス（寒暖差・雨など）
};

/**
 * 最高気温ごとの服装ルール（上から順に判定します）
 * minTemp: この気温「以上」ならこの服装
 */
const CLOTHING_RULES = [
  { minTemp: 30, emoji: "🥵", title: "真夏の暑さ", items: ["半袖", "ノースリーブ", "通気性の良い服", "帽子"] },
  { minTemp: 25, emoji: "👕", title: "半袖で過ごせる", items: ["半袖シャツ", "Tシャツ"] },
  { minTemp: 21, emoji: "👔", title: "長袖1枚でちょうどいい", items: ["長袖シャツ", "薄手のカットソー"] },
  { minTemp: 16, emoji: "🧥", title: "薄手の上着があると安心", items: ["カーディガン", "薄手のジャケット", "パーカー"] },
  { minTemp: 12, emoji: "🧶", title: "セーターや上着が必要", items: ["セーター", "トレンチコート", "ジャケット"] },
  { minTemp: 7, emoji: "🧥", title: "コートが必要", items: ["ウールのコート", "ニット", "ヒートテックなどの肌着"] },
  { minTemp: -Infinity, emoji: "🧣", title: "しっかり防寒", items: ["ダウンコート", "マフラー", "手袋", "ニット帽"] },
];

/** 最高気温と最低気温の差がこれ以上なら「寒暖差に注意」を表示 */
const BIG_TEMP_DIFF = 8;
/** 降水確率がこれ以上なら「傘」をすすめる */
const RAIN_POP = 50;

/**
 * 服装アドバイスを作ります
 * @param tempMax 最高気温 (℃) … 日中の服装を決めるのに使います
 * @param tempMin 最低気温 (℃) … 朝晩の冷え込みチェックに使います
 * @param pop 降水確率 (%)
 */
export function getClothingAdvice(tempMax: number, tempMin: number, pop: number): ClothingAdvice {
  // 最高気温が minTemp 以上になる最初のルールを探します（最後のルールは必ず当てはまります）
  const rule = CLOTHING_RULES.find((r) => tempMax >= r.minTemp)!;

  const tips: string[] = [];
  if (tempMax - tempMin >= BIG_TEMP_DIFF) {
    tips.push(`寒暖差が${tempMax - tempMin}℃あります。朝晩用に羽織るものを持っていきましょう`);
  }
  if (pop >= RAIN_POP) {
    tips.push("雨が降りそうです。傘を忘れずに☂️");
  }

  return { emoji: rule.emoji, title: rule.title, items: rule.items, tips };
}

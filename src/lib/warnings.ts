// 気象庁のデータから、指定した場所に出ている「警報・注意報」を取得するファイルです。
// ※ 日本国内のみ対応しています。
//
// 使っているデータ（どちらも無料・API キー不要）
//   - 国土地理院: 緯度・経度 → 市区町村コード
//   - 気象庁: 地域コードの一覧 (area.json) と 警報・注意報のデータ
//     （2026年5月29日からの新しい防災気象情報に対応した "r8" のデータを使います）

const GSI_REVERSE_URL = "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress";
const JMA_AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
const JMA_WARNING_URL = "https://www.jma.go.jp/bosai/warning/data/r8";

// ---------- 画面側でも使う型 ----------

/** 発表中の警報・注意報1件 */
export type WarningItem = {
  code: string; // 気象庁の種類コード
  name: string; // 例: レベル3 大雨警報
  level: number; // 危険度 2〜5（色分けに使います）
  status: string; // 発表 / 継続 など
};

/** 警報・注意報の取得結果 */
export type WeatherWarnings =
  | {
      status: "ok";
      areaName: string; // 市区町村名
      officeCode: string; // 担当の気象台のコード（気象庁のページへのリンクに使います）
      reportDatetime: string; // 発表日時 (ISO形式)
      headlines: string[]; // 気象庁からのお知らせ文
      items: WarningItem[]; // 発表中の警報・注意報（空なら何も出ていない）
    }
  | { status: "outside-japan" } // 日本国外なので対象外
  | { status: "error" }; // 取得に失敗

// ---------- 種類コード → 名前・レベル の対応表 ----------
// 気象庁の警報ページ（https://www.jma.go.jp/bosai/warning/）が使っている対応表をもとにしています。

const WARNING_KINDS: Record<string, { name: string; level: number }> = {
  // 大雨
  "10": { name: "レベル2 大雨注意報", level: 2 },
  "03": { name: "レベル3 大雨警報", level: 3 },
  "43": { name: "レベル4 大雨危険警報", level: 4 },
  "33": { name: "レベル5 大雨特別警報", level: 5 },
  // 土砂災害
  "29": { name: "レベル2 土砂災害注意報", level: 2 },
  "09": { name: "レベル3 土砂災害警報", level: 3 },
  "49": { name: "レベル4 土砂災害危険警報", level: 4 },
  "39": { name: "レベル5 土砂災害特別警報", level: 5 },
  // 高潮
  "19": { name: "レベル2 高潮注意報", level: 2 },
  "08": { name: "レベル3 高潮警報", level: 3 },
  "48": { name: "レベル4 高潮危険警報", level: 4 },
  "38": { name: "レベル5 高潮特別警報", level: 5 },
  // 風
  "15": { name: "強風注意報", level: 2 },
  "05": { name: "暴風警報", level: 3 },
  "35": { name: "暴風特別警報", level: 5 },
  // 風雪
  "13": { name: "風雪注意報", level: 2 },
  "02": { name: "暴風雪警報", level: 3 },
  "32": { name: "暴風雪特別警報", level: 5 },
  // 大雪
  "12": { name: "大雪注意報", level: 2 },
  "06": { name: "大雪警報", level: 3 },
  "36": { name: "大雪特別警報", level: 5 },
  // 波浪
  "16": { name: "波浪注意報", level: 2 },
  "07": { name: "波浪警報", level: 3 },
  "37": { name: "波浪特別警報", level: 5 },
  // その他の注意報
  "14": { name: "雷注意報", level: 2 },
  "17": { name: "融雪注意報", level: 2 },
  "20": { name: "濃霧注意報", level: 2 },
  "21": { name: "乾燥注意報", level: 2 },
  "22": { name: "なだれ注意報", level: 2 },
  "23": { name: "低温注意報", level: 2 },
  "24": { name: "霜注意報", level: 2 },
  "25": { name: "着氷注意報", level: 2 },
  "26": { name: "着雪注意報", level: 2 },
};

// ---------- 気象庁・国土地理院のレスポンスの型（必要な部分だけ） ----------

type JmaArea = { name: string; parent: string };
type JmaAreaList = {
  class20s: Record<string, JmaArea>; // 市区町村
  class15s: Record<string, JmaArea>;
  class10s: Record<string, JmaArea>;
};

/** 警報データは「大雨」「風」「雷」など現象ごとの発表が配列で入っています */
type JmaWarningReport = {
  reportDatetime: string;
  headlineText: string;
  warning: {
    class20Items?: { areaCode: string; kinds: { code?: string; status: string }[] }[];
  };
};

// ---------- 内部で使う関数 ----------

async function fetchJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`取得に失敗しました: ${url} (${res.status})`);
  return res.json() as Promise<T>;
}

/**
 * 市区町村コード（5桁）から、気象庁の地域コード（7桁）を探します。
 * 例: 新宿区 "13104" → ["1310400"]
 */
function findJmaAreaCodes(muniCode: string, areas: JmaAreaList): string[] {
  const allCodes = Object.keys(areas.class20s);
  const matched = allCodes.filter((c) => c.startsWith(muniCode));
  if (matched.length > 0) return matched;

  // 政令指定都市（札幌市・横浜市など）は、国土地理院は「区」のコード、気象庁は「市」のコードを使います。
  // 区のコードは市のコードのすぐ後ろの番号なので、同じ都道府県の中で「1つ手前の番号」の市を探します。
  // 例: 札幌市中央区 "01101" → 札幌市 "0110000"
  const cityCode = allCodes
    .map((c) => c.slice(0, 5))
    .filter((c) => c.slice(0, 2) === muniCode.slice(0, 2) && c < muniCode)
    .sort()
    .pop();
  return cityCode ? allCodes.filter((c) => c.startsWith(cityCode)) : [];
}

/**
 * 表示する地域名を決めます。
 * 横浜市のように「横浜市北部」「横浜市南部」と分かれている場合は、共通部分の「横浜市」にします。
 * （どちらに当たるかは分からないため、分かれた地域の警報はまとめて表示しています）
 */
function getAreaName(areaCodes: string[], areas: JmaAreaList): string {
  const names = areaCodes.map((c) => areas.class20s[c].name);
  let common = names[0];
  for (const name of names) {
    while (!name.startsWith(common)) common = common.slice(0, -1);
  }
  return common || names[0];
}

/** 市区町村 → 地域 → 府県 とたどって、担当の気象台のコードを求めます */
function findOfficeCode(areaCode: string, areas: JmaAreaList): string {
  const class15 = areas.class20s[areaCode].parent;
  const class10 = areas.class15s[class15].parent;
  return areas.class10s[class10].parent;
}

// ---------- 外部から使うメイン関数 ----------

/** 緯度・経度の場所に出ている警報・注意報を取得します（失敗しても例外は出しません） */
export async function getWarnings(lat: number, lon: number): Promise<WeatherWarnings> {
  try {
    // 1. 緯度・経度 → 市区町村コード（日本国外だと results がありません）
    const geo = await fetchJson<{ results?: { muniCd: string } }>(
      `${GSI_REVERSE_URL}?lat=${lat}&lon=${lon}`,
      86400, // 場所は変わらないので1日キャッシュ
    );
    if (!geo.results) return { status: "outside-japan" };

    // 2. 気象庁の地域コードと担当の気象台を調べます
    const areas = await fetchJson<JmaAreaList>(JMA_AREA_URL, 86400);
    const areaCodes = findJmaAreaCodes(geo.results.muniCd, areas);
    if (areaCodes.length === 0) return { status: "error" };
    const officeCode = findOfficeCode(areaCodes[0], areas);

    // 3. 警報・注意報のデータを取得（5分キャッシュ）
    const reports = await fetchJson<JmaWarningReport[]>(`${JMA_WARNING_URL}/${officeCode}.json`, 300);

    const items = new Map<string, WarningItem>(); // 同じ警報が重複しないように Map を使います
    const headlines = new Set<string>();
    let reportDatetime = "";

    for (const report of reports) {
      for (const area of report.warning.class20Items ?? []) {
        if (!areaCodes.includes(area.areaCode)) continue;
        for (const kind of area.kinds) {
          // コードがない（＝何も出ていない）ものと「解除」されたものは表示しません
          if (!kind.code || kind.status === "解除") continue;
          const info = WARNING_KINDS[kind.code] ?? { name: `警報・注意報（コード${kind.code}）`, level: 2 };
          items.set(kind.code, { code: kind.code, status: kind.status, ...info });
          headlines.add(report.headlineText);
        }
      }
      // いちばん新しい発表日時を表示に使います
      if (report.reportDatetime > reportDatetime) reportDatetime = report.reportDatetime;
    }

    return {
      status: "ok",
      areaName: getAreaName(areaCodes, areas),
      officeCode,
      reportDatetime,
      headlines: [...headlines],
      // 危険度の高い順に並べます
      items: [...items.values()].sort((a, b) => b.level - a.level),
    };
  } catch (err) {
    console.error(err);
    return { status: "error" };
  }
}

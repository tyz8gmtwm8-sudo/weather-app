// 天気に合わせて、画面全体の背景（色とアニメーション）を切り替える部品です。
// アニメーションの動き（雨が落ちる、雲が流れる など）は globals.css の「wx-」で始まるクラスに書いています。

/** 背景の種類 */
export type WeatherTheme =
  | "sunny" // 晴れ（昼）
  | "clear-night" // 晴れ（夜）
  | "cloudy" // くもり
  | "rain" // 雨
  | "thunder" // 雷雨
  | "snow" // 雪
  | "mist" // 霧
  | "windy"; // 強い風

/** 種類ごとの色の設定（Tailwind CSS のクラス名） */
export const THEMES: Record<
  WeatherTheme,
  {
    sky: string; // 背景のグラデーション
    text: string; // 背景の上に直接のせる文字（タイトルなど）の色
    card: string; // 「現在の天気」カードのグラデーション
  }
> = {
  sunny: {
    sky: "from-orange-400 via-amber-200 to-sky-300",
    text: "text-amber-950",
    card: "from-amber-400 to-orange-500",
  },
  "clear-night": {
    sky: "from-indigo-950 via-slate-900 to-blue-900",
    text: "text-white drop-shadow-md",
    card: "from-indigo-600 to-slate-800",
  },
  cloudy: {
    sky: "from-slate-400 via-slate-300 to-sky-200",
    text: "text-slate-900",
    card: "from-slate-400 to-slate-600",
  },
  rain: {
    sky: "from-slate-700 via-slate-600 to-slate-500",
    text: "text-white drop-shadow-md",
    card: "from-sky-600 to-slate-700",
  },
  thunder: {
    sky: "from-slate-900 via-slate-800 to-indigo-950",
    text: "text-white drop-shadow-md",
    card: "from-violet-700 to-slate-900",
  },
  snow: {
    sky: "from-sky-800 via-slate-500 to-slate-300",
    text: "text-white drop-shadow-md",
    card: "from-sky-400 to-indigo-500",
  },
  mist: {
    sky: "from-slate-300 via-gray-200 to-slate-100",
    text: "text-slate-800",
    card: "from-slate-400 to-slate-500",
  },
  windy: {
    sky: "from-slate-500 via-gray-400 to-slate-300",
    text: "text-white drop-shadow-md",
    card: "from-teal-500 to-slate-600",
  },
};

/** 気象庁の用語で「やや強い風」になる風速（m/s）。これ以上なら「風」の背景にします */
const WINDY_SPEED = 10;

/**
 * 天気アイコンのコードから、背景の種類を決めます。
 * アイコンのコードは OpenWeatherMap のもので、例えば "10d" なら
 * 前の2けた「10」が天気の種類（雨）、最後の「d」が昼（夜なら「n」）を表します。
 */
export function getWeatherTheme(icon: string, windSpeed?: number): WeatherTheme {
  const code = icon.slice(0, 2);
  const isNight = icon.endsWith("n");

  // 雨・雷・雪・霧は、風よりも優先して表示します
  if (code === "11") return "thunder";
  if (code === "09" || code === "10") return "rain";
  if (code === "13") return "snow";
  if (code === "50") return "mist";
  if (windSpeed !== undefined && windSpeed >= WINDY_SPEED) return "windy";
  if (code === "01" || code === "02") return isNight ? "clear-night" : "sunny";
  return "cloudy";
}

/**
 * 0〜1 の「ばらばらに見える数」を作ります。
 * Math.random() を使うと、サーバーとブラウザで値が変わって表示がずれるため、
 * 番号(i)から毎回同じ値が出る計算にしています。
 */
function pseudoRandom(i: number, seed: number) {
  // 数をかけ算やビット演算で「よくかき混ぜて」、規則的に並ばないようにしています
  let x = (i + 1) * 374761393 + seed * 668265263;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296; // 0 以上 1 未満にそろえる
}

/** 0〜count-1 の番号の配列を作ります（例: range(3) → [0, 1, 2]） */
const range = (count: number) => Array.from({ length: count }, (_, i) => i);

export default function WeatherBackground({ theme }: { theme: WeatherTheme }) {
  return (
    // aria-hidden: 飾りなので、読み上げソフトには読ませません
    // pointer-events-none: 背景がクリックのじゃまをしないようにします
    <div aria-hidden className="wx-layer pointer-events-none fixed inset-0 overflow-hidden">
      {/* key に theme を指定すると、天気が変わったときに作り直され、ふわっと切り替わります */}
      <div key={theme} className={`wx-fade absolute inset-0 bg-gradient-to-b ${THEMES[theme].sky}`}>
        {theme === "sunny" && <Sunny />}
        {theme === "clear-night" && <Night />}
        {theme === "cloudy" && <Clouds count={6} color="rgba(255,255,255,0.75)" />}
        {theme === "rain" && <Rain count={90} />}
        {theme === "thunder" && <Thunder />}
        {theme === "snow" && <Snow />}
        {theme === "mist" && <Mist />}
        {theme === "windy" && <Windy />}
      </div>
      {/* ダークモードのときは、背景を少し暗くして目にやさしくします */}
      <div className="absolute inset-0 hidden bg-slate-950/30 dark:block" />
    </div>
  );
}

/** 晴れ: 光る太陽と、回る光の筋、ふわふわ浮かぶ光の粒 */
function Sunny() {
  return (
    <>
      <div className="wx-sun-rays" />
      <div className="wx-sun" />
      {range(12).map((i) => {
        const size = 20 + pseudoRandom(i, 1) * 60;
        return (
          <span
            key={i}
            className="wx-flare"
            style={{
              left: `${pseudoRandom(i, 2) * 100}%`,
              top: `${30 + pseudoRandom(i, 3) * 70}%`,
              width: size,
              height: size,
              animationDuration: `${8 + pseudoRandom(i, 4) * 8}s`,
              animationDelay: `${-pseudoRandom(i, 5) * 16}s`,
            }}
          />
        );
      })}
    </>
  );
}

/** 晴れの夜: 月と、またたく星 */
function Night() {
  return (
    <>
      <div className="wx-moon" />
      {range(80).map((i) => (
        <span
          key={i}
          className="wx-star"
          style={{
            left: `${pseudoRandom(i, 1) * 100}%`,
            top: `${pseudoRandom(i, 2) * 70}%`,
            animationDuration: `${2 + pseudoRandom(i, 3) * 3}s`,
            animationDelay: `${-pseudoRandom(i, 4) * 5}s`,
          }}
        />
      ))}
    </>
  );
}

/** 雲: ぼかした楕円が左から右へ流れます（speed が小さいほど速く流れます） */
function Clouds({ count, color, speed = 1 }: { count: number; color: string; speed?: number }) {
  return (
    <>
      {range(count).map((i) => {
        const width = 250 + pseudoRandom(i, 1) * 300;
        const duration = (50 + pseudoRandom(i, 3) * 40) * speed;
        return (
          <span
            key={i}
            className="wx-cloud"
            style={{
              top: `${pseudoRandom(i, 2) * 45}%`,
              width,
              height: width * 0.35,
              background: color,
              animationDuration: `${duration}s`,
              animationDelay: `${-pseudoRandom(i, 4) * duration}s`,
            }}
          />
        );
      })}
    </>
  );
}

/** 雨: 斜めに落ちる雨粒 ＋ 暗い雲 */
function Rain({ count }: { count: number }) {
  return (
    <>
      <Clouds count={5} color="rgba(30,41,59,0.55)" />
      {range(count).map((i) => (
        <span
          key={i}
          className="wx-drop"
          style={{
            left: `${-10 + pseudoRandom(i, 1) * 130}%`,
            height: 50 + pseudoRandom(i, 2) * 50,
            animationDuration: `${0.6 + pseudoRandom(i, 3) * 0.5}s`,
            animationDelay: `${-pseudoRandom(i, 4) * 2}s`,
          }}
        />
      ))}
    </>
  );
}

/** 雷雨: 雨 ＋ ときどきピカッと光る */
function Thunder() {
  return (
    <>
      <Rain count={110} />
      <div className="wx-flash" />
    </>
  );
}

/** 雪: ゆらゆら落ちる雪の粒 */
function Snow() {
  return (
    <>
      {range(70).map((i) => {
        const size = 3 + pseudoRandom(i, 1) * 6;
        return (
          <span
            key={i}
            className="wx-flake"
            style={{
              left: `${pseudoRandom(i, 2) * 100}%`,
              width: size,
              height: size,
              opacity: 0.6 + pseudoRandom(i, 3) * 0.4,
              animationDuration: `${8 + pseudoRandom(i, 4) * 10}s`,
              animationDelay: `${-pseudoRandom(i, 5) * 18}s`,
            }}
          />
        );
      })}
    </>
  );
}

/** 霧: 白いもやが、ゆっくり左右にただよいます */
function Mist() {
  return (
    <>
      {range(4).map((i) => (
        <span
          key={i}
          className="wx-fog"
          style={{
            top: `${10 + i * 22}%`,
            animationDuration: `${14 + i * 4}s`,
            animationDelay: `${-i * 3}s`,
          }}
        />
      ))}
    </>
  );
}

/** 強い風: 速く流れる雲と、ビュッと横切る風の線、舞う葉っぱ */
function Windy() {
  return (
    <>
      <Clouds count={6} color="rgba(226,232,240,0.6)" speed={0.25} />
      {range(16).map((i) => (
        <span
          key={i}
          className="wx-gust"
          style={{
            top: `${pseudoRandom(i, 1) * 100}%`,
            width: `${20 + pseudoRandom(i, 2) * 25}vw`,
            animationDuration: `${1.5 + pseudoRandom(i, 3) * 1.5}s`,
            animationDelay: `${-pseudoRandom(i, 4) * 3}s`,
          }}
        />
      ))}
      {range(6).map((i) => (
        <span
          key={i}
          className="wx-leaf"
          style={{
            top: `${10 + pseudoRandom(i, 5) * 80}%`,
            animationDuration: `${4 + pseudoRandom(i, 6) * 3}s`,
            animationDelay: `${-pseudoRandom(i, 7) * 7}s`,
          }}
        >
          🍃
        </span>
      ))}
    </>
  );
}

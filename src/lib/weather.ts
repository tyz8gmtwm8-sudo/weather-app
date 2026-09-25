// OpenWeatherMap API からデータを取得し、画面で使いやすい形に整えるファイルです。
// ※ API キーを使うため、このファイルはサーバー側（API ルート）からのみ呼び出します。

const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ---------- 画面側でも使う型（データの形） ----------

/** 3時間ごとの予報1件 */
export type HourlyForecast = {
  time: string; // 現地時刻 "HH:MM"
  temp: number; // 気温 (℃)
  humidity: number; // 湿度 (%)
  pop: number; // 降水確率 (%)
  description: string; // 天気の説明（例: 晴天）
  icon: string; // アイコンのコード（例: 01d）
};

/** 1日分の予報まとめ */
export type DailyForecast = {
  date: string; // 現地の日付 "YYYY-MM-DD"
  tempMin: number;
  tempMax: number;
  humidity: number; // 1日の平均湿度
  pop: number; // 1日の中で最も高い降水確率
  description: string; // 代表の天気（お昼ごろの天気）
  icon: string;
  hourly: HourlyForecast[];
};

/** 現在の天気 */
export type CurrentWeather = {
  temp: number;
  feelsLike: number; // 体感温度
  humidity: number;
  windSpeed: number; // 風速 (m/s)
  description: string;
  icon: string;
};

/** API ルートがブラウザに返すデータ全体 */
export type WeatherResponse = {
  location: { name: string; country: string; lat: number; lon: number };
  today: string; // 現地の今日の日付 "YYYY-MM-DD"
  current: CurrentWeather;
  daily: DailyForecast[];
};

/** 場所の指定方法（都市名 または 緯度・経度） */
export type LocationQuery = { city: string } | { lat: number; lon: number };

// ---------- OpenWeatherMap のレスポンスの型（必要な部分だけ） ----------

type OwmWeather = { description: string; icon: string };

type OwmCurrent = {
  name: string;
  sys: { country: string };
  coord: { lat: number; lon: number };
  timezone: number;
  dt: number;
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: OwmWeather[];
};

type OwmForecast = {
  city: { timezone: number };
  list: {
    dt: number;
    main: { temp: number; temp_min: number; temp_max: number; humidity: number };
    pop: number; // 降水確率 (0〜1)
    weather: OwmWeather[];
  }[];
};

/** API のエラーを表すクラス（HTTP ステータスも一緒に持つ） */
export class WeatherApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// ---------- 内部で使う関数 ----------

/**
 * UNIX時刻（秒）とタイムゾーンのずれ（秒）から、現地の日付と時刻を作ります。
 * 例: 東京なら timezone = 32400 (9時間)
 */
function toLocalDateTime(unixSeconds: number, timezoneOffset: number) {
  // UTC として扱うことで、サーバーがどこの国にあっても同じ結果になります
  const iso = new Date((unixSeconds + timezoneOffset) * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** OpenWeatherMap にリクエストを送り、JSON を受け取ります */
async function fetchOwm<T>(endpoint: string, query: LocationQuery): Promise<T> {
  // API キーは環境変数から読み込みます（コードには直接書きません）
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new WeatherApiError(
      "サーバーに API キー (OPENWEATHER_API_KEY) が設定されていません",
      500,
    );
  }

  const params = new URLSearchParams({ appid: apiKey, units: "metric", lang: "ja" });
  if ("city" in query) {
    params.set("q", query.city);
  } else {
    params.set("lat", String(query.lat));
    params.set("lon", String(query.lon));
  }

  // 10分間はキャッシュして、API の無料枠を使いすぎないようにします
  const res = await fetch(`${BASE_URL}/${endpoint}?${params}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new WeatherApiError("都市が見つかりませんでした", 404);
    if (res.status === 401) throw new WeatherApiError("API キーが無効です（有効化まで数時間かかる場合があります）", 500);
    if (res.status === 429) throw new WeatherApiError("API の利用回数の上限に達しました", 429);
    throw new WeatherApiError("天気データの取得に失敗しました", 502);
  }
  return res.json() as Promise<T>;
}

/** 3時間ごとの予報リストを「日付ごと」にまとめます */
function groupByDay(forecast: OwmForecast): DailyForecast[] {
  const tz = forecast.city.timezone;
  const days = new Map<string, OwmForecast["list"]>();

  for (const item of forecast.list) {
    const { date } = toLocalDateTime(item.dt, tz);
    days.set(date, [...(days.get(date) ?? []), item]);
  }

  return [...days.entries()].map(([date, items]) => {
    // 代表の天気は「12時に一番近い時間帯」のものを使います
    const noon = items.reduce((best, item) => {
      const hour = Number(toLocalDateTime(item.dt, tz).time.slice(0, 2));
      const bestHour = Number(toLocalDateTime(best.dt, tz).time.slice(0, 2));
      return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? item : best;
    });

    return {
      date,
      tempMin: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
      tempMax: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
      humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
      pop: Math.round(Math.max(...items.map((i) => i.pop)) * 100),
      description: noon.weather[0].description,
      icon: noon.weather[0].icon,
      hourly: items.map((i) => ({
        time: toLocalDateTime(i.dt, tz).time,
        temp: Math.round(i.main.temp),
        humidity: i.main.humidity,
        pop: Math.round(i.pop * 100),
        description: i.weather[0].description,
        icon: i.weather[0].icon,
      })),
    };
  });
}

// ---------- 外部から使うメイン関数 ----------

/** 現在の天気と5日間の予報をまとめて取得します */
export async function getWeather(query: LocationQuery): Promise<WeatherResponse> {
  // 2つの API を同時に呼び出して待ち時間を短くします
  const [current, forecast] = await Promise.all([
    fetchOwm<OwmCurrent>("weather", query), // 現在の天気
    fetchOwm<OwmForecast>("forecast", query), // 5日間・3時間ごとの予報（降水確率あり）
  ]);

  return {
    location: {
      name: current.name,
      country: current.sys.country,
      lat: current.coord.lat,
      lon: current.coord.lon,
    },
    today: toLocalDateTime(current.dt, current.timezone).date,
    current: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: current.wind.speed,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
    },
    daily: groupByDay(forecast),
  };
}

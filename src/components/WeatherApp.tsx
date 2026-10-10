"use client";

// 天気アプリのメイン画面です。
// 「都市名で検索」または「現在地を使う」で天気を取得し、カレンダーで日付を切り替えます。

import Image from "next/image";
import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import WeatherBackground, { getWeatherTheme, THEMES, type WeatherTheme } from "@/components/WeatherBackground";
import type { DailyForecast, WeatherResponse } from "@/lib/weather";
import { getClothingAdvice } from "@/lib/clothing";
import type { WeatherWarnings } from "@/lib/warnings";

/** 天気アイコンの画像URL（OpenWeatherMap が提供している画像） */
const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

/** "2026-09-25" → "9月25日(金)" */
function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日(${weekday})`;
}

export default function WeatherApp() {
  const [cityInput, setCityInput] = useState("");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** 自分で作った API (/api/weather) を呼び出して天気を取得します */
  async function loadWeather(params: Record<string, string>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/weather?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "天気の取得に失敗しました");
      setWeather(data);
      setSelectedDate(data.today); // 新しい場所を読み込んだら「今日」を選択
    } catch (e) {
      setError(e instanceof Error ? e.message : "天気の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // 背景のお試し表示用（URL の最後に ?theme=rain などを付けると、その天気の背景になります）
  const [previewTheme, setPreviewTheme] = useState<WeatherTheme | null>(null);

  // 最初に画面を開いたときは東京の天気を表示します
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回だけデータを読み込むため
    loadWeather({ city: "Tokyo" });

    const param = new URLSearchParams(window.location.search).get("theme");
    if (param && param in THEMES) setPreviewTheme(param as WeatherTheme);
  }, []);

  /** 検索フォームの送信 */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (cityInput.trim()) loadWeather({ city: cityInput.trim() });
  }

  /** ブラウザの位置情報を使って現在地の天気を取得 */
  function handleCurrentLocation() {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報に対応していません");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        loadWeather({ lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) }),
      (err) => {
        setLoading(false);
        // 失敗の理由ごとに、何をすればいいか分かるメッセージを出します
        if (err.code === err.PERMISSION_DENIED) {
          setError("位置情報の利用が許可されていません（ブラウザと、Macの「システム設定」→「プライバシーとセキュリティ」→「位置情報サービス」で許可してください）");
        } else if (err.code === err.TIMEOUT) {
          setError("位置情報の取得が時間切れになりました。もう一度お試しください");
        } else {
          setError("現在地を特定できませんでした（Wi-Fi がオンになっているか確認してください）");
        }
      },
      // timeout: 30秒で打ち切る（指定しないと、いつまでも待ち続けることがあります）
      //   Macでは現在地の特定に10秒以上かかることがあるため、30秒にしています
      // maximumAge: 5分以内に取得した位置があれば、それを使って素早く表示します
      { timeout: 30000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const day = weather?.daily.find((d) => d.date === selectedDate);

  // 背景の種類を決めます
  //   今日を選んでいるとき … 「現在の天気」と「風速」から
  //   ほかの日を選んでいるとき … その日の代表の天気から（予報には風速がないため、風は判定しません）
  let theme: WeatherTheme = "cloudy"; // 読み込み前は、くもりの背景
  if (weather) {
    theme =
      selectedDate === weather.today || !day
        ? getWeatherTheme(weather.current.icon, weather.current.windSpeed)
        : getWeatherTheme(day.icon);
  }
  if (previewTheme) theme = previewTheme;
  const themeStyle = THEMES[theme];

  return (
    <>
      <WeatherBackground theme={theme} />
      {/* relative: 背景より手前に表示するため */}
      <main className="relative mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className={`mb-6 text-3xl font-bold ${themeStyle.text}`}>🌤 天気予報</h1>

        {/* 検索エリア */}
        <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="都市名を入力（例: Osaka, 札幌, London）"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sky-500 px-5 py-2 font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={loading}
            className="rounded-xl border border-sky-500 bg-white/80 px-5 py-2 font-medium text-sky-600 backdrop-blur-sm hover:bg-sky-50 disabled:opacity-50 dark:bg-slate-800/80 dark:hover:bg-slate-800"
          >
            📍 現在地
          </button>
        </form>

        {error && (
          <p className="mb-6 rounded-xl bg-red-100 px-4 py-3 text-red-700">⚠️ {error}</p>
        )}
        {loading && <p className={`mb-6 ${themeStyle.text}`}>読み込み中...</p>}

        {weather && (
          <>
            <h2 className={`mb-4 text-2xl font-semibold ${themeStyle.text}`}>
              {weather.location.name}
              <span className="ml-2 text-base font-normal opacity-75">{weather.location.country}</span>
            </h2>

            <WarningsCard warnings={weather.warnings} />

            <div className="grid gap-6 md:grid-cols-[320px_1fr]">
              {/* 場所が変わったらカレンダーを作り直す（表示月をリセットする）ため key を指定 */}
              <Calendar
                key={`${weather.location.lat},${weather.location.lon}`}
                availableDates={weather.daily.map((d) => d.date)}
                selectedDate={selectedDate}
                today={weather.today}
                onSelect={setSelectedDate}
              />

              <div className="flex flex-col gap-6">
                {/* 今日を選んでいるときだけ「現在の天気」を表示 */}
                {selectedDate === weather.today && (
                  <section className={`rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${themeStyle.card}`}>
                    <p className="text-sm opacity-90">現在の天気</p>
                    <div className="flex items-center gap-2">
                      <Image src={iconUrl(weather.current.icon)} alt={weather.current.description} width={80} height={80} />
                      <div>
                        <p className="text-5xl font-bold">{weather.current.temp}℃</p>
                        <p>{weather.current.description}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm opacity-90">
                      体感 {weather.current.feelsLike}℃ ／ 湿度 {weather.current.humidity}% ／ 風速{" "}
                      {weather.current.windSpeed}m/s
                    </p>
                  </section>
                )}

                {day ? <DayDetail day={day} /> : <p className={themeStyle.text}>この日の予報データはありません</p>}
              </div>
            </div>
          </>
        )}

        {/* 背景の色に関係なく読めるように、半透明の白い下地を敷いています */}
        <footer className="mt-10 rounded-xl bg-white/70 px-4 py-3 text-xs text-slate-600 backdrop-blur-sm dark:bg-slate-900/70 dark:text-slate-300">
          天気データ提供:{" "}
          <a href="https://openweathermap.org/" className="underline" target="_blank" rel="noreferrer">
            OpenWeatherMap
          </a>
          <br />
          警報・注意報: 出典{" "}
          <a href="https://www.jma.go.jp/" className="underline" target="_blank" rel="noreferrer">
            気象庁ホームページ
          </a>
          （市区町村の判定に国土地理院のデータを使用）
        </footer>
      </main>
    </>
  );
}

/** 選択した日の予報（1日のまとめ ＋ 3時間ごと） */
function DayDetail({ day }: { day: DailyForecast }) {
  return (
    <section className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md dark:bg-slate-800/80">
      <h3 className="mb-3 text-lg font-semibold">{formatDate(day.date)} の予報</h3>

      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center">
          <Image src={iconUrl(day.icon)} alt={day.description} width={64} height={64} />
          <span className="text-lg">{day.description}</span>
        </div>
        <Stat label="最高 / 最低" value={`${day.tempMax}℃ / ${day.tempMin}℃`} />
        <Stat label="降水確率" value={`${day.pop}%`} />
        <Stat label="湿度（平均）" value={`${day.humidity}%`} />
      </div>

      <ClothingCard day={day} />

      <h4 className="mb-2 text-sm font-medium text-slate-500">3時間ごとの予報</h4>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {day.hourly.map((h) => (
          <div
            key={h.time}
            className="flex min-w-20 flex-col items-center rounded-xl bg-sky-50 px-2 py-2 text-sm dark:bg-slate-700"
          >
            <span className="font-medium">{h.time}</span>
            <Image src={iconUrl(h.icon)} alt={h.description} width={48} height={48} />
            <span className="font-semibold">{h.temp}℃</span>
            <span className="text-xs text-blue-600 dark:text-sky-300">☔ {h.pop}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-300">💧 {h.humidity}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 気温に合わせた服装のアドバイス */
function ClothingCard({ day }: { day: DailyForecast }) {
  const advice = getClothingAdvice(day.tempMax, day.tempMin, day.pop);

  return (
    <div className="mb-5 rounded-xl bg-amber-50 p-4 dark:bg-slate-700">
      <h4 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-300">👕 服装のめやす</h4>
      <p className="text-lg font-semibold">
        {advice.emoji} {advice.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {advice.items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm dark:bg-slate-600">
            {item}
          </span>
        ))}
      </div>
      {advice.tips.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-800 dark:text-amber-200">
          {advice.tips.map((tip) => (
            <li key={tip}>💡 {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 危険度レベルごとの色（気象庁の警報ページの色分けに合わせています） */
const LEVEL_STYLES: Record<number, string> = {
  5: "bg-black text-white", // 特別警報
  4: "bg-purple-600 text-white", // 危険警報
  3: "bg-red-600 text-white", // 警報
  2: "bg-yellow-300 text-yellow-950", // 注意報
};

/** "2026-09-27T16:17:00+09:00" → "9月27日 16:17" */
function formatReportTime(iso: string) {
  const [, m, d, time] = iso.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}:\d{2})/) ?? [];
  return m ? `${Number(m)}月${Number(d)}日 ${time}` : iso;
}

/** 発表中の警報・注意報と、避難情報の確認方法 */
function WarningsCard({ warnings }: { warnings: WeatherWarnings }) {
  if (warnings.status === "outside-japan") {
    return <p className="mb-6 rounded-xl bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur-sm dark:bg-slate-800/70 dark:text-slate-300">ℹ️ 警報・注意報は日本国内の地域のみ表示できます</p>;
  }
  if (warnings.status === "error") {
    return <p className="mb-6 rounded-xl bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur-sm dark:bg-slate-800/70 dark:text-slate-300">⚠️ 警報・注意報を取得できませんでした</p>;
  }

  const hasWarnings = warnings.items.length > 0;

  return (
    <section
      className={`mb-6 rounded-2xl p-5 shadow-sm ${
        hasWarnings ? "border-2 border-red-400 bg-red-50 dark:bg-red-950/40" : "bg-white/80 backdrop-blur-md dark:bg-slate-800/80"
      }`}
    >
      <h3 className="mb-2 text-lg font-semibold">
        {hasWarnings ? "⚠️" : "✅"} {warnings.areaName}の警報・注意報
      </h3>

      {hasWarnings ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {warnings.items.map((item) => (
              <span
                key={item.code}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${LEVEL_STYLES[item.level] ?? LEVEL_STYLES[2]}`}
              >
                {item.name}
              </span>
            ))}
          </div>
          {warnings.headlines.map((text) => (
            <p key={text} className="mb-1 text-sm">
              {text}
            </p>
          ))}
        </>
      ) : (
        <p className="text-sm">現在、発表中の警報・注意報はありません。</p>
      )}

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {formatReportTime(warnings.reportDatetime)} 気象庁発表 ／{" "}
        <a
          href={`https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=${warnings.officeCode}`}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          気象庁のページで詳しく見る
        </a>
      </p>

      {/* 避難指示は市区町村が発令するもので、無料で使える公開データがないため、確認先を案内します */}
      <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-200">
        🏃 避難指示などの避難情報は、市区町村から発令されます。テレビ・ラジオ、市区町村のホームページや防災メール・防災アプリで確認してください。
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

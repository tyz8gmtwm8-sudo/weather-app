# 🌤 天気予報アプリ

[OpenWeatherMap](https://openweathermap.org/) の無料 API を使った天気予報 Web アプリです（Next.js 製）。

## できること

- 都市名で検索（例: `Tokyo`, `大阪`, `London`）
- 📍 ボタンで現在地の天気を表示（ブラウザの位置情報を使用）
- 気温・天気・湿度・降水確率・体感温度・風速を表示
- カレンダーで日付を選ぶと、その日の予報（1日のまとめ＋3時間ごと）に切り替え
  - 無料プランの「5日間予報」を使っているため、選べるのは今日から約5日間です

## 仕組み

```
ブラウザ ──> /api/weather（このアプリのサーバー） ──> OpenWeatherMap API
```

API キーはサーバー側（`src/lib/weather.ts`）でのみ使うため、ブラウザには送られません。

| ファイル | 役割 |
| --- | --- |
| `src/lib/weather.ts` | OpenWeatherMap からデータ取得・日付ごとに集計 |
| `src/app/api/weather/route.ts` | ブラウザから呼ばれる API |
| `src/components/WeatherApp.tsx` | メイン画面（検索・現在地・天気表示） |
| `src/components/Calendar.tsx` | カレンダー |

## ローカルで動かす

1. OpenWeatherMap に無料登録し、API キーを取得します（有効になるまで最大数時間かかることがあります）
2. 見本ファイルをコピーして `.env.local` を作り、API キーを書き込みます
   ```bash
   cp .env.example .env.local
   ```
   ```
   OPENWEATHER_API_KEY=あなたのAPIキー
   ```
3. 起動します
   ```bash
   npm install
   npm run dev
   ```
4. ブラウザで http://localhost:3000 を開きます

> `.env.local` は `.gitignore` により GitHub には公開されません。

## Vercel へのデプロイ

Vercel のプロジェクト設定 → **Environment Variables** に `OPENWEATHER_API_KEY` を登録してからデプロイしてください。

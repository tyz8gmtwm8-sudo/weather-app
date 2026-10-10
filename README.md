# 🌤 天気予報アプリ

都市名や現在地から天気予報を調べられる Web アプリです。
天気に合わせて画面の背景が変わり（晴れなら光、雨なら降る雨粒など）、その日の服装のめやすや、気象庁の警報・注意報も確認できます。

**▶ 公開中のアプリ: https://weather-app-gamma-fawn-47.vercel.app**

インストール不要で、パソコンでもスマホでも、上の URL を開くだけで使えます。

---

## 目次

- [できること](#できること)
- [使い方](#使い方)
- [自分のパソコンで動かす](#自分のパソコンで動かす)
- [毎朝の天気通知](#毎朝の天気通知)
- [Vercel で公開する](#vercel-で公開する)
- [仕組みとファイル構成](#仕組みとファイル構成)
- [使っている技術](#使っている技術)
- [データの出典](#データの出典)

---

## できること

| 機能 | 内容 |
| --- | --- |
| 🔍 都市名で検索 | `Tokyo`、`大阪`、`札幌`、`London` など、日本語でも英語でも検索できます |
| 📍 現在地の天気 | ブラウザの位置情報を使って、今いる場所の天気を表示します |
| 🌡 現在の天気 | 気温・体感温度・湿度・風速を表示します |
| 📅 カレンダーで日付を選ぶ | 今日から約5日先まで、選んだ日の予報（1日のまとめ＋3時間ごと）に切り替わります |
| 👕 服装のめやす | 最高・最低気温と降水確率から、おすすめの服装やアドバイスを表示します |
| ⚠️ 警報・注意報 | 気象庁が発表している警報・注意報を表示します（日本国内のみ） |
| 🎨 天気に合わせた背景 | 晴れ・夜・くもり・雨・雷雨・雪・霧・強風の 8 種類の背景に、天気に合わせて切り替わります |

> **予報が約5日先までの理由**
> 天気データ（OpenWeatherMap）の無料プランで使える「5日間予報」を使っているためです。

---

## 使い方

1. アプリを開くと、最初は **東京** の天気が表示されます。
2. 入力欄に都市名を入れて **「検索」** を押すと、その都市の天気に切り替わります。
3. **「📍 現在地」** を押すと、今いる場所の天気を表示します。
   - 初回はブラウザから「位置情報の使用を許可しますか？」と聞かれるので、**「許可する」** を押してください。
   - Mac で「時間切れ」と表示される場合は、「システム設定」→「プライバシーとセキュリティ」→「位置情報サービス」で、使っているブラウザがオンになっているか確認してください。
4. 左の **カレンダー** で日付を選ぶと、その日の予報が表示されます。

### 背景のお試し表示

URL の最後に `?theme=〇〇` を付けると、今の天気に関係なく好きな背景を表示できます。

```
https://weather-app-gamma-fawn-47.vercel.app/?theme=rain
```

| 〇〇 に入れる文字 | 背景 |
| --- | --- |
| `sunny` | ☀️ 晴れ（昼） |
| `clear-night` | 🌙 晴れ（夜） |
| `cloudy` | ☁️ くもり |
| `rain` | 🌧 雨 |
| `thunder` | ⛈ 雷雨 |
| `snow` | ❄️ 雪 |
| `mist` | 🌫 霧 |
| `windy` | 💨 強い風（風速 10m/s 以上） |

> パソコンの設定で「動きを減らす（視差効果を減らす）」をオンにしている場合は、背景のアニメーションと雷の点滅は止まります。

---

## 自分のパソコンで動かす

### 必要なもの

| 必要なもの | 説明 |
| --- | --- |
| [Node.js](https://nodejs.org/)（バージョン 24 で動作確認） | JavaScript をパソコン上で動かすためのソフトです。`npm` コマンドも一緒に入ります |
| [OpenWeatherMap](https://openweathermap.org/) の API キー（無料） | 天気データを受け取るための「合言葉」のような文字列です |

### 手順

**1. このリポジトリをダウンロードします**

```bash
git clone https://github.com/tyz8gmtwm8-sudo/weather-app.git
cd weather-app
```

**2. 必要なライブラリをインストールします**

`package.json` に書かれているライブラリ（Next.js や React など）がまとめてインストールされます。

```bash
npm install
```

**3. OpenWeatherMap の API キーを取得します**

1. [OpenWeatherMap](https://home.openweathermap.org/users/sign_up) で無料のアカウントを作ります。
2. ログイン後、[API keys のページ](https://home.openweathermap.org/api_keys) で API キーをコピーします。

> 作ったばかりの API キーは、使えるようになるまで最大で数時間かかることがあります。

**4. API キーを設定ファイルに書き込みます**

見本のファイル `.env.example` をコピーして、`.env.local` というファイルを作ります。

```bash
cp .env.example .env.local
```

`.env.local` を開いて、`=` の後ろに自分の API キーを貼り付けます。

```
OPENWEATHER_API_KEY=ここに自分のAPIキー
```

> ⚠️ `.env.local` には秘密の API キーが入るので、GitHub には公開しないでください。
> このリポジトリでは `.gitignore` で除外しているため、普通に `git push` しても公開されません。

**5. アプリを起動します**

```bash
npm run dev
```

**6. ブラウザで開きます**

http://localhost:3001 を開くと、アプリが表示されます。
止めるときは、ターミナルで `Control + C` を押します。

> ほかのアプリとぶつからないように、ポート番号を **3001** にしています（`package.json` の `"dev"` で変更できます）。

### よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発用サーバーを起動します（コードを保存すると自動で画面に反映されます） |
| `npm run build` | 公開用にアプリを組み立てます |
| `npm run start` | `build` したアプリを起動します |
| `npm run lint` | コードの書き方に問題がないかチェックします |
| `npm run notify` | 今日の天気を Mac の通知で表示します（下の「毎朝の天気通知」を参照） |

---

## 毎朝の天気通知

今日の天気と服装のめやすを、Mac のデスクトップ通知で知らせる機能です（**Mac のみ・任意**）。使わなくてもアプリは動きます。

### まず手動で試す

```bash
npm run notify
```

画面の右上に通知が出れば成功です。通知する都市は、`.env.local` に次の行を追加すると変更できます（省略すると東京）。

```
NOTIFY_CITY=Osaka
```

> このスクリプトは TypeScript のファイルを Node.js で直接実行します。古い Node.js では動かないことがあるので、エラーになる場合は Node.js を新しくしてください。

### 毎朝 8 時に自動で通知する

Mac の自動実行のしくみ（launchd）を使います。

1. `scripts/com.weatherapp.morning-notify.plist` を開き、次の場所を **自分の環境に合わせて書き換えます**。
   - `node` の場所 … ターミナルで `which node` を実行すると調べられます
   - `notify-weather.ts` の場所 … このリポジトリを置いたフォルダに合わせます
   - ログを保存する場所 … `/Users/あなたのユーザー名/Library/Logs/weather-notify.log` など
2. ファイルを所定のフォルダにコピーして、登録します。

   ```bash
   cp scripts/com.weatherapp.morning-notify.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.weatherapp.morning-notify.plist
   ```

3. やめたいときは、登録を解除します。

   ```bash
   launchctl unload ~/Library/LaunchAgents/com.weatherapp.morning-notify.plist
   ```

---

## Vercel で公開する

[Vercel](https://vercel.com/) を使うと、このアプリをインターネット上に無料で公開できます。

1. Vercel にログインし、このリポジトリ（または自分のフォーク）を選んでプロジェクトを作ります。
2. プロジェクトの **Settings → Environment Variables** で、`OPENWEATHER_API_KEY` に自分の API キーを登録します。
3. デプロイ（公開）します。

GitHub とつないでおくと、`main` ブランチにプッシュするたびに自動で公開し直されます。

> コマンドで公開する場合は、`npx vercel login` でログインしてから `npx vercel deploy --prod` を実行します。

---

## 仕組みとファイル構成

```
ブラウザ ──▶ /api/weather（このアプリのサーバー） ──▶ OpenWeatherMap（天気）
                                                └──▶ 国土地理院・気象庁（警報・注意報）
```

ブラウザは直接 OpenWeatherMap に問い合わせず、必ずこのアプリのサーバー（`/api/weather`）を通します。
そのため、**API キーはサーバーの中だけで使われ、ブラウザ（利用者）には送られません**。

| ファイル | 役割 |
| --- | --- |
| `src/app/page.tsx` | トップページ（メイン画面を表示するだけ） |
| `src/app/api/weather/route.ts` | ブラウザから呼ばれる API（`/api/weather?city=Tokyo` など） |
| `src/lib/weather.ts` | OpenWeatherMap から天気を取得し、日付ごとにまとめる |
| `src/lib/warnings.ts` | 気象庁から警報・注意報を取得する |
| `src/lib/clothing.ts` | 気温から服装のめやすを決める |
| `src/components/WeatherApp.tsx` | メイン画面（検索・現在地・天気の表示） |
| `src/components/Calendar.tsx` | 日付を選ぶカレンダー |
| `src/components/WeatherBackground.tsx` | 天気に合わせた背景（アニメーションは `src/app/globals.css`） |
| `scripts/notify-weather.ts` | Mac に天気を通知するスクリプト |

---

## 使っている技術

| 技術 | 役割 |
| --- | --- |
| [Next.js](https://nextjs.org/) 16 | 画面と API サーバーをまとめて作れるフレームワーク |
| [React](https://react.dev/) 19 | 画面を部品（コンポーネント）に分けて作るためのライブラリ |
| [TypeScript](https://www.typescriptlang.org/) | 型（データの形）をチェックできる JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) 4 | クラス名を並べてデザインを指定する CSS のしくみ |
| [Vercel](https://vercel.com/) | アプリの公開（ホスティング） |

---

## データの出典

- 天気データ: [OpenWeatherMap](https://openweathermap.org/)
- 警報・注意報: [気象庁ホームページ](https://www.jma.go.jp/)
- 市区町村の判定: [国土地理院](https://www.gsi.go.jp/)

> 避難指示などの避難情報は市区町村が発令するもので、このアプリでは表示していません。
> テレビ・ラジオ、市区町村のホームページや防災アプリで確認してください。

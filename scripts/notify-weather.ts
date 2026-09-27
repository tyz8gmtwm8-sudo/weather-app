// 今日の天気と服装のめやすを、Mac のデスクトップ通知で知らせるスクリプトです。
// 毎朝8時に launchd（Mac の自動実行のしくみ）から実行されます。
// 手動で試すとき: npm run notify

import { execFileSync } from "node:child_process";
import path from "node:path";
import { getWeather } from "../src/lib/weather.ts";
import { getClothingAdvice } from "../src/lib/clothing.ts";

/** Mac のデスクトップに通知を出します */
function showNotification(title: string, subtitle: string, message: string) {
  // 文字列は引数 (argv) として渡します。
  // コマンドの中に直接埋め込むと、「"」などの記号が入ったときに壊れてしまうためです。
  execFileSync("osascript", [
    "-e", "on run argv",
    "-e", "display notification (item 3 of argv) with title (item 1 of argv) subtitle (item 2 of argv)",
    "-e", "end run",
    title,
    subtitle,
    message,
  ]);
}

async function main() {
  // API キーなどの設定を .env.local から読み込みます
  // （自動実行のときは作業フォルダが違うので、このファイルの場所を基準に探します）
  process.loadEnvFile(path.join(import.meta.dirname, "..", ".env.local"));

  // 通知する都市（.env.local の NOTIFY_CITY で変更できます）
  const city = process.env.NOTIFY_CITY || "Tokyo";

  try {
    const weather = await getWeather({ city });
    // 今日の予報を探します（見つからなければ一番近い日の予報を使います）
    const day = weather.daily.find((d) => d.date === weather.today) ?? weather.daily[0];
    const advice = getClothingAdvice(day.tempMax, day.tempMin, day.pop);

    const title = `🌤 ${weather.location.name}の天気`;
    const subtitle = `${day.description}  最高${day.tempMax}℃ / 最低${day.tempMin}℃  ☔${day.pop}%`;
    const message = [
      `${advice.emoji} ${advice.title}（${advice.items.join("、")}）`,
      ...advice.tips,
    ].join("\n");

    showNotification(title, subtitle, message);
    console.log(`[${new Date().toLocaleString("ja-JP")}] 通知しました: ${subtitle}`);
  } catch (err) {
    // 失敗したことに気づけるよう、エラーも通知します
    const message = err instanceof Error ? err.message : String(err);
    showNotification("⚠️ 天気の通知に失敗しました", city, message);
    console.error(`[${new Date().toLocaleString("ja-JP")}] エラー:`, message);
    process.exitCode = 1;
  }
}

main();

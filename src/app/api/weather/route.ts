// ブラウザから呼び出す API ルートです（URL: /api/weather）
// 使い方:
//   /api/weather?city=Tokyo        … 都市名で検索
//   /api/weather?lat=35.6&lon=139.7 … 緯度・経度（現在地）で検索
//
// ブラウザ → この API（サーバー） → OpenWeatherMap の順に通信するので、
// API キーがブラウザ側に送られることはありません。

import { NextRequest, NextResponse } from "next/server";
import { getWeather, WeatherApiError, type LocationQuery } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const city = params.get("city")?.trim();
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));

  // 入力内容から検索条件を決めます
  let query: LocationQuery;
  if (city) {
    query = { city };
  } else if (params.has("lat") && params.has("lon") && Number.isFinite(lat) && Number.isFinite(lon)) {
    query = { lat, lon };
  } else {
    return NextResponse.json({ error: "都市名または現在地を指定してください" }, { status: 400 });
  }

  try {
    const data = await getWeather(query);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof WeatherApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'

// メモリキャッシュ（本番環境ではRedisなどを使用）
const subtitleCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

export interface Subtitle {
  start: number
  end: number
  text: string
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')
    .replace(/\[.*?\]/g, '') // [音楽] などの注釈を削除
    .replace(/\(.*?\)/g, '') // (笑い) などの注釈を削除
    .trim()
}

function formatSubtitles(transcript: any[]): Subtitle[] {
  return transcript.map(item => ({
    start: item.start, // youtube-captions-scraperは既に秒単位
    end: item.start + item.dur,
    text: cleanText(item.text)
  }))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

    if (!videoId) {
      return NextResponse.json(
        { error: '動画IDが必要です' },
        { status: 400 }
      )
    }

    // 準備完了の日本語字幕をチェック
    const readyKey = `${videoId}-ja-ready`
    const readyCache = subtitleCache.get(readyKey)
    if (readyCache && Date.now() - readyCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        videoId,
        japanese: readyCache.data,
        hasJapaneseSubtitles: readyCache.data.length > 0,
        source: 'cache-ready'
      })
    }

    // 通常のキャッシュをチェック
    const cacheKey = `${videoId}-ja`
    const cached = subtitleCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        videoId,
        japanese: cached.data,
        hasJapaneseSubtitles: cached.data.length > 0,
        source: 'cache'
      })
    }

    // 日本語字幕を取得（模擬データで対応）
    try {
      console.log(`日本語字幕取得開始: ${videoId} (模擬データ対応)`)
      
      // 現在はYouTubeの制限により、模擬字幕を返す
      const mockSubtitles = [
        { start: 0, dur: 3, text: "YouTube字幕APIの制限により" },
        { start: 3, dur: 4, text: "字幕の自動取得ができません。" },
        { start: 7, dur: 5, text: "今後、YouTube Data API v3を使用した" },
        { start: 12, dur: 4, text: "実装を検討しています。" }
      ]
      
      console.log("模擬字幕データ:", mockSubtitles);
      const formattedSubtitles = formatSubtitles(mockSubtitles)
      console.log("整形後の字幕：", formattedSubtitles);
      // キャッシュに保存
      subtitleCache.set(cacheKey, {
        data: formattedSubtitles,
        timestamp: Date.now()
      })
      
      console.log(`日本語字幕取得成功: ${formattedSubtitles.length}件 (模擬データ)`)
      
      return NextResponse.json({
        videoId,
        japanese: formattedSubtitles,
        hasJapaneseSubtitles: formattedSubtitles.length > 0,
        subtitleType: '模擬データ',
        source: 'api'
      })
    } catch (error) {
      console.log('日本語字幕が見つからないため、英語字幕の翻訳を試行...')
      
      // 英語字幕から翻訳を試行
      try {
        const englishCacheKey = `${videoId}-en`
        let englishSubtitles = []
        
        // 英語字幕のキャッシュをチェック
        const englishCached = subtitleCache.get(englishCacheKey)
        if (englishCached && Date.now() - englishCached.timestamp < CACHE_DURATION) {
          englishSubtitles = englishCached.data
        } else {
          // 英語字幕を取得（模擬データ）
          const mockEnglishSubtitles = [
            { start: 0, dur: 3, text: "Due to YouTube API restrictions" },
            { start: 3, dur: 4, text: "automatic subtitle fetching is not available." },
            { start: 7, dur: 5, text: "We are considering implementation with" },
            { start: 12, dur: 4, text: "YouTube Data API v3 in the future." }
          ]
          englishSubtitles = formatSubtitles(mockEnglishSubtitles)
        }
        
        if (englishSubtitles.length > 0) {
          // 翻訳は時間がかかるので、バックグラウンドで処理
          console.log('英語字幕を取得しました。翻訳は別途実行予定。')
          
          return NextResponse.json({
            videoId,
            japanese: [],
            hasJapaneseSubtitles: false,
            source: 'translation-pending',
            message: '日本語字幕は英語字幕からの翻訳が必要です'
          })
        }
      } catch (englishError) {
        console.error('英語字幕の取得も失敗:', englishError)
      }
      
      return NextResponse.json({
        videoId,
        japanese: [],
        hasJapaneseSubtitles: false,
        source: 'none',
        error: '日本語字幕が利用できません'
      })
    }
  } catch (error) {
    console.error('日本語字幕API エラー:', error)
    return NextResponse.json(
      { 
        error: '日本語字幕の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}
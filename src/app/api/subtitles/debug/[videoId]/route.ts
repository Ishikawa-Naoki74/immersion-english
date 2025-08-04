import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

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

    console.log(`デバッグ情報取得開始: ${videoId}`)

    // 利用可能な字幕の詳細情報を取得
    const transcriptList = await (YoutubeTranscript as any).listTranscripts(videoId)
    
    console.log('取得した字幕情報:', transcriptList)

    // 各言語の詳細情報を整理
    const debugInfo: any = {
      videoId,
      manual: transcriptList.manual || {},
      generated: transcriptList.generated || {},
      manualLanguages: Object.keys(transcriptList.manual || {}),
      generatedLanguages: Object.keys(transcriptList.generated || {}),
      allAvailableLanguages: [
        ...Object.keys(transcriptList.manual || {}),
        ...Object.keys(transcriptList.generated || {})
      ]
    }

    // 実際に英語字幕を取得してみる
    try {
      const englishTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      debugInfo.englishSampleCount = englishTranscript.length
      debugInfo.englishSample = englishTranscript.slice(0, 3).map(item => ({
        start: item.offset / 1000,
        end: (item.offset + item.duration) / 1000,
        text: item.text
      }))
    } catch (englishError) {
      debugInfo.englishError = englishError instanceof Error ? englishError.message : String(englishError)
    }

    // 日本語字幕の取得を試す
    try {
      const japaneseTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' })
      debugInfo.japaneseSampleCount = japaneseTranscript.length
      debugInfo.japaneseSample = japaneseTranscript.slice(0, 3).map(item => ({
        start: item.offset / 1000,
        end: (item.offset + item.duration) / 1000,
        text: item.text
      }))
    } catch (japaneseError) {
      debugInfo.japaneseError = japaneseError instanceof Error ? japaneseError.message : String(japaneseError)
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error('デバッグAPI エラー:', error)
    return NextResponse.json(
      { 
        error: 'デバッグ情報の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
        videoId: params.videoId
      },
      { status: 500 }
    )
  }
}
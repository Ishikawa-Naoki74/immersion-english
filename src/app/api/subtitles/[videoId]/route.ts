import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export interface Subtitle {
  start: number
  end: number
  text: string
}

export interface AvailableLanguage {
  language: string
  languageName: string
  isGenerated: boolean
  isTranslatable: boolean
}

// メモリキャッシュ（本番環境ではRedisなどを使用）
const subtitleCache = new Map<string, { data: any, timestamp: number }>()
const languageCache = new Map<string, { data: AvailableLanguage[], timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

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
    start: item.offset / 1000, // ミリ秒を秒に変換
    end: (item.offset + item.duration) / 1000,
    text: cleanText(item.text)
  }))
}

// 利用可能な字幕言語を詳細に取得（エラーメッセージから言語を抽出）
async function getAvailableLanguages(videoId: string): Promise<AvailableLanguage[]> {
  console.log(`利用可能言語取得開始: ${videoId}`)
  const cacheKey = `lang-${videoId}`
  
  // キャッシュチェック
  const cached = languageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`キャッシュから利用可能言語を取得: ${cached.data.length}言語`)
    return cached.data
  }

  const availableLanguages: AvailableLanguage[] = []
  
  // より多くの言語を試行（地域コード含む）
  const testLanguages = [
    'en', 'en-US', 'en-GB', 'en-CA', 'en-AU',
    'ja', 'ja-JP', 
    'ko', 'ko-KR',
    'zh', 'zh-CN', 'zh-TW', 'zh-HK',
    'es', 'es-ES', 'es-MX',
    'fr', 'fr-FR', 'fr-CA',
    'de', 'de-DE',
    'it', 'it-IT',
    'pt', 'pt-BR', 'pt-PT',
    'ru', 'ru-RU',
    'ar', 'hi', 'th', 'vi'
  ]

  console.log(`${testLanguages.length}言語を順次テスト中...`)
  
  for (const lang of testLanguages) {
    try {
      console.log(`言語テスト: ${lang}`)
      const subtitles = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      
      if (subtitles && subtitles.length > 0) {
        console.log(`✅ 言語 ${lang} が利用可能: ${subtitles.length}字幕`)
        availableLanguages.push({
          language: lang,
          languageName: lang,
          isGenerated: true, // 実際の判定は困難なので、すべて自動生成として扱う
          isTranslatable: true // 翻訳可能として扱う
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`❌ 言語 ${lang}: ${errorMessage}`)
      
      // エラーメッセージから利用可能言語を抽出
      if (errorMessage.includes('Available languages:')) {
        const match = errorMessage.match(/Available languages: (.+)/)
        if (match) {
          const suggestedLangs = match[1].split(/[,\s]+/).filter(l => l.trim())
          console.log(`エラーメッセージから検出された言語: ${suggestedLangs.join(', ')}`)
          
          // 検出された言語を試行
          for (const suggestedLang of suggestedLangs) {
            if (!availableLanguages.find(al => al.language === suggestedLang)) {
              try {
                console.log(`検出言語を試行: ${suggestedLang}`)
                const suggestedSubtitles = await YoutubeTranscript.fetchTranscript(videoId, { lang: suggestedLang })
                if (suggestedSubtitles && suggestedSubtitles.length > 0) {
                  console.log(`✅ 検出言語 ${suggestedLang} が利用可能: ${suggestedSubtitles.length}字幕`)
                  availableLanguages.push({
                    language: suggestedLang,
                    languageName: suggestedLang,
                    isGenerated: true,
                    isTranslatable: true
                  })
                }
              } catch (suggestedError) {
                console.log(`❌ 検出言語 ${suggestedLang} は利用不可`)
              }
            }
          }
        }
      }
    }
    
    // 見つかった言語が十分ある場合は早期終了
    if (availableLanguages.length >= 3) {
      console.log('十分な言語が見つかったため、テストを早期終了')
      break
    }
  }
  
  console.log(`利用可能言語検出完了: ${availableLanguages.length}言語`)
  availableLanguages.forEach(lang => {
    console.log(`- ${lang.language} (${lang.languageName})`)
  })
  
  // キャッシュに保存
  languageCache.set(cacheKey, {
    data: availableLanguages,
    timestamp: Date.now()
  })
  
  return availableLanguages
}

// 字幕の翻訳処理
async function translateSubtitles(subtitles: Subtitle[]): Promise<Subtitle[]> {
  try {
    // バッチ処理で翻訳（5件ずつ処理）
    const batchSize = 5
    const translatedSubtitles: Subtitle[] = []
    
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize)
      const translationPromises = batch.map(async (subtitle) => {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: subtitle.text,
              targetLang: 'ja',
              sourceLang: 'en'
            })
          })
          
          if (!response.ok) {
            throw new Error(`翻訳APIエラー: ${response.status}`)
          }
          
          const data = await response.json()
          return {
            ...subtitle,
            text: data.translatedText || subtitle.text
          }
        } catch (error) {
          console.error('個別翻訳エラー:', error)
          return subtitle // 翻訳失敗時は元のテキストを返す
        }
      })
      
      const batchTranslated = await Promise.all(translationPromises)
      translatedSubtitles.push(...batchTranslated)
      
      // API制限を考慮して少し待機
      if (i + batchSize < subtitles.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return translatedSubtitles
  } catch (error) {
    console.error('字幕翻訳エラー:', error)
    return subtitles // 翻訳失敗時は元の字幕を返す
  }
}

// 高速版の字幕取得（youtube-captions-scraper使用）
async function getYouTubeSubtitlesQuick(videoId: string, lang: string = 'en'): Promise<Subtitle[]> {
  console.log(`高速字幕取得開始: ${videoId}, 言語: ${lang}`)
  const cacheKey = `${videoId}-${lang}`
  
  // キャッシュチェック
  const cached = subtitleCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`キャッシュから字幕取得: ${videoId}, 言語: ${lang}, ${cached.data.length}件`)
    return cached.data
  }

  try {
    console.log(`youtube-transcriptで字幕取得中: ${videoId}, ${lang}`)
    
    // タイムアウト付きでリクエスト実行
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API_TIMEOUT')), 300000) // 5分でタイムアウト
    })
    
    const fetchPromise = YoutubeTranscript.fetchTranscript(videoId, {
      lang: lang
    })
    
    console.log('字幕取得リクエスト送信完了、レスポンス待機中...')
    
    // レース条件でタイムアウト制御
    const transcript = await Promise.race([fetchPromise, timeoutPromise])
    
    console.log(`字幕データ取得完了: ${transcript.length}件の字幕`)
    
    const formattedSubtitles = formatSubtitles(transcript)
    
    console.log(`字幕フォーマット完了: ${formattedSubtitles.length}件`)
    
    // キャッシュに保存
    subtitleCache.set(cacheKey, {
      data: formattedSubtitles,
      timestamp: Date.now()
    })
    
    console.log(`字幕取得成功: ${formattedSubtitles.length}件 (${lang})`)
    return formattedSubtitles
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`字幕取得エラー (${lang}):`, errorMessage)
    
    // エラーの種類に応じた詳細ログ
    if (errorMessage === 'API_TIMEOUT') {
      console.error(`タイムアウト: ${videoId} の ${lang} 字幕取得が5分を超過`)
    } else if (errorMessage.includes('Video unavailable')) {
      console.error(`動画利用不可: ${videoId} はプライベートまたは削除済み`)
    } else if (errorMessage.includes('No transcript')) {
      console.error(`字幕なし: ${videoId} に ${lang} 字幕が存在しない`)
    } else {
      console.error(`その他のエラー: ${errorMessage}`)
    }
    
    return []
  }
}

async function getYouTubeSubtitles(videoId: string, lang: string = 'en'): Promise<Subtitle[]> {
  console.log(`詳細字幕取得開始: ${videoId}, 言語: ${lang}`)
  const cacheKey = `${videoId}-${lang}`
  
  // キャッシュチェック
  const cached = subtitleCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`キャッシュから詳細字幕取得: ${cached.data.length}件`)
    return cached.data
  }

  try {
    console.log('最初に利用可能な言語を確認...')
    // 最初に利用可能な言語を確認
    const availableLanguages = await getAvailableLanguages(videoId)
    const requestedLang = availableLanguages.find(l => 
      l.language === lang || 
      l.language.startsWith(lang) || 
      lang.startsWith(l.language)
    )
    
    if (!requestedLang) {
      console.warn(`言語 ${lang} は利用できません。利用可能: ${availableLanguages.map(l => l.language).join(', ')}`)
      return []
    }
    
    console.log(`字幕取得開始: ${videoId}, 言語: ${requestedLang.language}, 生成: ${requestedLang.isGenerated}`)
    
    // youtube-transcriptで字幕取得
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API_TIMEOUT')), 300000) // 5分でタイムアウト
    })
    
    const fetchPromise = YoutubeTranscript.fetchTranscript(videoId, {
      lang: requestedLang.language
    })
    
    console.log('詳細字幕取得リクエスト送信完了、レスポンス待機中...')
    
    const transcript = await Promise.race([fetchPromise, timeoutPromise])
    
    console.log(`詳細字幕データ取得完了: ${transcript.length}件の字幕`)
    
    const formattedSubtitles = formatSubtitles(transcript)
    
    console.log(`詳細字幕フォーマット完了: ${formattedSubtitles.length}件`)
    
    // キャッシュに保存
    subtitleCache.set(cacheKey, {
      data: formattedSubtitles,
      timestamp: Date.now()
    })
    
    console.log(`詳細字幕取得成功: ${formattedSubtitles.length}件の字幕`)
    return formattedSubtitles
  } catch (error) {
    console.error(`詳細字幕取得エラー (${lang}):`, error)
    
    // 日本語翻訳の試行（英語字幕から自動翻訳）
    if (lang === 'ja' || lang === 'ja-JP') {
      console.log('日本語字幕が見つからないため、英語字幕の翻訳を試行...')
      try {
        const englishSubtitles = await getYouTubeSubtitles(videoId, 'en')
        if (englishSubtitles.length > 0) {
          console.log('英語字幕を取得しました。翻訳を開始...')
          
          // 翻訳処理（バッチ処理で効率化）
          const translatedSubtitles = await translateSubtitles(englishSubtitles)
          
          // 翻訳された字幕をキャッシュに保存
          subtitleCache.set(cacheKey, {
            data: translatedSubtitles,
            timestamp: Date.now()
          })
          
          console.log(`翻訳完了: ${translatedSubtitles.length}件の字幕`)
          return translatedSubtitles
        }
      } catch (englishError) {
        console.error('英語字幕の取得も失敗:', englishError)
      }
    }
    
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    console.log('=== 字幕API リクエスト開始 ===')
    const { videoId } = params
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'all'

    console.log(`動画ID: ${videoId}, 言語: ${lang}`)

    if (!videoId) {
      console.error('動画IDが未指定')
      return NextResponse.json(
        { error: '動画IDが必要です' },
        { status: 400 }
      )
    }

    if (lang === 'all') {
      console.log(`全言語字幕取得モード開始: ${videoId}`)
      
      try {
        console.log('利用可能言語の取得を開始...')
        // まず利用可能言語をチェック
        const availableLanguages = await getAvailableLanguages(videoId)
        console.log(`利用可能言語取得完了: ${availableLanguages.length}言語`)
        
        let englishSubs: Subtitle[] = []
        let japaneseSubs: Subtitle[] = []
        
        // 英語字幕を取得
        const hasEnglish = availableLanguages.some(lang => 
          lang.language === 'en' || lang.language.startsWith('en')
        )
        
        if (hasEnglish) {
          console.log('英語字幕を取得中...')
          englishSubs = await getYouTubeSubtitlesQuick(videoId, 'en')
          console.log(`英語字幕取得完了: ${englishSubs.length}件`)
        } else {
          console.log('英語字幕が利用できません')
        }
        
        // 日本語字幕を取得
        const hasJapanese = availableLanguages.some(lang => 
          lang.language === 'ja' || lang.language.startsWith('ja')
        )
        
        if (hasJapanese) {
          console.log('日本語字幕を取得中...')
          japaneseSubs = await getYouTubeSubtitlesQuick(videoId, 'ja')
          console.log(`日本語字幕取得完了: ${japaneseSubs.length}件`)
        } else if (englishSubs.length > 0) {
          console.log('日本語字幕が無いため、英語字幕を翻訳中...')
          japaneseSubs = await translateSubtitles(englishSubs)
          console.log(`英語->日本語翻訳完了: ${japaneseSubs.length}件`)
        }
        
        // 字幕が全く取得できない場合は音声認識を提案
        const noSubtitlesAvailable = englishSubs.length === 0 && japaneseSubs.length === 0 && availableLanguages.length === 0
        
        const baseResult = {
          videoId,
          english: englishSubs,
          japanese: japaneseSubs,
          availableLanguages,
          hasEnglishSubtitles: englishSubs.length > 0,
          hasJapaneseSubtitles: japaneseSubs.length > 0,
          loadingJapanese: false,
          errors: {
            english: !hasEnglish && englishSubs.length === 0 ? '英語字幕が利用できません' : null,
            japanese: !hasJapanese && japaneseSubs.length === 0 ? '日本語字幕が利用できません' : null
          },
          speechToTextAvailable: noSubtitlesAvailable,
          suggestions: noSubtitlesAvailable ? {
            speechToText: '字幕が設定されていません。音声認識機能を使用して字幕を生成できます。',
            audioFormats: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'],
            apiEndpoint: `/api/speech-to-text`
          } : null
        }

        console.log('完全なレスポンス返却準備完了')
        return NextResponse.json(baseResult)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー'
        console.error('高速字幕取得エラー:', errorMessage)
        
        // エラーの詳細分析
        let specificError = errorMessage
        if (errorMessage === 'API_TIMEOUT') {
          specificError = 'YouTube字幕APIのレスポンスがタイムアウトしました（5分）'
        } else if (errorMessage.includes('Video unavailable')) {
          specificError = 'この動画は利用できません（プライベート・削除済み・地域制限）'
        } else if (errorMessage.includes('No transcript')) {
          specificError = 'この動画には字幕が設定されていません'
        } else if (errorMessage.includes('network')) {
          specificError = 'ネットワーク接続に問題があります'
        }
        
        console.log('エラーレスポンス返却')
        return NextResponse.json({
          videoId,
          english: [],
          japanese: [],
          availableLanguages: [],
          hasEnglishSubtitles: false,
          hasJapaneseSubtitles: false,
          errors: {
            english: specificError,
            japanese: null
          },
          debugInfo: {
            originalError: errorMessage,
            timestamp: new Date().toISOString(),
            videoId: videoId
          }
        })
      }
    } else {
      console.log(`特定言語字幕取得モード: ${lang}`)
      // 特定の言語のみ取得
      const subtitles = await getYouTubeSubtitles(videoId, lang)
      
      console.log(`特定言語字幕取得完了: ${subtitles.length}件`)
      
      return NextResponse.json({
        videoId,
        language: lang,
        subtitles,
        hasSubtitles: subtitles.length > 0
      })
    }
  } catch (error) {
    console.error('字幕API 全体エラー:', error)
    return NextResponse.json(
      { 
        error: '字幕の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}

// キャッシュクリア用のDELETEエンドポイント
export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang')

    if (lang) {
      subtitleCache.delete(`${videoId}-${lang}`)
    } else {
      // 全言語のキャッシュを削除
      const keysToDelete = Array.from(subtitleCache.keys()).filter(key => 
        key.startsWith(`${videoId}-`)
      )
      keysToDelete.forEach(key => subtitleCache.delete(key))
    }

    return NextResponse.json({ message: 'キャッシュが削除されました' })
  } catch (error) {
    console.error('キャッシュ削除エラー:', error)
    return NextResponse.json(
      { error: 'キャッシュの削除に失敗しました' },
      { status: 500 }
    )
  }
}
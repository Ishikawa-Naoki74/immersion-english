import { NextRequest, NextResponse } from 'next/server'

// 複数の翻訳APIを使用した信頼性の高い翻訳システム
async function translateText(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  console.log(`翻訳開始: "${text.slice(0, 50)}..." (${sourceLang} -> ${targetLang})`)
  
  // 1. Google Translate Web API（非公式だが高品質）
  try {
    const googleTranslation = await translateWithGoogle(text, targetLang, sourceLang)
    if (googleTranslation && googleTranslation !== text) {
      console.log('Google翻訳成功')
      return googleTranslation
    }
  } catch (error) {
    console.log('Google翻訳失敗:', (error as Error).message)
  }

  // 2. MyMemory API（フォールバック）
  try {
    const myMemoryTranslation = await translateWithMyMemory(text, targetLang, sourceLang)
    if (myMemoryTranslation && myMemoryTranslation !== text) {
      console.log('MyMemory翻訳成功')
      return myMemoryTranslation
    }
  } catch (error) {
    console.log('MyMemory翻訳失敗:', (error as Error).message)
  }

  // 3. 辞書ベース翻訳（最後のフォールバック）
  if ((sourceLang === 'en' || sourceLang === 'auto') && (targetLang === 'ja' || targetLang === 'ja-JP')) {
    console.log('辞書ベース翻訳を試行')
    const dictionaryTranslation = translateWithDictionary(text)
    if (dictionaryTranslation !== text) {
      console.log('辞書翻訳成功')
      return dictionaryTranslation
    }
  }

  console.log('全ての翻訳方法が失敗、元のテキストを返す')
  return text
}

// Google Translate Web API
async function translateWithGoogle(text: string, targetLang: string, sourceLang: string): Promise<string> {
  const url = 'https://translate.googleapis.com/translate_a/single'
  const params = new URLSearchParams({
    client: 'gtx',
    sl: sourceLang,
    tl: targetLang,
    dt: 't',
    q: text
  })

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(10000) // 10秒タイムアウト
  })

  if (!response.ok) {
    throw new Error(`Google Translate API エラー: ${response.status}`)
  }

  const data = await response.json()
  
  if (data && data[0] && Array.isArray(data[0])) {
    return data[0]
      .map((item: any) => item[0])
      .filter((text: string) => text)
      .join('')
  }

  throw new Error('Google翻訳レスポンスの形式が不正です')
}

// MyMemory API
async function translateWithMyMemory(text: string, targetLang: string, sourceLang: string): Promise<string> {
  const langPair = sourceLang === 'auto' ? `en|${targetLang}` : `${sourceLang}|${targetLang}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000) // 10秒タイムアウト
  })

  if (!response.ok) {
    throw new Error(`MyMemory API エラー: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText
  }

  throw new Error('MyMemory翻訳に失敗しました')
}

// 辞書ベース翻訳（英語→日本語）
function translateWithDictionary(text: string): string {
  const dictionary: { [key: string]: string } = {
    // 基本単語
    'hello': 'こんにちは',
    'hi': 'こんにちは',
    'thank you': 'ありがとう',
    'thanks': 'ありがとう',
    'yes': 'はい',
    'no': 'いいえ',
    'please': 'お願いします',
    'sorry': 'すみません',
    'excuse me': 'すみません',
    
    // 形容詞
    'good': '良い',
    'bad': '悪い',
    'big': '大きい',
    'small': '小さい',
    'large': '大きい',
    'little': '小さい',
    'new': '新しい',
    'old': '古い',
    'young': '若い',
    'happy': '幸せな',
    'sad': '悲しい',
    'beautiful': '美しい',
    'ugly': '醜い',
    'fast': '速い',
    'slow': '遅い',
    'hot': '暑い',
    'cold': '寒い',
    'warm': '暖かい',
    'cool': '涼しい',
    
    // 時間
    'today': '今日',
    'tomorrow': '明日',
    'yesterday': '昨日',
    'now': '今',
    'morning': '朝',
    'afternoon': '午後',
    'evening': '夕方',
    'night': '夜',
    'time': '時間',
    'hour': '時間',
    'minute': '分',
    'second': '秒',
    
    // 場所
    'here': 'ここ',
    'there': 'そこ',
    'where': 'どこ',
    'home': '家',
    'school': '学校',
    'work': '仕事',
    'office': 'オフィス',
    'station': '駅',
    'airport': '空港',
    'hospital': '病院',
    'restaurant': 'レストラン',
    'shop': '店',
    'store': '店',
    
    // 疑問詞
    'what': '何',
    'when': 'いつ',
    'who': '誰',
    'how': 'どのように',
    'why': 'なぜ',
    'which': 'どれ',
    
    // 動詞
    'go': '行く',
    'come': '来る',
    'see': '見る',
    'look': '見る',
    'watch': '見る',
    'listen': '聞く',
    'hear': '聞く',
    'speak': '話す',
    'talk': '話す',
    'say': '言う',
    'tell': '言う',
    'eat': '食べる',
    'drink': '飲む',
    'sleep': '寝る',
    'wake up': '起きる',
    'work': '働く',
    'study': '勉強する',
    'learn': '学ぶ',
    'teach': '教える',
    'help': '助ける',
    'love': '愛する',
    'like': '好き',
    'hate': '嫌い',
    'want': '欲しい',
    'need': '必要',
    'know': '知る',
    'understand': '理解する',
    'remember': '覚える',
    'forget': '忘れる'
  }

  let translated = text.toLowerCase()
  
  // 長いフレーズから先に置換
  const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length)
  
  for (const english of sortedKeys) {
    const japanese = dictionary[english]
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    translated = translated.replace(regex, japanese)
  }

  return translated
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = 'ja', sourceLang = 'auto' } = await request.json()

    console.log(`翻訳API リクエスト: ${sourceLang} -> ${targetLang}`)
    console.log(`テキスト: "${text?.slice(0, 100)}..."`)

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'テキストが長すぎます（5000文字以下）' },
        { status: 400 }
      )
    }

    const translatedText = await translateText(text, targetLang, sourceLang)

    console.log(`翻訳完了: "${translatedText.slice(0, 100)}..."`)

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      success: translatedText !== text
    })
  } catch (error) {
    console.error('翻訳API エラー:', error)
    return NextResponse.json(
      { 
        error: '翻訳に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}
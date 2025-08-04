import { NextRequest, NextResponse } from 'next/server'

// 音声認識による字幕生成API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const videoId = formData.get('videoId') as string
    const language = formData.get('language') as string || 'en'

    console.log(`音声認識リクエスト: 動画ID=${videoId}, 言語=${language}`)

    if (!audioFile) {
      return NextResponse.json(
        { error: '音声ファイルが必要です' },
        { status: 400 }
      )
    }

    if (!videoId) {
      return NextResponse.json(
        { error: '動画IDが必要です' },
        { status: 400 }
      )
    }

    console.log(`音声ファイル: ${audioFile.name}, サイズ: ${audioFile.size}バイト`)

    // 音声ファイルのバリデーション
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: '音声ファイルが大きすぎます（25MB以下）' },
        { status: 400 }
      )
    }

    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `サポートされていない音声形式です。対応形式: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 複数の音声認識サービスを試行
    let transcriptionResult = null

    // 1. OpenAI Whisper API（最も高精度）
    try {
      console.log('OpenAI Whisper APIで音声認識を試行...')
      transcriptionResult = await transcribeWithWhisper(audioFile, language)
      if (transcriptionResult) {
        console.log('Whisper API成功')
      }
    } catch (whisperError) {
      console.log('Whisper API失敗:', (whisperError as Error).message)
    }

    // 2. Google Cloud Speech-to-Text API（フォールバック）
    if (!transcriptionResult) {
      try {
        console.log('Google Cloud Speech-to-Text APIで音声認識を試行...')
        transcriptionResult = await transcribeWithGoogle(audioFile, language)
        if (transcriptionResult) {
          console.log('Google Speech API成功')
        }
      } catch (googleError) {
        console.log('Google Speech API失敗:', (googleError as Error).message)
      }
    }

    // 3. Web Speech API（クライアントサイドでの実装を推奨）
    if (!transcriptionResult) {
      return NextResponse.json({
        error: '音声認識に失敗しました',
        suggestion: 'ブラウザのWeb Speech APIを使用してください',
        fallbackOptions: {
          webSpeechAPI: true,
          manualUpload: true
        }
      }, { status: 503 })
    }

    console.log(`音声認識完了: ${transcriptionResult.text?.length || 0}文字`)

    // 字幕形式に変換
    const subtitles = formatTranscriptionToSubtitles(transcriptionResult)

    return NextResponse.json({
      videoId,
      language,
      transcription: transcriptionResult,
      subtitles,
      success: true,
      method: transcriptionResult.method || 'unknown'
    })

  } catch (error) {
    console.error('音声認識API エラー:', error)
    return NextResponse.json(
      { 
        error: '音声認識に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}

// OpenAI Whisper API
async function transcribeWithWhisper(audioFile: File, language: string) {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.log('OpenAI API キーが設定されていません')
    return null
  }

  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')
  formData.append('language', language === 'ja' ? 'ja' : 'en')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'word')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
    signal: AbortSignal.timeout(300000) // 5分タイムアウト
  })

  if (!response.ok) {
    throw new Error(`Whisper API エラー: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  return {
    text: data.text,
    segments: data.segments || [],
    words: data.words || [],
    language: data.language,
    method: 'whisper'
  }
}

// Google Cloud Speech-to-Text API
async function transcribeWithGoogle(audioFile: File, language: string) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  
  if (!apiKey) {
    console.log('Google Cloud API キーが設定されていません')
    return null
  }

  // 音声ファイルをBase64エンコード
  const audioBuffer = await audioFile.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString('base64')

  const requestBody = {
    config: {
      encoding: 'WEBM_OPUS', // 形式に応じて調整
      sampleRateHertz: 16000,
      languageCode: language === 'ja' ? 'ja-JP' : 'en-US',
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      model: 'video' // 動画音声に最適化
    },
    audio: {
      content: audioBase64
    }
  }

  const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(300000) // 5分タイムアウト
  })

  if (!response.ok) {
    throw new Error(`Google Speech API エラー: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.results || data.results.length === 0) {
    throw new Error('音声認識結果が空です')
  }

  const transcript = data.results
    .map((result: any) => result.alternatives[0].transcript)
    .join(' ')

  return {
    text: transcript,
    results: data.results,
    method: 'google'
  }
}

// 音声認識結果を字幕形式に変換
function formatTranscriptionToSubtitles(transcription: any) {
  const subtitles = []

  // Whisperの場合
  if (transcription.method === 'whisper' && transcription.segments) {
    for (const segment of transcription.segments) {
      subtitles.push({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim()
      })
    }
  }
  // Googleの場合
  else if (transcription.method === 'google' && transcription.results) {
    let currentTime = 0
    const avgWordsPerSecond = 2.5 // 平均的な話速

    for (const result of transcription.results) {
      const alternative = result.alternatives[0]
      const text = alternative.transcript
      const words = text.split(' ')
      const duration = words.length / avgWordsPerSecond

      subtitles.push({
        start: currentTime,
        end: currentTime + duration,
        text: text.trim()
      })

      currentTime += duration + 0.5 // 0.5秒の間隔
    }
  }
  // フォールバック: テキスト全体を時間分割
  else if (transcription.text) {
    const sentences = transcription.text.split(/[.!?。！？]+/).filter(s => s.trim())
    const avgDurationPerSentence = 3 // 3秒/文

    for (let i = 0; i < sentences.length; i++) {
      const start = i * avgDurationPerSentence
      const end = start + avgDurationPerSentence

      subtitles.push({
        start,
        end,
        text: sentences[i].trim()
      })
    }
  }

  return subtitles
}

// GET エンドポイント: サポート情報
export async function GET() {
  return NextResponse.json({
    message: '音声認識による字幕生成API',
    supportedFormats: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'],
    maxFileSize: '25MB',
    supportedLanguages: ['en', 'ja', 'es', 'fr', 'de', 'ko', 'zh'],
    methods: [
      {
        name: 'OpenAI Whisper',
        description: '高精度な音声認識（APIキー必要）',
        enabled: !!process.env.OPENAI_API_KEY
      },
      {
        name: 'Google Cloud Speech-to-Text',
        description: 'Google Cloudの音声認識（APIキー必要）',
        enabled: !!process.env.GOOGLE_CLOUD_API_KEY
      },
      {
        name: 'Web Speech API',
        description: 'ブラウザ内蔵の音声認識（クライアントサイド）',
        enabled: true
      }
    ]
  })
}
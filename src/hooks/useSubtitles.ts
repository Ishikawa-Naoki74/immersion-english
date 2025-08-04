import { useState, useEffect, useCallback, useRef } from 'react'

export interface Subtitle {
  start: number
  end: number
  text: string
}

export interface SubtitleData {
  videoId: string
  english: Subtitle[]
  japanese: Subtitle[]
  availableLanguages: any[]
  hasEnglishSubtitles: boolean
  hasJapaneseSubtitles: boolean
  loadingJapanese?: boolean
  subtitleTypes?: {
    english: '自動' | '手動' | null
    japanese: '自動' | '手動' | null
  }
  errors?: {
    english: string | null
    japanese: string | null
  }
}

export function useSubtitles(videoId: string | null) {
  const [subtitleData, setSubtitleData] = useState<SubtitleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const loadSubtitles = useCallback(async () => {
    if (!videoId || loading) return

    // 既存のリクエストがあればキャンセル
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    setLoading(true)
    setError(null)

    let timeoutId: NodeJS.Timeout | null = null
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      console.log('字幕読み込み開始（高速モード）')
      
      // より長いタイムアウト設定（開発環境では特に）
      const timeoutDuration = process.env.NODE_ENV === 'development' ? 600000 : 300000 // 開発時10分、本番5分
      
      timeoutId = setTimeout(() => {
        if (controllerRef.current === controller && isMountedRef.current) {
          console.log('手動タイムアウト発生')
          controller.abort()
        }
      }, timeoutDuration)

      const response = await fetch(`/api/subtitles/${videoId}?lang=all`, {
        signal: controller.signal
      })
      
      // コンポーネントがアンマウントされていたら処理を中止
      if (!isMountedRef.current) {
        console.log('コンポーネントがアンマウント済み、処理を中止')
        return
      }
      
      // 成功時にタイムアウトをクリア
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (!response.ok) {
        throw new Error(`字幕の取得に失敗しました: ${response.status}`)
      }

      const data: SubtitleData = await response.json()
      
      // 再度マウント状態を確認
      if (!isMountedRef.current) {
        console.log('コンポーネントがアンマウント済み、データ設定をスキップ')
        return
      }
      
      setSubtitleData(data)
      
      console.log('基本字幕データ取得完了', {
        english: data.hasEnglishSubtitles,
        japanese: data.hasJapaneseSubtitles,
        errors: data.errors,
        speechToTextAvailable: data.speechToTextAvailable
      })

      // 音声認識が利用可能な場合の通知
      if (data.speechToTextAvailable && data.suggestions) {
        console.log('音声認識機能が利用可能:', data.suggestions.speechToText)
      }

    } catch (err) {
      // タイムアウトの場合はクリーンアップ
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // コンポーネントがアンマウントされていたらエラー処理をスキップ
      if (!isMountedRef.current) {
        console.log('コンポーネントがアンマウント済み、エラー処理をスキップ')
        return
      }

      // AbortErrorの場合は特別な処理
      if (err instanceof Error && err.name === 'AbortError') {
        // 開発環境でのHot Reloadによる中断かどうかを判定
        if (process.env.NODE_ENV === 'development') {
          console.log('開発環境での中断（Hot Reload等）:', err.message)
          setError('開発環境でのリロードにより中断されました。再試行してください。')
        } else {
          console.warn('字幕読み込みタイムアウト:', err)
          setError('リクエストがタイムアウトしました。動画の字幕が利用できない可能性があります。')
        }
      } else {
        // サーバーからのエラーレスポンスを解析
        let errorMessage = err instanceof Error ? err.message : '字幕の読み込みに失敗しました'
        
        // より具体的なエラーメッセージを提供
        if (errorMessage.includes('timeout')) {
          errorMessage = 'YouTube字幕APIの応答が遅延しています。しばらく待ってから再試行してください。'
        } else if (errorMessage.includes('Video unavailable')) {
          errorMessage = 'この動画は利用できません（プライベート、削除済み、または地域制限）'
        } else if (errorMessage.includes('No transcript')) {
          errorMessage = 'この動画には字幕が設定されていません'
        } else if (errorMessage.includes('404')) {
          errorMessage = '動画が見つかりません。動画IDを確認してください。'
        } else if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'ネットワーク接続に問題があります。接続を確認してください。'
        }
        
        setError(errorMessage)
        console.error('字幕読み込みエラー:', err)
      }
    } finally {
      // コントローラーをクリア
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
      
      // マウントされている場合のみ状態を更新
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [videoId]) // loadingを依存関係から除外

  // 現在の時間に対応する字幕を取得
  const getCurrentSubtitle = useCallback((subtitles: Subtitle[], currentTime: number): Subtitle | null => {
    return subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end) || null
  }, [])

  // 字幕をクリックして動画の時間をジャンプ
  const jumpToSubtitle = useCallback((subtitle: Subtitle, player: any) => {
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(subtitle.start, true)
    }
  }, [])

  // 次の字幕に移動
  const goToNextSubtitle = useCallback((subtitles: Subtitle[], currentTime: number, player: any) => {
    const nextSubtitle = subtitles.find(sub => sub.start > currentTime)
    if (nextSubtitle && player) {
      jumpToSubtitle(nextSubtitle, player)
    }
  }, [jumpToSubtitle])

  // 前の字幕に移動
  const goToPreviousSubtitle = useCallback((subtitles: Subtitle[], currentTime: number, player: any) => {
    const previousSubtitles = subtitles.filter(sub => sub.start < currentTime)
    const previousSubtitle = previousSubtitles[previousSubtitles.length - 1]
    if (previousSubtitle && player) {
      jumpToSubtitle(previousSubtitle, player)
    }
  }, [jumpToSubtitle])

  // 時間をフォーマット
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 単語を配列に分割（コンポーネント側でレンダリング）
  const splitTextIntoWords = useCallback((text: string) => {
    return text.split(' ').map((word, index) => ({
      word,
      index,
      cleanWord: word.replace(/[^\w]/g, '')
    }))
  }, [])

  useEffect(() => {
    // マウント状態をリセット
    isMountedRef.current = true
    
    if (videoId) {
      loadSubtitles()
    }

    // クリーンアップ関数：コンポーネントがアンマウントされる時に実行
    return () => {
      isMountedRef.current = false
      if (controllerRef.current) {
        controllerRef.current.abort()
        controllerRef.current = null
      }
    }
  }, [videoId]) // loadSubtitlesを依存関係から除外して、無限ループを防ぐ

  // キャッシュクリア
  const clearCache = useCallback(async () => {
    if (!videoId) return

    try {
      await fetch(`/api/subtitles/${videoId}`, { method: 'DELETE' })
      setSubtitleData(null)
    } catch (error) {
      console.error('キャッシュクリアエラー:', error)
    }
  }, [videoId])

  return {
    subtitleData,
    loading,
    error,
    loadSubtitles,
    getCurrentSubtitle,
    jumpToSubtitle,
    goToNextSubtitle,
    goToPreviousSubtitle,
    formatTime,
    splitTextIntoWords,
    clearCache
  }
}
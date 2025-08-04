'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSubtitles, Subtitle } from '@/hooks/useSubtitles'

// インタラクティブテキストコンポーネント
function InteractiveText({ text, onWordClick }: { text: string, onWordClick?: (word: string) => void }) {
  if (!onWordClick) return <>{text}</>

  return (
    <>
      {text.split(' ').map((word, index) => (
        <span key={index}>
          <span
            onClick={() => onWordClick(word.replace(/[^\w]/g, ''))}
            className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 px-1 rounded transition-colors"
            title={`クリックして "${word}" を調べる`}
          >
            {word}
          </span>
          {index < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

interface SubtitlePlayerProps {
  videoId: string
  player: any
  onWordClick?: (word: string) => void
}

export default function SubtitlePlayer({ videoId, player, onWordClick }: SubtitlePlayerProps) {
  const {
    subtitleData,
    loading,
    error,
    getCurrentSubtitle,
    jumpToSubtitle,
    goToNextSubtitle,
    goToPreviousSubtitle,
    formatTime,
    splitTextIntoWords
  } = useSubtitles(videoId)

  const [currentTime, setCurrentTime] = useState(0)
  const [showEnglish, setShowEnglish] = useState(true)
  const [showJapanese, setShowJapanese] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout>()

  // プレイヤーの時間を監視
  useEffect(() => {
    if (player) {
      const updateTime = () => {
        try {
          const time = player.getCurrentTime()
          setCurrentTime(time)
        } catch (error) {
          // プレイヤーがまだ準備できていない場合
        }
      }

      intervalRef.current = setInterval(updateTime, 100) // 100msごとに更新

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [player])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!subtitleData) return

      switch (e.key.toLowerCase()) {
        case 'e':
          e.preventDefault()
          setShowEnglish(!showEnglish)
          break
        case 'j':
          e.preventDefault()
          setShowJapanese(!showJapanese)
          break
        case 'n':
          e.preventDefault()
          goToNextSubtitle(subtitleData.english, currentTime, player)
          break
        case 'p':
          e.preventDefault()
          goToPreviousSubtitle(subtitleData.english, currentTime, player)
          break
        case '1':
          e.preventDefault()
          if (player) player.setPlaybackRate(0.5)
          setPlaybackRate(0.5)
          break
        case '2':
          e.preventDefault()
          if (player) player.setPlaybackRate(1)
          setPlaybackRate(1)
          break
        case '3':
          e.preventDefault()
          if (player) player.setPlaybackRate(1.25)
          setPlaybackRate(1.25)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showEnglish, showJapanese, subtitleData, currentTime, player, goToNextSubtitle, goToPreviousSubtitle])

  const currentEnglishSubtitle = getCurrentSubtitle(subtitleData?.english || [], currentTime)
  const currentJapaneseSubtitle = getCurrentSubtitle(subtitleData?.japanese || [], currentTime)

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <div className="text-gray-900 font-medium">字幕を読み込み中...</div>
              <div className="text-sm text-gray-500 mt-1">高速読み込みで英語字幕を優先取得中</div>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-gray-100 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">字幕エラー</span>
          </div>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/subtitles/debug/${videoId}`)
                const debugInfo = await response.json()
                console.log('字幕デバッグ情報:', debugInfo)
                alert('デバッグ情報をコンソールに出力しました')
              } catch (err) {
                console.error('デバッグ情報取得エラー:', err)
              }
            }}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
          >
            デバッグ情報
          </button>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <p className="text-sm text-red-500 mt-1">
          この動画には字幕が利用できない可能性があります
        </p>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded transition-colors"
          >
            ページを再読み込み
          </button>
          <button
            onClick={() => {
              const newVideoId = prompt('動画IDを入力してください（YouTubeのURLの v= の後の部分）')
              if (newVideoId) {
                window.location.href = window.location.pathname.replace(/\/[^\/]+$/, `/${newVideoId}`)
              }
            }}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded transition-colors"
          >
            別の動画を試す
          </button>
        </div>
        <details className="mt-3">
          <summary className="text-sm text-red-600 cursor-pointer">トラブルシューティング</summary>
          <div className="mt-2 text-sm text-red-600 space-y-1">
            <p>• 動画に字幕が設定されていない可能性があります</p>
            <p>• プライベート動画や地域制限がある場合があります</p>
            <p>• 一時的なAPIエラーの可能性があります</p>
            <p>• デバッグ情報ボタンで詳細を確認してください</p>
          </div>
        </details>
      </div>
    )
  }

  if (!subtitleData || (!subtitleData.hasEnglishSubtitles && !subtitleData.hasJapaneseSubtitles)) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2 text-yellow-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">字幕なし</span>
        </div>
        <p className="text-yellow-600 mt-2">
          この動画には利用可能な字幕がありません
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* コントロールパネル */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 字幕切り替えボタン */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">字幕:</span>
            {subtitleData.hasEnglishSubtitles && (
              <button
                onClick={() => setShowEnglish(!showEnglish)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showEnglish 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                English
              </button>
            )}
            
            {/* 日本語字幕ボタン（読み込み状態対応） */}
            {(subtitleData.hasJapaneseSubtitles || subtitleData.loadingJapanese) && (
              <button
                onClick={() => setShowJapanese(!showJapanese)}
                disabled={!subtitleData.hasJapaneseSubtitles}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  showJapanese && subtitleData.hasJapaneseSubtitles
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                } ${!subtitleData.hasJapaneseSubtitles ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {subtitleData.loadingJapanese && !subtitleData.hasJapaneseSubtitles && (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>日本語</span>
              </button>
            )}
          </div>

          {/* 再生速度 */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">速度:</span>
            {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
              <button
                key={rate}
                onClick={() => {
                  if (player) player.setPlaybackRate(rate)
                  setPlaybackRate(rate)
                }}
                className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                  playbackRate === rate
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPreviousSubtitle(subtitleData.english, currentTime, player)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="前の字幕 (P)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goToNextSubtitle(subtitleData.english, currentTime, player)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="次の字幕 (N)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* キーボードショートカットの説明 */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-x-4">
            <span>E: 英語字幕</span>
            <span>J: 日本語字幕</span>
            <span>N: 次の字幕</span>
            <span>P: 前の字幕</span>
            <span>1-3: 再生速度</span>
          </div>
        </div>
      </div>

      {/* 現在の字幕表示 */}
      {(showEnglish || showJapanese) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">現在の字幕</h3>
          
          {showEnglish && (
            <div className="mb-4">
              <div className="text-sm text-blue-600 font-medium mb-2 flex items-center space-x-2">
                <span>English</span>
                {subtitleData?.subtitleTypes?.english && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    subtitleData.subtitleTypes.english === '自動' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {subtitleData.subtitleTypes.english}字幕
                  </span>
                )}
              </div>
              <div className="text-lg text-gray-900 bg-blue-50 p-4 rounded-lg border border-blue-200 min-h-[60px] flex items-center">
                {currentEnglishSubtitle ? (
                  <InteractiveText text={currentEnglishSubtitle.text} onWordClick={onWordClick} />
                ) : (
                  <span className="text-gray-400 italic">字幕なし</span>
                )}
              </div>
            </div>
          )}
          
          {showJapanese && (
            <div>
              <div className="text-sm text-green-600 font-medium mb-2 flex items-center space-x-2">
                <span>日本語</span>
                {subtitleData?.subtitleTypes?.japanese && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    subtitleData.subtitleTypes.japanese === '自動' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {subtitleData.subtitleTypes.japanese}字幕
                  </span>
                )}
              </div>
              <div className="text-lg text-gray-900 bg-green-50 p-4 rounded-lg border border-green-200 min-h-[60px] flex items-center">
                {currentJapaneseSubtitle ? (
                  currentJapaneseSubtitle.text
                ) : (
                  <span className="text-gray-400 italic">字幕なし</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 字幕一覧 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">字幕一覧</h3>
          <p className="text-sm text-gray-500 mt-1">
            クリックしてその時間にジャンプできます
          </p>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {subtitleData.english.map((subtitle, index) => (
              <div
                key={index}
                onClick={() => jumpToSubtitle(subtitle, player)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  currentEnglishSubtitle === subtitle
                    ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                    {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
                  </span>
                  {currentEnglishSubtitle === subtitle && (
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="text-xs font-medium">再生中</span>
                    </div>
                  )}
                </div>
                
                {showEnglish && (
                  <div className="text-sm text-gray-900 mb-2">
                    <span className="text-blue-600 font-medium">EN:</span>{' '}
                    <InteractiveText text={subtitle.text} onWordClick={onWordClick} />
                  </div>
                )}
                
                {showJapanese && subtitleData.japanese[index] && (
                  <div className="text-sm text-gray-900">
                    <span className="text-green-600 font-medium">JP:</span>{' '}
                    {subtitleData.japanese[index].text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
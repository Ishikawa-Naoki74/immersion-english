'use client'

import { useState } from 'react'
import YouTube from 'react-youtube'
import { YouTubeVideo } from '@/lib/youtube'

interface VideoPlayerProps {
  video: YouTubeVideo
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const [showEnglishCC, setShowEnglishCC] = useState(true)
  const [showJapaneseCC, setShowJapaneseCC] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const opts = {
    height: '400',
    width: '100%',
    playerVars: {
      autoplay: 0,
      cc_load_policy: showEnglishCC || showJapaneseCC ? 1 : 0,
      cc_lang_pref: showEnglishCC ? 'en' : showJapaneseCC ? 'ja' : 'en',
      playbackRate: playbackRate,
    },
  }

  const onReady = (event: any) => {
    const player = event.target
    if (playbackRate !== 1) {
      player.setPlaybackRate(playbackRate)
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
  }

  return (
    <div className="h-full">
      <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
        <YouTube
          videoId={video.id}
          opts={opts}
          onReady={onReady}
          className="w-full h-full"
        />
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{video.title}</h2>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">{video.channelTitle}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-6 6V8m0 2v2m0 0v2m0-2H9m2 0h2" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">字幕</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setShowEnglishCC(true)
                  setShowJapaneseCC(false)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showEnglishCC && !showJapaneseCC
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
英語
              </button>
              <button
                onClick={() => {
                  setShowEnglishCC(false)
                  setShowJapaneseCC(true)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  !showEnglishCC && showJapaneseCC
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
日本語
              </button>
              <button
                onClick={() => {
                  setShowEnglishCC(true)
                  setShowJapaneseCC(true)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showEnglishCC && showJapaneseCC
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
両方
              </button>
              <button
                onClick={() => {
                  setShowEnglishCC(false)
                  setShowJapaneseCC(false)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  !showEnglishCC && !showJapaneseCC
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
なし
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">再生速度</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    playbackRate === rate
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
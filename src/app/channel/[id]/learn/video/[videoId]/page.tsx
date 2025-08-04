'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Channel, Video } from '@/types'
import { getChannels, getVideos } from '@/lib/storage'
import SubtitlePlayer from '@/components/SubtitlePlayer'

// YouTubeコンポーネントを動的インポート（SSR対策）
const YouTube = dynamic(() => import('react-youtube') as any, { ssr: false })

interface VideoPlayerPageProps {
  params: {
    id: string
    videoId: string
  }
}


export default function VideoPlayerPage({ params }: VideoPlayerPageProps) {
  const router = useRouter()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<any>(null)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    loadVideoData()
  }, [params.id, params.videoId])

  const loadVideoData = () => {
    const channels = getChannels()
    const foundChannel = channels.find(c => c.id === params.id)
    
    if (!foundChannel) {
      router.push('/')
      return
    }
    
    const videos = getVideos(params.id)
    const foundVideo = videos.find(v => v.id === params.videoId)
    
    if (!foundVideo) {
      router.push(`/channel/${params.id}/learn`)
      return
    }
    
    setChannel(foundChannel)
    setVideo(foundVideo)
    setLoading(false)
  }

  // YouTube動画IDを抽出
  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  // 単語クリック時の処理
  const handleWordClick = useCallback((word: string) => {
    // 将来的には辞書APIなどを使用
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
    if (cleanWord) {
      alert(`"${cleanWord}" の意味を調べる機能は開発中です`)
      // 実装例: 辞書APIを呼び出して意味を表示
    }
  }, [])

  // プレイヤーの準備完了時
  const onReady = (event: any) => {
    setPlayer(event.target)
    setDuration(event.target.getDuration())
  }

  // 再生状態変更時
  const onStateChange = (event: any) => {
    setIsPlaying(event.data === 1) // 1 = playing
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!channel || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">動画が見つかりません</p>
        </div>
      </div>
    )
  }

  const youtubeVideoId = getYouTubeVideoId(video.url)

  if (!youtubeVideoId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">無効な動画URLです</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/channel/${params.id}/learn`)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={channel.iconUrl}
                  alt={channel.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{channel.name}</h1>
                <p className="text-sm text-gray-600">学習モード</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              字幕設定は下の字幕パネルで調整できます
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Video Player Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <YouTube
                {...({
                  videoId: youtubeVideoId,
                  opts: {
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 0,
                      controls: 1,
                      rel: 0,
                      showinfo: 0,
                      cc_load_policy: 0 // YouTube字幕を無効化（独自の字幕を使用）
                    },
                  },
                  onReady: onReady,
                  onStateChange: onStateChange,
                  className: "w-full h-full"
                } as any)}
              />
            </div>
            
            {/* Video Info */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>再生時間: {video.duration}</span>
                <span>追加日: {new Date(video.addedAt).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
          
          {/* Subtitle Player Component */}
          <SubtitlePlayer
            videoId={youtubeVideoId}
            player={player}
            onWordClick={handleWordClick}
          />
        </div>
      </div>
    </div>
  )
}
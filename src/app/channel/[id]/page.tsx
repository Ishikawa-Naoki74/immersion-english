'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Channel, Video } from '@/types'
import { getChannels, getVideos, saveVideo, generateId } from '@/lib/storage'

interface ChannelPageProps {
  params: {
    id: string
  }
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const router = useRouter()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoThumbnail, setNewVideoThumbnail] = useState('')
  const [newVideoDuration, setNewVideoDuration] = useState('')

  useEffect(() => {
    loadChannelData()
  }, [params.id])

  const loadChannelData = () => {
    const channels = getChannels()
    const foundChannel = channels.find(c => c.id === params.id)
    
    if (!foundChannel) {
      router.push('/')
      return
    }
    
    setChannel(foundChannel)
    setVideos(getVideos(params.id))
  }

  const navigateToVideoList = () => {
    router.push(`/channel/${params.id}/videos`)
  }

  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return

    const newVideo: Video = {
      id: generateId(),
      channelId: params.id,
      title: newVideoTitle.trim(),
      thumbnailUrl: newVideoThumbnail.trim() || 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
      duration: newVideoDuration.trim() || '10:00',
      url: newVideoUrl.trim(),
      addedAt: new Date().toISOString(),
    }

    saveVideo(newVideo)
    setNewVideoTitle('')
    setNewVideoUrl('')
    setNewVideoThumbnail('')
    setNewVideoDuration('')
    setShowAddVideo(false)
    loadChannelData()
  }

  const addSampleVideos = () => {
    const sampleVideos: Video[] = [
      {
        id: generateId(),
        channelId: params.id,
        title: 'How to learn English effectively',
        thumbnailUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        duration: '15:32',
        url: 'https://www.youtube.com/watch?v=nOpe7jEoWKA',
        addedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        channelId: params.id,
        title: 'English pronunciation tips',
        thumbnailUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        duration: '12:45',
        url: 'https://www.youtube.com/watch?v=nOpe7jEoWKA',
        addedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        channelId: params.id,
        title: 'Grammar essentials for beginners',
        thumbnailUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        duration: '18:20',
        url: 'https://www.youtube.com/watch?v=nOpe7jEoWKA',
        addedAt: new Date().toISOString(),
      }
    ]

    sampleVideos.forEach(video => saveVideo(video))
    loadChannelData()
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={channel.iconUrl}
                  alt={channel.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{channel.name}</h1>
                {channel.description && (
                  <p className="text-gray-600">{channel.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={navigateToVideoList}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>動画追加</span>
              </button>
              
              <button
                onClick={() => setShowAddVideo(true)}
                className="bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium border border-gray-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>手動追加</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(video => (
              <div
                key={video.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    追加日: {new Date(video.addedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">動画が登録されていません</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              このチャンネルで学習する動画を追加して、英語学習を始めましょう
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowAddVideo(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>最初の動画を追加</span>
              </button>
              <button
                onClick={addSampleVideos}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                サンプル動画を追加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">動画追加</h3>
              <button
                onClick={() => setShowAddVideo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">動画タイトル *</label>
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="例: How to learn English effectively"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL *</label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">サムネイルURL</label>
                <input
                  type="url"
                  value={newVideoThumbnail}
                  onChange={(e) => setNewVideoThumbnail(e.target.value)}
                  placeholder="https://i.ytimg.com/vi/.../mqdefault.jpg"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">動画時間</label>
                <input
                  type="text"
                  value={newVideoDuration}
                  onChange={(e) => setNewVideoDuration(e.target.value)}
                  placeholder="例: 15:32"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddVideo(false)}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!newVideoTitle.trim() || !newVideoUrl.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Channel, Video } from '@/types'
import { getChannels, saveVideo, generateId } from '@/lib/storage'
import { getChannelVideos, VideoSearchResult, YouTubeVideo } from '@/lib/videoSearch'

interface ChannelVideosPageProps {
  params: {
    id: string
  }
}

export default function ChannelVideosPage({ params }: ChannelVideosPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1')
  
  const [channel, setChannel] = useState<Channel | null>(null)
  const [videoSearchResult, setVideoSearchResult] = useState<VideoSearchResult>({
    videos: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [pageTokens, setPageTokens] = useState<Record<number, string>>({})

  useEffect(() => {
    loadChannelData()
  }, [params.id])

  useEffect(() => {
    if (channel) {
      loadVideos(currentPage)
    }
  }, [channel, currentPage])

  const loadChannelData = () => {
    const channels = getChannels()
    const foundChannel = channels.find(c => c.id === params.id)
    
    if (!foundChannel) {
      router.push('/')
      return
    }
    
    setChannel(foundChannel)
  }

  const loadVideos = async (page: number) => {
    if (!channel) return
    
    setLoading(true)
    try {
      const pageToken = pageTokens[page]
      const result = await getChannelVideos(channel.id, page, 30, pageToken)
      setVideoSearchResult(result)
      
      // 次のページのトークンを保存
      if (result.nextPageToken) {
        setPageTokens(prev => ({
          ...prev,
          [page + 1]: result.nextPageToken!
        }))
      }
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVideo = (youtubeVideo: YouTubeVideo) => {
    const newVideo: Video = {
      id: generateId(),
      channelId: params.id,
      title: youtubeVideo.title,
      thumbnailUrl: youtubeVideo.thumbnailUrl,
      duration: youtubeVideo.duration,
      url: youtubeVideo.url,
      addedAt: new Date().toISOString(),
    }

    saveVideo(newVideo)
    // 成功のフィードバックを表示（簡単な実装）
    alert('動画を追加しました！')
  }

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', page.toString())
    router.push(url.pathname + url.search)
  }

  const renderPagination = () => {
    const { currentPage, totalPages } = videoSearchResult
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        {/* 前へボタン */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          前へ
        </button>

        {/* ページ番号 */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 border rounded-lg text-sm font-medium ${
              page === currentPage
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* 次へボタン */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ
        </button>
      </div>
    )
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
                onClick={() => router.push(`/channel/${params.id}`)}
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
                <p className="text-gray-600">動画一覧から選択</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {videoSearchResult.totalResults > 0 && (
                <span>
                  {videoSearchResult.totalResults.toLocaleString()}件の動画 | 
                  ページ {videoSearchResult.currentPage} / {videoSearchResult.totalPages}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">動画を読み込み中...</span>
            </div>
          </div>
        ) : videoSearchResult.videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">動画が見つかりませんでした</h3>
            <p className="text-gray-500">このチャンネルには表示可能な動画がありません</p>
          </div>
        ) : (
          <>
            {/* Videos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoSearchResult.videos.map(video => (
                <div
                  key={video.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{video.viewCount}</span>
                      <span>{new Date(video.publishedAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <button
                      onClick={() => handleAddVideo(video)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                    >
                      学習リストに追加
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  )
}
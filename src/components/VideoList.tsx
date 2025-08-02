'use client'

import { YouTubeVideo } from '@/lib/youtube'
import Image from 'next/image'

interface VideoListProps {
  videos: YouTubeVideo[]
  onVideoSelect: (video: YouTubeVideo) => void
  selectedVideoId?: string
}

export default function VideoList({ videos, onVideoSelect, selectedVideoId }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">検索結果がありません</p>
        <p className="text-sm text-gray-400 mt-1">英語学習動画を検索してみてください</p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">検索結果</h3>
            <p className="text-sm text-gray-500">{videos.length}件の動画が見つかりました</p>
          </div>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => onVideoSelect(video)}
            className={`p-4 border-b border-gray-50 last:border-b-0 cursor-pointer transition-all duration-200 ${
              selectedVideoId === video.id 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 relative">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={120}
                  height={90}
                  className="rounded-xl object-cover shadow-sm"
                />
                {selectedVideoId === video.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-relaxed">
                  {video.title}
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12"/>
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">{video.channelTitle}</p>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {new Date(video.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
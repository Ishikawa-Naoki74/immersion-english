'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChannelSearchResult } from '@/types'
import { searchChannels } from '@/lib/channelSearch'

interface ChannelSearchBarProps {
  onChannelSelect: (channel: ChannelSearchResult) => void
}

export default function ChannelSearchBar({ onChannelSelect }: ChannelSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 初期表示時に人気チャンネルを表示
    loadInitialChannels()
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      
      try {
        const results = await searchChannels(searchQuery)
        setSearchResults(results)
      } catch (err) {
        setError('チャンネルの検索中にエラーが発生しました')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const loadInitialChannels = async () => {
    setLoading(true)
    try {
      const results = await searchChannels('')
      setSearchResults(results)
    } catch (err) {
      setError('チャンネルの読み込み中にエラーが発生しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = () => {
    setShowResults(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // フォーカスが検索結果内に移動した場合は閉じない
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
      return
    }
    setTimeout(() => setShowResults(false), 200)
  }

  const handleChannelSelect = (channel: ChannelSearchResult) => {
    onChannelSelect(channel)
    setSearchQuery('')
    setShowResults(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="チャンネル名で検索... (例: TED, English, BBC, code)"
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-lg"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">検索中...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">検索結果が見つかりませんでした</p>
            </div>
          )}

          {!loading && !error && searchResults.length > 0 && (
            <div className="py-2">
              {!searchQuery && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  人気チャンネル
                </div>
              )}
              {searchResults.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={channel.iconUrl}
                        alt={channel.name}
                        fill
                        className="object-cover rounded-full"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {channel.name}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {channel.description}
                      </div>
                      <div className="flex space-x-3 text-xs text-gray-500 mt-1">
                        <span>📺 {channel.videoCount}</span>
                        <span>👥 {channel.subscriberCount}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                        登録
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
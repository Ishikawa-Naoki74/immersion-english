'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChannelSearchResult } from '@/types'
import { searchChannels } from '@/lib/channelSearch'

interface ChannelSearchProps {
  onChannelSelect: (channel: ChannelSearchResult) => void
  isOpen: boolean
  onClose: () => void
}

export default function ChannelSearch({ onChannelSelect, isOpen, onClose }: ChannelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
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
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">チャンネル検索</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
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
              placeholder="チャンネル名で検索... (例: TED, English, BBC)"
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">検索中...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">検索結果が見つかりませんでした</h4>
              <p className="text-gray-500">別のキーワードで検索してみてください</p>
            </div>
          )}

          {!loading && !error && searchResults.length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(channel => (
                  <div
                    key={channel.id}
                    className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                  >
                    {/* Channel Icon */}
                    <div className="text-center mb-4">
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <Image
                          src={channel.iconUrl}
                          alt={channel.name}
                          fill
                          className="object-cover rounded-full"
                          sizes="80px"
                        />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg line-clamp-1 mb-2">
                        {channel.name}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {channel.description}
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-4">
                        <span>📺 {channel.videoCount}</span>
                        <span>👥 {channel.subscriberCount}</span>
                      </div>
                    </div>

                    {/* Register Button */}
                    <button
                      onClick={() => onChannelSelect(channel)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>登録</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">チャンネルを検索</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                学習したいYouTubeチャンネル名を入力してください。<br />
                TED、English、BBCなどのキーワードで検索できます。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
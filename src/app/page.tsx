'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Channel, ChannelStats, ChannelSearchResult } from '@/types'
import { getChannels, getChannelStats, saveChannel, generateId } from '@/lib/storage'
import ChannelCard from '@/components/ChannelCard'
import ChannelSearchBar from '@/components/ChannelSearchBar'

export default function Home() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelStats, setChannelStats] = useState<Record<string, ChannelStats>>({})
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelIcon, setNewChannelIcon] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = () => {
    const savedChannels = getChannels()
    
    // Sanitize existing channel data
    const sanitizedChannels = savedChannels.map(channel => {
      let sanitizedIconUrl = channel.iconUrl
      if (sanitizedIconUrl && !sanitizedIconUrl.startsWith('http://') && !sanitizedIconUrl.startsWith('https://')) {
        sanitizedIconUrl = 'https://' + sanitizedIconUrl
        // Save the sanitized channel back to storage
        const updatedChannel = { ...channel, iconUrl: sanitizedIconUrl }
        saveChannel(updatedChannel)
        return updatedChannel
      }
      return channel
    })
    
    setChannels(sanitizedChannels)
    
    // Load stats for each channel
    const stats: Record<string, ChannelStats> = {}
    sanitizedChannels.forEach(channel => {
      stats[channel.id] = getChannelStats(channel.id)
    })
    setChannelStats(stats)
  }

  const handleStudy = (channelId: string) => {
    router.push(`/channel/${channelId}`)
  }

  const handleAddChannel = () => {
    if (!newChannelName.trim()) return

    // URL validation and sanitization
    let sanitizedIconUrl = newChannelIcon.trim()
    if (sanitizedIconUrl && !sanitizedIconUrl.startsWith('http://') && !sanitizedIconUrl.startsWith('https://')) {
      sanitizedIconUrl = 'https://' + sanitizedIconUrl
    }
    if (!sanitizedIconUrl) {
      sanitizedIconUrl = 'https://via.placeholder.com/64x64?text=CH'
    }

    const newChannel: Channel = {
      id: generateId(),
      name: newChannelName.trim(),
      iconUrl: sanitizedIconUrl,
      description: newChannelDescription.trim(),
      totalStudyTime: 0,
      createdAt: new Date().toISOString(),
    }

    saveChannel(newChannel)
    setNewChannelName('')
    setNewChannelIcon('')
    setNewChannelDescription('')
    setShowAddChannel(false)
    loadChannels()
  }

  // デモ用のサンプルチャンネルを追加
  const handleChannelSelect = (searchResult: ChannelSearchResult) => {
    // 既に登録済みかチェック
    const existingChannel = channels.find(c => c.id === searchResult.id)
    if (existingChannel) {
      alert('このチャンネルは既に登録されています')
      return
    }

    // 検索結果からChannelオブジェクトを作成
    const newChannel: Channel = {
      id: searchResult.id,
      name: searchResult.name,
      iconUrl: searchResult.iconUrl,
      description: searchResult.description,
      totalStudyTime: 0,
      createdAt: new Date().toISOString(),
    }

    saveChannel(newChannel)
    loadChannels()
  }

  const addSampleChannels = () => {
    const sampleChannels: Channel[] = [
      {
        id: generateId(),
        name: 'TED Talks',
        iconUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        description: 'Ideas worth spreading - Educational talks from TED',
        totalStudyTime: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'English with Lucy',
        iconUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        description: 'Learn English with native speaker Lucy',
        totalStudyTime: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'BBC Learning English',
        iconUrl: 'https://i.ytimg.com/vi/nOpe7jEoWKA/mqdefault.jpg',
        description: 'Official BBC channel for learning English',
        totalStudyTime: 0,
        createdAt: new Date().toISOString(),
      }
    ]

    sampleChannels.forEach(channel => saveChannel(channel))
    loadChannels()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Immersion English
                </h1>
                <p className="text-sm text-gray-500">チャンネル管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddChannel(true)}
                className="bg-white/80 text-gray-700 px-4 py-2 rounded-xl hover:bg-white transition-all duration-200 font-medium border border-gray-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>手動追加</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              チャンネルを
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">検索・管理</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              学習したいYouTubeチャンネルを検索して登録し、効率的な英語学習を始めましょう
            </p>
          </div>
          
          {/* Channel Search Bar */}
          <ChannelSearchBar onChannelSelect={handleChannelSelect} />
        </div>

        {/* Registered Channels Section */}
        {channels.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              登録済みチャンネル
            </h3>
          </div>
        )}

        {/* Channels Grid */}
        {channels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {channels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                stats={channelStats[channel.id] || { totalStudyTime: 0, newCards: 0, learningCards: 0, completedCards: 0 }}
                onStudy={handleStudy}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">チャンネルが登録されていません</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              学習したいYouTubeチャンネルを登録して、効率的な英語学習を始めましょう
            </p>
            <div className="space-y-4">
              <p className="text-lg text-gray-600 mb-6">
                上の検索欄からチャンネルを検索・登録してください
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="bg-white/80 text-gray-700 px-6 py-3 rounded-xl hover:bg-white transition-all duration-200 font-medium border border-gray-200"
                >
                  手動で追加
                </button>
                <button
                  onClick={addSampleChannels}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  サンプル追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">チャンネル追加</h3>
              <button
                onClick={() => setShowAddChannel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">チャンネル名 *</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="例: TED Talks"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">アイコンURL</label>
                <input
                  type="url"
                  value={newChannelIcon}
                  onChange={(e) => setNewChannelIcon(e.target.value)}
                  placeholder="https://example.com/icon.jpg"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="チャンネルの説明を入力..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddChannel(false)}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddChannel}
                disabled={!newChannelName.trim()}
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
import Image from 'next/image'
import { Channel, ChannelStats } from '@/types'

interface ChannelCardProps {
  channel: Channel
  stats: ChannelStats
  onStudy: (channelId: string) => void
}

export default function ChannelCard({ channel, stats, onStudy }: ChannelCardProps) {
  const formatStudyTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* チャンネルヘッダー */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={channel.iconUrl}
              alt={channel.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              {channel.name}
            </h3>
            {channel.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 学習統計 */}
      <div className="p-6">
        {/* 総学習時間 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">総学習時間</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatStudyTime(stats.totalStudyTime)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.totalStudyTime / 120) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* カード統計 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.newCards}</div>
            <div className="text-xs text-gray-500">新規</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.learningCards}</div>
            <div className="text-xs text-gray-500">学習中</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.completedCards}</div>
            <div className="text-xs text-gray-500">完了</div>
          </div>
        </div>

        {/* 学習ボタン */}
        <button
          onClick={() => onStudy(channel.id)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>学習開始</span>
        </button>
      </div>
    </div>
  )
}
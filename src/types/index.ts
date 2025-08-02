export interface Channel {
  id: string
  name: string
  iconUrl: string
  description?: string
  totalStudyTime: number // 分単位
  createdAt: string
}

export interface Video {
  id: string
  channelId: string
  title: string
  thumbnailUrl: string
  duration: string
  url: string
  addedAt: string
}

export interface StudyCard {
  id: string
  videoId: string
  channelId: string
  word: string
  sentence: string 
  translation: string
  status: 'new' | 'learning' | 'completed'
  createdAt: string
  lastStudiedAt?: string
  difficulty: number // 1-5
  studyCount: number
}

export interface StudySession {
  id: string
  channelId: string
  videoId: string
  startTime: string
  endTime: string
  duration: number // 分単位
}

export interface ChannelStats {
  totalStudyTime: number
  newCards: number
  learningCards: number
  completedCards: number
}

// チャンネル検索結果の型
export interface ChannelSearchResult {
  id: string
  name: string
  iconUrl: string
  description: string
  subscriberCount: string
  videoCount: string
}
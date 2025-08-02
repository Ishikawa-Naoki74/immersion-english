import { Channel, Video, StudyCard, StudySession, ChannelStats } from '@/types'

const STORAGE_KEYS = {
  CHANNELS: 'immersion_english_channels',
  VIDEOS: 'immersion_english_videos',
  STUDY_CARDS: 'immersion_english_study_cards',
  STUDY_SESSIONS: 'immersion_english_study_sessions',
}

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error getting data from storage for key ${key}:`, error)
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving data to storage for key ${key}:`, error)
  }
}

// Channel functions
export function getChannels(): Channel[] {
  return getFromStorage<Channel>(STORAGE_KEYS.CHANNELS)
}

export function saveChannel(channel: Channel): void {
  const channels = getChannels()
  const existingIndex = channels.findIndex(c => c.id === channel.id)
  
  if (existingIndex >= 0) {
    channels[existingIndex] = channel
  } else {
    channels.push(channel)
  }
  
  saveToStorage(STORAGE_KEYS.CHANNELS, channels)
}

export function deleteChannel(channelId: string): void {
  const channels = getChannels().filter(c => c.id !== channelId)
  saveToStorage(STORAGE_KEYS.CHANNELS, channels)
  
  // Also delete related videos, cards, and sessions
  const videos = getVideos().filter(v => v.channelId !== channelId)
  saveToStorage(STORAGE_KEYS.VIDEOS, videos)
  
  const cards = getStudyCards().filter(c => c.channelId !== channelId)
  saveToStorage(STORAGE_KEYS.STUDY_CARDS, cards)
  
  const sessions = getStudySessions().filter(s => s.channelId !== channelId)
  saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, sessions)
}

// Video functions
export function getVideos(channelId?: string): Video[] {
  const videos = getFromStorage<Video>(STORAGE_KEYS.VIDEOS)
  return channelId ? videos.filter(v => v.channelId === channelId) : videos
}

export function saveVideo(video: Video): void {
  const videos = getVideos()
  const existingIndex = videos.findIndex(v => v.id === video.id)
  
  if (existingIndex >= 0) {
    videos[existingIndex] = video
  } else {
    videos.push(video)
  }
  
  saveToStorage(STORAGE_KEYS.VIDEOS, videos)
}

export function deleteVideo(videoId: string): void {
  const videos = getVideos().filter(v => v.id !== videoId)
  saveToStorage(STORAGE_KEYS.VIDEOS, videos)
  
  // Also delete related cards
  const cards = getStudyCards().filter(c => c.videoId !== videoId)
  saveToStorage(STORAGE_KEYS.STUDY_CARDS, cards)
}

// Study card functions
export function getStudyCards(channelId?: string, videoId?: string): StudyCard[] {
  let cards = getFromStorage<StudyCard>(STORAGE_KEYS.STUDY_CARDS)
  
  if (channelId) {
    cards = cards.filter(c => c.channelId === channelId)
  }
  
  if (videoId) {
    cards = cards.filter(c => c.videoId === videoId)
  }
  
  return cards
}

export function saveStudyCard(card: StudyCard): void {
  const cards = getStudyCards()
  const existingIndex = cards.findIndex(c => c.id === card.id)
  
  if (existingIndex >= 0) {
    cards[existingIndex] = card
  } else {
    cards.push(card)
  }
  
  saveToStorage(STORAGE_KEYS.STUDY_CARDS, cards)
}

export function deleteStudyCard(cardId: string): void {
  const cards = getStudyCards().filter(c => c.id !== cardId)
  saveToStorage(STORAGE_KEYS.STUDY_CARDS, cards)
}

export function updateCardStatus(cardId: string, status: StudyCard['status']): void {
  const cards = getStudyCards()
  const cardIndex = cards.findIndex(c => c.id === cardId)
  
  if (cardIndex >= 0) {
    cards[cardIndex].status = status
    cards[cardIndex].lastStudiedAt = new Date().toISOString()
    cards[cardIndex].studyCount += 1
    
    saveToStorage(STORAGE_KEYS.STUDY_CARDS, cards)
  }
}

// Study session functions
export function getStudySessions(channelId?: string): StudySession[] {
  const sessions = getFromStorage<StudySession>(STORAGE_KEYS.STUDY_SESSIONS)
  return channelId ? sessions.filter(s => s.channelId === channelId) : sessions
}

export function saveStudySession(session: StudySession): void {
  const sessions = getStudySessions()
  sessions.push(session)
  saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, sessions)
}

// Stats calculation functions
export function getChannelStats(channelId: string): ChannelStats {
  const cards = getStudyCards(channelId)
  const sessions = getStudySessions(channelId)
  
  const newCards = cards.filter(c => c.status === 'new').length
  const learningCards = cards.filter(c => c.status === 'learning').length
  const completedCards = cards.filter(c => c.status === 'completed').length
  
  const totalStudyTime = sessions.reduce((total, session) => total + session.duration, 0)
  
  return {
    totalStudyTime,
    newCards,
    learningCards,
    completedCards,
  }
}

// Helper function to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
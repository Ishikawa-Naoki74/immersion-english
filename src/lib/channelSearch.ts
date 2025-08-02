import { ChannelSearchResult } from '@/types'

// YouTube Data API の設定
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// 購読者数をフォーマットする関数
function formatSubscriberCount(count: string): string {
  const num = parseInt(count)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return count
}

// 動画数をフォーマットする関数
function formatVideoCount(count: string): string {
  const num = parseInt(count)
  return num.toLocaleString()
}

// フォールバック用のモックデータ（APIキーが設定されていない場合）
const fallbackChannels: ChannelSearchResult[] = [
  {
    id: 'UCZf__ehlCEBPop-_sldpBUQ',
    name: 'HikakinTV',
    iconUrl: 'https://yt3.ggpht.com/ytc/AIdro_mNklhSBBr7UP3w2wbzF0GAL8pmfk6NFaAT6g1A=s176-c-k-c0x00ffffff-no-rj',
    description: 'ヒカキンのメインチャンネルです！チャンネル登録よろしくお願いします！',
    subscriberCount: '5.51M',
    videoCount: '3,247'
  },
  {
    id: 'UCtFRv9O2AHqOZjjynzrv-xg',
    name: 'TED',
    iconUrl: 'https://yt3.ggpht.com/Pi3eWykiwJUqTdbJ3ROq91H8B6awGWlbWzqCAYVI4XaWzoY7NtHjLYLQHXK25L-5QwkWzJW_qw=s176-c-k-c0x00ffffff-no-rj',
    description: 'The TED Talks channel features the best talks and performances from the TED Conference.',
    subscriberCount: '20.1M',
    videoCount: '4,863'
  },
  {
    id: 'UCG-KntY7aVnIGXYEBQvmBAQ',
    name: 'English with Lucy',
    iconUrl: 'https://yt3.ggpht.com/ytc/AIdro_kGrKVa0pkAZ8k1pJ5q8DuFPiwNQ_bg6Kk_3xSOWKn4dg=s176-c-k-c0x00ffffff-no-rj',
    description: 'Hi everyone! I\'m Lucy and I\'m here to help you improve your English.',
    subscriberCount: '5.42M',
    videoCount: '567'
  }
]

// 曖昧検索のスコア計算関数（フォールバック用）
function calculateScore(text: string, query: string): number {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // 完全一致
  if (textLower === queryLower) return 100
  
  // 前方一致
  if (textLower.startsWith(queryLower)) return 90
  
  // 単語の開始位置での一致
  const words = textLower.split(/\s+/)
  for (const word of words) {
    if (word.startsWith(queryLower)) return 80
  }
  
  // 部分一致
  if (textLower.includes(queryLower)) return 70
  
  // 各文字が順番に含まれているか（曖昧一致）
  let textIndex = 0
  let matchCount = 0
  for (const char of queryLower) {
    const foundIndex = textLower.indexOf(char, textIndex)
    if (foundIndex !== -1) {
      textIndex = foundIndex + 1
      matchCount++
    }
  }
  
  if (matchCount === queryLower.length) {
    return 50 + (matchCount / textLower.length) * 20
  }
  
  // 部分的な文字マッチ
  const matchRatio = matchCount / queryLower.length
  if (matchRatio > 0.5) {
    return matchRatio * 40
  }
  
  return 0
}

// フォールバック検索（APIキーがない場合）
async function fallbackSearch(query: string): Promise<ChannelSearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  if (!query.trim()) {
    return fallbackChannels
  }
  
  const scoredChannels = fallbackChannels.map(channel => {
    const nameScore = calculateScore(channel.name, query)
    const descScore = calculateScore(channel.description, query) * 0.5
    const totalScore = Math.max(nameScore, descScore)
    
    return {
      ...channel,
      score: totalScore
    }
  })
  
  return scoredChannels
    .filter(channel => channel.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, ...channel }) => channel)
}

// YouTube Data APIを使用したチャンネル検索
export async function searchChannels(query: string): Promise<ChannelSearchResult[]> {
  // APIキーがない場合はフォールバック
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not found, using fallback data')
    return fallbackSearch(query)
  }

  try {
    if (!query.trim()) {
      // 空の検索の場合は人気チャンネルを返す
      const popularQuery = 'english learning'
      return await searchChannels(popularQuery)
    }

    // YouTube Data API でチャンネル検索
    const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
      part: 'snippet',
      type: 'channel',
      q: query,
      maxResults: '12',
      key: YOUTUBE_API_KEY,
      order: 'relevance'
    })

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`YouTube API search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return []
    }

    // チャンネルIDを取得して詳細情報を取得
    const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(',')
    
    const channelsUrl = `${YOUTUBE_API_BASE}/channels?` + new URLSearchParams({
      part: 'snippet,statistics',
      id: channelIds,
      key: YOUTUBE_API_KEY
    })

    const channelsResponse = await fetch(channelsUrl)
    if (!channelsResponse.ok) {
      throw new Error(`YouTube API channels failed: ${channelsResponse.status}`)
    }

    const channelsData = await channelsResponse.json()

    // レスポンスを ChannelSearchResult 形式に変換
    const results: ChannelSearchResult[] = channelsData.items.map((item: any) => ({
      id: item.id,
      name: item.snippet.title,
      iconUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      description: item.snippet.description || '',
      subscriberCount: formatSubscriberCount(item.statistics?.subscriberCount || '0'),
      videoCount: formatVideoCount(item.statistics?.videoCount || '0')
    }))

    return results

  } catch (error) {
    console.error('YouTube API error:', error)
    // エラーの場合はフォールバック
    return fallbackSearch(query)
  }
}

// チャンネルIDから詳細情報を取得
export async function getChannelById(channelId: string): Promise<ChannelSearchResult | null> {
  // APIキーがない場合はフォールバック
  if (!YOUTUBE_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const channel = fallbackChannels.find(c => c.id === channelId)
    return channel || null
  }

  try {
    const channelsUrl = `${YOUTUBE_API_BASE}/channels?` + new URLSearchParams({
      part: 'snippet,statistics',
      id: channelId,
      key: YOUTUBE_API_KEY
    })

    const response = await fetch(channelsUrl)
    if (!response.ok) {
      throw new Error(`YouTube API failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return null
    }

    const item = data.items[0]
    return {
      id: item.id,
      name: item.snippet.title,
      iconUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      description: item.snippet.description || '',
      subscriberCount: formatSubscriberCount(item.statistics?.subscriberCount || '0'),
      videoCount: formatVideoCount(item.statistics?.videoCount || '0')
    }

  } catch (error) {
    console.error('YouTube API error:', error)
    // エラーの場合はフォールバック
    await new Promise(resolve => setTimeout(resolve, 200))
    const channel = fallbackChannels.find(c => c.id === channelId)
    return channel || null
  }
}
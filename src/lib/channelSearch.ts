import { ChannelSearchResult } from '@/types'

// サーバーサイドAPIを使用（安全）

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

// サーバーサイドAPIを使用したチャンネル検索（安全）
export async function searchChannels(query: string): Promise<ChannelSearchResult[]> {
  try {
    console.log(`YouTubeチャンネル検索: "${query}"`)
    
    if (!query.trim()) {
      // 空の検索の場合は人気チャンネルを返す
      const popularQuery = 'english learning'
      return await searchChannels(popularQuery)
    }

    const url = new URL('/api/youtube/channels/search', window.location.origin)
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', '12')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'YouTubeチャンネル検索に失敗しました')
    }

    console.log(`YouTubeチャンネル検索完了: ${data.channels?.length || 0}件`)
    
    // サーバーサイドAPIの形式をクライアント形式に変換
    const results: ChannelSearchResult[] = data.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.title,
      iconUrl: channel.thumbnail,
      description: channel.description,
      subscriberCount: channel.subscriberCount ? formatSubscriberCount(channel.subscriberCount) : '0',
      videoCount: channel.videoCount ? formatVideoCount(channel.videoCount) : '0'
    }))

    return results

  } catch (error) {
    console.error('YouTubeチャンネル検索エラー:', error)
    // エラーの場合はフォールバック
    console.warn('フォールバックデータを使用します')
    return fallbackSearch(query)
  }
}

// チャンネルIDから詳細情報を取得（サーバーサイドAPI使用）
export async function getChannelById(channelId: string): Promise<ChannelSearchResult | null> {
  try {
    console.log(`YouTubeチャンネル詳細取得: ${channelId}`)
    
    // チャンネル検索APIを使用（1件のみ取得）
    const url = new URL('/api/youtube/channels/search', window.location.origin)
    url.searchParams.set('q', channelId) // チャンネルIDで検索
    url.searchParams.set('maxResults', '1')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'YouTubeチャンネル情報の取得に失敗しました')
    }

    if (!data.channels || data.channels.length === 0) {
      return null
    }

    const channel = data.channels[0]
    const result: ChannelSearchResult = {
      id: channel.id,
      name: channel.title,
      iconUrl: channel.thumbnail,
      description: channel.description,
      subscriberCount: channel.subscriberCount ? formatSubscriberCount(channel.subscriberCount) : '0',
      videoCount: channel.videoCount ? formatVideoCount(channel.videoCount) : '0'
    }

    console.log(`YouTubeチャンネル詳細取得完了: ${result.name}`)
    return result

  } catch (error) {
    console.error('YouTubeチャンネル詳細取得エラー:', error)
    // エラーの場合はフォールバック
    console.warn('フォールバックデータを使用します')
    await new Promise(resolve => setTimeout(resolve, 200))
    const channel = fallbackChannels.find(c => c.id === channelId)
    return channel || null
  }
}
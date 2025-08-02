// YouTube Data APIを使用した動画検索
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: string
  publishedAt: string
  viewCount: string
  channelId: string
  channelTitle: string
  url: string
}

export interface VideoSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
  prevPageToken?: string
  totalResults: number
  currentPage: number
  totalPages: number
}

// 再生時間をフォーマットする関数 (PT4M13S -> 4:13)
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 視聴回数をフォーマットする関数
function formatViewCount(count: string): string {
  const num = parseInt(count)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M回再生`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K回再生`
  }
  return `${num}回再生`
}

// チャンネルIDから動画一覧を取得（ページネーション対応）
export async function getChannelVideos(
  channelId: string, 
  page: number = 1, 
  maxResults: number = 30,
  pageToken?: string
): Promise<VideoSearchResult> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not found')
    return {
      videos: [],
      totalResults: 0,
      currentPage: page,
      totalPages: 0
    }
  }

  try {
    // チャンネルの動画を検索
    const searchParams: Record<string, string> = {
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      order: 'date',
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY
    }

    if (pageToken) {
      searchParams.pageToken = pageToken
    }

    const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams(searchParams)

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`YouTube search API failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return {
        videos: [],
        totalResults: searchData.pageInfo?.totalResults || 0,
        currentPage: page,
        totalPages: 0
      }
    }

    // 動画IDを取得
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    // 動画の詳細情報を取得（再生時間、視聴回数など）
    const videosUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY
    })

    const videosResponse = await fetch(videosUrl)
    if (!videosResponse.ok) {
      throw new Error(`YouTube videos API failed: ${videosResponse.status}`)
    }

    const videosData = await videosResponse.json()

    // レスポンスをYouTubeVideo形式に変換
    const videos: YouTubeVideo[] = videosData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: formatDuration(item.contentDetails?.duration || 'PT0S'),
      publishedAt: item.snippet.publishedAt,
      viewCount: formatViewCount(item.statistics?.viewCount || '0'),
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id}`
    }))

    const totalResults = searchData.pageInfo?.totalResults || 0
    const totalPages = Math.ceil(totalResults / maxResults)

    return {
      videos,
      nextPageToken: searchData.nextPageToken,
      prevPageToken: searchData.prevPageToken,
      totalResults,
      currentPage: page,
      totalPages
    }

  } catch (error) {
    console.error('YouTube API error:', error)
    return {
      videos: [],
      totalResults: 0,
      currentPage: page,
      totalPages: 0
    }
  }
}

// 動画を検索（チャンネル内で特定のキーワード）
export async function searchChannelVideos(channelId: string, query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not found')
    return []
  }

  try {
    // チャンネル内で動画を検索
    const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      q: query,
      order: 'relevance',
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY
    })

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`YouTube search API failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return []
    }

    // 動画IDを取得
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    // 動画の詳細情報を取得
    const videosUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY
    })

    const videosResponse = await fetch(videosUrl)
    if (!videosResponse.ok) {
      throw new Error(`YouTube videos API failed: ${videosResponse.status}`)
    }

    const videosData = await videosResponse.json()

    // レスポンスをYouTubeVideo形式に変換
    const videos: YouTubeVideo[] = videosData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: formatDuration(item.contentDetails?.duration || 'PT0S'),
      publishedAt: item.snippet.publishedAt,
      viewCount: formatViewCount(item.statistics?.viewCount || '0'),
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id}`
    }))

    return videos

  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}
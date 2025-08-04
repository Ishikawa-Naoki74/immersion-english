import { NextRequest, NextResponse } from 'next/server'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelTitle: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('maxResults') || '12')
    const pageToken = searchParams.get('pageToken')

    console.log(`YouTube検索リクエスト: "${query}", 最大件数: ${maxResults}`)

    if (!query) {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      )
    }

    const API_KEY = process.env.YOUTUBE_API_KEY

    if (!API_KEY) {
      console.error('YouTube API キーが設定されていません')
      return NextResponse.json(
        { error: 'YouTube API キーが設定されていません' },
        { status: 500 }
      )
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'video')
    url.searchParams.set('maxResults', maxResults.toString())
    url.searchParams.set('key', API_KEY)
    
    // 字幕付き動画を優先
    url.searchParams.set('videoCaption', 'closedCaption')
    url.searchParams.set('order', 'relevance')
    
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    console.log('YouTube API呼び出し中...')

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30000) // 30秒タイムアウト
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('YouTube API エラー:', data.error)
      return NextResponse.json(
        { 
          error: 'YouTube API リクエストに失敗しました',
          details: data.error?.message || '不明なエラー'
        },
        { status: response.status }
      )
    }

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))

    console.log(`YouTube検索完了: ${videos.length}件の動画`)

    const result: YouTubeSearchResult = {
      videos,
      nextPageToken: data.nextPageToken,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('YouTube検索エラー:', error)
    return NextResponse.json(
      { 
        error: 'YouTube検索に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}
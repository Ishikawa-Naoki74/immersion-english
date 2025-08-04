import { NextRequest, NextResponse } from 'next/server'

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount?: string
  videoCount?: string
  customUrl?: string
}

export interface YouTubeChannelSearchResult {
  channels: YouTubeChannel[]
  nextPageToken?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('maxResults') || '12')
    const pageToken = searchParams.get('pageToken')

    console.log(`YouTubeチャンネル検索リクエスト: "${query}", 最大件数: ${maxResults}`)

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
    url.searchParams.set('type', 'channel')
    url.searchParams.set('maxResults', maxResults.toString())
    url.searchParams.set('key', API_KEY)
    url.searchParams.set('order', 'relevance')
    
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    console.log('YouTube Channel Search API呼び出し中...')

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

    // チャンネル詳細情報を取得
    const channelIds = data.items.map((item: any) => item.id.channelId).join(',')
    
    let channelDetails = null
    if (channelIds) {
      try {
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
        detailsUrl.searchParams.set('part', 'snippet,statistics')
        detailsUrl.searchParams.set('id', channelIds)
        detailsUrl.searchParams.set('key', API_KEY)

        const detailsResponse = await fetch(detailsUrl.toString(), {
          signal: AbortSignal.timeout(30000)
        })

        if (detailsResponse.ok) {
          channelDetails = await detailsResponse.json()
        }
      } catch (error) {
        console.log('チャンネル詳細情報の取得をスキップ:', error)
      }
    }

    const channels: YouTubeChannel[] = data.items.map((item: any) => {
      const channelId = item.id.channelId
      const details = channelDetails?.items?.find((detail: any) => detail.id === channelId)
      
      return {
        id: channelId,
        title: item.snippet.title || item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        subscriberCount: details?.statistics?.subscriberCount,
        videoCount: details?.statistics?.videoCount,
        customUrl: details?.snippet?.customUrl,
      }
    })

    console.log(`YouTubeチャンネル検索完了: ${channels.length}件のチャンネル`)

    const result: YouTubeChannelSearchResult = {
      channels,
      nextPageToken: data.nextPageToken,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('YouTubeチャンネル検索エラー:', error)
    return NextResponse.json(
      { 
        error: 'YouTubeチャンネル検索に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}
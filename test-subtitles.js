// youtube-captions-scraperの動作テスト
const { getSubtitles } = require('youtube-captions-scraper');

async function testSubtitles() {
  try {
    console.log('字幕取得テスト開始...');
    
    // 有名なYouTube動画のテスト
    const videoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
    
    console.log(`動画ID: ${videoId} の英語字幕を取得中...`);
    const englishSubtitles = await getSubtitles({
      videoID: videoId,
      lang: 'en'
    });
    
    console.log(`英語字幕取得成功: ${englishSubtitles.length}件`);
    console.log('最初の3件:', englishSubtitles.slice(0, 3));
    
    console.log(`動画ID: ${videoId} の日本語字幕を取得中...`);
    const japaneseSubtitles = await getSubtitles({
      videoID: videoId,
      lang: 'ja'
    });
    
    console.log(`日本語字幕取得成功: ${japaneseSubtitles.length}件`);
    console.log('最初の3件:', japaneseSubtitles.slice(0, 3));
    
  } catch (error) {
    console.error('エラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
}

testSubtitles();
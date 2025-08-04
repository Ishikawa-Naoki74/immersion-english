const { getSubtitles } = require('youtube-captions-scraper');

async function testCaptions() {
  console.log('youtube-captions-scraperのテスト開始...');
  
  try {
    console.time('字幕取得時間');
    
    const videoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
    console.log(`動画ID: ${videoId} の字幕を取得中...`);
    
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: 'en'
    });
    
    console.timeEnd('字幕取得時間');
    console.log(`取得成功: ${subtitles.length}件の字幕`);
    console.log('最初の3件:');
    console.log(subtitles.slice(0, 3));
    
  } catch (error) {
    console.timeEnd('字幕取得時間');
    console.error('エラー:', error.message);
  }
}

testCaptions();
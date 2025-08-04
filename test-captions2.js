const { getSubtitles } = require('youtube-captions-scraper');

async function testDifferentVideo() {
  console.log('異なる動画IDでテスト...');
  
  const testVideos = [
    'dQw4w9WgXcQ', // Rick Astley
    'jNQXAC9IVRw', // Me at the zoo (first YouTube video)
    'QH2-TGUlwu4', // Nyan Cat
    '9bZkp7q19f0'  // Gangnam Style
  ];
  
  for (const videoId of testVideos) {
    try {
      console.log(`\n--- 動画ID: ${videoId} ---`);
      console.time(`字幕取得時間_${videoId}`);
      
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: 'en'
      });
      
      console.timeEnd(`字幕取得時間_${videoId}`);
      console.log(`結果: ${subtitles.length}件の字幕`);
      
      if (subtitles.length > 0) {
        console.log('最初の字幕:', subtitles[0]);
        break; // 成功したら終了
      }
      
    } catch (error) {
      console.error(`エラー (${videoId}):`, error.message);
    }
  }
}

testDifferentVideo();
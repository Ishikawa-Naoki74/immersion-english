const { YoutubeTranscript } = require('youtube-transcript');

async function testCorrectUsage() {
  console.log('youtube-transcriptの正しい使用方法をテスト...');
  
  const testVideos = [
    'xWOoBJUqlbI', // en-GB available
    'E_cYa7f7TDc'  // ja available
  ];
  
  for (const videoId of testVideos) {
    try {
      console.log(`\n--- 動画ID: ${videoId} ---`);
      
      // 複数の言語を試行
      const languages = ['en', 'en-GB', 'ja', 'ja-JP', 'es', 'fr', 'de'];
      
      for (const lang of languages) {
        try {
          console.log(`言語 ${lang} を試行中...`);
          const subtitles = await YoutubeTranscript.fetchTranscript(videoId, { lang });
          
          if (subtitles && subtitles.length > 0) {
            console.log(`✅ 成功: ${lang} - ${subtitles.length}件の字幕`);
            console.log('サンプル:', subtitles[0]);
            console.log('データ形式:', Object.keys(subtitles[0]));
            break; // 成功したら次の動画へ
          }
        } catch (langError) {
          console.log(`❌ ${lang}: ${langError.message}`);
        }
      }
      
    } catch (error) {
      console.error(`動画 ${videoId} でエラー:`, error.message);
    }
  }
}

testCorrectUsage();
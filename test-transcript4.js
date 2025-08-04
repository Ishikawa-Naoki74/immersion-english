const { YoutubeTranscript } = require('youtube-transcript');

async function testRecentVideos() {
  console.log('最近の動画・字幕付き動画でテスト...');
  
  const testVideos = [
    { id: 'kEHKhQNqHmY', title: 'Recent video 1' },
    { id: 'GVvq3TfCioE', title: 'Recent video 2' },
    { id: 'xWOoBJUqlbI', title: 'Educational content' },
    { id: 'E_cYa7f7TDc', title: 'Test video' },
    { id: 'GtL1huin9EE', title: 'Another test' }
  ];
  
  for (const video of testVideos) {
    try {
      console.log(`\n--- ${video.title} (${video.id}) ---`);
      
      // まず利用可能な言語をチェック
      try {
        const transcripts = await YoutubeTranscript.listTranscripts(video.id);
        console.log('利用可能な字幕言語:', Object.keys(transcripts.manual || {}), Object.keys(transcripts.generated || {}));
      } catch (listError) {
        console.log('言語一覧取得エラー:', listError.message);
      }
      
      console.time(`字幕取得時間_${video.id}`);
      
      const subtitles = await YoutubeTranscript.fetchTranscript(video.id, {
        lang: 'en'
      });
      
      console.timeEnd(`字幕取得時間_${video.id}`);
      console.log(`成功: ${subtitles.length}件の字幕`);
      
      if (subtitles.length > 0) {
        console.log('最初の字幕:', subtitles[0]);
        console.log('成功した動画ID:', video.id);
        return; // 成功したら終了
      }
      
    } catch (error) {
      console.error(`エラー (${video.title}):`, error.message);
    }
  }
  
  console.log('\n全ての動画で字幕取得に失敗しました。');
}

testRecentVideos();
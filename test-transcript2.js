const { YoutubeTranscript } = require('youtube-transcript');

async function testDifferentVideos() {
  console.log('様々な動画でyoutube-transcriptをテスト...');
  
  const testVideos = [
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo' },
    { id: 'kJQP7kiw5Fk', title: 'Despacito' },
    { id: 'QH2-TGUlwu4', title: 'Nyan Cat' },
    { id: 'TcMBFSGVi1c', title: 'Zoom background' },
    { id: 'MtN1YnoL46Q', title: 'Popular educational video' }
  ];
  
  for (const video of testVideos) {
    try {
      console.log(`\n--- ${video.title} (${video.id}) ---`);
      console.time(`字幕取得時間_${video.id}`);
      
      const subtitles = await YoutubeTranscript.fetchTranscript(video.id, {
        lang: 'en'
      });
      
      console.timeEnd(`字幕取得時間_${video.id}`);
      console.log(`成功: ${subtitles.length}件の字幕`);
      
      if (subtitles.length > 0) {
        console.log('最初の字幕:', subtitles[0]);
        break; // 成功したら終了
      }
      
    } catch (error) {
      console.timeEnd(`字幕取得時間_${video.id}`);
      console.error(`エラー (${video.title}):`, error.message);
    }
  }
}

testDifferentVideos();
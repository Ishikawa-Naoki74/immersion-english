const { YoutubeTranscript } = require('youtube-transcript');

async function testEducationalVideos() {
  console.log('教育系・ニュース動画でテスト...');
  
  const testVideos = [
    { id: 'LdwoBzoxc2k', title: 'TED Talk' },
    { id: 'LdQp6wYNrVw', title: 'Khan Academy' },
    { id: '_VB39Jo8mAQ', title: 'Crash Course' },
    { id: 'J9oEc0wCQDE', title: 'Science Video' },
    { id: 'RK2y0DlV8mk', title: 'BBC Video' }
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
        console.log('成功した動画ID:', video.id);
        break; // 成功したら終了
      }
      
    } catch (error) {
      console.timeEnd(`字幕取得時間_${video.id}`);
      console.error(`エラー (${video.title}):`, error.message);
    }
  }
}

testEducationalVideos();
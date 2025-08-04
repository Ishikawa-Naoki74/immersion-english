// ytdl-coreの動作テスト
const ytdl = require('ytdl-core');

async function testYtdl() {
  try {
    console.log('ytdl-core テスト開始...');
    
    const videoId = 'dQw4w9WgXcQ';
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`動画情報を取得中: ${url}`);
    const info = await ytdl.getInfo(url);
    
    console.log('動画タイトル:', info.videoDetails.title);
    console.log('動画長:', info.videoDetails.lengthSeconds, '秒');
    
    // 字幕情報を確認
    const captions = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (captions && captions.length > 0) {
      console.log('利用可能な字幕:');
      captions.forEach(caption => {
        console.log(`- 言語: ${caption.name?.simpleText || caption.languageCode}, 種類: ${caption.kind || 'manual'}`);
      });
    } else {
      console.log('字幕が見つかりません');
    }
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

testYtdl();
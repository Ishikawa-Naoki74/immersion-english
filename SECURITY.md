# セキュリティガイドライン

## 🔐 API キーの管理

### ❌ **絶対にやってはいけないこと**
- API キーを直接コードに書く
- API キーを Git にプッシュする
- 公開リポジトリに秘密情報を含める
- `NEXT_PUBLIC_` 付きの環境変数に機密情報を設定

### ✅ **推奨される方法**

#### 1. 環境変数の使用
```bash
# .env.local (Gitにコミットされない)
YOUTUBE_API_KEY=your_actual_api_key_here
OPENAI_API_KEY=your_actual_openai_key
```

#### 2. サーバーサイドでのAPI呼び出し
```javascript
// ❌ クライアントサイド（危険）
const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}`)

// ✅ サーバーサイド（安全）
const response = await fetch('/api/youtube/search', {
  method: 'POST',
  body: JSON.stringify({ query })
})
```

## 🛡️ セキュリティチェックリスト

### 開発環境
- [ ] `.env.local` ファイルが `.gitignore` に含まれている
- [ ] 実際のAPI キーが `.env.example` に含まれていない
- [ ] テスト用のダミーキーを使用している

### 本番環境
- [ ] 環境変数が適切に設定されている
- [ ] API キーに適切な制限が設定されている
- [ ] HTTPS を使用している
- [ ] レート制限が設定されている

## 🚨 API キーが漏洩した場合の対処

1. **即座にキーを無効化**
   - Google Cloud Console でキーを削除
   - OpenAI でキーを削除

2. **新しいキーを生成**
   - 必要に応じて使用制限を設定
   - IP制限やリファラー制限を追加

3. **コードの更新**
   - 新しいキーを環境変数に設定
   - Git 履歴から古いキーを削除（必要に応じて）

## 📋 使用している API と推奨制限

### YouTube Data API v3
- **リファラー制限**: `localhost:3000`, `yourdomain.com`
- **API制限**: YouTube Data API v3 のみ
- **クォータ**: 日次クォータの監視

### OpenAI API
- **使用制限**: 音声認識（Whisper）のみ
- **レート制限**: 設定済み
- **支出制限**: 月額上限の設定

### Google Cloud APIs
- **IP制限**: 本番サーバーのIPのみ
- **API制限**: Speech-to-Text, Translate のみ
- **クォータ**: 日次・月次制限の設定

## 🔍 セキュリティ監査

定期的に以下をチェック:
- API キーの使用状況
- 不審なアクセスログ
- クォータの消費状況
- 未使用のキーの削除

## 📞 問題報告

セキュリティに関する問題を発見した場合:
1. 公開リポジトリでのIssue報告は避ける
2. プライベートな方法で報告する
3. 修正まで詳細を公開しない
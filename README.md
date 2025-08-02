# Immersion English

English immersion learning application built with Next.js 14 and TypeScript.

## セットアップ

### YouTube Data API の設定

実際のYouTubeチャンネル検索を有効にするには、YouTube Data API v3 のAPIキーが必要です。

1. [Google Cloud Console](https://console.developers.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. YouTube Data API v3 を有効化
4. 認証情報を作成してAPIキーを取得
5. プロジェクトルートに `.env.local` ファイルを作成
6. 以下の内容を追加：

```bash
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 機能

- **チャンネル検索**: YouTube Data APIを使用した実際のチャンネル検索
- **チャンネル管理**: 学習用チャンネルの登録・管理
- **動画追加**: チャンネルごとの動画追加・管理
- **進捗追跡**: 学習進捗の記録・表示

## 注意事項

- APIキーが設定されていない場合は、フォールバックのモックデータが使用されます
- YouTube Data API には利用制限があります（1日10,000リクエスト）

## 開発コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run start` - 本番サーバー起動
- `npm run lint` - ESLint実行
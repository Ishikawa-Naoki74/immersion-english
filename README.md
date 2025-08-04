# Immersion English

English immersion learning application built with Next.js 14 and TypeScript.

## セットアップ

### 🔐 環境変数の設定

このアプリケーションは複数のAPIを使用します。実際のサービスを利用するには、適切なAPIキーが必要です。

#### 1. 環境変数ファイルのセットアップ

```bash
# .env.example を .env.local にコピー
cp .env.example .env.local
```

#### 2. 必要なAPIキーの取得と設定

**YouTube Data API v3**（動画・チャンネル検索用）
1. [Google Cloud Console](https://console.developers.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. YouTube Data API v3 を有効化
4. 認証情報を作成してAPIキーを取得
5. APIキーに使用制限を設定（推奨）

**OpenAI API**（音声認識用 - オプション）
1. [OpenAI Platform](https://platform.openai.com/) でアカウント作成
2. API キーを生成

**Google Cloud APIs**（翻訳・音声認識用 - オプション）
1. Google Cloud Console で必要なAPIを有効化
2. 認証情報を作成

#### 3. .env.local ファイルの設定

```bash
# YouTube API (サーバーサイド用 - 安全)
YOUTUBE_API_KEY=your_youtube_api_key_here

# OpenAI API (音声認識用 - オプション)
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud API (翻訳・音声認識用 - オプション)
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
```

⚠️ **セキュリティ重要事項**:
- `.env.local` ファイルは Git にコミットされません
- APIキーは外部に漏洩しないよう注意してください
- 詳細は [SECURITY.md](./SECURITY.md) を参照

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
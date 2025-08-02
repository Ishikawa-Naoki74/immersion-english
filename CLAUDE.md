# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

「Immersion English」は、Next.js 14とTypeScriptで構築された英語学習アプリケーションです。レッスン、練習、進捗追跡、コミュニティ機能を備えたインタラクティブな英語イマージョン学習を提供します。

## 開発コマンド

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintでコード品質をチェック

## アーキテクチャ

### 技術スタック
- **フレームワーク**: Next.js 14 with App Router
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS with PostCSS
- **フォント**: Inter (Google Fonts)

### プロジェクト構造
```
src/
├── app/                    # Next.js App Routerディレクトリ
│   ├── globals.css        # グローバルスタイルとTailwindインポート
│   ├── layout.tsx         # Interフォントとメタデータを含むルートレイアウト
│   └── page.tsx           # ウェルカムUIと機能カードを含むホームページ
```

### 主要設定ファイル
- `tailwind.config.js` - カスタムカラー（background/foreground CSS変数）を含むTailwind設定
- `next.config.js` - 基本的なNext.js設定（現在は空）
- `tsconfig.json` - TypeScript設定
- `postcss.config.js` - Tailwind用PostCSS設定

### アプリケーション機能（予定）
ホームページのUIに基づき、アプリケーションには以下が含まれます：
- **Learn**: インタラクティブな英語レッスン
- **Practice**: AIアシスタンスによるスピーキング、リスニング、ライティング練習
- **Progress**: 学習進捗の追跡と成果
- **Community**: 学習者同士の交流のためのソーシャル機能

### スタイリングアプローチ
- ユーティリティクラスを使用したTailwind CSS
- CSS変数によるダークモードサポート
- モバイルファーストのレスポンシブデザイン
- 魅力的なUIのためのカスタムグラデーションと視覚効果

## Next.jsベストプラクティス

### ファイル構成
- App Router構造を使用：ルート用の`app/`ディレクトリ
- 機能ベースのフォルダで関連コンポーネントをグループ化
- 共有コンポーネントは`src/components/`に配置
- ユーティリティ関数と設定は`src/lib/`を使用
- 型は`src/types/`に保存するか、コンポーネントと同じ場所に配置

### コンポーネント構造
- パフォーマンス向上のためデフォルトでServer Componentsを使用
- 必要な場合のみ`'use client'`ディレクティブを追加（フック、イベントハンドラー、ブラウザAPI）
- データ取得には非同期Server Componentsを優先
- コンポーネントpropsにはTypeScriptインターフェースを使用

### パフォーマンス最適化
- 最適化された画像には`next/image`コンポーネントを使用
- `loading.tsx`ファイルで適切なローディング状態を実装
- コンポーネントレベルのローディングには`Suspense`境界を使用
- `fetch()`と`unstable_cache`でNext.js組み込みキャッシュを活用
- 大きなコンポーネントのコード分割には動的インポートを使用

### データ取得
- 可能な限りServer Componentsでデータを取得
- フォーム送信とミューテーションにはServer Actionsを使用
- `error.tsx`ファイルで適切なエラー境界を実装
- 動的ルートの404処理には`notFound()`を使用

### SEOとメタデータ
- `layout.tsx`と`page.tsx`ファイルでメタデータを定義
- 動的ルートには動的メタデータ生成を使用
- 適切なOpen GraphとTwitter Cardメタタグを実装
- 適切な場合は構造化データを追加

### ルーティング規則
- ファイルベースルーティングを使用：ルート用の`page.tsx`
- 共有UIには`layout.tsx`を実装
- 再レンダリングが必要なレイアウトには`template.tsx`を使用
- 整理のために`(folder)`構文でルートグループを活用
- 高度なレイアウトには並列ルート`@folder`を使用

### 状態管理
- サーバー状態にはReact Server Componentsを使用
- クライアント状態には`useState`と`useReducer`を実装
- 複雑なクライアント状態にはZustandやContext APIを検討
- 共有可能な状態にはURLクエリパラメータを使用

## 開発ノート

- プロジェクトはNext.js App Router（Pages Routerではない）を使用
- TypeScriptが厳密に適用されている
- Tailwind CSSはsrc/内のすべての関連ファイルタイプをスキャンするよう設定
- アプリケーションタイトルは「Immersion English」、説明は「English immersion learning application」
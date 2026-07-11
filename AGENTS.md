# AGENTS.md

このリポジトリで作業するAIエージェント向けの技術的な手引き。

プロダクトの目的・フェーズ計画・仕様は [plan.md](./plan.md) が正とする。本ファイルはコードを書く上での実務的な注意点をまとめる。

## パッケージマネージャ

**pnpm** を使う。npmやyarnのコマンド・ロックファイルは使わない。

```bash
pnpm install
pnpm run dev      # 開発サーバー
pnpm run build    # 本番ビルド（tsc -b && vite build）
pnpm run test     # vitest run
pnpm run lint     # eslint .
pnpm run format   # prettier --write .
```

コードを変更したら、コミット前に `lint` → `test` → `build` を通す。

## ディレクトリ構成

```
src/
├── components/   UIコンポーネント（見た目・イベントハンドラのみ、ロジックは持たない）
├── hooks/        状態とロジック本体（useState/useEffect/useRefで完結）
├── services/     Canvas描画・Blob生成・ダウンロードなど副作用の塊（UIから独立、DOM/ブラウザAPIに依存してよい）
├── utils/        純粋関数（DOM非依存、ユニットテスト対象）
└── types/        共有の型定義
```

新しいロジックを書くとき、「テストしやすい計算」は`utils/`、「副作用はあるが再利用したい処理」は`services/`、「Reactの状態管理」は`hooks/`に置く。

## 状態管理

React標準のみ（`useState`/`useReducer`/`useRef`、必要な場合のみContext）。Redux/Zustandは導入しない。全体の状態は`App.tsx`に集約し、各hookが状態と操作関数を返す一方向のデータフロー。

### `<video>`要素の扱い方（重要）

`usePlaybackControls`が`<video>`の唯一の管理者。

- 実際に`video.currentTime`を書き換えたり`.play()`/`.pause()`を呼ぶ処理は、すべて`useRef`で保持した`nodeRef`（`videoNodeRef`として公開）経由で行う。
- `videoNode`（useState）は「videoが存在するかどうか」を他のhookに伝えて再レンダーを起こすためだけに使う。実体のミューテーションには使わない。

これは`eslint-plugin-react-hooks` v7（React Compiler対応ルール）が、hookの引数やuseStateの値を後から書き換えるコードをエラーにするため。新しく動画を操作する処理を書くときは、必ず`videoNodeRef.current`経由で行うこと。`videoNode`（state）を直接ミューテートするとlintが落ちる。

### state更新パターンの注意

以下2つの新しいlintルールに引っかかりやすい。

1. **`react-hooks/set-state-in-effect`**：propや外部値の変化に応じてstateを「リセット」する処理を`useEffect`の同期的な本体に書くと弾かれる。代わりにレンダー本体で条件付きで`setState`する（React公式の"adjusting state when a prop changes"パターン）。

   ```ts
   const [synced, setSynced] = useState(key)
   if (key !== synced) {
     setSynced(key)
     setSomeState(deriveFrom(key))
   }
   ```

   ※ただし`useRef`の値を触る場合はこのパターンは使えない（下記参照）。非同期処理（`await`の後）で呼ぶ`setState`は対象外なので、`useEffect`内の非同期コールバックからの更新は問題ない。

2. **`react-hooks/refs`**：refの読み書き（`.current`）はレンダー本体では禁止で、`useEffect`やイベントハンドラの中でのみ行う。「videoKeyが変わったらrefをリセットする」ような処理は`useEffect(() => { ... }, [key])`のクリーンアップ関数の中に書く。

実装例は`src/hooks/usePlaybackControls.ts`と`src/hooks/useThumbnailGeneration.ts`を参照。

## テスト方針

`plan.md`の「テスト方針」に準拠。動画再生やCanvas自体を無理にモックしない。

- **ユニットテスト対象**：`utils/`配下の純粋関数（時刻フォーマット、ファイル名生成、シーク量計算、サムネイル間隔計算など）
- **手動確認に委ねるもの**：実際の動画再生、`seeked`イベント、Canvas描画、WebP保存、`requestVideoFrameCallback`

新しいロジックを追加するときは、DOM/ブラウザAPIに依存する部分と純粋な計算部分を分離し、後者だけテストを書く。

## コーディング規約

- TypeScriptの`any`は使わない
- コメントは「WHY」が非自明な場合のみ、1行で
- Object URL（`URL.createObjectURL`）は使い終わったら必ず`revokeObjectURL`する。動画変更時・アンマウント時のクリーンアップを忘れない
- イベントリスナーは`useEffect`のクリーンアップで確実に解除する
- 新しい依存ライブラリを追加する前に、標準APIで実現できないか確認する

## 開発プロセス

- `plan.md`のフェーズ定義がプロダクトの実装順の基本方針。ユーザーから明示的な指示がない限り、未着手フェーズの機能を先回りして実装しない
- フェーズの完了条件・確認事項は`plan.md`の該当セクションを参照し、実装後はチェックボックスや実装状況の記述を更新する
- 動画ファイルは一切外部へ送信しない。ネットワーク送信が必要な実装を思いついても、この制約を優先する

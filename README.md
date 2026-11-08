# poyote

動画や画像を、Webに公開しやすい形に整えるアプリ。

- `/movie` 動画から好きなフレームを切り抜いて画像として保存する
- `/image` 手元の画像を好きな比率に切り取ってリサイズする
- `/compress` 手元の動画をWeb公開用の軽いmp4に変換し、poster用の静止画も書き出す

## 読み込んだファイルについて

読み込んだ動画・画像ファイルは外部サーバーへ送信されません。すべての処理はブラウザ内で完結します。

## コマンド

```bash
pnpm run dev      # 開発サーバー起動
pnpm run build    # 本番ビルド
pnpm run test     # テスト実行
pnpm run lint     # ESLintによる静的解析
pnpm run format   # Prettierによるフォーマット
```

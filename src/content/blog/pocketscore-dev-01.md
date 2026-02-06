---
title: "PocketScore開発記 #1：Tauri v2でSQLiteデータベースをバックアップ・復元する"
description: "ミュージシャンのための楽譜管理アプリを開発中。SQLiteのバックアップ機能をRustで実装した記録です。"
pubDate: "2026-02-06"
---

# PocketScore開発記 #1：Tauri v2でSQLiteデータベースをバックアップ・復元する

ミュージシャンをしながら、エンジニアとして「自分のための道具」を作っています。
現在開発しているのは、PDF楽譜管理アプリ **「PocketScore」**。

今回は、Androidアプリとしても展開する上で避けて通れない**「データのポータビリティ（バックアップと復元）」**をTauri v2でどう実装したか、その備忘録を残します。

## なぜバックアップが必要か

PocketScoreは、プライバシーとオフラインでの動作を重視し、データはすべてローカルの **SQLite** に保存しています。
しかし、Androidアプリとして運用する場合、端末の紛失や機種変更への備えが必須です。ユーザーが自分のデータを「資産」として持ち出せる仕組みを目指しました。

## 実装のポイント：ZIP形式でのエクスポート

バックアップファイル（拡張子 `.pscore`）の実体は、SQLiteのDBファイルと設定ファイルを固めたZIPアーカイブです。

### Rust（Backend）での処理

Rustの `zip` クレートと `walkdir` を組み合わせ、アプリのデータディレクトリを圧縮するコマンドを実装しました。

```rust
use std::fs::File;
use std::io::{Write, Read};
use zip::write::FileOptions;
use walkdir::WalkDir;

#[tauri::command]
pub async fn export_pscore(handle: tauri::AppHandle) -> Result<String, String> {
    // アプリ専用のデータディレクトリを取得
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("pocketscore.db");
    
    // 出力先のパス（例としてドキュメントフォルダ）
    let docs_dir = handle.path().document_dir().map_err(|e| e.to_string())?;
    let backup_path = docs_dir.join("backup.pscore");

    let file = File::create(&backup_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Stored);

    // DBファイルをZIPに追加
    zip.start_file("pocketscore.db", options).map_err(|e| e.to_string())?;
    let mut f = File::open(db_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    zip.write_all(&buffer).map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;
    
    Ok(backup_path.to_string_lossy().into_owned())
}
```

### フロントエンド（React）での呼び出し

ユーザー体験を損なわないよう、保存完了時にトースト通知を出すなど工夫しています。

```typescript
import { invoke } from "@tauri-apps/api/core";

const handleExport = async () => {
  setLoading(true);
  try {
    const path = await invoke<string>("export_pscore");
    alert(`バックアップが完了しました！\n保存先: ${path}`);
  } catch (e) {
    console.error(e);
    alert("エクスポート中にエラーが発生しました。");
  } finally {
    setLoading(false);
  }
};
```

### 実装上のハマりどころ：Androidのファイル権限

Androidで実装する際、最も苦労したのが**「ファイルシステムへのアクセス権限」**です。 Tauri v2では capabilities の設定が厳密になっており、path プラグインや fs プラグインの権限を正しく設定しないと、ファイルを作成した瞬間にアプリがクラッシュします。

また、保存先も app_data_dir（アプリ専用領域）から、ユーザーが見える document_dir へ移動させる際、Android 13以降のスコープドストレージの仕様を意識する必要がありました。

## 生活の文脈の中で作るということ

最近は冷え込み、仕事の合間に豆炭を熾して暖を取りながらコードを書いています。

次は、Android実機でのビルドと広告実装について書く予定です。

---
title: 生還記録】FreeBSDインストーラーの「ディスク全消去」警告を回避して、既存パーティションにZFSインストールする方法
description: FreeBSDインストーラーの「ディスク全消去」警告を回避して、既存パーティションにZFSインストールする方法を紹介します。
pubDate: 2026-02-28
---

FreeBSDを試そうと意気揚々とインストーラーを立ち上げ、パーティションまで進んだところでどうしても「ディスク全消去」の警告が出てきたり、先に進めなかったりしました。

インストーラーの「Manual」で freebsd-zfs パーティションを作成(仮でマウントポイントは/に)した後、「Shell」 で解決することができました。

```sh
# 既存の古いZFSラベル情報をクリア（念のため）
zpool labelclear -f /dev/nda0p4

# 特定のパーティションだけにプール「zroot」を作成
# -o altroot=/mnt を指定して、作業用に /mnt へ紐付けます
zpool create -o altroot=/mnt -m none -f zroot /dev/nda0p4

# ルートとなるデータセット（階層）の作成
zfs create -o mountpoint=none zroot/ROOT
zfs create -o mountpoint=/ zroot/ROOT/default
zfs create -o mountpoint=/home zroot/home

# ブート対象の設定（これを忘れると起動時にパニックになります）
zpool set bootfs=zroot/ROOT/default zroot

# exitするとファイルの展開が始まりました。
exit
```

うろ覚えですが、これで無事にインストールが完了しました。
ブートはNixOSのsystemd-bootなので、エントリーを追加してブートできました。

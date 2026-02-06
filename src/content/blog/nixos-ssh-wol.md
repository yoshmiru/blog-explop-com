---
title: "NixOSと多段SSHで作る、オンデマンド自宅開発環境"
pubDate: 2026-02-06
description: "VPS、MacBook Air、そしてメインPC。NixOSの宣言的設定とWoLを組み合わせて、外出先から自宅マシンを叩き起こす仕組みを構築しました。"
tags: ["NixOS", "Linux", "SSH", "WakeOnLan"]
---

## はじめに：静寂とパワーの共存

自宅のメインマシンのパワーは頼もしいですが、24時間ファンを回し続けるのは、電気代の面でも、部屋の静寂を保つ面でも避けたいところです。

そこで、「普段は眠っているが、外から一撃で叩き起こせる」環境をNixOSで構築しました。

## システム構成図

今回の構成は、VPSを玄関口にした3段構えです。

1. **VPS**: 固定IPで外からのSSH接続を待ち受ける。
2. **MacBook Air (Gateway)**: 自宅で常時起動。VPSへ逆トンネルを張りつつ、メインPCへの「目覚まし役」を担う。
3. **Main PC (Target)**: 普段はサスペンド。WoL（Wake-on-LAN）を受けて起動する。



## NixOSによる「寝かしつけ」と「目覚め」の設定

NixOSの魅力は、OSの状態をコードで管理できること。メインPCの `configuration.nix` に以下を追記するだけで、WoLの準備と自動スリープが完了します。

```nix
{ pkgs, ... }: {
  # ネットワークカードのWoLを有効化
  networking.interfaces."enp3s0".wakeOnLan.enable = true;

  # 30分間アイドルなら自動でサスペンド（エコ運用）
  services.logind.extraConfig = ''
    IdleAction=suspend
    IdleActionSec=30min
  '';
}
```

## 魔法のSSH Config

外出先の端末から `ssh main-pc` と打つだけで、すべての工程を自動化します。手元のデバイスの `~/.ssh/config` に以下の設定を仕込みます。

```text
# 中継役のMacBook Air (VPS経由)
Host mba
    HostName localhost
    Port 10026
    ProxyJump vps-server

# 本命のメインPC
Host main-pc
    HostName 192.168.1.XX  # 自宅内ローカルIP
    ProxyJump mba
    # 接続前にMBA上でWoLコマンドを実行し、5秒待機
    ProxyCommand ssh mba "wakeonlan [MACアドレス] && sleep 5" && ssh mba "nc %h %p"
```

## 結び

「使わないときは眠らせる、必要なときはコードで起こす」。
NixOSの宣言的な設定は、こうした少し複雑なインフラ構成を、圧倒的に見通しの良いものにしてくれます。

リモートワークや外出先からの作業が多い方の参考になれば幸いです。

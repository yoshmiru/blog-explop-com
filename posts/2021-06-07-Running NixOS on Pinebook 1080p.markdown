---
title: NixOS on Pinbook 1080p
---

Get installer from [https://nixos.wiki/wiki/NixOS_on_ARM](https://nixos.wiki/wiki/NixOS_on_ARM) and install it.

#### To get wifi connection, I had to have following steps

- clone nixpkgs

  `$ git clone git@github.com:NixOS/nixpkgs.git`

- Apply this patch

  [https://github.com/yoshmiru/nixpkgs/commit/1c90b3211b65ba9b75dd40142aefddb0aa3149c9](https://github.com/yoshmiru/nixpkgs/commit/1c90b3211b65ba9b75dd40142aefddb0aa3149c9)


- Load kernel module.
  - edit /etc/nixos/configuration.nix

    ``` boot.extraModulePackages = [ pkgs.linuxPackages.rtl8723cs ]; ```

  - Rebuild and switch

    `nixos-rebuild -I nixpkgs=/path/to/nixpkgs switch`


Thanks to these sites.

- https://nixos.wiki/wiki/Linux_kernel
- https://nixos.wiki/wiki/Nixpkgs/Create_and_debug_packages

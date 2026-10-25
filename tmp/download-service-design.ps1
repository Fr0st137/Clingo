$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor' | Out-Null
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/5f1d616b-8e11-4e3b-98a5-7b55d9e58156.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/check.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: check.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/7a0bdc45-6c5e-482e-88b8-a26e38794cd9.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/add-addon.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: add-addon.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/2c2d0368-a8d9-491c-8a3c-0a8977173995.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/switch-off.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: switch-off.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/92ef19b4-e581-4b39-90a1-f724d301e369.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/switch-on.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: switch-on.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/c13201f3-6f67-493f-9f91-5753da29fc50.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/clock.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: clock.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/f88fc302-e119-4b33-bac8-ca9728c72414.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/wallet.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: wallet.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/8fd5a807-4945-4f04-87b7-779fe14820d7.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/cleaning.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: cleaning.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/3f756c24-d599-48ab-92d7-01ba7136f706.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-1.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-1.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/1d134d5f-6753-4b07-8f83-b6bac934e294.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-2.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-2.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/e3cd90a5-0a5c-4b54-8f13-b9271835aa57.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-3.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-3.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/cdd9f406-6d0d-45d9-9045-9995c4149052.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-4.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-4.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/0657a8fe-259f-4ed3-8411-84f091683135.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-5.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-5.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/76c96c1f-9e36-4692-b9d5-49b5a66a9b6f.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-6.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-6.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/612a0046-24eb-4296-bd77-60e4a3e47e38.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-7.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-7.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/b140a56e-0414-43f3-a608-f69ee257a602.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-8.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-8.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/592f2571-939d-4c41-bb7b-d7478d9db6bf.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-9.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-9.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/84a37245-d70f-4e14-bddf-e01c770d8a1c.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/addon-10.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: addon-10.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/348b85c6-82e1-4f2f-b206-4ef069bbf51d.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/gallery-example.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: gallery-example.png' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/899996dc-cd9d-48cc-b632-b02e168b26b7.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/back.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: back.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/edebf763-9786-42d5-8521-1f0058ca2a52.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/preview.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: preview.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/f7973984-0e32-4ae1-9689-3781f10af06b.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/draft.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: draft.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/1d2e6b0d-592b-4820-8648-32b29d10a7c8.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/publish.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: publish.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/acac6b2c-f6a6-4ed9-8670-02a6e6ae9d82.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/info.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: info.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/0091c1d7-d1f4-4073-939f-6e14d94f0c21.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/minus.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: minus.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/e1b782ae-e4f0-4e65-8e4d-c5fbaae3ac93.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/plus.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: plus.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/7cb2365a-7c86-47e3-8980-15e098daf090.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/trash.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: trash.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/e4e83848-0566-4ed6-825c-7c64db64cf84.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/add-tier.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: add-tier.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/3db41729-2397-44d6-91ca-11930819d178.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/info-blue.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: info-blue.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/b88016b0-be52-480e-a1e9-0eeb76b83b63.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/warning.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: warning.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/a4cd36f0-758c-4bac-8ad7-fd8ea0013ffd.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/info-addons.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: info-addons.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/a1080afd-c359-4e4f-9b7e-25abb5b968fe.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/bold.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: bold.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/7dfd8489-0f58-43d1-a1be-afe0cbcbc539.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/italic.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: italic.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/e0a2f0de-251e-4ba6-831b-7cc5374ebbd0.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/underline.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: underline.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/bb3dd4f4-b00d-4443-96f7-64df144dfc29.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/strike.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: strike.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/85003651-0d3a-4a90-b5d8-9dd88198490f.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/paint.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: paint.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/70af0d72-55fb-4336-b848-b38699d3a1a1.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/list.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: list.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/24bdd9e1-e35c-4d5d-9f45-6ac556e15f91.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/smile.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: smile.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/567e2b30-ba4d-4914-bdd5-a746edd7347d.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/add-photo.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: add-photo.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/5fd98b1e-3a94-40ea-983e-254a821d640e.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/image.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: image.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/d2bf8fea-21a1-4fb2-ad0a-7b2765f935dc.svg' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/remove.svg'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: remove.svg' }
curl.exe -sS -L 'https://www.figma.com/api/mcp/asset/3151a75b-53e8-4bc7-a8fc-1cffc36c536f.png' -o 'outputs/clingo-platform/apps/provider/public/figma-assets/services/editor/background.png'
if ($LASTEXITCODE -ne 0) { throw 'Download failed: background.png' }

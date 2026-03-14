# Prumo Desktop Client

Shell Electron para Windows/Linux que carrega o `prumo-web-client`.

## Stack
- Electron
- Build embutido do `../prumo-web-client`

## Requisitos
- Node.js 20+
- npm 10+

## Rodar local (desktop)
```bash
npm install
npm run desktop:dev
```

Por padrao os scripts procuram o repo web em `../prumo-web-client`.
Se estiver em outro caminho, defina `PRUMO_WEB_CLIENT_DIR`.

## Gerar instalador Windows (.exe)
```bash
npm run desktop:build:win
```

## Gerar pacote Linux (.AppImage + .deb)
```bash
npm run desktop:build:linux
```

Em Windows, a geracao de `.AppImage` pode exigir privilegio de symlink (ou Developer Mode ativo). O caminho recomendado e executar esse build em runner Linux (workflow `desktop-release`).
Artefatos em `release/`.

## Variaveis de ambiente
Build embutido do web usa as variaveis do `prumo-web-client`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## GitHub Actions
- `desktop-ci`: valida preparacao do bundle web embutido em Windows e Linux.
- `desktop-release`: gera `.exe`, `.AppImage` e `.deb` e publica artefatos.

# Promo_APP_Windows

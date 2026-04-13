# Promo App Windows

Shell Electron dedicado ao Windows que carrega o `promo_APP_Web`.
O shell usa particao persistente (`persist:promo`) e bridge segura para sessao/desbloqueio rapido.

## Stack
- Electron
- Build embutido do `../promo_APP_Web`

## Requisitos
- Node.js 20+
- npm 10+

## Rodar local (desktop)
```bash
npm install
npm run desktop:dev
```

Por padrao os scripts procuram o repo web em `../promo_APP_Web`.
Se estiver em outro caminho, defina `PROMO_APP_WEB_DIR`.

## Gerar instalador Windows (.exe)
```bash
npm run desktop:build:win
```

Artefatos em `release/`.

## Variaveis de ambiente
Build embutido do web usa as variaveis do `promo_APP_Web`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Sessao e desbloqueio rapido
- Sessao permanece ativa por politica operacional (30 dias) no cliente.
- Tokens/sessao no desktop usam bridge segura (cofre local criptografado pelo SO quando disponivel).
- Primeiro login no desktop solicita configuracao de PIN para desbloqueio rapido.

## GitHub Actions
- `desktop-ci`: valida preparacao do bundle web embutido em Windows.
- `desktop-release`: gera `.exe` e publica artefato.

## Code Hygiene
```bash
npm run cleanup:analyze
npm run cleanup:verify
```

# Promo_APP_Windows

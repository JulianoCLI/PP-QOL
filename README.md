# PP-QOL — PokePixel QOL (Tampermonkey)

Script para `https://pokepixel.nietore.com/play/`: refill, catch, hunt por faixa de nível, recover e auto sell.

## Instalar

1. Instale Tampermonkey ou Violentmonkey.
2. Crie um script novo e cole o conteúdo de `pokepixel-qol.user.js`
   (ou instale pela URL raw abaixo).
3. Abra o jogo. O painel **PP-QOL** aparece na lateral direita.

- Raw: `https://raw.githubusercontent.com/JulianoCLI/PP-QOL/main/pokepixel-qol.user.js`
- O cabeçalho já tem `@updateURL` / `@downloadURL`, então o gerenciador checa atualização sozinho.

## O que faz

- **Refill** — compra na loja do Mark quando o estoque cai abaixo do mínimo.
- **Catch** — arremessa na fila de captura; bola separada para shiny.
- **Hunt** — entra sozinho na zona da rota conforme o nível do time.
- **Recover** — sem revive: sai para a cidade, cura e volta para a rota; com revive: usa `reviveHunt`.
- **Sell** — vende itens vendáveis no Mark de tempos em tempos; pokémons só com opt-in e allowlist.

## Atualização automática

- No boot o script baixa o próprio arquivo do GitHub e lê o `@version`.
- Se o remoto for maior, mostra um banner no painel: **Atualizar** (abre o raw) ou **Depois**.
- Botão **Verificar update** força a checagem manual.

## Notas

- Tudo persiste em `localStorage` (`pp-qol-v1`); recarregar mantém a config.
- Venda de pokémon vem desligada por padrão (`sellMonsOn: false`, lista vazia).

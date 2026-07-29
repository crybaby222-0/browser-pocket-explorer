O joystick já foi corrigido (os dois eixos estavam invertidos em relação à câmera).

O resto do pedido é grande demais para uma única entrega. Proposta dividida em fases; posso começar pela Fase 1 assim que aprovar.

## Fase 1 — Menu inicial + perfil + avatar
- Tela inicial substituindo o overlay atual: Jogar, Continuar, Perfil, Mundos, Configurações, Créditos.
- Perfil salvo no IndexedDB (nome, cor favorita, estatísticas: tempo jogado, mortes, itens criados).
- Editor de avatar com preview 3D ao vivo: cor de pele, cabelo (estilo + cor), roupa, acessório, altura. Alimenta o gerador procedural de personagem já existente.

## Fase 2 — Hotbar estilo Minecraft + joystick horizontal
- Barra de 9 slots fixa na base da tela, seleção por teclas 1–9, roda do mouse e arrastar no toque; item selecionado é o equipado.
- Sincronizada com a mochila (arrastar entre mochila e hotbar).
- Layout de controles em paisagem: joystick e botões reposicionados, hotbar reduzida, HUD compacto, detectando orientação.

## Fase 3 — Objetos 3D variados + texturas e shaders
- Variedade procedural: 5+ tipos de flor, potes de mel, cogumelos, tocos, cristais, barris, placas, pedras — com variação de cor/escala por semente.
- Painel "Aparência": pacotes de textura (Liso, Pixelado, Aquarela, Cel) gerados proceduralmente em canvas, sem arquivos externos.
- Shaders alternáveis: contorno toon, névoa, saturação, ondulação de água, modo retro (baixa resolução).

## Fase 4 — Mundos personalizados
- Tela "Mundos": criar/renomear/apagar, com semente digitável, tamanho, densidade de floresta, nível da água, altura das montanhas, clima e hora do dia.
- Cada mundo tem save próprio no IndexedDB; o menu inicial lista todos.

## Fase 5 — Multiplayer
- Precisa de servidor: usaria o Lovable Cloud (banco + realtime) para salas, presença e sincronização de posição/animação dos jogadores, com chat simples.
- Modelo cooperativo leve (mesmo mundo por semente, jogadores visíveis, sem sincronizar física de inimigos no início).

## Fase 6 — Tutorial de APK
- Página `/apk` no próprio app com passo a passo Capacitor: instalar, `npx cap add android`, build, abrir no Android Studio, gerar APK/AAB assinado, ícone e splash, testar no celular.

## Detalhes técnicos
- Tudo continua em Three.js + React, sem engines externas; geometria e texturas procedurais para não pesar o bundle.
- Multiplayer é a única fase que exige backend (Lovable Cloud); as demais são 100% cliente com IndexedDB.

## Pergunta
Confirma essa ordem, ou prefere priorizar alguma fase (por exemplo multiplayer ou APK) antes?

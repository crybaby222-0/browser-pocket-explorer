# LITE World

LITE — Jogo de Mundo Aberto 3D em HTML

Crie um jogo chamado LITE, um jogo de mundo aberto totalmente desenvolvido em HTML5, CSS3 e JavaScript, utilizando Three.js para renderização 3D. O projeto deve ser completo, organizado, otimizado para dispositivos móveis e desktop, sem depender de engines como Unity ou Unreal.

Direção Artística

O visual deve combinar a estética de jogos clássicos do Nintendo 3DS, Game Boy Advance, Paper Mario, Kirby e RPGs coloridos, mantendo identidade própria.

Características visuais:

Paleta extremamente vibrante.

Céu com gradientes suaves.

Iluminação estilizada.

Sombras simples.

Texturas em baixa resolução propositalmente.

Personagens com aparência "fofa".

Objetos grandes e fáceis de identificar.

Árvores, flores, casas e montanhas cartunescas.

Animações suaves.

Efeito leve de cel shading.

Água animada.

Grama balançando.

Partículas de poeira, folhas e brilho.

O resultado deve parecer um jogo portátil moderno inspirado no 3DS.

Mundo

Criar um mapa aberto explorável contendo:

Florestas

Vilas

Lago

Montanhas

Cavernas

Ruínas

Campos floridos

Praia

Pequenas ilhas

Pontes

Trilhas

Todo o cenário deve ser contínuo, sem telas de carregamento.

Jogador

Criar um personagem totalmente em 3D com:

Idle

Caminhar

Correr

Pular

Cair

Nadar

Girar

Interagir

A câmera deve ser em terceira pessoa.

Controles Mobile

Na versão mobile criar um HUD inspirado em jogos modernos.

Lado esquerdo:

Joystick virtual analógico transparente.

Lado direito:

Botão Pular

Botão Interagir

Botão Atacar

Botão Correr

Todos devem possuir:

Ícones SVG reais.

Design moderno.

Fundo translúcido.

Bordas arredondadas.

Feedback ao toque.

Animação de pressão.

Nunca utilizar emojis.

Utilizar ícones de bibliotecas reais como:

Lucide

Heroicons

Material Symbols

Font Awesome

Desktop

Adicionar suporte completo para:

WASD

Mouse

Gamepad API

Teclas configuráveis.

Sistema de Física

Implementar:

Gravidade

Colisão

Rampas

Escadas

Água

Quedas

Objetos sólidos

NPCs

Criar NPCs inteligentes capazes de:

Caminhar

Conversar

Dar missões

Dormir

Trabalhar

Sentar

Olhar para o jogador

Sistema de Diálogo

Criar caixas de diálogo modernas com:

Nome do personagem

Retrato

Texto digitando lentamente

Escolhas

Eventos

Missões

Inventário

Criar inventário completo com:

Itens

Consumíveis

Equipamentos

Ferramentas

Moedas

Arrastar e soltar

Descrição

Ícones reais.

Sistema de Craft

Permitir criar:

Ferramentas

Comidas

Itens especiais

Combate

Criar:

Espada

Arco

Magia

Dano

Vida

Inimigos

Bosses

Barra de HP.

Missões

Sistema completo contendo:

Missões principais

Missões secundárias

Objetivos

Recompensas

Mapa indicando destino.

Interface

Criar uma interface moderna usando HTML e CSS.

Sem emojis.

Utilizar SVGs reais.

Adicionar:

Mapa

Minimapa

Inventário

Configurações

Pause

HUD

Vida

Energia

Moedas

Relógio

Missões.

Sons

Adicionar:

Passos

Água

Vento

Pássaros

Ataques

Interface

Música ambiente.

Otimização

O jogo deve rodar em:

Android

iPhone

Tablet

Desktop

Com FPS elevado utilizando:

Frustum Culling

LOD

Compressão de texturas

Carregamento sob demanda

Instanced Meshes

Object Pooling.

Estrutura

Criar uma arquitetura profissional:

assets/

models/

textures/

audio/

icons/

fonts/

css/

js/

engine/

ui/

player/

world/

physics/

npc/

quests/

inventory/

combat/

save/

settings/

utils/

index.html

Sistema de Save

Salvar automaticamente:

Posição

Inventário

Missões

Configurações

Itens

Dinheiro

Progresso

Utilizar IndexedDB.

Configurações

Adicionar:

Volume

Qualidade gráfica

Idioma

Sensibilidade

Mostrar FPS

Sombras

Tela cheia

Render Distance

Controle.

Objetivo

Gerar um jogo extremamente polido, divertido e visualmente bonito, parecendo um título comercial para Nintendo 3DS, mas executado inteiramente no navegador usando apenas tecnologias web. O código deve ser modular, organizado, comentado, responsivo e fácil de expandir com novos mapas, personagens, itens e missões. Cada sistema deve ser funcional e integrado aos demais, evitando código de exemplo ou placeholders.

Sem usar blibliotecas da lovable

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/51f3abd5-36cc-42c2-90a4-e4292245955c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

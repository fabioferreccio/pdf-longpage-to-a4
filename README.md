# Nubank PDF A4 Converter

Este projeto é um utilitário especializado em converter informes de rendimentos do Nubank que utilizam o formato de "scroll longo" (páginas contínuas de grande altura) em documentos formatados no padrão A4, prontos para impressão e arquivamento profissional.

## Funcionalidades

- **Quebra Inteligente**: Identifica espaços vazios entre linhas de texto para evitar cortes no meio de informações.
- **Margens de Impressão**: Adiciona automaticamente uma margem de segurança de 30 pontos em todos os lados.
- **Remoção de Páginas em Branco**: Detecta e descarta segmentos que não contêm informação útil.
- **Redimensionamento Seguro**: Redimensiona o conteúdo caso ele exceda a área útil da página A4, garantindo que nada saia da borda.

## Requisitos

- Node.js (v20 ou superior)
- npm

## Instalação

```bash
npm install
```

## Uso

Para converter um arquivo PDF, utilize o comando:

```bash
npm run generate <caminho_do_input.pdf> <caminho_do_output.pdf>
```

Exemplo:
```bash
npm run generate input.pdf output.pdf
```

## Desenvolvimento (TDD)

O projeto foi desenvolvido seguindo práticas de TDD. Para rodar a switch de testes:

```bash
npm test
```

## Arquitetura

- **PdfAnalyzer**: Utiliza `pdf2json` para mapear coordenadas de texto e determinar os pontos ideais de corte.
- **PdfSplitter**: Utiliza `pdf-lib` para extrair os segmentos da página original e montá-los em novas páginas A4 com margens.
- **Orchestrator**: Coordena o processo de análise e geração.

## Licença

ISC

# Espaço Delas — Protótipo navegável

Plataforma digital de beleza e agendamentos do salão **Espaço Delas** (atendimento feminino e masculino).
Protótipo de demonstração desenvolvido por **FORGE STUDIOS — Tecnologias em Softwares LTDA.** (CNPJ 69.902.162/0001-11).

> Todos os valores, contatos, profissionais, clientes e agendamentos são **demonstrativos**.
> A autenticação é **simulada** (dados no `localStorage` do navegador) e **não** é adequada para produção.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build
```

O app usa `HashRouter`, então o conteúdo de `dist/` funciona em qualquer hospedagem estática, sem configurar rotas.

## Acessos de demonstração

| Área | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@demo.com` | `123456` |
| Administrador | `admin@espacodelas.com` | `admin123` |

As telas de login têm um botão **preencher** com esses dados. Em **Admin → Configurações → Restaurar dados demonstrativos** a base inicial é recriada (útil antes de uma apresentação).

## O que está implementado

- **Site institucional** (`/`): hero, 6 cartões de serviço com preço e duração demonstrativos, sobre nós, equipe, depoimentos e rodapé com contato, endereço, horários e redes sociais.
- **Área do cliente**: login, cadastro com validação, “esqueci minha senha” (simulado), painel com saudação, próximo agendamento, histórico, meus dados, cancelamento e pedido de alteração de horário.
- **Agendamento em 6 etapas** (`/agendar`): serviço → profissional → data (calendário) → horário → confirmação → sucesso (com download `.ics` para a agenda do celular). As escolhas ficam salvas se a pessoa precisar entrar ou criar conta no meio do fluxo.
- **Painel administrativo** (`/admin`, com login próprio): visão geral com indicadores, agenda diária (colunas por profissional) e semanal, lista de agendamentos com filtros e exportação CSV, clientes (CRUD e histórico), serviços (CRUD, imagem por URL ou upload, ativo/inativo), profissionais (especialidades, horários por dia da semana, disponibilidade), horários de funcionamento e bloqueios, relatórios (7/30/90 dias, exportação) e configurações.

### Regras de agenda

`src/lib/availability.ts` é a fonte única de disponibilidade:

- horário livre = dentro do expediente do salão **e** do profissional, sem sobrepor agendamentos ativos ou bloqueios, e não no passado;
- a duração de cada serviço define quanto tempo o horário ocupa;
- a criação e o reagendamento revalidam o horário no momento de salvar (sem reservas duplicadas para o mesmo profissional);
- cancelar libera o horário na hora; bloqueios e mudanças de expediente refletem imediatamente para os clientes.

## Estrutura

```
src/
  lib/         tipos, dados demonstrativos (seed), store + localStorage, regras de disponibilidade, datas
  components/  UI reutilizável (botões, modais, calendário, seletor de horários, gráficos…)
  layouts/     PublicLayout (site) e AdminLayout (menu lateral)
  pages/       public/, auth/, booking/, client/, admin/
```

## Imagens

As fotos ilustrativas vêm do Unsplash (`src/lib/images.ts`). Se alguma não carregar (sem internet, por exemplo), aparece uma arte de fallback na paleta do salão. Para produção, substitua pelas fotos reais do salão.

## Próximos passos para produção

Backend com banco de dados, autenticação real (hash de senha, recuperação por e-mail), notificações por WhatsApp/e-mail, pagamentos e hospedagem com domínio próprio.

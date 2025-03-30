# AcheiQuadra - Sistema de Gerenciamento de Quadras Esportivas

AcheiQuadra é uma plataforma SaaS (Software as a Service) para gerenciamento e locação de quadras esportivas. Este sistema conecta os praticantes de esportes com as arenas, facilitando o processo de reserva, pagamento e gestão de quadras.

## Funcionalidades Principais

### Para clientes (locatários)
- Busca de quadras por tipo, localização, preço e comodidades
- Visualização da disponibilidade em tempo real
- Reservas avulsas ou mensais
- Pagamento via PIX ou cartão de crédito
- Acompanhamento do status da reserva
- Avaliação após o uso
- Adição de serviços extras (aluguel de equipamentos, bebidas, etc.)

### Para arenas (proprietários)
- Gerenciamento de quadras e horários
- Configuração de preços e descontos
- Confirmação de reservas
- Relatórios financeiros
- Gestão de avaliações e feedback
- Cadastro de serviços extras

### Para administradores do sistema
- Gestão de usuários e arenas
- Monitoramento de pagamentos
- Relatórios gerais
- Configurações do sistema

## Tecnologias Utilizadas

### Backend
- **Python + FastAPI**: API RESTful com documentação automática e validação
- **MongoDB**: Banco de dados NoSQL para armazenamento flexível
- **JWT**: Autenticação segura
- **Pydantic**: Validação de dados e serialização
- **Motor (AsyncIO MongoDB)**: Acesso assíncrono ao banco de dados

### Frontend
- **React + TypeScript**: Interface responsiva e tipada
- **Tailwind CSS**: Framework de UI para desenvolvimento rápido
- **React Router**: Navegação entre páginas
- **Axios**: Cliente HTTP para requisições à API
- **React Context API**: Gerenciamento de estado
- **Recharts**: Biblioteca para visualizações e gráficos

### Integrações
- **Mercado Pago/Stripe**: Processamento de pagamentos
- **Twilio**: Comunicação via WhatsApp
- **SendGrid**: Envio de e-mails transacionais
- **Google Maps API**: Localização e cálculo de distâncias

### Infraestrutura
- **Docker + Docker Compose**: Containerização
- **Nginx**: Servidor web e proxy reverso
- **Let's Encrypt**: Certificados SSL gratuitos
- **VPS**: Hospedagem em servidor virtual

## Estrutura do Projeto

O projeto segue uma arquitetura moderna de microserviços, com frontend e backend separados:

### Backend (Python + FastAPI)
- **API RESTful**: Endpoints para todas as operações do sistema
- **Validação de dados**: Esquemas Pydantic para validação de entrada/saída
- **Autenticação JWT**: Segurança e controle de acesso
- **Banco MongoDB**: Flexibilidade para armazenar diferentes tipos de dados
- **Consultas Geoespaciais**: Busca de quadras por proximidade

### Frontend (React + TypeScript)
- **Componentes Reutilizáveis**: Biblioteca de UI customizada
- **Páginas Responsivas**: Funciona em desktop e dispositivos móveis
- **Rotas Protegidas**: Controle de acesso baseado em perfil de usuário
- **Formulários Validados**: Feedback imediato para o usuário
- **Estado Global**: Contexto para usuário, autenticação e dados comuns

## Fluxo de Reserva

1. Usuário busca quadras por tipo, localização e disponibilidade
2. Seleciona uma quadra e visualiza detalhes (fotos, preço, avaliações)
3. Escolhe data e horário disponíveis
4. Adiciona serviços extras (opcional)
5. Confirma a reserva (login requerido)
6. Realiza o pagamento (PIX ou cartão)
7. Sistema notifica a arena sobre a nova reserva
8. Arena confirma a reserva
9. Sistema notifica o usuário sobre a confirmação
10. Usuário utiliza a quadra no horário reservado
11. Após o uso, o usuário pode avaliar a experiência

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos
- Docker e Docker Compose
- Node.js (versão 16+)
- Python (versão 3.9+)
- MongoDB (ou usar o container)

### Backend
1. Clone o repositório
2. Crie um arquivo `.env` baseado no `.env.example`
3. Execute o ambiente com Docker Compose:
   ```
   docker-compose up -d backend mongo
   ```
4. Inicialize o banco de dados:
   ```
   docker-compose exec backend python -m app.db.init_db
   ```

### Frontend
1. Navegue até a pasta do frontend
2. Instale as dependências:
   ```
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```
   npm start
   ```

## Deployment em Produção

### Usando Docker Compose
1. Configure o arquivo `.env` com as variáveis de produção
2. Execute o build e inicialização dos containers:
   ```
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
3. Configure o Nginx para servir a aplicação com SSL:
   ```
   docker-compose exec nginx nginx -s reload
   ```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para o branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Próximos Passos

- Implementação de aplicativo móvel (React Native)
- Integração com Google Calendar e outros sistemas de agenda
- Sistema de notificações push
- Funcionalidade de reserva recorrente
- Área para organização de campeonatos e eventos
- Integração com redes sociais para compartilhamento



# ESTRUTURA DO PROJETO
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py           # Rotas de autenticação e usuários
│   │   │   ├── arenas.py         # Rotas de gerenciamento de arenas
│   │   │   ├── courts.py         # Rotas de quadras e disponibilidade
│   │   │   ├── bookings.py       # Rotas de reservas
│   │   │   ├── payments.py       # Rotas de pagamentos
│   │   │   ├── reviews.py        # Rotas de avaliações
│   │   │   ├── users.py          # Rotas de perfil de usuário
│   │   │   └── admin.py          # Rotas administrativas
│   │   └── api.py                # Configuração das rotas da API
│   ├── core/
│   │   ├── config.py             # Configurações do sistema
│   │   ├── security.py           # Autenticação e segurança
│   │   └── constants.py          # Constantes do sistema
│   ├── db/
│   │   ├── database.py           # Conexão com MongoDB
│   │   ├── repositories/         # Padrão repositório para acesso a dados
│   │   │   ├── arena_repo.py     # Repositório de arenas
│   │   │   ├── booking_repo.py   # Repositório de reservas
│   │   │   ├── court_repo.py     # Repositório de quadras
│   │   │   ├── payment_repo.py   # Repositório de pagamentos
│   │   │   ├── review_repo.py    # Repositório de avaliações
│   │   │   └── user_repo.py      # Repositório de usuários
│   │   └── init_db.py            # Inicialização do banco
│   ├── models/                   # Modelos de dados (Pydantic)
│   │   ├── user.py               # Modelo de usuário
│   │   ├── arena.py              # Modelo de arena
│   │   ├── court.py              # Modelo de quadra
│   │   ├── booking.py            # Modelo de reserva
│   │   ├── payment.py            # Modelo de pagamento
│   │   └── review.py             # Modelo de avaliação
│   ├── schemas/                  # Esquemas para validação de dados
│   │   ├── user.py               # Esquemas de usuário (criar, atualizar, etc)
│   │   ├── arena.py              # Esquemas de arena
│   │   ├── court.py              # Esquemas de quadra
│   │   ├── booking.py            # Esquemas de reserva
│   │   ├── payment.py            # Esquemas de pagamento
│   │   └── review.py             # Esquemas de avaliação
│   ├── services/                 # Lógica de negócio e integrações
│   │   ├── email.py              # Serviço de e-mail
│   │   ├── whatsapp.py           # Serviço de WhatsApp (Twilio)
│   │   ├── payment.py            # Integração com gateway de pagamento
│   │   ├── maps.py               # Integração com Google Maps
│   │   ├── booking_service.py    # Serviço de reservas
│   │   ├── court_service.py      # Serviço de quadras
│   │   └── user_service.py       # Serviço de usuários
│   ├── templates/                # Templates de e-mail e documentos
│   │   ├── email/
│   │   │   ├── booking_confirmation.html
│   │   │   ├── welcome.html
│   │   │   ├── password_reset.html
│   │   │   └── verification.html
│   │   └── pdf/
│   │       └── receipt.html
│   ├── utils/                    # Utilitários
│   │   ├── validators.py         # Validadores (CPF, etc)
│   │   ├── date_utils.py         # Funções para manipulação de datas
│   │   ├── pdf_generator.py      # Gerador de PDF para recibos
│   │   └── helpers.py            # Funções auxiliares diversas
│   └── main.py                   # Ponto de entrada da aplicação
├── tests/                        # Testes
│   ├── conftest.py               # Configurações e fixtures para testes
│   ├── unit/                     # Testes unitários
│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   └── test_validators.py
│   └── integration/              # Testes de integração
│       ├── test_auth_api.py
│       ├── test_courts_api.py
│       └── test_bookings_api.py
├── alembic/                      # Migrations (caso use SQL no futuro)
├── .env.example                  # Exemplo de variáveis de ambiente
├── requirements.txt              # Dependências Python
├── requirements-dev.txt          # Dependências para desenvolvimento
├── Dockerfile                    # Docker para backend
└── pytest.ini                    # Configuração de testes

frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   ├── robots.txt
│   └── assets/
│       ├── logos/
│       └── images/
├── src/
│   ├── assets/                   # Recursos estáticos
│   │   ├── images/               # Imagens
│   │   ├── icons/                # Ícones SVG
│   │   └── styles/               # Estilos CSS/SCSS globais
│   ├── components/               # Componentes React reutilizáveis
│   │   ├── common/               # Componentes gerais
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorDisplay.tsx
│   │   ├── layouts/              # Layouts de página
│   │   │   ├── MainLayout.tsx    # Layout principal
│   │   │   ├── AdminLayout.tsx   # Layout para admin
│   │   │   └── ArenaLayout.tsx   # Layout para donos de arena
│   │   ├── courts/               # Componentes de quadras
│   │   │   ├── CourtCard.tsx
│   │   │   ├── CourtDetails.tsx
│   │   │   ├── CourtFilter.tsx
│   │   │   └── CourtGallery.tsx
│   │   ├── bookings/             # Componentes de reservas
│   │   │   ├── BookingSummary.tsx
│   │   │   ├── CourtCalendar.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   └── BookingFilter.tsx
│   │   ├── payment/              # Componentes de pagamento
│   │   │   ├── PixPayment.tsx
│   │   │   ├── CreditCardForm.tsx
│   │   │   └── PaymentSummary.tsx
│   │   ├── user/                 # Componentes de usuário
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── UserBookings.tsx
│   │   │   └── UserReviews.tsx
│   │   └── admin/                # Componentes de admin
│   │       ├── UserList.tsx
│   │       ├── ArenaList.tsx
│   │       └── DashboardStats.tsx
│   ├── context/                  # Context API (estado global)
│   │   ├── AuthContext.tsx       # Contexto de autenticação
│   │   ├── BookingContext.tsx    # Contexto de reserva em andamento
│   │   └── ThemeContext.tsx      # Contexto de tema/UI
│   ├── hooks/                    # Custom hooks React
│   │   ├── useAuth.ts            # Hook para autenticação
│   │   ├── useForm.ts            # Hook para formulários
│   │   ├── useCourts.ts          # Hook para dados de quadras
│   │   └── useBookings.ts        # Hook para reservas
│   ├── pages/                    # Páginas principais
│   │   ├── Home/
│   │   │   └── index.tsx         # Página inicial
│   │   ├── Login/
│   │   │   └── index.tsx         # Página de login
│   │   ├── Register/
│   │   │   └── index.tsx         # Página de cadastro
│   │   ├── Search/
│   │   │   └── index.tsx         # Busca de quadras
│   │   ├── ArenaDetails/
│   │   │   └── index.tsx         # Detalhes da arena
│   │   ├── Booking/
│   │   │   └── index.tsx         # Página de reserva
│   │   ├── Payment/
│   │   │   └── index.tsx         # Página de pagamento
│   │   ├── UserProfile/
│   │   │   └── index.tsx         # Perfil do usuário
│   │   ├── UserBookings/
│   │   │   └── index.tsx         # Reservas do usuário
│   │   ├── ArenaAdmin/
│   │   │   ├── Dashboard/
│   │   │   │   └── index.tsx     # Dashboard da arena
│   │   │   ├── Courts/
│   │   │   │   └── index.tsx     # Gerenciamento de quadras
│   │   │   ├── Bookings/
│   │   │   │   └── index.tsx     # Gerenciamento de reservas
│   │   │   └── Settings/
│   │   │       └── index.tsx     # Configurações da arena
│   │   └── Admin/
│   │       ├── Dashboard/
│   │       │   └── index.tsx     # Dashboard admin
│   │       ├── Users/
│   │       │   └── index.tsx     # Gestão de usuários
│   │       └── Arenas/
│   │           └── index.tsx     # Gestão de arenas
│   ├── services/                 # Serviços de API e utilitários
│   │   ├── api.ts                # Cliente Axios configurado
│   │   ├── auth.service.ts       # Serviço de autenticação
│   │   ├── courts.service.ts     # Serviço de quadras
│   │   ├── bookings.service.ts   # Serviço de reservas
│   │   ├── payments.service.ts   # Serviço de pagamentos
│   │   └── storage.service.ts    # Serviço de armazenamento local
│   ├── utils/                    # Utilitários
│   │   ├── formatters.ts         # Formatação (datas, moeda, etc)
│   │   ├── validators.ts         # Validadores de formulário
│   │   ├── constants.ts          # Constantes da aplicação
│   │   └── helpers.ts            # Funções auxiliares diversas
│   ├── types/                    # Definições de tipos TypeScript
│   │   ├── user.types.ts
│   │   ├── arena.types.ts
│   │   ├── court.types.ts
│   │   ├── booking.types.ts
│   │   └── payment.types.ts
│   ├── App.tsx                   # Componente principal
│   ├── index.tsx                 # Ponto de entrada do React
│   └── react-app-env.d.ts        # Declarações de ambiente
├── .env.example                  # Exemplo de variáveis de ambiente
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── tailwind.config.js            # Configuração Tailwind CSS
├── .eslintrc.js                  # Configuração ESLint
├── .prettierrc                   # Configuração Prettier
├── Dockerfile                    # Docker para frontend
└── README.md                     # Documentação

# # Descrição Funcional - AcheiQuadraApp

## Visão Geral

AcheiQuadra é um sistema SaaS para gerenciamento e reserva de quadras esportivas. A plataforma conecta três tipos de usuários:
1. Clientes que desejam alugar quadras
2. Donos de arenas que oferecem quadras para locação
3. Administradores do sistema

## Modelos de Dados

### User
- Representa usuários do sistema (clientes, donos de arena, administradores)
- Atributos: id, username, email, password_hash, first_name, last_name, phone, cpf, birth_date, role, is_active
- Roles: ADMIN, ARENA_OWNER, CUSTOMER

### Arena
- Representa estabelecimentos com quadras esportivas
- Atributos: id, name, description, address, owner_id, phone, email, logo_url, photos, amenities, rating, business_hours, cancellation_policy

### Court
- Representa quadras individuais pertencentes a uma arena
- Atributos: id, arena_id, name, type, description, photos, price_per_hour, discounted_price, minimum_booking_hours, characteristics, extra_services

### Booking
- Representa reservas de quadras
- Atributos: id, user_id, court_id, arena_id, booking_type (single/monthly), timeslot, monthly_config, status, price_per_hour, total_hours, subtotal, total_amount
- Status: PENDING, WAITING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED

### Payment
- Representa pagamentos de reservas
- Atributos: id, booking_id, user_id, arena_id, amount, payment_method, status, gateway_id, payment_date
- Métodos: PIX, CREDIT_CARD, ON_SITE

### Review
- Representa avaliações de usuários após o uso das quadras
- Atributos: id, booking_id, user_id, arena_id, court_id, rating, comment, aspects

## Fluxos Principais

### Fluxo de Busca e Reserva
1. Usuário busca quadras por tipo, localização, data, etc
2. Sistema exibe quadras disponíveis
3. Usuário seleciona uma quadra específica
4. Usuário escolhe data e horário disponíveis
5. Usuário adiciona serviços extras (opcional)
6. Usuário confirma reserva (login necessário)
7. Usuário realiza pagamento
8. Sistema notifica arena sobre nova reserva
9. Arena confirma ou rejeita reserva
10. Sistema notifica usuário sobre status da reserva

### Fluxo de Gestão de Arena
1. Dono da arena acessa painel administrativo
2. Cadastra/gerencia quadras, preços, disponibilidade
3. Visualiza/confirma/rejeita reservas
4. Acessa relatórios financeiros e ocupação
5. Gerencia serviços extras

### Fluxo Administrativo
1. Administrador acessa painel administrativo
2. Gerencia usuários, arenas, configurações do sistema
3. Visualiza relatórios, métricas e KPIs
4. Resolve disputas ou problemas

## Regras de Negócio

1. Uma reserva só é confirmada após pagamento e aprovação da arena
2. Cancelamentos seguem política específica de cada arena
3. Avaliações só podem ser feitas após o uso da quadra
4. Reservas mensais são recorrentes e têm um período mínimo
5. Donos de arena podem oferecer descontos para pagamentos antecipados
6. Usuários inativos não podem fazer reservas

## Integrações

1. Pagamentos: Mercado Pago/Stripe para processamento
2. Notificações: Twilio para WhatsApp, SendGrid para emails
3. Mapas: Google Maps para localização e distâncias
4. Armazenamento: AWS S3 para imagens e arquivos

## Componentes Principais (Frontend)

1. CourtCard: Exibe informações resumidas de uma quadra
2. CourtCalendar: Calendário de disponibilidade de uma quadra
3. BookingSummary: Resumo da reserva com preços
4. PaymentForm: Formulário de pagamento com opções PIX e Cartão

## Endpoints Principais (Backend)

1. /api/courts: Busca de quadras com filtros
2. /api/courts/{id}/availability: Disponibilidade de horários
3. /api/bookings: Criação e gestão de reservas
4. /api/payments: Processamento de pagamentos
5. /api/arenas/{id}/courts: Quadras de uma arena específica
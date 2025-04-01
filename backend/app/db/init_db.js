// scripts/insert_test_data.js

// Função para gerar data ISO string com dias de diferença
function getDateString(daysDiff = 0) {
    var date = new Date();
    date.setDate(date.getDate() + daysDiff);
    return date.toISOString();
}

// Inserir usuários
var users = [
    {
        _id: ObjectId("507f1f77bcf86cd799439012"),
        username: "joaoproprietario",
        email: "joao@arenaexemplo.com",
        first_name: "João",
        last_name: "Silva",
        phone: "11988888888",
        password_hash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // "secret"
        cpf: "11111111111",
        birth_date: new Date("1985-05-15"),
        is_active: true,
        role: "arena_owner",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        _id: ObjectId("507f1f77bcf86cd799439013"),
        username: "mariacliente",
        email: "maria@email.com",
        first_name: "Maria",
        last_name: "Santos",
        phone: "11977777777",
        password_hash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // "secret"
        cpf: "22222222222",
        birth_date: new Date("1992-08-20"),
        is_active: true,
        role: "customer",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        _id: ObjectId("507f1f77bcf86cd799439014"),
        username: "carloscliente",
        email: "carlos@email.com",
        first_name: "Carlos",
        last_name: "Oliveira",
        phone: "11966666666",
        password_hash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // "secret"
        cpf: "33333333333",
        birth_date: new Date("1988-11-10"),
        is_active: true,
        role: "customer",
        created_at: new Date(),
        updated_at: new Date()
    }
];

// Inserir arenas
var arenas = [
    {
        "_id": ObjectId("607f1f77bcf86cd799439021"),
        "name": "Arena Esportiva São Paulo",
        "description": "Arena completa com diversas quadras esportivas",
        "owner_id": ObjectId("507f1f77bcf86cd799439012"),
        "address": {
            "street": "Rua das Quadras",
            "number": "100",
            "neighborhood": "Moema",
            "city": "São Paulo",
            "state": "SP",
            "zipcode": "04078000",
            "coordinates": {
                "latitude": -23.6025,
                "longitude": -46.6669
            }
        },
        "phone": "1122223333",
        "email": "contato@arenaesportiva.com",
        "business_hours": {
            "monday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "tuesday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "wednesday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "thursday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "friday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "saturday": [
                {
                    "start": "08:00",
                    "end": "22:00"
                }
            ],
            "sunday": [
                {
                    "start": "08:00",
                    "end": "18:00"
                }
            ]
        },
        "cancellation_policy": "Cancelamentos devem ser feitos com 24h de antecedência",
        "advance_payment_required": true,
        "payment_deadline_hours": 24.0,
        "logo_url": "https://example.com/logos/arena1.jpg",
        "photos": [
            "https://www.jaraguatenisclube.com.br/imagem/estrutura/10/thumbnails/IMG_20180518_074836342_654x0.jpg"
        ],
        "amenities": [
            "estacionamento",
            "vestiário",
            "lanchonete"
        ],
        "active": true,
        "created_at": ISODate("2025-03-31T17:00:57.668Z"),
        "updated_at": ISODate("2025-03-31T17:00:57.668Z")
    },
    {
        "_id": ObjectId("607f1f77bcf86cd799439022"),
        "name": "Centro de Tênis Paulista",
        "description": "Especializado em quadras de tênis e beach tennis",
        "owner_id": ObjectId("507f1f77bcf86cd799439012"),
        "address": {
            "street": "Avenida dos Tenistas",
            "number": "500",
            "neighborhood": "Pinheiros",
            "city": "São Paulo",
            "state": "SP",
            "zipcode": "05414000",
            "coordinates": {
                "latitude": -23.5678,
                "longitude": -46.6987
            }
        },
        "phone": "1133334444",
        "email": "contato@tenispaulista.com",
        "business_hours": {
            "monday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "tuesday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "wednesday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "thursday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "friday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "saturday": [
                {
                    "start": "07:00",
                    "end": "23:00"
                }
            ],
            "sunday": [
                {
                    "start": "07:00",
                    "end": "21:00"
                }
            ]
        },
        "cancellation_policy": "Cancelamentos devem ser feitos com 12h de antecedência",
        "advance_payment_required": true,
        "payment_deadline_hours": 12.0,
        "logo_url": "https://example.com/logos/arena2.jpg",
        "photos": [
            "https://www.recoma.com.br/wp-content/uploads/2019/09/Recomaclay-3-1.jpg"
        ],
        "amenities": [
            "vestiário",
            "loja de artigos esportivos",
            "quadras cobertas"
        ],
        "active": true,
        "created_at": ISODate("2025-03-31T17:00:57.668Z"),
        "updated_at": ISODate("2025-03-31T17:00:57.668Z")
    }
];

// Inserir quadras
var courts = [
    {
        "_id": ObjectId("707f1f77bcf86cd799439031"),
        "arena_id": ObjectId("607f1f77bcf86cd799439021"),
        "name": "Quadra 1 - Futsal",
        "type": "futsal",
        "description": "Quadra oficial de futsal, piso sintético",
        "price_per_hour": 120.0,
        "discounted_price": 100.0,
        "minimum_booking_hours": 1.0,
        "is_available": true,
        "advance_payment_required": true,
        "photos": [
            "https://www.jaraguatenisclube.com.br/imagem/estrutura/10/thumbnails/IMG_20180518_074836342_654x0.jpg",
            "https://example.com/photos/court1-2.jpg",
            "https://www.jaraguatenisclube.com.br/imagem/estrutura/10/thumbnails/IMG_20180518_074841186_654x0.jpg"
        ],
        "characteristics": [
            "piso sintético",
            "traves oficiais",
            "iluminação noturna"
        ],
        "extra_services": [
            "bola",
            "juiz"
        ],
        "created_at": ISODate("2025-03-31T17:00:57.669Z"),
        "updated_at": ISODate("2025-03-31T17:00:57.669Z")
    },
    {
        "_id": ObjectId("707f1f77bcf86cd799439032"),
        "arena_id": ObjectId("607f1f77bcf86cd799439021"),
        "name": "Quadra 2 - Society",
        "type": "soccer",
        "description": "Quadra de society grama sintética",
        "price_per_hour": 200.0,
        "minimum_booking_hours": 1.0,
        "is_available": true,
        "advance_payment_required": true,
        "photos": [
            "https://urupes.sp.gov.br/noticias/upload/postagens/1715802666_32167.jpg",
            "https://empreendahoje.com/wp-content/uploads/2020/02/Quadra-de-futebol-society-2.jpg"
        ],
        "characteristics": [
            "grama sintética",
            "arquibancada",
            "vestiário"
        ],
        "extra_services": [
            "bola",
            "juiz"
        ],
        "created_at": ISODate("2025-03-31T17:00:57.669Z"),
        "updated_at": ISODate("2025-03-31T17:00:57.669Z")
    },
    {
        "_id": ObjectId("707f1f77bcf86cd799439033"),
        "arena_id": ObjectId("607f1f77bcf86cd799439022"),
        "name": "Quadra 1 - Tênis",
        "type": "tennis",
        "description": "Quadra de tênis saibro",
        "price_per_hour": 150.0,
        "minimum_booking_hours": 1.0,
        "is_available": true,
        "advance_payment_required": true,
        "photos": [
            "https://www.recoma.com.br/wp-content/uploads/2019/09/Recomaclay-3-1.jpg",
            "https://brascourt.com.br/wp-content/uploads/2021/11/6-1.png"
        ],
        "characteristics": [
            "piso de saibro",
            "rede oficial"
        ],
        "extra_services": [
            "raquete",
            "bola"
        ],
        "created_at": ISODate("2025-03-31T17:00:57.669Z"),
        "updated_at": ISODate("2025-03-31T17:00:57.669Z")
    }
];

// Inserir reservas
var bookings = [
    // Reserva avulsa - pendente
    {
        _id: ObjectId("807f1f77bcf86cd799439041"),
        user_id: ObjectId("507f1f77bcf86cd799439013"), // Maria Santos
        court_id: ObjectId("707f1f77bcf86cd799439031"), // Quadra Futsal
        arena_id: ObjectId("607f1f77bcf86cd799439021"), // Arena Esportiva SP
        booking_type: "single",
        timeslot: {
            date: getDateString(2), // 2 dias no futuro
            start_time: "19:00",
            end_time: "20:00"
        },
        status: "pending",
        price_per_hour: 120.00,
        total_hours: 1,
        subtotal: 120.00,
        extra_services: [
            {
                service_id: "1",
                name: "Bola",
                quantity: 1,
                unit_price: 10.00,
                total_price: 10.00
            }
        ],
        total_amount: 130.00,
        discount_amount: 0.00,
        requires_payment: true,
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        created_at: new Date(),
        updated_at: new Date()
    },
    // Reserva avulsa - confirmada
    {
        _id: ObjectId("807f1f77bcf86cd799439042"),
        user_id: ObjectId("507f1f77bcf86cd799439014"), // Carlos Oliveira
        court_id: ObjectId("707f1f77bcf86cd799439032"), // Quadra Society
        arena_id: ObjectId("607f1f77bcf86cd799439021"), // Arena Esportiva SP
        booking_type: "single",
        timeslot: {
            date: getDateString(3), // 3 dias no futuro
            start_time: "20:00",
            end_time: "22:00"
        },
        status: "confirmed",
        price_per_hour: 200.00,
        total_hours: 2,
        subtotal: 400.00,
        extra_services: [],
        total_amount: 400.00,
        discount_amount: 0.00,
        requires_payment: true,
        payment_deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 horas
        created_at: new Date(),
        updated_at: new Date()
    },
    // Reserva mensal - confirmada
    {
        _id: ObjectId("807f1f77bcf86cd799439043"),
        user_id: ObjectId("507f1f77bcf86cd799439013"), // Maria Santos
        court_id: ObjectId("707f1f77bcf86cd799439033"), // Quadra Tênis
        arena_id: ObjectId("607f1f77bcf86cd799439022"), // Centro de Tênis Paulista
        booking_type: "monthly",
        monthly_config: {
            weekdays: [2, 4], // Terça e Quinta
            start_time: "18:00",
            end_time: "19:00",
            start_date: getDateString(0),
            end_date: getDateString(30) // 30 dias no futuro
        },
        status: "confirmed",
        price_per_hour: 150.00,
        total_hours: 8, // 2 dias por semana * 4 semanas
        subtotal: 1200.00,
        extra_services: [
            {
                service_id: "2",
                name: "Raquete",
                quantity: 2,
                unit_price: 15.00,
                total_price: 30.00
            }
        ],
        total_amount: 1230.00,
        discount_amount: 100.00, // Desconto de R$100
        requires_payment: true,
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        created_at: new Date(),
        updated_at: new Date()
    }
];

// Inserir pagamentos
var payments = [
    {
        _id: ObjectId("907f1f77bcf86cd799439051"),
        booking_id: ObjectId("807f1f77bcf86cd799439042"), // Reserva confirmada
        user_id: ObjectId("507f1f77bcf86cd799439014"), // Carlos Oliveira
        arena_id: ObjectId("607f1f77bcf86cd799439021"), // Arena Esportiva SP
        payment_method: "pix",
        amount: 400.00,
        status: "approved",
        gateway_id: "PIX123456789",
        pix_qrcode: "00020101021226860014br.gov.bcb.pix2561qrcodes.example.com/qr/v2/9d36b84fc2754f2caa1c00f8cd2b4d9e520400005303986540540.005802BR5925ARENA ESPORTIVA SAO PAULO6009SAO PAULO6108054078000620712345678906304",
        payment_date: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        _id: ObjectId("907f1f77bcf86cd799439052"),
        booking_id: ObjectId("807f1f77bcf86cd799439043"), // Reserva mensal
        user_id: ObjectId("507f1f77bcf86cd799439013"), // Maria Santos
        arena_id: ObjectId("607f1f77bcf86cd799439022"), // Centro de Tênis Paulista
        payment_method: "credit_card",
        amount: 1130.00, // 1230 - 100 de desconto
        status: "approved",
        gateway_id: "CC987654321",
        credit_card_last4: "4242",
        payment_date: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        created_at: new Date(),
        updated_at: new Date()
    }
];

// Executar as inserções
db.users.insertMany(users);
db.arenas.insertMany(arenas);
db.courts.insertMany(courts);
db.bookings.insertMany(bookings);
db.payments.insertMany(payments);

print("Dados de teste inseridos com sucesso!");
-- ==========================================================================
-- AUTO DRIVE CRM - BANCO DE DADOS POSTGRESQL (SUPABASE CONFIG - V2)
-- Copie todo este código e cole no SQL Editor do seu projeto Supabase.
-- ==========================================================================

-- 1. LIMPEZA DE TABELAS EXISTENTES (Caso queira recriar)
DROP TABLE IF EXISTS agenda CASCADE;
DROP TABLE IF EXISTS despesas CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS estoque CASCADE;

-- 2. TABELA DE ESTOQUE (VEÍCULOS)
CREATE TABLE estoque (
    id SERIAL PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    year VARCHAR(20) NOT NULL,
    km INTEGER NOT NULL DEFAULT 0,
    buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    days_in_stock INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'disponivel', -- disponivel, reservado, vendido, preparacao
    type VARCHAR(50) NOT NULL DEFAULT 'convencional',  -- convencional, repasse
    plate VARCHAR(50) DEFAULT '',
    color VARCHAR(100) DEFAULT '',
    chassis VARCHAR(100) DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABELA DE LEADS
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    interest_car_id INTEGER REFERENCES estoque(id) ON DELETE SET NULL,
    origin VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'novo lead', -- novo lead, contato realizado, negociacao, sem resposta, fechado, perdido
    last_contact_days INTEGER NOT NULL DEFAULT 0,
    next_action VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. TABELA DE INTERAÇÕES (TIMELINE DOS LEADS)
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABELA DE VENDAS CONSOLIDADAS
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES estoque(id) ON DELETE SET NULL,
    client VARCHAR(255) NOT NULL,
    sell_price NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    profit NUMERIC(12, 2) NOT NULL,
    margin NUMERIC(5, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- convencional, repasse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. TABELA DE DESPESAS (CUSTOS OPERACIONAIS E PREPARAÇÃO)
CREATE TABLE despesas (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    car_id INTEGER REFERENCES estoque(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    val NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Preparação, Marketing, Mecânica, Operacional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. TABELA DE AGENDA OPERACIONAL
CREATE TABLE agenda (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    car_id INTEGER REFERENCES estoque(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- visitas, entregas, revisao, documentos
    description VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==========================================================================
-- POPULANDO COM DADOS MOCKADOS E REALISTAS INICIAIS
-- ==========================================================================

-- Inserindo veículos no Estoque com os novos campos
INSERT INTO estoque (id, model, year, km, buy_price, sell_price, days_in_stock, status, type, plate, color, chassis) VALUES
(1, 'Jeep Compass Longitude 2.0 Flex', '2021/2021', 42000, 110000.00, 125900.00, 45, 'disponivel', 'convencional', 'BRA2E26', 'Cinza Metálico', '9BWZZZ99Z99999123'),
(2, 'Toyota Corolla XEi 2.0 Flex', '2020/2020', 58000, 95000.00, 108500.00, 12, 'reservado', 'convencional', 'PLQ7D90', 'Preto Cristal', '9BWZZZ99Z99999456'),
(3, 'Honda Civic EXL 2.0', '2019/2019', 64000, 88000.00, 99900.00, 35, 'disponivel', 'convencional', 'OGK3F88', 'Branco Pérola', '9BWZZZ99Z99999789'),
(4, 'VW Polo Comfortline 1.0 TSI', '2022/2023', 28000, 72000.00, 81900.00, 8, 'preparacao', 'convencional', 'RTS4G10', 'Prata', '9BWZZZ99Z99999321'),
(5, 'Chevrolet Onix Plus LTZ Turbo', '2021/2021', 38000, 65000.00, 71000.00, 52, 'disponivel', 'repasse', 'HNS9F22', 'Azul', '9BWZZZ99Z99999654'),
(6, 'Hyundai HB20 Evolution 1.0', '2020/2021', 49000, 53000.00, 58500.00, 22, 'disponivel', 'repasse', 'FTU4B44', 'Vermelho', '9BWZZZ99Z99999987'),
(7, 'Ford Ka SE 1.0', '2019/2019', 75000, 38000.00, 42000.00, 4, 'vendido', 'repasse', 'KAS5H77', 'Branco', '9BWZZZ99Z99999555');

-- Ajustando sequência de IDs de estoque
SELECT setval('estoque_id_seq', (SELECT MAX(id) FROM estoque));

-- Inserindo Leads
INSERT INTO leads (id, name, phone, interest_car_id, origin, status, last_contact_days, next_action) VALUES
(1, 'Carlos Alberto Santos', '(11) 98765-4321', 1, 'Instagram', 'negociação', 2, 'Enviar simulação de financiamento hoje à tarde'),
(2, 'Mariana Costa', '(21) 99123-4567', 2, 'WhatsApp', 'novo lead', 0, 'Fazer primeiro contato de apresentação'),
(3, 'Ricardo Mendes', '(11) 97321-8901', 3, 'OLX/Webmotors', 'sem resposta', 14, 'Fazer última tentativa de contato antes de arquivar'),
(4, 'Ana Beatriz Ramos', '(31) 98456-1122', 4, 'Indicação', 'contato realizado', 4, 'Agendar vistoria cautelar na oficina do mecânico dela'),
(5, 'Felipe Andrade Lins', '(11) 99345-6789', 5, 'OLX/Webmotors', 'sem resposta', 32, 'Mudar status para perdido se não responder');

-- Ajustando sequência de IDs de leads
SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads));

-- Inserindo Interações na Timeline
INSERT INTO interactions (lead_id, date, text) VALUES
(1, '20/05/2026', 'Cliente entrou em contato via direct perguntando sobre Jeep Compass. Gostou da KM.'),
(1, '21/05/2026', 'Fizemos contato via WhatsApp. Enviou proposta de veículo na troca. Em análise.'),
(2, '22/05/2026', 'Lead gerado automaticamente via botão flutuante do site. Carro de interesse: Corolla.'),
(3, '08/05/2026', 'Cliente demonstrou interesse no Civic através da OLX.'),
(3, '10/05/2026', 'Enviei fotos adicionais do Civic. Cliente visualizou e não respondeu.'),
(3, '15/05/2026', 'Fiz cobrança de retorno. Sem resposta até o momento.'),
(4, '18/05/2026', 'Indicada pelo primo dela (Pedro). Procura carro econômico, gostou do Polo.'),
(4, '20/05/2026', 'Conversamos sobre preço. Pediu para levar o carro para avaliação amanhã.'),
(5, '20/04/2026', 'Perguntou sobre condições de repasse no Onix.'),
(5, '22/04/2026', 'Enviado valor à vista de repasse. Cliente sumiu.');

-- Inserindo Histórico de Vendas
INSERT INTO vendas (id, car_id, client, sell_price, date, profit, margin, type) VALUES
(1, 7, 'Antônio da Silva Lojista', 41000.00, '2026-05-18', 3000.00, 7.30, 'repasse'),
(2, NULL, 'Juliana Medeiros', 89000.00, '2026-05-10', 12000.00, 13.50, 'convencional'),
(3, NULL, 'Gustavo Franco', 52000.00, '2026-05-02', 6000.00, 11.50, 'convencional');

-- Ajustando sequência de IDs de vendas
SELECT setval('vendas_id_seq', (SELECT MAX(id) FROM vendas));

-- Inserindo Despesas
INSERT INTO despesas (id, description, car_id, date, val, category) VALUES
(1, 'Polimento Jeep Compass', 1, '2026-05-12', 450.00, 'Preparação'),
(2, 'Higienização interna Honda Civic', 3, '2026-05-15', 250.00, 'Preparação'),
(3, 'Martelinho de Ouro Polo', 4, '2026-05-20', 350.00, 'Preparação'),
(4, 'Impulsionamento Instagram - Compass', 1, '2026-05-05', 200.00, 'Marketing'),
(5, 'Assinatura Planos Portais (Webmotors/OLX)', NULL, '2026-05-01', 600.00, 'Marketing');

-- Ajustando sequência de IDs de despesas
SELECT setval('despesas_id_seq', (SELECT MAX(id) FROM despesas));

-- Inserindo Agenda
INSERT INTO agenda (id, title, date, time, car_id, category, description) VALUES
(1, 'Apresentação Jeep Compass', '2026-05-22', '14:30', 1, 'visitas', 'Levar veículo ao Condomínio Quinta da Boa Vista'),
(2, 'Entrega do Toyota Corolla', '2026-05-23', '10:00', 2, 'entregas', 'Encontro no Cartório do 3º Ofício para assinaturas'),
(3, 'Levar Polo para Martelinho/Estética', '2026-05-22', '16:00', 4, 'revisao', 'Oficina do Marquinhos Polimentos'),
(4, 'Vistoria Cautelar Civic', '2026-05-24', '09:00', 3, 'documentos', 'Posto Super Visão Cautelares');

-- Ajustando sequência de IDs de agenda
SELECT setval('agenda_id_seq', (SELECT MAX(id) FROM agenda));

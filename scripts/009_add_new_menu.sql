-- Insert new categories and products - Cardápio Atualizado

-- 🍪 Cookies e Doces
INSERT INTO categories (name, description, display_order) VALUES 
('🍪 Cookies e Doces', 'Deliciosos cookies artesanais', 1);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Tradicional De Nutella', 'Massa de baunilha com gotas de chocolate com avelã e recheio de nutella', 11.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Total Black', 'Massa de cacau 50% com gotas de chocolate ao leite e recheio de chocolate 50%', 10.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Kit Kat', 'Massa de baunilha com gotas de chocolate ao leite e recheio de creme de avelã', 12.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Red Velvet', 'Massa de red velvet com gotas de chocolate branco e recheio de creme de ninho', 11.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Oreo', 'Massa branca com pedaços de oreo e gotas de chocolate ao leite com recheio de chocolate branco', 12.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Doce De Leite', 'Massa de canela com recheio de doce de leite', 12.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Frutas Vermelhas', 'Massa de biscoito amanteigado com recheio de creme branco e geleia de frutas vermelhas', 11.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Limão', 'Massa de biscoito amanteigado com mousse de limão', 11.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Brownie', 'Massa de chocolate densa com chocolate ao leite', 10.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Manteiga Escocesa', 'Massa de biscoito amanteigado com recheio de caramelo cremoso e chocolate de 50%', 13.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true),
('Broockie', 'Massa de Brownie com pedaços de chocolate e massa de cookie com gotas de chocolate', 11.99, (SELECT id FROM categories WHERE name = '🍪 Cookies e Doces'), true);

-- 🌽 Cuscuz
INSERT INTO categories (name, description, display_order) VALUES 
('🌽 Cuscuz', 'Cuscuz nordestino com diversos recheios', 2);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cuscuz com Carne', 'Cuscuz com carne de sol na nata', 14.00, (SELECT id FROM categories WHERE name = '🌽 Cuscuz'), true),
('Cuscuz com Frango', 'Cuscuz com frango desfiado e catupiry', 11.99, (SELECT id FROM categories WHERE name = '🌽 Cuscuz'), true),
('Cuscuz Nordestino', 'Cuscuz com carne de sol desfiada, ovo e queijo coalho', 17.99, (SELECT id FROM categories WHERE name = '🌽 Cuscuz'), true),
('Cuscuz da Casa', 'Cuscuz com carne de sol e cream cheese, ovos e pimenta biquinho', 15.99, (SELECT id FROM categories WHERE name = '🌽 Cuscuz'), true);

-- 🥞 Tapiocas
INSERT INTO categories (name, description, display_order) VALUES 
('🥞 Tapiocas', 'Tapioca fresquinha com recheios variados', 3);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Nordestina', 'Massa de Tapioca com carne de sol desfiada e queijo coalho', 14.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true),
('Carne de Sol na Nata', 'Massa de Tapioca com Carne de Sol na Nata', 13.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true),
('Carne de Sol / Cream Cheese', 'Massa de Tapioca com Carne de Sol e Cream Cheese', 15.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true),
('Frango com Catupiry', 'Massa de Tapioca Com Frango e Catupiry', 12.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true),
('Chocotela', 'Massa de Tapioca com Nutella e Morango', 12.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true),
('Churros', 'Massa de Tapioca com Canela e Doce de Leite', 12.99, (SELECT id FROM categories WHERE name = '🥞 Tapiocas'), true);

-- 🥖 Pães e Salgados
INSERT INTO categories (name, description, display_order) VALUES 
('🥖 Pães e Salgados', 'Pães na chapa, folhados, fritos e assados', 4);

-- Pães na Chapa
INSERT INTO products (name, description, price, category_id, active) VALUES
('Bom Dia', 'Pão Francês com recheio de Queijo, Presunto e Ovo', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Tostadinho Real', 'Pão Francês com Recheio de Carne de Sol e Cream Cheese', 12.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Pão Duplo Chapa', 'Pão Francês com Duplo de Carne, Queijo Coalho e Ovo', 14.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Frango com Catupiry', 'Pão Francês com Frango e Catupiry', 10.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Misto na Chapa', 'Pão Francês com Mussarela e Presunto', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
-- Folhados
('Pão Folhado de Carne de Sol', 'Pão Folhado de Carne de Sol', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Pão Folhado de Frango com Cream Cheese', 'Pão Folhado de Frango com Cream Cheese', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Pão Folhado Misto', 'Pão Folhado Misto', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Queijada', 'Queijada', 6.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
-- Fritos
('Coxinha de Frango', 'Coxinha de Frango', 7.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Coxinha de Carne de Sol', 'Coxinha de Carne de Sol', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Enroladinho', 'Enroladinho', 6.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Risole Misto', 'Risole Misto', 7.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
-- Assados (Empadas)
('Empada de Carne de Sol na Nata', 'Empada de Carne de Sol na Nata', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Empada de Carne de Sol com Cream Cheese', 'Empada de Carne de Sol com Cream Cheese', 9.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Empada de Frango com Catupiry', 'Empada de Frango com Catupiry', 8.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Empada Doce de Leite Condensado', 'Empada Doce de Leite Condensado', 7.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true),
('Empada Doce de Chocolate', 'Empada Doce de Chocolate', 7.99, (SELECT id FROM categories WHERE name = '🥖 Pães e Salgados'), true);

-- 🧀 Pão de Queijo Recheado
INSERT INTO categories (name, description, display_order) VALUES 
('🧀 Pão de Queijo Recheado', 'Pão de queijo mineiro recheado', 5);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Tradicional', 'Massa de Queijo tradicional', 6.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true),
('Carne de Sol na Nata', 'Massa de Pão de Queijo com recheio de Carne de Sol na Nata', 12.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true),
('Calabresa', 'Massa de Pão de Queijo com Recheio de Calabresa', 9.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true),
('Frango com Catupiry', 'Massa de Pão de Queijo com Recheio de Frango e Catupiry', 10.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true),
('Presunto', 'Massa de Pão de Queijo com recheio de queijo e presunto', 8.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true),
('Arretado', 'Massa de Pão de Queijo com recheio Carne de Sol', 11.99, (SELECT id FROM categories WHERE name = '🧀 Pão de Queijo Recheado'), true);

-- 🍰 Bolos
INSERT INTO categories (name, description, display_order) VALUES 
('🍰 Bolos', 'Bolos artesanais caseiros', 6);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Ovos', 'Massa de Ovos Amanteigado', 8.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Limão', 'Massa de Baunilha com Limão', 8.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Chocolate', 'Massa de Chocolate Amanteigado', 9.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Moça', 'Massa de Ovos e Leite Condensado', 9.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Milho com Goiabada', 'Massa de Milho com Goiabada derretida', 9.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Mesclado', 'Massa de Ovos e Chocolate', 9.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true),
('Laranja com Calda', 'Massa de Baunilha e Laranja com Calda de Laranja', 9.99, (SELECT id FROM categories WHERE name = '🍰 Bolos'), true);

-- 🧇 Waffles
INSERT INTO categories (name, description, display_order) VALUES 
('🧇 Waffles', 'Waffles artesanais com coberturas especiais', 7);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Geleia de Frutas Vermelhas', 'Massa de Waffles, sorvete de creme e geleia de frutas vermelhas', 14.99, (SELECT id FROM categories WHERE name = '🧇 Waffles'), true),
('Doce de Leite', 'Massa de Waffles, sorvete de creme e doce de leite', 14.99, (SELECT id FROM categories WHERE name = '🧇 Waffles'), true),
('Delírio Real', 'Massa de Waffles, sorvete de creme, morango e nutella', 16.99, (SELECT id FROM categories WHERE name = '🧇 Waffles'), true),
('Banana Flambada', 'Massa de Waffles, banana gratinada com caramelo', 15.99, (SELECT id FROM categories WHERE name = '🧇 Waffles'), true),
('Tradicional', 'Massa de Waffles, sorvete de creme e caldas', 13.99, (SELECT id FROM categories WHERE name = '🧇 Waffles'), true);

-- 🥧 Tortas Salgadas e Pastéis
INSERT INTO categories (name, description, display_order) VALUES 
('🥧 Tortas Salgadas e Pastéis', 'Tortas salgadas e pastéis artesanais', 8);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Sertanejo', 'Pastel Sertanejo', 10.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Carne de Sol', 'Pastel de Carne de Sol', 12.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Franbacon Cheese', 'Pastel de Frango, Bacon e Queijo', 12.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Frango', 'Pastelão de Frango', 15.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Pastelão', 'Pastelão Grande', 15.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Frango com Catupiry', 'Massa amanteigada com recheio de frango com catupiry', 16.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Carne de Sol na Nata', 'Massa amanteigada com recheio de carne de sol na nata', 18.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true),
('Carne de Sol com Cream Cheese', 'Massa amanteigada com recheio de carne de sol com cream cheese', 18.99, (SELECT id FROM categories WHERE name = '🥧 Tortas Salgadas e Pastéis'), true);

-- ☕ Cafés e Bebidas Quentes
INSERT INTO categories (name, description, display_order) VALUES 
('☕ Cafés e Bebidas Quentes', 'Cafés especiais e bebidas quentes', 9);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cappuccino Cremoso Gelado', 'Café cremoso gelado, com espuma cremosa e Nutella', 14.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Frapê de Brigadeiro Gelado', 'Café cremoso com brigadeiro e chantilly', 13.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Frapê Gelado de Doce de Leite', 'Creme de baunilha, café expresso, chantilly e doce de leite', 13.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Expresso de Chocolate Trufado', 'Expresso do café Baggio de Chocolate trufado', 12.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Expresso de Caramelo', 'Expresso do café Baggio de Caramelo', 10.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Expresso de Avelã', 'Expresso do café Baggio de Avelã', 10.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Café em Grãos Baggio', 'Safra especial de torra média (encorpado/notas de chocolate ou equilibrado/notas frutadas)', 25.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Café em Grãos Italle', 'Safra especial de torra média 100% arábica', 24.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Cappuccino', 'Cappuccino tradicional', 8.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Café com Leite', 'Café com Leite', 6.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Expresso Comum', 'Expresso Comum', 5.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Expresso Duplo', 'Expresso Duplo', 8.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Chocolate Quente Tradicional', 'Leite, Chocolate em pó 40%, Chocolate em Barra e Creme de Leite', 9.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true),
('Chocolate Quente Branco', 'Leite, Chocolate em pó, Chocolate branco em Barra e Creme de Leite', 10.99, (SELECT id FROM categories WHERE name = '☕ Cafés e Bebidas Quentes'), true);

-- 🍮 Sobremesas
INSERT INTO categories (name, description, display_order) VALUES 
('🍮 Sobremesas', 'Sobremesas artesanais', 10);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Pudim (Tradicional Leite Condensado)', 'Massa de ovos e Leite Condensado com Calda de Caramelo', 8.99, (SELECT id FROM categories WHERE name = '🍮 Sobremesas'), true);

-- 🥤 Bebidas Frias
INSERT INTO categories (name, description, display_order) VALUES 
('🥤 Bebidas Frias', 'Sucos, vitaminas, milk-shakes e refrigerantes', 11);

-- Sucos e Vitaminas
INSERT INTO products (name, description, price, category_id, active) VALUES
('Suco de Abacaxi', 'Suco natural de Abacaxi', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Cajá', 'Suco natural de Cajá', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Uva', 'Suco natural de Uva', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Graviola', 'Suco natural de Graviola', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Laranja', 'Suco natural de Laranja', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Morango', 'Suco natural de Morango', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Limão', 'Suco natural de Limão', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Suco de Maracujá', 'Suco natural de Maracujá', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
-- Milk-Shakes Clássicos
('Milk-Shake Creme', 'Milk-Shake Clássico de Creme', 12.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Chocolate', 'Milk-Shake Clássico de Chocolate', 12.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Morango', 'Milk-Shake Clássico de Morango', 12.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Ovomaltine', 'Milk-Shake Clássico de Ovomaltine', 13.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
-- Milk-Shakes Premium
('Milk-Shake Nutella', 'Milk-Shake Premium de Nutella', 15.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Cappuccino', 'Milk-Shake Premium de Cappuccino', 14.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Frapê', 'Milk-Shake Premium Frapê', 14.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Pistache', 'Milk-Shake Premium de Pistache', 15.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Geleia de Morango', 'Milk-Shake Premium com Geleia de Morango', 14.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Frutas Vermelhas', 'Milk-Shake Premium de Frutas Vermelhas', 15.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Milk-Shake Doce de Leite', 'Milk-Shake Premium de Doce de Leite', 14.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
-- Chá Gelado
('Chá Gelado Abacaxi', 'Chá Gelado sabor Abacaxi', 7.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Chá Gelado Red Ice', 'Chá Gelado Red Ice', 7.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Chá Gelado Maçã Verde', 'Chá Gelado sabor Maçã Verde', 7.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Chá Gelado Melancia', 'Chá Gelado sabor Melancia', 7.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Chá Gelado Tangerina', 'Chá Gelado sabor Tangerina', 7.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
-- Refrigerantes
('Coca-Cola Lata', 'Coca-Cola Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Coca-Cola Zero Lata', 'Coca-Cola Zero Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Coca-Cola 1L', 'Coca-Cola 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Coca-Cola Zero 1L', 'Coca-Cola Zero 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Pepsi Lata', 'Pepsi Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Pepsi 1L', 'Pepsi 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Sprite Lata', 'Sprite Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Sprite 1L', 'Sprite 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Guaraná Lata', 'Guaraná Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Guaraná 1L', 'Guaraná 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Fanta Uva Lata', 'Fanta Uva Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Fanta Uva 1L', 'Fanta Uva 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Fanta Laranja Lata', 'Fanta Laranja Lata 350ml', 5.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true),
('Fanta Laranja 1L', 'Fanta Laranja 1 Litro', 8.99, (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias'), true);

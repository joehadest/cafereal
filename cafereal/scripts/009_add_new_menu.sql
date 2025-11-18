-- Insert new categories and products

-- Cookie sabores
INSERT INTO categories (name, description, display_order) VALUES 
('Cookie sabores', 'Deliciosos cookies artesanais', 1);

-- Substituindo 'available' por 'active' em todos os INSERTs
INSERT INTO products (name, description, price, category_id, active) VALUES
('Total black', 'Cookie de chocolate intenso', 8.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Tradicional com nutella', 'Cookie clássico com nutella', 9.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Choco duo', 'Cookie duplo chocolate', 9.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('KitKat', 'Cookie com pedaços de KitKat', 10.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Kinder', 'Cookie com Kinder', 10.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Oreo', 'Cookie com Oreo', 9.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Red velvet', 'Cookie red velvet', 10.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true),
('Pistache', 'Cookie de pistache', 12.00, (SELECT id FROM categories WHERE name = 'Cookie sabores'), true);

-- Cuscuz
INSERT INTO categories (name, description, display_order) VALUES 
('Cuscuz', 'Cuscuz nordestino com diversos recheios', 2);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cuscuz com Ovo', 'Cuscuz tradicional com ovo', 8.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true),
('Cuscuz com Queijo coalho', 'Cuscuz com queijo coalho', 10.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true),
('Cuscuz com Carne de sol na nata', 'Cuscuz com carne de sol na nata', 15.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true),
('Cuscuz com Carne e cream cheese', 'Cuscuz com carne e cream cheese', 15.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true),
('Cuscuz com Frango', 'Cuscuz com frango desfiado', 12.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true),
('Cuscuz com Frango e cream cheese', 'Cuscuz com frango e cream cheese', 14.00, (SELECT id FROM categories WHERE name = 'Cuscuz'), true);

-- Tapioca
INSERT INTO categories (name, description, display_order) VALUES 
('Tapioca', 'Tapioca fresquinha com recheios variados', 3);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Tapioca com Ovo', 'Tapioca com ovo', 8.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true),
('Tapioca com Queijo coalho', 'Tapioca com queijo coalho', 10.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true),
('Tapioca com Carne de sol na nata', 'Tapioca com carne de sol na nata', 15.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true),
('Tapioca com Carne e cream cheese', 'Tapioca com carne e cream cheese', 15.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true),
('Tapioca com Frango', 'Tapioca com frango desfiado', 12.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true),
('Tapioca com Frango e cream cheese', 'Tapioca com frango e cream cheese', 14.00, (SELECT id FROM categories WHERE name = 'Tapioca'), true);

-- Tortas doces
INSERT INTO categories (name, description, display_order) VALUES 
('Tortas doces', 'Tortas artesanais doces', 4);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Torta de manteiga escocesa', 'Torta clássica de manteiga escocesa', 12.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true),
('Torta de limão', 'Torta refrescante de limão', 12.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true),
('Torta com geleia de frutas vermelhas', 'Torta com geleia de frutas vermelhas', 14.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true),
('Torta de brownie', 'Torta de brownie intenso', 15.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true),
('Brookie', 'Combinação de brownie e cookie', 14.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true),
('Torta brownie', 'Torta de brownie', 15.00, (SELECT id FROM categories WHERE name = 'Tortas doces'), true);

-- Milk shakes premium
INSERT INTO categories (name, description, display_order) VALUES 
('Milk shakes premium', 'Milk shakes especiais', 5);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Milk shake Ovomaltine', 'Milk shake de ovomaltine', 16.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Nutella', 'Milk shake de nutella', 18.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Cappuccino', 'Milk shake de cappuccino', 16.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Frapê', 'Milk shake frapê', 16.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Pistache', 'Milk shake de pistache', 18.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Geleia de morango', 'Milk shake com geleia de morango', 16.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true),
('Milk shake Frutas vermelhas', 'Milk shake de frutas vermelhas', 17.00, (SELECT id FROM categories WHERE name = 'Milk shakes premium'), true);

-- Café comum
INSERT INTO categories (name, description, display_order) VALUES 
('Café comum', 'Cafés tradicionais', 6);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cappuccino comum', 'Cappuccino tradicional', 8.00, (SELECT id FROM categories WHERE name = 'Café comum'), true),
('Café expresso simples', 'Café expresso', 5.00, (SELECT id FROM categories WHERE name = 'Café comum'), true),
('Duplo expresso simples', 'Duplo expresso', 8.00, (SELECT id FROM categories WHERE name = 'Café comum'), true);

-- Café gourmet
INSERT INTO categories (name, description, display_order) VALUES 
('Café gourmet', 'Cafés especiais gourmet', 7);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Expresso de avelãs', 'Expresso com avelãs', 10.00, (SELECT id FROM categories WHERE name = 'Café gourmet'), true),
('Expresso caramel', 'Expresso com caramelo', 10.00, (SELECT id FROM categories WHERE name = 'Café gourmet'), true),
('Expresso trufado', 'Expresso trufado', 12.00, (SELECT id FROM categories WHERE name = 'Café gourmet'), true);

-- Frapes quentes
INSERT INTO categories (name, description, display_order) VALUES 
('Frapes quentes', 'Frapes cremosos quentes', 8);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cappuccino cremoso', 'Cappuccino cremoso', 12.00, (SELECT id FROM categories WHERE name = 'Frapes quentes'), true),
('Frapê de brigadeiro', 'Frapê quente de brigadeiro', 14.00, (SELECT id FROM categories WHERE name = 'Frapes quentes'), true),
('Frapê de baunilha', 'Frapê quente de baunilha', 13.00, (SELECT id FROM categories WHERE name = 'Frapes quentes'), true);

-- Frapes gelados
INSERT INTO categories (name, description, display_order) VALUES 
('Frapes gelados', 'Frapes refrescantes gelados', 9);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Cappuccino cremoso gelado', 'Cappuccino cremoso gelado', 12.00, (SELECT id FROM categories WHERE name = 'Frapes gelados'), true),
('Frapê de brigadeiro gelado', 'Frapê gelado de brigadeiro', 14.00, (SELECT id FROM categories WHERE name = 'Frapes gelados'), true),
('Frapê de baunilha gelado', 'Frapê gelado de baunilha', 13.00, (SELECT id FROM categories WHERE name = 'Frapes gelados'), true);

-- Bebidas tradicionais
INSERT INTO categories (name, description, display_order) VALUES 
('Bebidas tradicionais', 'Bebidas clássicas', 10);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Chocolate quente', 'Chocolate quente cremoso', 8.00, (SELECT id FROM categories WHERE name = 'Bebidas tradicionais'), true),
('Chocolate quente branco', 'Chocolate branco quente', 9.00, (SELECT id FROM categories WHERE name = 'Bebidas tradicionais'), true);

-- Pão de queijo
INSERT INTO categories (name, description, display_order) VALUES 
('Pão de queijo', 'Pão de queijo mineiro', 11);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Pão de queijo tradicional', 'Pão de queijo tradicional', 6.00, (SELECT id FROM categories WHERE name = 'Pão de queijo'), true),
('Pão de queijo com Carne', 'Pão de queijo recheado com carne', 10.00, (SELECT id FROM categories WHERE name = 'Pão de queijo'), true),
('Pão de queijo com Carne e cream cheese', 'Pão de queijo com carne e cream cheese', 12.00, (SELECT id FROM categories WHERE name = 'Pão de queijo'), true),
('Pão de queijo com Frango', 'Pão de queijo recheado com frango', 10.00, (SELECT id FROM categories WHERE name = 'Pão de queijo'), true),
('Pão de queijo com Carne de sol na nata', 'Pão de queijo com carne de sol na nata', 14.00, (SELECT id FROM categories WHERE name = 'Pão de queijo'), true);

-- Waffles
INSERT INTO categories (name, description, display_order) VALUES 
('Waffles', 'Waffles artesanais', 12);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Waffle tradicional', 'Waffle tradicional', 12.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle com Geleia de frutas vermelhas', 'Waffle com geleia de frutas vermelhas', 14.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle com Doce de leite e coco', 'Waffle com doce de leite e coco', 15.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle com Nutella, morango e sorvete', 'Waffle com nutella, morango e sorvete de creme', 18.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle Ovomaltine', 'Waffle com ovomaltine', 16.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle com Creme de limão', 'Waffle com creme de limão', 15.00, (SELECT id FROM categories WHERE name = 'Waffles'), true),
('Waffle com Banana e nutella gratinada', 'Waffle com banana e nutella gratinada', 17.00, (SELECT id FROM categories WHERE name = 'Waffles'), true);

-- Crepe francês
INSERT INTO categories (name, description, display_order) VALUES 
('Crepe francês', 'Crepes franceses salgados', 13);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Crepe com Queijo coalho', 'Crepe com queijo coalho', 12.00, (SELECT id FROM categories WHERE name = 'Crepe francês'), true),
('Crepe com Carne de sol na nata', 'Crepe com carne de sol na nata', 16.00, (SELECT id FROM categories WHERE name = 'Crepe francês'), true),
('Crepe com Carne e cream cheese', 'Crepe com carne e cream cheese', 16.00, (SELECT id FROM categories WHERE name = 'Crepe francês'), true),
('Crepe com Frango', 'Crepe com frango', 14.00, (SELECT id FROM categories WHERE name = 'Crepe francês'), true),
('Crepe com Frango e cream cheese', 'Crepe com frango e cream cheese', 15.00, (SELECT id FROM categories WHERE name = 'Crepe francês'), true);

-- Batida de açaí
INSERT INTO categories (name, description, display_order) VALUES 
('Batida de açaí', 'Batidas refrescantes de açaí', 14);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Batida de açaí', 'Batida cremosa de açaí', 15.00, (SELECT id FROM categories WHERE name = 'Batida de açaí'), true);

-- Sucos
INSERT INTO categories (name, description, display_order) VALUES 
('Sucos', 'Sucos naturais', 15);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Suco natural', 'Suco natural da fruta', 8.00, (SELECT id FROM categories WHERE name = 'Sucos'), true);

-- Refrigerantes
INSERT INTO categories (name, description, display_order) VALUES 
('Refrigerantes', 'Refrigerantes diversos', 16);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Refrigerante lata', 'Refrigerante em lata', 5.00, (SELECT id FROM categories WHERE name = 'Refrigerantes'), true),
('Refrigerante 600ml', 'Refrigerante 600ml', 7.00, (SELECT id FROM categories WHERE name = 'Refrigerantes'), true);

-- Bebidas gaseificadas
INSERT INTO categories (name, description, display_order) VALUES 
('Bebidas gaseificadas', 'Bebidas gaseificadas', 17);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Água com gás', 'Água mineral com gás', 4.00, (SELECT id FROM categories WHERE name = 'Bebidas gaseificadas'), true),
('Água tônica', 'Água tônica', 5.00, (SELECT id FROM categories WHERE name = 'Bebidas gaseificadas'), true);

-- Chás diuréticos
INSERT INTO categories (name, description, display_order) VALUES 
('Chás diuréticos', 'Chás naturais diuréticos', 18);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Chá verde', 'Chá verde natural', 6.00, (SELECT id FROM categories WHERE name = 'Chás diuréticos'), true),
('Chá de hibisco', 'Chá de hibisco', 6.00, (SELECT id FROM categories WHERE name = 'Chás diuréticos'), true);

-- Tortas salgadas
INSERT INTO categories (name, description, display_order) VALUES 
('Tortas salgadas', 'Tortas salgadas artesanais', 19);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Torta de Carne de sol com cream cheese', 'Torta de carne de sol com cream cheese', 18.00, (SELECT id FROM categories WHERE name = 'Tortas salgadas'), true),
('Torta de Carne de sol na nata', 'Torta de carne de sol na nata', 18.00, (SELECT id FROM categories WHERE name = 'Tortas salgadas'), true),
('Torta de Frango com catupiry', 'Torta de frango com catupiry', 16.00, (SELECT id FROM categories WHERE name = 'Tortas salgadas'), true);

-- Salgados
INSERT INTO categories (name, description, display_order) VALUES 
('Salgados', 'Salgados diversos', 20);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Pão folhado de carne', 'Pão folhado recheado com carne', 8.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Pão folhado de frango', 'Pão folhado recheado com frango', 8.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Pão folhado misto', 'Pão folhado misto', 8.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Enroladinho', 'Enroladinho de salsicha', 6.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Coxinha de carne de sol', 'Coxinha recheada com carne de sol', 8.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Coxinha de frango', 'Coxinha tradicional de frango', 7.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Risoles', 'Risoles crocantes', 7.00, (SELECT id FROM categories WHERE name = 'Salgados'), true),
('Queijada', 'Queijada mineira', 6.00, (SELECT id FROM categories WHERE name = 'Salgados'), true);

-- Pastéis
INSERT INTO categories (name, description, display_order) VALUES 
('Pastéis', 'Pastéis e pastelões', 21);

INSERT INTO products (name, description, price, category_id, active) VALUES
('Pastel Sertanejo', 'Pastel sertanejo', 10.00, (SELECT id FROM categories WHERE name = 'Pastéis'), true),
('Pastel de Carne de Sol', 'Pastel de carne de sol', 12.00, (SELECT id FROM categories WHERE name = 'Pastéis'), true),
('Pastel Franbacon cheese', 'Pastel de frango, bacon e queijo', 12.00, (SELECT id FROM categories WHERE name = 'Pastéis'), true),
('Pastelão de Frango', 'Pastelão grande de frango', 15.00, (SELECT id FROM categories WHERE name = 'Pastéis'), true);

-- Adicionar extras para Cuscuz e Tapioca

-- Extras para Cuscuz
INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Ovos',
  2.00,
  1,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Queijo Coalho',
  2.00,
  2,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Queijo Mussarela',
  2.00,
  3,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Carne de Sol na Nata',
  3.00,
  4,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Carne de Sol com Cream Cheese',
  4.00,
  5,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Frango com Catupiry',
  3.00,
  6,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Frango com Cream Cheese',
  4.00,
  7,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🌽 Cuscuz';

-- Extras para Tapioca
INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Ovos',
  2.00,
  1,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Queijo Coalho',
  2.00,
  2,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Queijo Mussarela',
  2.00,
  3,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Carne de Sol na Nata',
  3.00,
  4,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Carne de Sol com Cream Cheese',
  4.00,
  5,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Frango com Catupiry',
  3.00,
  6,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';

INSERT INTO product_extras (product_id, name, price, display_order, active, max_quantity)
SELECT 
  p.id,
  'Frango com Cream Cheese',
  4.00,
  7,
  true,
  10
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = '🥞 Tapiocas';


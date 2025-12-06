-- Script para separar Milkshakes das Bebidas Frias
-- Criar nova categoria para Milkshakes

-- Criar categoria de Milkshakes (display_order 12 para ficar logo após Bebidas Frias)
INSERT INTO categories (name, description, display_order, active)
SELECT '🥤 Milkshakes', 'Milkshakes cremosos e deliciosos', 12, true
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '🥤 Milkshakes'
);

-- Mover todos os produtos que contêm "Milk-Shake" ou "Milkshake" para a nova categoria
UPDATE products
SET category_id = (SELECT id FROM categories WHERE name = '🥤 Milkshakes')
WHERE category_id = (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias')
  AND (
    LOWER(name) LIKE '%milk-shake%' OR 
    LOWER(name) LIKE '%milkshake%' OR
    LOWER(name) LIKE '%milk shake%'
  );

-- Atualizar a descrição da categoria Bebidas Frias para remover menção a milkshakes
UPDATE categories
SET description = 'Sucos, vitaminas e refrigerantes'
WHERE name = '🥤 Bebidas Frias';


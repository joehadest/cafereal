-- Script para organizar Bebidas Frias em categorias separadas
-- Separar em: Sucos, Refrigerantes, Chá Gelado
-- Nota: Milkshakes já foram separados pelo script 015

-- Criar categoria de Sucos (display_order 11 - antes dos Milkshakes)
INSERT INTO categories (name, description, display_order, active)
SELECT '🧃 Sucos', 'Sucos naturais e refrescantes', 11, true
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '🧃 Sucos'
);

-- Criar categoria de Refrigerantes (display_order 13 - após Milkshakes)
INSERT INTO categories (name, description, display_order, active)
SELECT '🥤 Refrigerantes', 'Refrigerantes gelados', 13, true
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '🥤 Refrigerantes'
);

-- Criar categoria de Chá Gelado (display_order 14)
INSERT INTO categories (name, description, display_order, active)
SELECT '🧊 Chá Gelado', 'Chás gelados refrescantes', 14, true
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '🧊 Chá Gelado'
);

-- Mover Sucos para categoria de Sucos
UPDATE products
SET category_id = (SELECT id FROM categories WHERE name = '🧃 Sucos')
WHERE category_id = (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias')
  AND (
    LOWER(name) LIKE '%suco%' OR
    LOWER(name) LIKE '%suco de%'
  )
  AND LOWER(name) NOT LIKE '%milkshake%'
  AND LOWER(name) NOT LIKE '%milk-shake%';

-- Mover Refrigerantes para categoria de Refrigerantes
UPDATE products
SET category_id = (SELECT id FROM categories WHERE name = '🥤 Refrigerantes')
WHERE category_id = (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias')
  AND (
    LOWER(name) LIKE '%coca%' OR
    LOWER(name) LIKE '%pepsi%' OR
    LOWER(name) LIKE '%sprite%' OR
    LOWER(name) LIKE '%guaraná%' OR
    LOWER(name) LIKE '%fanta%' OR
    LOWER(name) LIKE '%refrigerante%'
  );

-- Mover Chá Gelado para categoria de Chá Gelado
UPDATE products
SET category_id = (SELECT id FROM categories WHERE name = '🧊 Chá Gelado')
WHERE category_id = (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias')
  AND (
    LOWER(name) LIKE '%chá gelado%' OR
    LOWER(name) LIKE '%chá%gelado%'
  );

-- Verificar se há produtos restantes na categoria Bebidas Frias
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM products
  WHERE category_id = (SELECT id FROM categories WHERE name = '🥤 Bebidas Frias');
  
  -- Se não houver produtos restantes, desativar a categoria
  IF remaining_count = 0 THEN
    UPDATE categories
    SET active = false, description = 'Categoria desativada - produtos movidos para categorias específicas'
    WHERE name = '🥤 Bebidas Frias';
  ELSE
    -- Se houver produtos restantes (como vitaminas), atualizar a descrição
    UPDATE categories
    SET description = 'Bebidas frias diversas (vitaminas e outros)'
    WHERE name = '🥤 Bebidas Frias';
  END IF;
END $$;


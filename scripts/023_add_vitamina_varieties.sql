-- Adicionar variedades de tamanho para vitaminas
-- Estrutura similar aos sucos: cada sabor é um produto com variedades de tamanho

-- Obter ou criar a categoria de Vitaminas
INSERT INTO categories (name, description, display_order, active)
SELECT '🥤 Vitaminas', 'Vitaminas naturais e nutritivas', 12, true
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '🥤 Vitaminas'
);

-- Criar ou atualizar produtos de vitamina para cada sabor
-- Vitamina de Abacaxi
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  -- Obter categoria de vitaminas
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  -- Verificar se o produto já existe
  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Abacaxi' OR (name LIKE '%Vitamina%' AND name LIKE '%Abacaxi%')
  LIMIT 1;

  IF v_product_id IS NULL THEN
    -- Criar novo produto
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES (
      'Vitamina de Abacaxi',
      'Vitamina natural de abacaxi',
      8.00,
      vitamina_category_id,
      true,
      'Copa/Bar',
      'Sucos e Chás',
      1
    )
    RETURNING id INTO v_product_id;
  ELSE
    -- Atualizar produto existente
    UPDATE products 
    SET 
      name = 'Vitamina de Abacaxi',
      description = 'Vitamina natural de abacaxi',
      price = 8.00,
      category_id = vitamina_category_id,
      print_sector = 'Copa/Bar',
      product_class = 'Sucos e Chás',
      display_order = 1
    WHERE id = v_product_id;
  END IF;

  -- Adicionar variedades (se não existirem)
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active)
    VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active)
    VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active)
    VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;

-- Vitamina de Banana
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Banana' OR (name LIKE '%Vitamina%' AND name LIKE '%Banana%')
  LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES ('Vitamina de Banana', 'Vitamina natural de banana', 8.00, vitamina_category_id, true, 'Copa/Bar', 'Sucos e Chás', 2)
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products 
    SET name = 'Vitamina de Banana', description = 'Vitamina natural de banana', price = 8.00, category_id = vitamina_category_id, print_sector = 'Copa/Bar', product_class = 'Sucos e Chás', display_order = 2
    WHERE id = v_product_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;

-- Vitamina de Morango
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Morango' OR (name LIKE '%Vitamina%' AND name LIKE '%Morango%')
  LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES ('Vitamina de Morango', 'Vitamina natural de morango', 8.00, vitamina_category_id, true, 'Copa/Bar', 'Sucos e Chás', 3)
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products 
    SET name = 'Vitamina de Morango', description = 'Vitamina natural de morango', price = 8.00, category_id = vitamina_category_id, print_sector = 'Copa/Bar', product_class = 'Sucos e Chás', display_order = 3
    WHERE id = v_product_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;

-- Vitamina de Mamão
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Mamão' OR (name LIKE '%Vitamina%' AND (name LIKE '%Mamão%' OR name LIKE '%Mamao%'))
  LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES ('Vitamina de Mamão', 'Vitamina natural de mamão', 8.00, vitamina_category_id, true, 'Copa/Bar', 'Sucos e Chás', 4)
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products 
    SET name = 'Vitamina de Mamão', description = 'Vitamina natural de mamão', price = 8.00, category_id = vitamina_category_id, print_sector = 'Copa/Bar', product_class = 'Sucos e Chás', display_order = 4
    WHERE id = v_product_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;

-- Vitamina de Acerola
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Acerola' OR (name LIKE '%Vitamina%' AND name LIKE '%Acerola%')
  LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES ('Vitamina de Acerola', 'Vitamina natural de acerola', 8.00, vitamina_category_id, true, 'Copa/Bar', 'Sucos e Chás', 5)
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products 
    SET name = 'Vitamina de Acerola', description = 'Vitamina natural de acerola', price = 8.00, category_id = vitamina_category_id, print_sector = 'Copa/Bar', product_class = 'Sucos e Chás', display_order = 5
    WHERE id = v_product_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;

-- Vitamina de Maracujá
DO $$
DECLARE
  vitamina_category_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO vitamina_category_id 
  FROM categories 
  WHERE name = '🥤 Vitaminas' OR name LIKE '%Vitamina%'
  LIMIT 1;
  
  IF vitamina_category_id IS NULL THEN
    SELECT id INTO vitamina_category_id 
    FROM categories 
    WHERE name LIKE '%Bebida%'
    LIMIT 1;
  END IF;

  SELECT id INTO v_product_id 
  FROM products 
  WHERE name = 'Vitamina de Maracujá' OR (name LIKE '%Vitamina%' AND (name LIKE '%Maracujá%' OR name LIKE '%Maracuja%'))
  LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO products (name, description, price, category_id, active, print_sector, product_class, display_order)
    VALUES ('Vitamina de Maracujá', 'Vitamina natural de maracujá', 8.00, vitamina_category_id, true, 'Copa/Bar', 'Sucos e Chás', 6)
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products 
    SET name = 'Vitamina de Maracujá', description = 'Vitamina natural de maracujá', price = 8.00, category_id = vitamina_category_id, print_sector = 'Copa/Bar', product_class = 'Sucos e Chás', display_order = 6
    WHERE id = v_product_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Copo 300ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Copo 300ml', 8.00, 0, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 750ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 750ml', 20.00, 1, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_varieties WHERE product_id = v_product_id AND name = 'Jarra 1000ml') THEN
    INSERT INTO product_varieties (product_id, name, price, display_order, active) VALUES (v_product_id, 'Jarra 1000ml', 25.00, 2, true);
  END IF;
END $$;


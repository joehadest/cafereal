-- Criar tabela de variedades de produtos (ex: Pequeno, Médio, Grande)
CREATE TABLE IF NOT EXISTS product_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- ex: "Pequeno", "Médio", "Grande"
  price DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de extras de produtos (ex: Bacon Extra, Queijo Extra)
CREATE TABLE IF NOT EXISTS product_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- ex: "Bacon Extra", "Queijo Extra"
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  max_quantity INTEGER DEFAULT 10, -- quantidade máxima permitida
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para armazenar extras selecionados em itens de pedido
CREATE TABLE IF NOT EXISTS order_item_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES product_extras(id),
  extra_name TEXT NOT NULL,
  extra_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna para armazenar a variedade selecionada no item do pedido
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS variety_id UUID REFERENCES product_varieties(id),
ADD COLUMN IF NOT EXISTS variety_name TEXT,
ADD COLUMN IF NOT EXISTS variety_price DECIMAL(10, 2);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_varieties_product_id ON product_varieties(product_id);
CREATE INDEX IF NOT EXISTS idx_product_extras_product_id ON product_extras(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_extras_order_item_id ON order_item_extras(order_item_id);

-- Habilitar RLS
ALTER TABLE product_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_extras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_varieties
CREATE POLICY "Anyone can view active varieties" ON product_varieties
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage varieties" ON product_varieties
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para product_extras
CREATE POLICY "Anyone can view active extras" ON product_extras
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage extras" ON product_extras
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para order_item_extras
CREATE POLICY "Anyone can view order item extras" ON order_item_extras
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create order item extras" ON order_item_extras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage order item extras" ON order_item_extras
  FOR ALL USING (auth.role() = 'authenticated');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_product_varieties_updated_at
  BEFORE UPDATE ON product_varieties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_extras_updated_at
  BEFORE UPDATE ON product_extras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

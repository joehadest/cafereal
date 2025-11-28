-- Insert sample categories
insert into public.categories (name, description, display_order, active) values
  ('Entradas', 'Deliciosas entradas para começar sua refeição', 1, true),
  ('Pratos Principais', 'Nossos pratos principais especiais', 2, true),
  ('Bebidas', 'Bebidas refrescantes e saborosas', 3, true),
  ('Sobremesas', 'Doces irresistíveis para finalizar', 4, true);

-- Insert sample products
insert into public.products (category_id, name, description, price, display_order, active)
select 
  c.id,
  p.name,
  p.description,
  p.price,
  p.display_order,
  p.active
from (
  select id from public.categories where name = 'Entradas'
) c
cross join (
  values
    ('Bruschetta', 'Pão italiano com tomate, manjericão e azeite', 18.90, 1, true),
    ('Carpaccio', 'Finas fatias de carne com rúcula e parmesão', 32.90, 2, true),
    ('Camarão ao Alho', 'Camarões salteados no alho e azeite', 42.90, 3, true)
) as p(name, description, price, display_order, active);

insert into public.products (category_id, name, description, price, display_order, active)
select 
  c.id,
  p.name,
  p.description,
  p.price,
  p.display_order,
  p.active
from (
  select id from public.categories where name = 'Pratos Principais'
) c
cross join (
  values
    ('Filé Mignon', 'Filé mignon grelhado com batatas e legumes', 68.90, 1, true),
    ('Salmão Grelhado', 'Salmão fresco com molho de maracujá', 62.90, 2, true),
    ('Risoto de Funghi', 'Risoto cremoso com cogumelos variados', 54.90, 3, true),
    ('Picanha na Brasa', 'Picanha suculenta com farofa e vinagrete', 72.90, 4, true)
) as p(name, description, price, display_order, active);

insert into public.products (category_id, name, description, price, display_order, active)
select 
  c.id,
  p.name,
  p.description,
  p.price,
  p.display_order,
  p.active
from (
  select id from public.categories where name = 'Bebidas'
) c
cross join (
  values
    ('Suco Natural', 'Suco natural de frutas da estação', 12.90, 1, true),
    ('Refrigerante', 'Refrigerante lata 350ml', 6.90, 2, true),
    ('Água Mineral', 'Água mineral sem gás 500ml', 5.90, 3, true),
    ('Caipirinha', 'Caipirinha tradicional', 18.90, 4, true)
) as p(name, description, price, display_order, active);

insert into public.products (category_id, name, description, price, display_order, active)
select 
  c.id,
  p.name,
  p.description,
  p.price,
  p.display_order,
  p.active
from (
  select id from public.categories where name = 'Sobremesas'
) c
cross join (
  values
    ('Petit Gateau', 'Bolinho de chocolate com sorvete', 24.90, 1, true),
    ('Pudim de Leite', 'Pudim caseiro com calda de caramelo', 16.90, 2, true),
    ('Mousse de Maracujá', 'Mousse leve e refrescante', 14.90, 3, true)
) as p(name, description, price, display_order, active);

-- Insert sample restaurant tables
insert into public.restaurant_tables (table_number, capacity, status) values
  (1, 4, 'available'),
  (2, 4, 'available'),
  (3, 2, 'available'),
  (4, 2, 'available'),
  (5, 6, 'available'),
  (6, 6, 'available'),
  (7, 8, 'available'),
  (8, 4, 'available'),
  (9, 4, 'available'),
  (10, 2, 'available');

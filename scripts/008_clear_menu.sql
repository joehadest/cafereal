-- Remove all existing products and categories
DELETE FROM products;
DELETE FROM categories;

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;

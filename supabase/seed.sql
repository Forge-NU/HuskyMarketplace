-- Local development data. Runs after migrations on `supabase db reset`.
-- Never runs on production. Categories match the live table so local
-- listings use the same ids.

-- Top-level categories first, since subcategories reference them.
INSERT INTO public.categories (id, name, icon, parent_id, sort_order)
VALUES
    ('c1111111-0000-0000-0000-000000000001', 'Furniture', 'sofa', NULL, 1),
    ('c1111111-0000-0000-0000-000000000002', 'Electronics', 'cpu', NULL, 2),
    ('c1111111-0000-0000-0000-000000000003', 'Clothing', 'shirt', NULL, 3),
    ('c1111111-0000-0000-0000-000000000004', 'Books & Notes', 'book', NULL, 4),
    ('c1111111-0000-0000-0000-000000000005', 'Tutoring & Academic Help', 'graduation-cap', NULL, 5),
    ('c1111111-0000-0000-0000-000000000006', 'Moving & Labor', 'truck', NULL, 6),
    ('c1111111-0000-0000-0000-000000000007', 'Other', 'more-horizontal', NULL, 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, icon, parent_id, sort_order)
VALUES
    ('c2222222-0000-0000-0000-000000000001', 'Desks & Chairs', 'armchair', 'c1111111-0000-0000-0000-000000000001', 1),
    ('c2222222-0000-0000-0000-000000000002', 'Math Tutoring', 'calculator', 'c1111111-0000-0000-0000-000000000005', 1)
ON CONFLICT (id) DO NOTHING;

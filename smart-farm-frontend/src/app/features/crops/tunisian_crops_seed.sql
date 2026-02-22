-- Tunisian Crops Sample Data
-- Includes iconic crops: Deglet Nour Dates, Chemlali Olives, Maltese Oranges, Durum Wheat, and Gabes Pomegranates

-- ⚠️ SAFETY FIRST: Unlink existing sensors from crops before cleaning to avoid Foreign Key violations
-- We do NOT want to delete the sensors, just remove their association with the old crops
UPDATE "sensors" SET "crop_id" = NULL;

-- 🗑️ CLEANUP: Remove existing crops
DELETE FROM "crops";

-- 🌱 INSERT: Add new Tunisian crops
INSERT INTO "crops" ("crop_id", "name", "description", "variety", "planting_date", "expected_harvest_date", "status", "notes", "created_at", "updated_at") VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Deglet Nour Dates', 'Premium "Queen of Dates" from the Tozeur oasis region', 'Deglet Nour', '2025-03-15', '2025-10-25', 'growing', 'Traditional three-layer oasis system in Tozeur. Pollination completed in March.', '2025-12-31 15:48:14.000000', '2025-12-31 15:48:14.000000'),

('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'Chemlali Olives', 'High-yield oil olives typical of the Sahel and Sfax regions', 'Chemlali', '2025-02-01', '2025-11-20', 'growing', 'Rain-fed olive grove in Sfax (Thyna). High resistance to drought.', '2025-12-31 15:48:14.000000', '2025-12-31 15:48:14.000000'),

('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'Maltese Oranges', 'World-renowned sweet blood oranges from Cap Bon', 'Maltese Demi-Sanguine', '2025-04-10', '2026-01-15', 'growing', 'Located in Nabeul/Menzel Bouzelfa. Requires regular irrigation and wind protection.', '2025-12-31 15:48:14.000000', '2025-12-31 15:48:14.000000'),

('d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', 'Durum Wheat', 'Hard wheat for high-quality semolina, couscous, and pasta', 'Karim', '2025-11-20', '2026-06-15', 'planted', 'Large scale cultivation in Beja (Granary of Tunisia). Dependent on winter rainfall.', '2025-12-31 15:48:14.000000', '2025-12-31 15:48:14.000000'),

('e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', 'Gabes Pomegranates', 'Sweet, juicy pomegranates from the coastal oasis of Gabes', 'Gabsi', '2025-03-01', '2025-09-30', 'growing', 'Intercropped with henna and vegetables in the Gabes coastal oasis system.', '2025-12-31 15:48:14.000000', '2025-12-31 15:48:14.000000');

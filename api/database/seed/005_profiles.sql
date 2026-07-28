-- Seed data for profiles
INSERT INTO profiles (profile_id, user_id, first_name, last_name, email, phone, bio, avatar_url, created_at) VALUES
(1, 'felix.whiskerton', 'Felix', 'Whiskerton', 'felix@purrtech.co', '555-0101', 'Supply chain manager with 10 years of experience in feline tech.', 'https://example.com/avatars/felix.png', '2024-01-15T10:00:00.000Z'),
(2, 'tabitha.pawson', 'Tabitha', 'Pawson', 'tabitha@whiskerware.com', '555-0102', 'Procurement specialist focused on smart pet products.', 'https://example.com/avatars/tabitha.png', '2024-01-16T11:30:00.000Z'),
(3, 'nina.nibbles', 'Nina', 'Nibbles', 'nina@catnip.com', '555-0103', 'Eco-conscious sourcing lead for sustainable cat accessories.', 'https://example.com/avatars/nina.png', '2024-01-17T09:15:00.000Z'),
(4, 'oliver.claws', 'Oliver', 'Claws', 'oliver@octocat.supply', '555-0104', 'Logistics coordinator handling cross-branch deliveries.', 'https://example.com/avatars/oliver.png', '2024-01-18T14:45:00.000Z'),
(5, 'mila.furrington', 'Mila', 'Furrington', 'mila@octocat.supply', NULL, 'New team member in inventory management.', NULL, '2024-02-01T08:00:00.000Z');

insert into orders (order_number, customer_name, status, return_eligible, delivery_date) values
('ORD1006', 'Fiona Gallagher', 'Delivered', true, current_date - interval '12 days'),
('ORD1007', 'George Clark', 'In Transit', false, current_date + interval '1 day'),
('ORD1008', 'Hannah Abbott', 'Delivered', false, current_date - interval '40 days'),
('ORD1009', 'Ian Malcolm', 'Returned', false, current_date - interval '15 days'),
('ORD1010', 'Julia Roberts', 'Delivered', true, current_date - interval '1 day');
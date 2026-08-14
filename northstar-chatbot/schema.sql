-- Member 4: Seed 5 Sample Orders matching your EXACT table columns
INSERT INTO orders (order_number, customer_name, status, return_eligible, delivery_date)
VALUES 
  ('ORD1001', 'Alice Johnson', 'Delivered', true, CURRENT_DATE - INTERVAL '10 days'),
  ('ORD1002', 'Bob Smith', 'Delivered', false, CURRENT_DATE - INTERVAL '45 days'),
  ('ORD1003', 'Charlie Brown', 'Delivered', false, CURRENT_DATE - INTERVAL '5 days'),
  ('ORD1004', 'Diana Prince', 'Pending Return', false, CURRENT_DATE - INTERVAL '12 days'),
  ('ORD1005', 'Evan Wright', 'Delivered', true, CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (order_number) DO NOTHING;
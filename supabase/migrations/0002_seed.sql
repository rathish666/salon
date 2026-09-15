-- Sample data so the site looks complete immediately.
-- Safe to skip/edit before running in a real client's project.

insert into service_categories (name, sort_order) values
  ('Haircuts', 1),
  ('Hair Styling', 2),
  ('Hair Coloring', 3),
  ('Hair Treatments', 4),
  ('Beard & Grooming', 5),
  ('Bridal & Special Occasion', 6),
  ('Kids', 7);

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Premium Haircut', 'Consultation, wash, precision cut, and finish styling.', 45, 500, true
from service_categories where name = 'Haircuts';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Kids Haircut', 'A relaxed, patient haircut for children under 12.', 30, 300, true
from service_categories where name = 'Kids';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Blow-Dry & Styling', 'Wash and professional blow-dry styling for any occasion.', 40, 700, true
from service_categories where name = 'Hair Styling';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Global Hair Coloring', 'Full-head color using ammonia-free, low-damage formulas.', 120, 2500, true
from service_categories where name = 'Hair Coloring';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Beard Styling & Trim', 'Shape, trim, and hot towel finish.', 25, 300, true
from service_categories where name = 'Beard & Grooming';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Keratin Smoothing Treatment', 'Reduces frizz and adds shine for up to 4 months.', 150, 3500, true
from service_categories where name = 'Hair Treatments';

insert into services (category_id, name, description, duration_minutes, price, is_active)
select id, 'Bridal Hair Styling', 'Trial + wedding-day styling with premium pinning and finish.', 120, 4000, true
from service_categories where name = 'Bridal & Special Occasion';

insert into staff (full_name, bio, specialization, experience_years, is_active) values
  ('Priya Nair', 'Known for precision bobs and low-maintenance layered cuts.', 'Haircuts & Styling', 8, true),
  ('Arjun Mehta', 'Color specialist trained in balayage and global color correction.', 'Hair Coloring', 6, true),
  ('Simran Kaur', 'Bridal specialist with 200+ weddings styled across Mumbai.', 'Bridal Styling', 10, true);

-- Standard Mon–Sat 9am–8pm availability for all staff, Sunday closed.
insert into staff_availability (staff_id, day_of_week, start_time, end_time, is_closed)
select s.id, d.day, '09:00', '20:00', (d.day = 0)
from staff s
cross join (select generate_series(0,6) as day) d;

insert into testimonials (customer_name, rating, review, review_date, is_published) values
  ('Ananya Rao', 5, 'Best haircut I have had in Mumbai. Priya really listens before she cuts.', current_date - 20, true),
  ('Rohan Kapoor', 5, 'Arjun matched my color perfectly on the first try. No brassy tones at all.', current_date - 12, true),
  ('Meera Iyer', 4, 'Lovely, calm space. Booking online was easy and they were on time.', current_date - 5, true);

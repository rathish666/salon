export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  category?: ServiceCategory;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string;
  specialization: string;
  experience_years: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string;  // "09:00:00"
  end_time: string;    // "20:00:00"
  is_closed: boolean;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  customer?: Customer;
  service_id: string;
  service?: Service;
  staff_id: string | null;
  staff?: Staff;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:MM:SS
  end_time: string;         // HH:MM:SS
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  rating: number;
  review: string;
  photo_url: string | null;
  review_date: string;
  is_published: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface OpeningHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface SalonSettings {
  id: string;
  salon_name: string;
  logo_url: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  google_maps_url: string | null;
  min_booking_notice_hours: number;
  max_advance_booking_days: number;
  opening_hours: OpeningHour[];
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

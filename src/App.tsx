import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Home } from '@/pages/Home';
import { Services } from '@/pages/Services';
import { StaffPage, GalleryPage, ContactPage } from '@/pages/StaffGalleryContact';
import { Booking } from '@/pages/Booking';
import { NotFound } from '@/pages/NotFound';

import { AdminLayout } from '@/admin/AdminLayout';
import { AdminLogin } from '@/admin/pages/Login';
import { ProtectedRoute } from '@/admin/ProtectedRoute';
import { Dashboard } from '@/admin/pages/Dashboard';
import { AdminAppointments } from '@/admin/pages/Appointments';
import { AdminServices } from '@/admin/pages/Services';
import { AdminStaff } from '@/admin/pages/Staff';
import { AdminGallery } from '@/admin/pages/Gallery';
import { AdminTestimonials } from '@/admin/pages/Testimonials';
import { AdminMessages } from '@/admin/pages/Messages';
import { AdminCustomers } from '@/admin/pages/Customers';
import { AdminSettings } from '@/admin/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/booking" element={<Booking />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

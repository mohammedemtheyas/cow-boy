import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection.js';
import { QuickBookingWidget } from '../components/QuickBookingWidget.js';
import { FeaturesSection } from '../components/FeaturesSection.js';
import { HowItWorks } from '../components/HowItWorks.js';
import { Footer } from '../components/Footer.js';
import { BookingModal } from '../components/BookingModal.js';
import { Slot } from '../types/index.js';

export const LandingPage: React.FC = () => {
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setBookingModalOpen(true);
  };

  const handleProceedFromQuickWidget = (
    serviceId: string,
    providerId: string,
    date: string,
    slot: Slot
  ) => {
    // Open the booking modal with prefilled service
    setSelectedServiceId(serviceId);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      {/* Hero Section */}
      <HeroSection onOpenBookingModal={() => handleOpenBooking()} />

      {/* Embedded Live Quick Booking Widget Section */}
      <section className="relative -mt-10 mb-16 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <QuickBookingWidget onProceedToForm={handleProceedFromQuickWidget} />
      </section>

      {/* Features Showcase */}
      <FeaturesSection />

      {/* How it works */}
      <HowItWorks />

      {/* Footer & CTA */}
      <Footer onOpenBookingModal={() => handleOpenBooking()} />

      {/* Global Booking Wizard Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preselectedServiceId={selectedServiceId}
      />
    </div>
  );
};

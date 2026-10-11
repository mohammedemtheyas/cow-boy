import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SLOTORA database seeding...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Admin)',
      email: 'admin@slotora.com',
      phone: '+1 (555) 019-2834',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '+1 (555) 342-9981',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  console.log('✅ Users seeded (Admin: admin@slotora.com / admin123, User: alex@example.com / user123)');

  // Create Services
  const servicesData = [
    {
      name: 'Executive Strategy & Business Advisory',
      description: 'High-level business roadmapping, market expansion strategy, and investor pitch deck evaluation for executives and founders.',
      category: 'Strategy & Advisory',
      durationMinutes: 45,
      price: 150.0,
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'AI Architecture & Full-Stack Tech Review',
      description: 'Deep architectural consultation on scalable microservices, LLM agent integration, cloud infrastructure, and security audit.',
      category: 'Tech & Architecture',
      durationMinutes: 60,
      price: 190.0,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Senior Career Mentorship & Portfolio Critique',
      description: 'One-on-one tailored mentoring session focusing on senior role transition, resume refactoring, and behavioral interview coaching.',
      category: 'Career & Mentorship',
      durationMinutes: 30,
      price: 85.0,
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Integrative Wellness & Stress Management',
      description: 'Holistic lifestyle consultation incorporating mindfulness techniques, ergonomic posture analysis, and personalized wellness routines.',
      category: 'Health & Wellness',
      durationMinutes: 45,
      price: 110.0,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Artisan Hair Sculpting & Conditioning Treatment',
      description: 'Master stylist consultation, precision haircut, deep restorative scalp treatment, and bespoke finishing session.',
      category: 'Salon & Grooming',
      durationMinutes: 45,
      price: 95.0,
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Advanced STEM Academic Tutoring',
      description: 'Targeted university-level tutoring in algorithms, calculus, or physics. Focused problem-solving for exam preparation.',
      category: 'Education & Tutoring',
      durationMinutes: 30,
      price: 50.0,
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const createdServices = [];
  for (const s of servicesData) {
    const created = await prisma.service.create({ data: s });
    createdServices.push(created);
  }

  console.log(`✅ ${createdServices.length} Services created`);

  // Create Providers
  const providersData = [
    {
      name: 'Dr. Marcus Vance',
      title: 'Principal Systems Architect',
      bio: 'Ex-Google staff architect with 15+ years experience in distributed systems and generative AI infrastructure.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Sophia Chen',
      title: 'Venture Partner & Growth Advisor',
      bio: 'Advised 40+ YC and Techstars startups through Series A/B scaling and product-market positioning.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Julian Sterling',
      title: 'Certified Mind-Body Practitioner',
      bio: 'Licensed wellness coach specializing in executive stress mitigation, sleep architecture, and somatic resets.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Camille Dubois',
      title: 'Creative Style Director',
      bio: 'Trained in Paris and Milan, delivering bespoke styling and precision hair architectural design.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const createdProviders = [];
  for (const p of providersData) {
    const created = await prisma.provider.create({ data: p });
    createdProviders.push(created);
  }

  console.log(`✅ ${createdProviders.length} Providers created`);

  // Link Service Providers
  // Dr. Marcus Vance -> AI Architecture (index 1), STEM (index 5)
  // Sophia Chen -> Executive Strategy (index 0), Career Mentorship (index 2)
  // Julian Sterling -> Integrative Wellness (index 3), Career Mentorship (index 2)
  // Camille Dubois -> Artisan Hair (index 4)
  const links = [
    { serviceId: createdServices[1].id, providerId: createdProviders[0].id },
    { serviceId: createdServices[5].id, providerId: createdProviders[0].id },
    { serviceId: createdServices[0].id, providerId: createdProviders[1].id },
    { serviceId: createdServices[2].id, providerId: createdProviders[1].id },
    { serviceId: createdServices[3].id, providerId: createdProviders[2].id },
    { serviceId: createdServices[2].id, providerId: createdProviders[2].id },
    { serviceId: createdServices[4].id, providerId: createdProviders[3].id },
  ];

  for (const link of links) {
    await prisma.serviceProvider.create({ data: link });
  }

  // Set Availability for each provider (Mon - Sat, 09:00 - 18:00)
  for (const prov of createdProviders) {
    // Days 1 to 5 (Mon to Fri) 09:00 - 17:30
    for (let day = 1; day <= 5; day++) {
      await prisma.availability.create({
        data: {
          providerId: prov.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:30',
        },
      });
    }
    // Day 6 (Saturday) 10:00 - 15:00
    await prisma.availability.create({
      data: {
        providerId: prov.id,
        dayOfWeek: 6,
        startTime: '10:00',
        endTime: '15:00',
      },
    });
  }

  console.log('✅ Providers availability configured');

  // Seed realistic upcoming & completed sample appointments
  const today = new Date();
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getFutureDate = (daysAhead: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    return formatYMD(d);
  };

  const getPastDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return formatYMD(d);
  };

  const sampleAppointments = [
    {
      bookingReference: 'SLT-89214',
      userId: demoUser.id,
      serviceId: createdServices[1].id,
      providerId: createdProviders[0].id,
      customerName: 'Alex Rivera',
      customerEmail: 'alex@example.com',
      customerPhone: '+1 (555) 342-9981',
      appointmentDate: getFutureDate(2),
      startTime: '10:00',
      endTime: '11:00',
      status: 'CONFIRMED',
      notes: 'Focus on RAG pipelines and vector database cost optimization.',
    },
    {
      bookingReference: 'SLT-77402',
      userId: demoUser.id,
      serviceId: createdServices[0].id,
      providerId: createdProviders[1].id,
      customerName: 'Alex Rivera',
      customerEmail: 'alex@example.com',
      customerPhone: '+1 (555) 342-9981',
      appointmentDate: getFutureDate(5),
      startTime: '14:00',
      endTime: '14:45',
      status: 'CONFIRMED',
      notes: 'Review Q4 scaling metrics and pre-seed term sheet terms.',
    },
    {
      bookingReference: 'SLT-61298',
      userId: demoUser.id,
      serviceId: createdServices[3].id,
      providerId: createdProviders[2].id,
      customerName: 'Alex Rivera',
      customerEmail: 'alex@example.com',
      customerPhone: '+1 (555) 342-9981',
      appointmentDate: getPastDate(4),
      startTime: '11:00',
      endTime: '11:45',
      status: 'COMPLETED',
      notes: 'Session completed. Breathing protocol provided.',
    },
    {
      bookingReference: 'SLT-44321',
      userId: demoUser.id,
      serviceId: createdServices[4].id,
      providerId: createdProviders[3].id,
      customerName: 'Alex Rivera',
      customerEmail: 'alex@example.com',
      customerPhone: '+1 (555) 342-9981',
      appointmentDate: getPastDate(12),
      startTime: '13:00',
      endTime: '13:45',
      status: 'CANCELLED',
      notes: 'Cancelled due to travel schedule change.',
    },
    {
      bookingReference: 'SLT-99120',
      userId: null,
      serviceId: createdServices[0].id,
      providerId: createdProviders[1].id,
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.j@techventures.io',
      customerPhone: '+1 (555) 902-1244',
      appointmentDate: getFutureDate(1),
      startTime: '11:00',
      endTime: '11:45',
      status: 'CONFIRMED',
      notes: 'Guest booking for Series A syndicate strategy.',
    },
  ];

  for (const apt of sampleAppointments) {
    await prisma.appointment.create({ data: apt });
  }

  console.log(`✅ ${sampleAppointments.length} Sample appointments seeded`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

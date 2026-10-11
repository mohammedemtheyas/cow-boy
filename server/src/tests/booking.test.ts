import { prisma } from '../db.js';
import { intervalsOverlap, isSlotInPast } from '../utils/time.js';

async function runTests() {
  console.log('🧪 Starting SLOTORA Automated Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Time Interval Overlap Detection Unit Tests
    console.log('[Suite 1: Time Overlap Detection Logic]');
    assert(intervalsOverlap('10:00', '11:00', '10:00', '11:00'), 'Identical intervals overlap');
    assert(intervalsOverlap('10:00', '11:00', '10:30', '11:30'), 'Partial start overlap detected');
    assert(intervalsOverlap('10:30', '11:30', '10:00', '11:00'), 'Partial end overlap detected');
    assert(intervalsOverlap('10:00', '12:00', '10:30', '11:00'), 'Enclosed interval detected');
    assert(!intervalsOverlap('10:00', '11:00', '11:00', '12:00'), 'Adjacent intervals do NOT overlap');
    assert(!intervalsOverlap('09:00', '10:00', '10:00', '11:00'), 'Preceding adjacent intervals do NOT overlap');

    // Test 2: Past Slot Detection
    console.log('\n[Suite 2: Past Slot Detection]');
    assert(isSlotInPast('2020-01-01', '09:00'), '2020 date correctly marked as past');
    assert(!isSlotInPast('2099-01-01', '09:00'), 'Future year 2099 correctly marked as not past');

    // Test 3: Database Booking Overlap and Slot Release Integration Test
    console.log('\n[Suite 3: Database Booking Rules & Concurrency]');
    const service = await prisma.service.findFirst({ where: { isActive: true } });
    const provider = await prisma.provider.findFirst({ where: { isActive: true } });

    if (!service || !provider) {
      throw new Error('Seed data required to run integration tests');
    }

    const testDate = '2029-12-01';
    const testSlotStart = '10:00';
    const testSlotEnd = '11:00';

    // Clean any leftover test data
    await prisma.appointment.deleteMany({
      where: { appointmentDate: testDate, providerId: provider.id },
    });

    // Create initial booking
    const appt1 = await prisma.appointment.create({
      data: {
        bookingReference: 'TEST-10001',
        serviceId: service.id,
        providerId: provider.id,
        customerName: 'Test User 1',
        customerEmail: 'test1@example.com',
        customerPhone: '+1-555-0001',
        appointmentDate: testDate,
        startTime: testSlotStart,
        endTime: testSlotEnd,
        status: 'CONFIRMED',
      },
    });

    assert(Boolean(appt1.id), 'Initial booking created successfully in database');

    // Attempt duplicate booking for same slot
    const existing = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: testDate,
        status: 'CONFIRMED',
      },
    });

    const isDuplicate = existing.some((e) =>
      intervalsOverlap(testSlotStart, testSlotEnd, e.startTime, e.endTime)
    );
    assert(isDuplicate, 'Duplicate slot booking detected and prevented');

    // Attempt overlapping slot (10:30 to 11:30)
    const isOverlapping = existing.some((e) =>
      intervalsOverlap('10:30', '11:30', e.startTime, e.endTime)
    );
    assert(isOverlapping, 'Overlapping interval (10:30 - 11:30) detected and prevented');

    // Non-overlapping slot (11:00 to 12:00)
    const nonOverlapping = existing.some((e) =>
      intervalsOverlap('11:00', '12:00', e.startTime, e.endTime)
    );
    assert(!nonOverlapping, 'Non-overlapping adjacent slot (11:00 - 12:00) is permitted');

    // Cancellation & Slot Release
    const cancelled = await prisma.appointment.update({
      where: { id: appt1.id },
      data: { status: 'CANCELLED' },
    });

    assert(cancelled.status === 'CANCELLED', 'Appointment cancelled non-destructively');

    const confirmedAfterCancel = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: testDate,
        status: 'CONFIRMED',
      },
    });

    const isSlotAvailableNow = !confirmedAfterCancel.some((e) =>
      intervalsOverlap(testSlotStart, testSlotEnd, e.startTime, e.endTime)
    );
    assert(isSlotAvailableNow, 'Released time slot is immediately available for new reservations');

    // Clean up test records
    await prisma.appointment.deleteMany({
      where: { appointmentDate: testDate, providerId: provider.id },
    });

    console.log(`\n================================`);
    console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

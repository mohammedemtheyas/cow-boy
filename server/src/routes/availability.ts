import { Router } from 'express';
import { prisma } from '../db.js';
import { timeToMinutes, minutesToTime, intervalsOverlap, isSlotInPast } from '../utils/time.js';

const router = Router();

// GET /api/availability?serviceId=...&providerId=...&date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { serviceId, providerId, date } = req.query;

    if (!serviceId || !providerId || !date) {
      return res.status(400).json({
        error: 'Missing required query parameters: serviceId, providerId, date (YYYY-MM-DD)',
      });
    }

    const dateStr = String(date);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD' });
    }

    // Check service
    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
    });
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    // Check provider
    const provider = await prisma.provider.findUnique({
      where: { id: String(providerId) },
      include: {
        availability: true,
      },
    });
    if (!provider || !provider.isActive) {
      return res.status(404).json({ error: 'Provider not found or inactive' });
    }

    // Parse date for Day of Week (0 = Sunday ... 6 = Saturday)
    const [year, month, day] = dateStr.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    const dayOfWeek = parsedDate.getDay();

    // Check if entire date is strictly in the past (before today's midnight)
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (parsedDate.getTime() < todayZero.getTime()) {
      return res.json({
        date: dateStr,
        indicator: 'Fully Booked',
        message: 'Past dates cannot be booked',
        slots: [],
        availableCount: 0,
        totalSlots: 0,
      });
    }

    // Find provider availability for this day of week
    const workingRules = provider.availability.filter(
      (a) => a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (workingRules.length === 0) {
      return res.json({
        date: dateStr,
        indicator: 'Fully Booked',
        message: 'Provider is not available on this day of the week',
        slots: [],
        availableCount: 0,
        totalSlots: 0,
      });
    }

    // Fetch confirmed bookings for this provider on this date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: dateStr,
        status: 'CONFIRMED',
      },
    });

    const duration = service.durationMinutes;
    // Step interval: 30 minutes if duration <= 30, else 30 or 45 min slots
    const step = 30;

    const candidateSlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reason?: string;
    }> = [];

    for (const rule of workingRules) {
      const startMin = timeToMinutes(rule.startTime);
      const endMin = timeToMinutes(rule.endTime);

      for (let current = startMin; current + duration <= endMin; current += step) {
        const slotStart = minutesToTime(current);
        const slotEnd = minutesToTime(current + duration);

        // 1. Check if slot starts in the past
        const inPast = isSlotInPast(dateStr, slotStart);
        if (inPast) {
          candidateSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: false,
            reason: 'Past time',
          });
          continue;
        }

        // 2. Check overlap with any confirmed appointment
        const hasConflict = bookedAppointments.some((appt) =>
          intervalsOverlap(slotStart, slotEnd, appt.startTime, appt.endTime)
        );

        if (hasConflict) {
          candidateSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: false,
            reason: 'Already booked',
          });
        } else {
          candidateSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: true,
          });
        }
      }
    }

    const availableSlots = candidateSlots.filter((s) => s.available);
    const availableCount = availableSlots.length;
    const totalSlots = candidateSlots.length;

    let indicator: 'Available' | 'Few Slots Left' | 'Fully Booked' = 'Available';
    if (availableCount === 0) {
      indicator = 'Fully Booked';
    } else if (availableCount <= 3) {
      indicator = 'Few Slots Left';
    } else {
      indicator = 'Available';
    }

    return res.json({
      date: dateStr,
      providerId: provider.id,
      providerName: provider.name,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: duration,
      indicator,
      totalSlots,
      availableCount,
      slots: candidateSlots,
    });
  } catch (error) {
    console.error('Error generating availability:', error);
    return res.status(500).json({ error: 'Failed to calculate slot availability' });
  }
});

export default router;

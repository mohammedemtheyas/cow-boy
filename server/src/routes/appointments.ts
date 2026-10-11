import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { AuthRequest, optionalAuth, authenticateToken } from '../middleware/auth.js';
import {
  timeToMinutes,
  minutesToTime,
  intervalsOverlap,
  isSlotInPast,
  generateBookingReference,
} from '../utils/time.js';

const router = Router();

const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  providerId: z.string().min(1, 'Provider is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date in YYYY-MM-DD required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Valid start time in HH:MM required'),
  customerName: z.string().min(2, 'Full name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().min(7, 'Please enter a valid phone number'),
  notes: z.string().max(500).optional(),
});

const rescheduleSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date in YYYY-MM-DD required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Valid start time in HH:MM required'),
});

// POST /api/appointments - Atomic creation with overlap & duplicate protection
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const validated = createAppointmentSchema.parse(req.body);

    // 1. Verify not in the past
    if (isSlotInPast(validated.appointmentDate, validated.startTime)) {
      return res.status(400).json({
        error: 'Cannot book appointments in the past. Please select an upcoming date and time.',
      });
    }

    // 2. Fetch service
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
    });
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Selected service does not exist or is inactive' });
    }

    // 3. Fetch provider
    const provider = await prisma.provider.findUnique({
      where: { id: validated.providerId },
      include: { availability: true },
    });
    if (!provider || !provider.isActive) {
      return res.status(404).json({ error: 'Selected provider does not exist or is inactive' });
    }

    // Calculate endTime
    const startMins = timeToMinutes(validated.startTime);
    const endMins = startMins + service.durationMinutes;
    const calculatedEndTime = minutesToTime(endMins);

    // 4. Verify provider working hours on day of week
    const [year, month, day] = validated.appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    const providerDayRule = provider.availability.find(
      (a) => a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (!providerDayRule) {
      return res.status(400).json({
        error: `${provider.name} is not available on this day of the week.`,
      });
    }

    const provStart = timeToMinutes(providerDayRule.startTime);
    const provEnd = timeToMinutes(providerDayRule.endTime);

    if (startMins < provStart || endMins > provEnd) {
      return res.status(400).json({
        error: `Requested slot (${validated.startTime} - ${calculatedEndTime}) falls outside provider working hours (${providerDayRule.startTime} - ${providerDayRule.endTime}).`,
      });
    }

    // Determine associated user ID if logged in or by matching email
    let targetUserId = req.user?.id || null;
    if (!targetUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.customerEmail.toLowerCase() },
      });
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    }

    // 5. ATOMIC PRISMA TRANSACTION to prevent race conditions and duplicate/overlapping bookings
    const result = await prisma.$transaction(async (tx) => {
      // Find all active/confirmed appointments for this provider on this date
      const existingAppointments = await tx.appointment.findMany({
        where: {
          providerId: validated.providerId,
          appointmentDate: validated.appointmentDate,
          status: 'CONFIRMED',
        },
      });

      // Strict interval overlap collision check
      const collision = existingAppointments.find((existing) =>
        intervalsOverlap(
          validated.startTime,
          calculatedEndTime,
          existing.startTime,
          existing.endTime
        )
      );

      if (collision) {
        throw new Error(
          `SLOT_CONFLICT: Time slot ${validated.startTime} - ${calculatedEndTime} is no longer available. Please choose another slot.`
        );
      }

      // Generate unique booking reference
      let reference = generateBookingReference();
      let refExists = await tx.appointment.findUnique({ where: { bookingReference: reference } });
      while (refExists) {
        reference = generateBookingReference();
        refExists = await tx.appointment.findUnique({ where: { bookingReference: reference } });
      }

      // Save appointment
      const newAppointment = await tx.appointment.create({
        data: {
          bookingReference: reference,
          userId: targetUserId,
          serviceId: validated.serviceId,
          providerId: validated.providerId,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail.toLowerCase(),
          customerPhone: validated.customerPhone,
          appointmentDate: validated.appointmentDate,
          startTime: validated.startTime,
          endTime: calculatedEndTime,
          status: 'CONFIRMED',
          notes: validated.notes || null,
        },
        include: {
          service: true,
          provider: true,
        },
      });

      return newAppointment;
    });

    return res.status(201).json({
      message: 'Appointment successfully confirmed',
      appointment: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    if (error.message && error.message.startsWith('SLOT_CONFLICT:')) {
      const msg = error.message.replace('SLOT_CONFLICT:', '').trim();
      return res.status(409).json({ error: msg });
    }

    console.error('Booking error:', error);
    return res.status(500).json({ error: 'Failed to process booking reservation' });
  }
});

// GET /api/appointments - Retrieve appointments for user or guest
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { email, reference, phone } = req.query;

    let whereClause: any = {};

    if (req.user) {
      // User is logged in: fetch their appointments
      whereClause = {
        OR: [{ userId: req.user.id }, { customerEmail: req.user.email.toLowerCase() }],
      };
    } else if (reference) {
      whereClause = { bookingReference: String(reference).toUpperCase() };
    } else if (email) {
      whereClause = { customerEmail: String(email).toLowerCase() };
      if (phone) {
        whereClause.customerPhone = String(phone);
      }
    } else {
      return res.status(400).json({
        error: 'Please provide authentication or specify booking reference/email to view appointments',
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
        provider: true,
      },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
    });

    return res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// GET /api/appointments/:id - Single appointment details
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        service: true,
        provider: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Privacy verification if user is logged in
    if (req.user && req.user.role !== 'ADMIN') {
      if (
        appointment.userId !== req.user.id &&
        appointment.customerEmail !== req.user.email.toLowerCase()
      ) {
        return res.status(403).json({ error: 'Unauthorized to view this appointment' });
      }
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve appointment' });
  }
});

// PATCH /api/appointments/:id/cancel - Non-destructive cancellation that frees up slot
router.patch('/:id/cancel', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (req.user && req.user.role !== 'ADMIN') {
      if (
        appointment.userId !== req.user.id &&
        appointment.customerEmail !== req.user.email.toLowerCase()
      ) {
        return res.status(403).json({ error: 'Unauthorized to cancel this appointment' });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        service: true,
        provider: true,
      },
    });

    return res.json({
      message: 'Appointment successfully cancelled and time slot has been released.',
      appointment: updated,
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// PATCH /api/appointments/:id/reschedule - Reschedule appointment with conflict prevention
router.patch('/:id/reschedule', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const validated = rescheduleSchema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { service: true, provider: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot reschedule a cancelled appointment' });
    }

    if (isSlotInPast(validated.appointmentDate, validated.startTime)) {
      return res.status(400).json({ error: 'Cannot reschedule to a past date or time' });
    }

    const duration = appointment.service.durationMinutes;
    const startMins = timeToMinutes(validated.startTime);
    const endMins = startMins + duration;
    const calculatedEndTime = minutesToTime(endMins);

    // Atomic reschedule check
    const updated = await prisma.$transaction(async (tx) => {
      // Find other confirmed appointments for this provider on the new date
      const conflicts = await tx.appointment.findMany({
        where: {
          providerId: appointment.providerId,
          appointmentDate: validated.appointmentDate,
          status: 'CONFIRMED',
          id: { not: appointment.id },
        },
      });

      const hasCollision = conflicts.some((c) =>
        intervalsOverlap(validated.startTime, calculatedEndTime, c.startTime, c.endTime)
      );

      if (hasCollision) {
        throw new Error(
          `SLOT_CONFLICT: Time slot ${validated.startTime} - ${calculatedEndTime} on ${validated.appointmentDate} is already booked.`
        );
      }

      return await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          appointmentDate: validated.appointmentDate,
          startTime: validated.startTime,
          endTime: calculatedEndTime,
          status: 'CONFIRMED',
        },
        include: {
          service: true,
          provider: true,
        },
      });
    });

    return res.json({
      message: 'Appointment successfully rescheduled',
      appointment: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.message && error.message.startsWith('SLOT_CONFLICT:')) {
      return res.status(409).json({ error: error.message.replace('SLOT_CONFLICT:', '').trim() });
    }
    return res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

export default router;

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply auth + requireAdmin to all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats - KPI analytics & summaries
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalAppointments = await prisma.appointment.count();
    const confirmedAppointments = await prisma.appointment.count({
      where: { status: 'CONFIRMED' },
    });
    const completedAppointments = await prisma.appointment.count({
      where: { status: 'COMPLETED' },
    });
    const cancelledAppointments = await prisma.appointment.count({
      where: { status: 'CANCELLED' },
    });

    const appointmentsWithPrice = await prisma.appointment.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      include: { service: { select: { price: true } } },
    });

    const totalRevenue = appointmentsWithPrice.reduce(
      (sum, appt) => sum + (appt.service?.price || 0),
      0
    );

    const totalServices = await prisma.service.count();
    const totalProviders = await prisma.provider.count();

    return res.json({
      stats: {
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        totalServices,
        totalProviders,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/appointments - Search, filter, inspect all appointments
router.get('/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, date } = req.query;

    let whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = String(status);
    }

    if (date) {
      whereClause.appointmentDate = String(date);
    }

    if (search) {
      const q = String(search);
      whereClause.OR = [
        { bookingReference: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
        { customerPhone: { contains: q } },
        { service: { name: { contains: q } } },
      ];
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
    console.error('Admin fetch appointments error:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PATCH /api/admin/appointments/:id/status - Update status directly
router.patch('/appointments/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
      include: { service: true, provider: true },
    });

    return res.json({ message: 'Status updated successfully', appointment: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// Service management schema
const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  durationMinutes: z.number().min(15).max(240),
  price: z.number().min(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// POST /api/admin/services - Create service
router.post('/services', async (req: AuthRequest, res: Response) => {
  try {
    const validated = serviceSchema.parse(req.body);

    const service = await prisma.service.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        durationMinutes: validated.durationMinutes,
        price: validated.price,
        imageUrl: validated.imageUrl || null,
        isActive: validated.isActive !== undefined ? validated.isActive : true,
      },
    });

    return res.status(201).json({ message: 'Service created successfully', service });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create service' });
  }
});

// PATCH /api/admin/services/:id - Edit service
router.patch('/services/:id', async (req: AuthRequest, res: Response) => {
  try {
    const validated = serviceSchema.partial().parse(req.body);

    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: validated,
    });

    return res.json({ message: 'Service updated successfully', service: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/admin/services/:id - Toggle active/inactive or remove
router.delete('/services/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Soft-deactivate for safe retention
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return res.json({ message: 'Service deactivated successfully', service: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

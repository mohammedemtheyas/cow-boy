import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    const whereClause: any = { isActive: true };

    if (category && category !== 'All') {
      whereClause.category = String(category);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        providers: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedServices = services.map((s) => ({
      ...s,
      providers: s.providers.map((sp) => sp.provider).filter((p) => p.isActive),
    }));

    return res.json({ services: formattedServices });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        providers: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({
      service: {
        ...service,
        providers: service.providers.map((sp) => sp.provider).filter((p) => p.isActive),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve service details' });
  }
});

export default router;

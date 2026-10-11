import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/providers
router.get('/', async (req, res) => {
  try {
    const { serviceId } = req.query;

    let whereClause: any = { isActive: true };

    if (serviceId) {
      whereClause.services = {
        some: {
          serviceId: String(serviceId),
        },
      };
    }

    const providers = await prisma.provider.findMany({
      where: whereClause,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availability: {
          where: { isActive: true },
        },
      },
    });

    const formatted = providers.map((p) => ({
      ...p,
      services: p.services.map((s) => s.service),
    }));

    return res.json({ providers: formatted });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return res.status(500).json({ error: 'Failed to retrieve providers' });
  }
});

export default router;

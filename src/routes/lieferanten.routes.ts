import { Router } from 'express';
import { createLieferant } from '../controllers/lieferant.controller';

const router = Router();

router.post('/', createLieferant);

export default router;
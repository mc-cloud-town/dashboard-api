import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import api from './api';

const router = Router();

router.use('/api', api);

export default router;

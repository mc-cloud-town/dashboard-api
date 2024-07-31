import { Router } from 'express';

import google from './google';
import discord from './discord';

const router = Router();

router.use('/google', google);
router.use('/discord', discord);

export default router;

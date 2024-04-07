import type { Request, Response } from 'express';

import { Router } from 'express';
import Course from '../course';

const router = Router();

export async function getCourses(req: Request, res: Response) {
  const courses = await Course.find({});
  res.json(courses);
}

router.get('/', getCourses);

export default router;

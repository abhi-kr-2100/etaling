import { Request, Response, Router } from 'express';

import { UserProfile } from '../user-profile';
import SentenceList from '../sentence-list';

const router = Router();

export async function getSentenceLists(req: Request, res: Response) {
  const userId = req.auth.payload.sub;
  const userProfile = await UserProfile.findOne({
    userId,
  });

  const sentenceLists = await SentenceList.find({
    $or: [{ owner: userProfile._id }, { isPublic: true }],
  });

  res.json(
    sentenceLists.map((sl) => ({
      _id: sl._id,
      title: sl.title,
      sentences: sl.sentences,
    })),
  );
}

router.get('/', getSentenceLists);

export default router;

import express from 'express';
import { deleteUser, getUsers, signout, test, updateUser, getUser, getUsersPP, getUserByUsername, followUser, unfollowUser, getUserRelations } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.put('/update/:userId', verifyToken, updateUser);
router.delete('/delete/:userId', verifyToken, deleteUser);
router.post('/signout', signout);
router.get('/getusers', verifyToken, getUsers);
router.get('/getUsersPP', verifyToken, getUsersPP);
router.get('/by-username/:username', getUserByUsername);
router.post('/follow/:userId', verifyToken, followUser);
router.post('/unfollow/:userId', verifyToken, unfollowUser);
router.get('/relations/:userId', verifyToken, getUserRelations);
router.get('/:userId', getUser);

export default router;
import express from 'express';
import {
    createComment,
    getComments,
    getRouteComments,
    getRouteCommentsCount,
    likeComment,
    editComment,
    deleteComment
} from '../controllers/comment.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/', verifyToken, createComment);
router.get('/all', verifyToken, getComments);
router.get('/route/:routeId', getRouteComments);
router.get('/route/:routeId/count', getRouteCommentsCount);
router.put('/:commentId/like', verifyToken, likeComment);
router.put('/:commentId', verifyToken, editComment);
router.delete('/:commentId', verifyToken, deleteComment);

export default router;
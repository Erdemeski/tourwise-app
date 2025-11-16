import Comment from "../models/comment.model.js";
import { errorHandler } from "../utils/error.js";

export const createComment = async (req, res, next) => {
    try {
        const { content, routeId, userId } = req.body;

        if (!req.user || req.user.id !== userId) {
            return next(errorHandler(403, "You are not allowed to create this comment"));
        }

        if (!content || !routeId) {
            return next(errorHandler(400, "Content and routeId are required"));
        }

        const newComment = new Comment({
            content,
            routeId,
            userId,
        });

        await newComment.save();
        res.status(200).json(newComment);
    } catch (error) {
        next(error);
    }
};

export const getComments = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, "You are not allowed to get all comments"));
    }
    try {
        const startIndex = parseInt(req.query.startIndex, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 7;
        const sortDirection = req.query.sort === "desc" ? -1 : 1;
        const comments = await Comment.find()
            .sort({ updatedAt: sortDirection })
            .skip(startIndex)
            .limit(limit);

        const totalComments = await Comment.countDocuments();

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastMonthComments = await Comment.countDocuments({ createdAt: { $gte: oneMonthAgo } });
        res.status(200).json({ comments, totalComments, lastMonthComments });
    } catch (error) {
        next(error);
    }
};

export const getRouteComments = async (req, res, next) => {
    const { routeId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    try {
        const skip = (page - 1) * limit;

        const totalComments = await Comment.countDocuments({ routeId });
        const comments = await Comment.find({ routeId })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip, 10))
            .limit(parseInt(limit, 10));

        res.status(200).json({
            comments,
            totalComments,
            totalPages: Math.ceil(totalComments / limit),
            currentPage: parseInt(page, 10),
        });
    } catch (error) {
        next(error);
    }
};

export const getRouteCommentsCount = async (req, res, next) => {
    try {
        const comments = await Comment.find({ routeId: req.params.routeId }).sort({
            createdAt: -1,
        });

        res.status(200).json(comments.length);
    } catch (error) {
        next(error);
    }
};

export const likeComment = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to like a comment"));
        }

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return next(errorHandler(404, "Comment not found"));
        }
        const userIndex = comment.likes.indexOf(req.user.id);
        if (userIndex === -1) {
            comment.numberOfLikes += 1;
            comment.likes.push(req.user.id);
        } else {
            comment.numberOfLikes = Math.max(0, comment.numberOfLikes - 1);
            comment.likes.splice(userIndex, 1);
        }
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
};

export const editComment = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to edit a comment"));
        }

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return next(errorHandler(404, "Comment not found"));
        }
        if (comment.userId !== req.user.id && !req.user.isAdmin) {
            return next(errorHandler(403, "You are not allowed to edit this comment"));
        }
        const editedComment = await Comment.findByIdAndUpdate(
            req.params.commentId,
            {
                content: req.body.content,
            },
            { new: true }
        );
        res.status(200).json(editedComment);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(errorHandler(401, "You must be signed in to delete a comment"));
        }

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return next(errorHandler(404, "Comment not found"));
        }
        if (comment.userId !== req.user.id && !req.user.isAdmin) {
            return next(errorHandler(403, "You are not allowed to delete this comment"));
        }
        await Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json("Comment has been deleted");
    } catch (error) {
        next(error);
    }
};
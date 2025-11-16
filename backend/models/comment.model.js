import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    routeId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    likes: {
        type: [String],
        default: [],
    },
    numberOfLikes: {
        type: Number,
        default: 0,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';


export const test = (req, res) => {
    res.json({ message: 'API is working!' });
};


export const updateUser = async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to update this user'));
    }

    // Get the current user to check if they are a Google user
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) {
        return next(errorHandler(404, 'User not found'));
    }

    // Only allow password update for non-Google users
    if (req.body.password) {
        if (currentUser.isGoogleUser) {
            return next(errorHandler(400, 'Google users cannot change their password'));
        }
        if (!req.body.currentPassword) {
            return next(errorHandler(400, 'Current password is required to set a new password'));
        }
        // Verify current password
        const validPassword = bcryptjs.compareSync(req.body.currentPassword, currentUser.password);
        if (!validPassword) {
            return next(errorHandler(400, 'Current password is incorrect'));
        }
        if (req.body.password.length < 6) {
            return next(errorHandler(400, 'Password must be at least 6 characters'));
        }
        req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    // Validate firstName and lastName
    if (req.body.firstName || req.body.lastName) {
        if (req.body.firstName && req.body.firstName.trim().length < 2) {
            return next(errorHandler(400, 'First name must be at least 2 characters long'));
        }
        if (req.body.lastName && req.body.lastName.trim().length < 2) {
            return next(errorHandler(400, 'Last name must be at least 2 characters long'));
        }
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                ...(req.body.password && !currentUser.isGoogleUser && { password: req.body.password }),
            },
        }, { new: true });
        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);

    } catch (error) {
        next(error);
    }
};


export const deleteUser = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(errorHandler(403, 'You are not allowed to delete this user'));
    }
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.status(200).json({ message: 'User deleted successfuly' });
    } catch (error) {
        next(error);
    }
};


export const signout = (req, res, next) => {
    try {
        res.clearCookie('access_token').status(200).json('User has been signed out');

    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {

    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to see users'));
    }

    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const users = await User.find().sort({ createdAt: sortDirection }).skip(startIndex).limit(limit);

        const usersWithoutPassword = users.map((user) => {
            const { password, ...rest } = user._doc;
            return rest;
        });

        const totalUsers = await User.countDocuments();
        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        );
        const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

        res.status(200).json({
            users: usersWithoutPassword,
            totalUsers,
            lastMonthUsers
        });

    } catch (error) {
        next(error);
    }

};

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return next(errorHandler(404, 'User not found!'));
        }
        const { password, ...rest } = user._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

export const getUsersPP = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to see users'));
    }
    try {
        const users = await User.find().select('_id profilePicture username firstName lastName');
        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

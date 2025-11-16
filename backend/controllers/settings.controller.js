import Settings from "../models/settings.model.js";
import { errorHandler } from "../utils/error.js";

export const getAllSettings = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(errorHandler(403, 'You are not allowed to view settings'));
        }

        const settings = await Settings.find({});
        res.status(200).json(settings);
    } catch (error) {
        next(error);
    }
};

export const defineTimeWarningNew = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(errorHandler(403, 'You are not allowed to manipulate'));
        }

        const updatedSetting = await Settings.findOneAndUpdate(
            { settingType: 'timeWarningNew' },
            { $set: { value: req.body.timeWarningNew } },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedSetting);
    } catch (error) {
        next(error);
    }
};

export const defineTimeBookedBefore = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(errorHandler(403, 'You are not allowed to manipulate'));
        }

        const updatedSetting = await Settings.findOneAndUpdate(
            { settingType: 'timeBookedBefore' },
            { $set: { value: req.body.timeBookedBefore } },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedSetting);
    } catch (error) {
        next(error);
    }
};

export const getTimeWarningNew = async (req, res, next) => {
    try {
        let setting = await Settings.findOne({ settingType: 'timeWarningNew' });
        res.status(200).json({ timeWarningNew: setting.value });
    } catch (error) {
        next(error);
    }
};

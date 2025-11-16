import Contact from "../models/contact.model.js";
import { errorHandler } from "../utils/error.js";

export const createContact = async (req, res, next) => {

    /*     if (!req.user) {
            return next(errorHandler(403, 'You are not allowed to send a feedback'))
        }
     */
    if (!req.body.name ||
        !req.body.surname ||
        !req.body.email ||
        !req.body.phoneNumber ||
        !req.body.message) {
        return next(errorHandler(400, 'Please provide all required fields'))
    }

    const newContact = new Contact({
        ...req.body
    });

    try {
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (error) {
        next(error);
    }
};

export const getContacts = async (req, res, next) => {

    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to the feedbacks'));
    }

    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 7;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const contacts = await Contact.find().sort({ createdAt: sortDirection }).skip(startIndex).limit(limit);

        const totalContacts = await Contact.countDocuments();
        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        );
        const lastMonthContacts = await Contact.countDocuments({ createdAt: { $gte: oneMonthAgo } });

        res.status(200).json({
            contacts,
            totalContacts,
            lastMonthContacts
        });

    } catch (error) {
        next(error);
    }

};
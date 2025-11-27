import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import routeRoutes from './routes/route.route.js';
import commentRoutes from './routes/comment.route.js';
import cookieParser from "cookie-parser";
import itineraryRoutes from './routes/itinerary.route.js';
import contactRoutes from './routes/contact.route.js';
import settingRoutes from './routes/settings.route.js';
import aiRoutes from './routes/ai.route.js';


mongoose
    .connect(process.env.MONGO)
    .then(() => {
        console.log("MongoDB is connected!");
    }).catch((err) => {
        console.log(err);
    });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/setting', settingRoutes);
app.use('/api/ai', aiRoutes);


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error!';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});
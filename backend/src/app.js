import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Request logger
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);

// Global error handler
app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export default app;
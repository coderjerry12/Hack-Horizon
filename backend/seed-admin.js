import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/models/user.models.js";

const email = process.argv[2];

if (!email) {
    console.error("❌ Usage: node seed-admin.js <email>");
    process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.error(`❌ No user found with email: ${email}`);
            process.exit(1);
        }

        if (user.role === "admin") {
            console.log(`ℹ️  ${user.username} (${email}) is already an admin`);
            process.exit(0);
        }

        user.role = "admin";
        await user.save({ validateBeforeSave: false });

        console.log(`✅ ${user.username} (${email}) has been promoted to ADMIN`);
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();

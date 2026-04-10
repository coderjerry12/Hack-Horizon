import mongoose, { Schema } from "mongoose";

const sosEventSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        hospital: {
            id: Number,
            name: String,
            address: String,
            phone: String,
            email: String,
            website: String,
            emergency: String,
            location: {
                lat: Number,
                lng: Number,
            },
        },
        routing: {
            travelTimeInMinutes: Number,
            distance: Number, // km
            note: String,
        },
        status: {
            type: String,
            enum: ["DISPATCHED", "CANCELLED", "RESOLVED"],
            default: "DISPATCHED",
        },
        emergencyContactNotified: {
            type: Boolean,
            default: false,
        },
        source: {
            type: String,
            enum: ["user", "bystander", "crash_detection", "ai_detection"],
            default: "user",
        },
        bystanderInfo: {
            phone: String,
            description: String,
        },
    },
    {
        timestamps: true,
    }
);

const SosEvent = mongoose.model("SosEvent", sosEventSchema);

export default SosEvent;

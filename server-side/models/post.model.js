const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    pickupLocation: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ["Posted", "Claimed", "Approved", "Picked Up", "Completed", "Expired"],
        default: "Posted"
    },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    claimApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);

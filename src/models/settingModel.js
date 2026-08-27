const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
    {
        storeName: {
            type: String,
            default: 'Azez Store',
            trim: true,
        },
        whatsappNumber: {
            type: String,
            required: [true, 'WhatsApp number is required'],
            trim: true,
        },
        discordInviteUrl: {
            type: String,
            trim: true,
        },
        facebookUrl: {
            type: String,
            trim: true,
        },
        announcementText: {
            type: String,
            trim: true,
        },
        isStoreOpen: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    categoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out-of-stock'],
        default: 'active'
    },
    imageUrl: {
        type: String,
        trim: true
    },
    videoUrl: {
        type: String,
        trim: true
    },
    timeToPrepare: {
        type: Number,
        required: true,
        min: 1
    },
    foodType: {
        type: String,
        enum: ['veg', 'nonveg'],
        required: true
    },
    addon: [{ type: mongoose.Schema.Types.ObjectId, ref:'addon'}],
    variation: [{ type: mongoose.Schema.Types.ObjectId, ref:'variations'}],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

MenuItemSchema.virtual('isAvailable').get(function() {
    return this.status === 'active';
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
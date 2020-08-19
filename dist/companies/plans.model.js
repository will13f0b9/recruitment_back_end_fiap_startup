"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const restSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    benefits: {
        type: [String],
        required: false,
        default: []
    }
});
exports.Plan = mongoose.model('Plan', restSchema);

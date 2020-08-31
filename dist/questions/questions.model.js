"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
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
exports.Question = mongoose.model('Question', restSchema);

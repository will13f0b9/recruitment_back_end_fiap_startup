"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const restSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cnpj: {
        type: String,
        required: true
    },
    employees: {
        type: Number,
        required: false
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    location: {
        type: String,
        required: true
    },
    lastUpdateDate: {
        type: Date,
        //ref: 'User',
        required: false,
        default: () => new Date()
    },
    registerDate: {
        type: Date,
        //ref: 'User',
        required: false,
        default: () => new Date()
    },
});
exports.Company = mongoose.model('Company', restSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const examConfigSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
});
const restSchema = new mongoose.Schema({
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    requiredSkills: {
        type: [String],
        required: true,
        default: []
    },
    desirableSkills: {
        type: [String],
        required: false,
        default: []
    },
    cadidateUsers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: false,
        default: []
    },
    usersWhoViewed: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: false,
        default: []
    },
    title: {
        type: String,
        required: true
    },
    anotherInfo: {
        type: String,
        required: false,
        maxlength: 1000
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    salary: {
        type: Number,
        required: false
    },
    hiring: {
        type: String,
        required: true,
        enum: ['PJ', 'CLT']
    },
    lastUpdateDate: {
        type: Date,
        required: false,
        default: () => new Date()
    },
    registerDate: {
        type: Date,
        required: false,
        default: () => new Date()
    },
    benefits: {
        type: [String],
        required: false
    },
    difficulty: {
        type: [String],
        required: true,
        enum: ["STAGE", "JUNIOR", "PLENO", "SENIOR", "SPECIALIST"]
    },
    done: {
        type: Boolean,
        default: false
    },
    examConfig: {
        type: [examConfigSchema],
        required: false
    },
});
exports.Job = mongoose.model('Job', restSchema);

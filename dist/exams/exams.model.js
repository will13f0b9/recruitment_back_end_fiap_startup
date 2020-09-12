"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const questionsSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Types.ObjectId,
        ref: "Question",
        required: true
    },
    answer: {
        type: String,
        required: false,
        enum: ["A", "B", "C", "D", "E"]
    },
});
const candidateControllSchema = new mongoose.Schema({
    registerDate: {
        type: Date,
        required: true
    },
    startedAt: {
        type: Date,
        required: false
    },
    doneAt: {
        type: Date
    },
    candidateId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    questions: {
        type: [questionsSchema],
        required: true
    }
});
const restSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidateControll: {
        type: [candidateControllSchema],
        required: false
    }
});
exports.Exam = mongoose.model('Exam', restSchema);

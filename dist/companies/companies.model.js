"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const environment_1 = require("../common/environment");
const restSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cnpj: {
        type: String,
        unique: true,
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
        //ref: 'company',
        required: false,
        default: () => new Date()
    },
    registerDate: {
        type: Date,
        //ref: 'company',
        required: false,
        default: () => new Date()
    },
    password: {
        type: String,
        select: false,
        required: true
    },
    email: {
        type: String,
        unique: false,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        required: false
    },
    plan: {
        type: mongoose.Types.ObjectId,
        ref: "Plan",
        required: true
    }
});
restSchema.statics.findByCnpj = function (cnpj, projection) {
    return this.findOne({ cnpj }, projection); //{email: email}
};
restSchema.methods.matches = function (password) {
    return bcrypt.compareSync(password, this.password);
};
const hashPassword = (obj, next) => {
    bcrypt.hash(obj.password, environment_1.environment.security.saltRounds)
        .then(hash => {
        obj.password = hash;
        next();
    }).catch(next);
};
const saveMiddleware = function (next) {
    const company = this;
    if (!company.isModified('password')) {
        next();
    }
    else {
        hashPassword(company, next);
    }
};
const updateMiddleware = function (next) {
    if (!this.getUpdate().password) {
        next();
    }
    else {
        hashPassword(this.getUpdate(), next);
    }
};
restSchema.pre('save', saveMiddleware);
restSchema.pre('findOneAndUpdate', updateMiddleware);
restSchema.pre('update', updateMiddleware);
exports.Company = mongoose.model('Company', restSchema);

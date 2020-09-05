"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const restify_errors_1 = require("restify-errors");
const users_model_1 = require("../users/users.model");
const environment_1 = require("../common/environment");
const companies_model_1 = require("../companies/companies.model");
exports.authenticate = (req, resp, next) => {
    console.log("AUTHENTICATE");
    const { email, password, cnpj } = req.body;
    if (email) {
        users_model_1.User.findByEmail(email, '+password') //1st
            .then(user => {
            if (user && user.matches(password)) { //2nd
                //gerar o token
                //3rd
                const token = jwt.sign({ sub: user.email, iss: 'meat-api' }, environment_1.environment.security.apiSecret);
                console.log(user);
                resp.json({ userId: user._id, name: user.name, email: user.email, profiles: user.profiles, bussinessAccount: user.companies,
                    cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token });
                return next(false);
            }
            else {
                return next(new restify_errors_1.NotAuthorizedError('Invalid Credentials'));
            }
        }).catch(next);
    }
    else if (cnpj) {
        companies_model_1.Company.findByCnpj(cnpj, "+password")
            .then(company => {
            console.log(company);
            if (company && company.matches(password)) {
                const token = jwt.sign({ sub: company.email, iss: 'meat-api' }, environment_1.environment.security.apiSecret);
                console.log(company);
                resp.json({ companyId: company._id, description: company.description, lastUpdateDate: company.lastUpdateDate,
                    location: company.location, registerDate: company.registerDate, name: company.name, email: company.email, cnpj: company.cnpj, accessToken: token });
                return next(false);
            }
            else {
                return next(new restify_errors_1.NotAuthorizedError('Invalid Credentials'));
            }
        }).catch(next);
    }
    else {
        return next(new restify_errors_1.BadRequestError('Invalid properties'));
    }
};

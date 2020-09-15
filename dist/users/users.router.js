"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const restify_errors_1 = require("restify-errors");
const users_model_1 = require("./users.model");
const auth_handler_1 = require("../security/auth.handler");
const mongoose = require("mongoose");
const fs = require("fs");
const { gzip, ungzip } = require('node-gzip');
class UsersRouter extends model_router_1.ModelRouter {
    constructor() {
        super(users_model_1.User);
        this.findByEmail = (req, resp, next) => {
            if (req.query) {
                console.log(JSON.stringify(req.query));
                users_model_1.User.find(req.query)
                    .then(user => user ? user : [])
                    .then(this.renderAll(resp, next, {
                    pageSize: this.pageSize,
                    url: req.url
                }))
                    .catch(next);
            }
            else {
                next();
            }
        };
        this.populateCompany = (req, resp, next) => {
            const document = new users_model_1.User(req.body);
            users_model_1.User.findOne({ email: document.email, profiles: document.profiles }).then(user => {
                if (user && document.companies) {
                    document.companies.forEach(company => user.companies.push(company));
                    user.save().then(user => resp.json(user)).catch(next);
                }
                else {
                    next();
                }
            }).catch(next);
        };
        this.addNewCompanyToPreviousRecruiter = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar userId na url");
                if (!req.body)
                    throw new restify_errors_1.BadRequestError("Necessário enviar um body na requisição");
                if (!req.body.companyId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar companyId no body da requisição");
                console.log(`PUSH COMPANYID=${req.body.companyId} TO USERID=${req.params.userId}`);
                users_model_1.User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.userId) }, { "$push": { "companies": req.body.companyId } }).then(next).catch(next);
                return resp.json();
            }).catch(next);
        };
        this.uploadCurriculum = (req, resp, next) => {
            // req.files.curriculum.name  | req.files.curriculum.path | req.files.curriculum.type
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na uri");
                if (!req.files)
                    throw new restify_errors_1.BadRequestError("Necessário enviar formData no corpo da requisição");
                if (!req.files.curriculum)
                    throw new restify_errors_1.BadRequestError("Necessário enviar formData com 'curriculum' de pdf do usuário no corpo da requisição");
                users_model_1.User.findById(req.params.id).then(user => {
                    if (!user)
                        throw new restify_errors_1.NotFoundError(`Usuário de id: ${req.params.id} não localizado`);
                    const fileB64 = fs.readFileSync(req.files.curriculum.path).toString("base64");
                    user.curriculum = fileB64;
                    user.save().catch(next);
                    return resp.json({ message: "Curriculum salvo com sucesso!" });
                }).catch(next);
            }).catch(next);
        };
        this.on('beforeRender', document => {
            document.password = undefined;
            //delete document.password
        });
    }
    applyRoutes(application) {
        application.get({ path: `${this.basePath}`, version: '2.0.0' }, [this.findByEmail, this.findAll]);
        application.get({ path: `${this.basePath}`, version: '1.0.0' }, [this.findAll]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.post(`${this.basePath}`, [this.populateCompany, this.save]);
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete]);
        application.post(`${this.basePath}/:id/curriculum`, [this.uploadCurriculum]);
        application.post(`${this.basePath}/:userId/companies/`, [this.addNewCompanyToPreviousRecruiter]);
        application.post(`${this.basePath}/authenticate`, auth_handler_1.authenticate);
    }
}
exports.usersRouter = new UsersRouter();

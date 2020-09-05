"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const restify_errors_1 = require("restify-errors");
const users_model_1 = require("./users.model");
const auth_handler_1 = require("../security/auth.handler");
const mongoose = require("mongoose");
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
        this.addNewCompanyToPreviousRecruiter = (req, resp, next) => {
            if (!req.params.userId)
                return new restify_errors_1.BadRequestError("Necessário enviar userId na url");
            if (!req.body)
                return new restify_errors_1.BadRequestError("Necessário enviar um body na requisição");
            if (!req.body.companyId)
                return new restify_errors_1.BadRequestError("Necessário enviar companyId no body da requisição");
            console.log(`PUSH COMPANYID=${req.body.companyId} TO USERID=${req.params.userId}`);
            users_model_1.User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.userId) }, { "$push": { "companies": req.body.companyId } }).then(next).catch(next);
            return resp.json();
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
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete]);
        application.post(`${this.basePath}/:userId/companies/`, [this.addNewCompanyToPreviousRecruiter]);
        application.post(`${this.basePath}/authenticate`, auth_handler_1.authenticate);
    }
}
exports.usersRouter = new UsersRouter();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const companies_model_1 = require("./companies.model");
const authz_handler_1 = require("../security/authz.handler");
class CompaniesRouter extends model_router_1.ModelRouter {
    constructor() {
        super(companies_model_1.Company);
        this.findByCnpj = (req, resp, next) => {
            if (req.query.cnpj) {
                console.log(`Buscando por CNPJ=${req.query.cnpj}`);
                companies_model_1.Company.findByCnpj(req.query.cnpj)
                    .then(company => company ? [company] : [])
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
    }
    applyRoutes(application) {
        application.get(`${this.basePath}`, [this.findByCnpj, this.findAll]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.delete]);
    }
}
exports.companiesRouter = new CompaniesRouter();

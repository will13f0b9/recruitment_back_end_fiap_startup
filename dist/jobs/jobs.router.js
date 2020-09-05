"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const jobs_model_1 = require("./jobs.model");
const authz_handler_1 = require("../security/authz.handler");
class JobsRouter extends model_router_1.ModelRouter {
    constructor() {
        super(jobs_model_1.Job);
        this.findAllPopulate = (req, resp, next) => {
            const x = { path: "company", select: ["name", "employees"] };
            return this.findAll(req, resp, next, x);
        };
        this.findByFilters = (req, resp, next) => {
            if (req.query) {
                console.log(JSON.stringify(req.query));
                if (req.query.requiredSkills) {
                    req.query.requiredSkills = { "$in": [req.query.requiredSkills.split(",")] };
                }
                jobs_model_1.Job.find(req.query).populate("name", "employees")
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
    }
    prepareOne(query) {
        console.log('preapre');
        return query.populate('company', 'name');
    }
    applyRoutes(application) {
        application.get(`${this.basePath}`, [this.findByFilters, this.findAllPopulate]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.delete]);
    }
}
exports.jobsRouter = new JobsRouter();

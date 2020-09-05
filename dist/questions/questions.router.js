"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const questions_model_1 = require("./questions.model");
class QuestionRouter extends model_router_1.ModelRouter {
    constructor() {
        super(questions_model_1.Question);
        this.findByFilters = (req, resp, next) => {
            if (req.query) {
                console.log(JSON.stringify(req.query));
                if (req.query.skills) {
                    req.query.skills = { "$in": req.query.skills.split(",") };
                }
                if (req.query.difficulty) {
                    req.query.difficulty = { "$in": req.query.difficulty.split(",") };
                }
                console.log(JSON.stringify(req.query));
                questions_model_1.Question.find(req.query)
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
    applyRoutes(application) {
        application.get(`${this.basePath}`, [this.findByFilters, this.findAll]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete]);
    }
}
exports.questionRouter = new QuestionRouter();

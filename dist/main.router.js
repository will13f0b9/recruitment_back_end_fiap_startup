"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./common/router");
class MainRouter extends router_1.Router {
    applyRoutes(application) {
        application.get('/', (req, resp, next) => {
            resp.json({
                version: "1.0.0",
                users: '/users',
                jobs: '/jobs',
                certifications: '/certifications',
                plans: '/plans',
                companies: "/companies",
                questions: "/questions"
            });
        });
    }
}
exports.mainRouter = new MainRouter();

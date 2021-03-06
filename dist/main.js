"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server/server");
const users_router_1 = require("./users/users.router");
const restaurants_router_1 = require("./restaurants/restaurants.router");
const reviews_router_1 = require("./reviews/reviews.router");
const main_router_1 = require("./main.router");
const plans_router_1 = require("./plans/plans.router");
const jobs_router_1 = require("./jobs/jobs.router");
const companies_router_1 = require("./companies/companies.router");
const questions_router_1 = require("./questions/questions.router");
const exams_router_1 = require("./exams/exams.router");
const server = new server_1.Server();
server.bootstrap([
    users_router_1.usersRouter,
    restaurants_router_1.restaurantsRouter,
    reviews_router_1.reviewsRouter,
    main_router_1.mainRouter,
    plans_router_1.plansRouter,
    jobs_router_1.jobsRouter,
    companies_router_1.companiesRouter,
    questions_router_1.questionRouter,
    exams_router_1.examRouter
]).then(server => {
    console.log('Server is listening on:', server.application.address());
}).catch(error => {
    console.log('Server failed to start');
    console.error(error);
    process.exit(1);
});

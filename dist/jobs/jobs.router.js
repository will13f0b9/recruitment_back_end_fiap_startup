"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const mongoose = require("mongoose");
const jobs_model_1 = require("./jobs.model");
const restify_errors_1 = require("restify-errors");
const exams_model_1 = require("../exams/exams.model");
const questions_model_1 = require("../questions/questions.model");
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
        this.pushViewed = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                return jobs_model_1.Job.updateOne({ _id: req.params.id, usersWhoViewed: { $ne: req.params.userId } }, { $push: { usersWhoViewed: mongoose.Types.ObjectId(req.params.userId) } }).then(job => {
                    if (job.nModified == 0) {
                        resp.status(400);
                        return resp.json({ message: "Usuário já vizualizou vaga" });
                    }
                    else {
                        return resp.json({ message: "Visualização adicionada com sucesso" });
                    }
                }).catch(next);
            }).catch(next);
        };
        this.candidateUser = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                const jobId = mongoose.Types.ObjectId(req.params.id);
                const userId = mongoose.Types.ObjectId(req.params.userId);
                jobs_model_1.Job.findById(jobId).then(job => {
                    if (!job)
                        throw new restify_errors_1.NotFoundError("Job não localizado");
                    return jobs_model_1.Job.updateOne({ _id: jobId, cadidateUsers: { $ne: userId } }, { $push: { cadidateUsers: userId } }).then(modified => {
                        if (modified.nModified == 0) {
                            resp.status(400);
                            return resp.json({ message: "Usuário já está candidatado à vaga" });
                        }
                        else {
                            console.log("Pode cadastrar exame??", job.examConfig && job.examConfig.length > 0);
                            if (job.examConfig && job.examConfig.length > 0) {
                                return exams_model_1.Exam.findOne({ jobId: jobId }).then((exam) => __awaiter(this, void 0, void 0, function* () {
                                    const candidateControll = { registerDate: new Date(), candidateId: userId, questions: [], startedAt: null, doneAt: null };
                                    for (let index = 0; index < job.examConfig.length; index++) {
                                        const element = job.examConfig[index];
                                        yield questions_model_1.Question.aggregate([{ $match: { skills: element.skill, difficulty: job.difficulty } }, { $sample: { size: element.quantity } }, { $project: { _id: 1 } }]).then(randomQuestion => {
                                            console.log("RANDOM IDS QUESTIONS=", randomQuestion);
                                            candidateControll.questions.push(...randomQuestion.map(f => {
                                                const question = { questionId: f._id };
                                                return question;
                                            }));
                                        }).catch(next);
                                    }
                                    console.log("CANDIDATE CONTROLL", candidateControll);
                                    if (exam) {
                                        //registerUser in exam
                                        //@ts-ignore
                                        exam.candidateControll.push(candidateControll);
                                        exam.save().then(exam => {
                                            return resp.json({ message: "Usuário candidatado com sucesso a vaga e ao exame!" });
                                        }).catch(next);
                                    }
                                    else {
                                        const exam = new exams_model_1.Exam();
                                        exam.jobId = jobId;
                                        //@ts-ignore
                                        exam.candidateControll = [candidateControll];
                                        exam.save().then(exam => {
                                            return resp.json({ message: "Usuário candidatado com sucesso a vaga e ao exame!" });
                                        }).catch(next);
                                    }
                                })).catch(next);
                            }
                            else {
                                return resp.json({ message: "Usuário candidatado com sucesso" });
                            }
                        }
                    }).catch(next);
                }).catch(next);
            }).catch(next);
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
        application.post(`${this.basePath}/:id/viewed/:userId`, [this.pushViewed]);
        application.post(`${this.basePath}/:id/candidate/:userId`, [this.candidateUser]);
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete]);
    }
}
exports.jobsRouter = new JobsRouter();

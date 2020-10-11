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
const exams_model_1 = require("./exams.model");
const authz_handler_1 = require("../security/authz.handler");
const restify_errors_1 = require("restify-errors");
const jobs_model_1 = require("../jobs/jobs.model");
class ExamRouter extends model_router_1.ModelRouter {
    constructor() {
        super(exams_model_1.Exam);
        this.findAllQuestionsOfUser = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                const jobId = mongoose.Types.ObjectId(req.params.id);
                const userId = mongoose.Types.ObjectId(req.params.userId);
                exams_model_1.Exam.findOne({ jobId: jobId, 'candidateControll.doneAt': null, 'candidateControll.candidateId': userId }).populate("candidateControll.questions.questionId", ["description", "title", "alternatives"]).then(exam => {
                    console.log("Exame then");
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Exame não localizado ou já finalizado para o usuário!");
                    exam.candidateControll = exam.candidateControll.filter(f => {
                        return f.candidateId.toString() === req.params.userId;
                    });
                    let canSaveStartedDate = false;
                    exam.candidateControll.forEach(f => {
                        if (!f.startedAt) {
                            canSaveStartedDate = true;
                            f.startedAt = new Date();
                        }
                    });
                    if (canSaveStartedDate) {
                        // exam.save().catch(next);
                    }
                    return resp.json(exam);
                }).catch(next);
            }).catch(next);
        };
        this.finishExam = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                console.log("FINISH EXAM TO USER");
                const jobId = mongoose.Types.ObjectId(req.params.id);
                const userId = mongoose.Types.ObjectId(req.params.userId);
                const forceDone = req.query.forceDone;
                exams_model_1.Exam.findOne({ jobId: jobId, 'candidateControll.candidateId': userId, 'candidateControll.doneAt': null })
                    .populate("candidateControll.questions.questionId", ["description", "title", "alternatives", "correctQuestionId"])
                    .then(exam => {
                    debugger;
                    console.log("exam", exam);
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Exame não localizado ou já finalizado para o usuário!");
                    let success = 0;
                    let error = 0;
                    let doneAt = undefined;
                    let startedAt = undefined;
                    let hitPercent = "0%";
                    exam.candidateControll.forEach(f => {
                        if (f.candidateId.toString() === req.params.userId) {
                            f.questions.forEach(q => {
                                let correctQuestion = false;
                                const question = q.questionId;
                                if (!q.answer && !forceDone)
                                    throw new restify_errors_1.BadRequestError("Faltam responder questões para finalizar o exame!");
                                if (q.answer === question.correctQuestionId) {
                                    success += 1;
                                }
                                else {
                                    error += 1;
                                }
                            });
                            let total = error + success;
                            if (total != 0) {
                                hitPercent = `${parseFloat(((100 * success) / total).toString()).toFixed(2)}%`;
                            }
                            f.totalHits = success;
                            f.totalErrors = error;
                            f.doneAt = new Date();
                            doneAt = f.doneAt;
                            startedAt = f.startedAt;
                        }
                    });
                    console.log(exam);
                    exam.save().catch(next);
                    return resp.json({ totalHits: success, totalErrors: error, doneAt: doneAt, startedAt: startedAt, hitPercent: hitPercent });
                }).catch(next);
            }).catch(next);
        };
        this.answerQuestion = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                if (!req.params.questionId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id da questão na url");
                if (!req.body)
                    throw new restify_errors_1.BadRequestError("Necessário enviar um body na requisição");
                if (!req.body.answer)
                    throw new restify_errors_1.BadRequestError("Necessário enviar answer no corpo da requisição");
                const jobId = mongoose.Types.ObjectId(req.params.id);
                const userId = mongoose.Types.ObjectId(req.params.userId);
                const questionId = mongoose.Types.ObjectId(req.params.questionId);
                exams_model_1.Exam.findOne({ jobId: jobId, 'candidateControll.candidateId': userId, 'candidateControll.doneAt': null, 'candidateControll.startedAt': { $ne: null } })
                    .then(exam => {
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Questão não localizada ou não pode ter seu resultado alterado!");
                    exam.candidateControll.forEach(f => {
                        if (f.candidateId.toString() === req.params.userId) {
                            f.questions.forEach(q => {
                                console.log("compare => ", q.questionId.toString() == req.params.questionId);
                                if (q.questionId.toString() == req.params.questionId) {
                                    console.log("ALTERANDO VALOR DA QUESTÃO");
                                    q.answer = req.body.answer;
                                }
                            });
                        }
                    });
                    console.log("SAVE");
                    exam.save().then(saved => {
                        return resp.send(204);
                    }).catch(next);
                }).catch(next);
            }).catch(next);
        };
        this.examsInfos = (req, res, next) => {
            new Promise((reslv, rjct) => {
                if (!req.params.jobId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar o jobId como parametro da url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar o userId como parametro da url");
                const jobId = req.params.jobId;
                const userId = req.params.userId;
                jobs_model_1.Job.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(jobId) } },
                    { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
                    { $project: { 'approved': 1, 'repproved': 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
                    { $sort: { exams: 1 } }
                ])
                    .then(jobs => {
                    const data = {};
                    jobs.forEach(f => {
                        data['approved'] = f.approved;
                        data['repproved'] = f.repproved;
                        f.exams.forEach(e => {
                            e.candidateControll.forEach(c => {
                                if (c.candidateId.toString() == userId.toString()) {
                                    if (c.totalErrors != null && c.totalErrors != undefined
                                        && c.totalHits != null && c.totalHits != undefined) {
                                        let total = c.totalErrors + c.totalHits;
                                        if (total == 0) {
                                            data['hitPercent'] = "0%";
                                        }
                                        else {
                                            data['hitPercent'] = `${parseFloat(((100 * c.totalHits) / total).toString()).toFixed(2)}%`;
                                        }
                                    }
                                    data['totalHits'] = c.totalHits;
                                    data['totalErrors'] = c.totalErrors;
                                    data['doneAt'] = c.doneAt;
                                    data['startedAt'] = c.startedAt;
                                }
                            });
                        });
                        console.log("DELETE");
                        delete f.exams;
                    });
                    return res.json(data);
                }).catch(next);
            }).catch(next);
        };
        this.detailsOfExamUser = (req, resp, next) => {
            new Promise((res, rejct) => {
                if (!req.params.id)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do job na url");
                if (!req.params.userId)
                    throw new restify_errors_1.BadRequestError("Necessário enviar id do usuário na url");
                console.log("DETAILS OF EXAM TO USER");
                const jobId = mongoose.Types.ObjectId(req.params.id);
                const userId = mongoose.Types.ObjectId(req.params.userId);
                exams_model_1.Exam.findOne({ jobId: jobId, 'candidateControll.candidateId': userId })
                    .populate("candidateControll.questions.questionId", ["skills", "correctQuestionId"])
                    .then((exam) => __awaiter(this, void 0, void 0, function* () {
                    console.log("exam", exam);
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Exame não localizado");
                    const job = yield jobs_model_1.Job.findById(jobId, "examConfig").lean();
                    job.examConfig.forEach(e => e.quantity = 0);
                    exam.candidateControll.forEach(f => {
                        if (f.candidateId.toString() === req.params.userId) {
                            f.questions.forEach(q => {
                                let correctQuestion = false;
                                const question = q.questionId;
                                job.examConfig.forEach(e => {
                                    if (question.skills.indexOf(e.skill) != -1) {
                                        if (!e['success']) {
                                            e['success'] = e['success'] ? e['success'] : 0;
                                        }
                                        if (!e['error']) {
                                            e['error'] = e['error'] ? e['error'] : 0;
                                        }
                                        if (q.answer === question.correctQuestionId) {
                                            e['quantity'] += 1;
                                            e['success'] += 1;
                                        }
                                        else {
                                            e['quantity'] += 1;
                                            e['error'] += 1;
                                        }
                                        let total = e['error'] + e['success'];
                                        if (total != 0 && total) {
                                            e['hitPercent'] = `${parseFloat(((100 * e['success']) / total).toString()).toFixed(2)}%`;
                                        }
                                    }
                                });
                            });
                        }
                    });
                    exam.save().catch(next);
                    return resp.json(job);
                })).catch(next);
            }).catch(next);
        };
    }
    prepareOne(query) {
        console.log('preapre');
        return query.populate('company', 'name');
    }
    applyRoutes(application) {
        application.post(`${this.basePath}/answer/jobs/:id/users/:userId/questions/:questionId`, [this.answerQuestion]);
        application.post(`${this.basePath}/done/jobs/:id/users/:userId`, [this.finishExam]);
        application.post(`${this.basePath}/start/jobs/:id/users/:userId`, [this.findAllQuestionsOfUser]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.get(`${this.basePath}/infos/jobs/:jobId/users/:userId`, [this.examsInfos]);
        application.get(`${this.basePath}/infos/details/jobs/:id/users/:userId`, [this.detailsOfExamUser]);
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.delete]);
    }
}
exports.examRouter = new ExamRouter();

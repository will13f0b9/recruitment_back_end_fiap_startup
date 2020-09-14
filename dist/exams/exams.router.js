"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_router_1 = require("../common/model-router");
const mongoose = require("mongoose");
const exams_model_1 = require("./exams.model");
const authz_handler_1 = require("../security/authz.handler");
const restify_errors_1 = require("restify-errors");
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
                exams_model_1.Exam.findOne({ jobId: jobId, 'candidateControll.startedAt': null, 'candidateControll.doneAt': null, 'candidateControll.candidateId': userId }).populate("candidateControll.questions.questionId", ["description", "title", "alternatives"]).then(exam => {
                    console.log("Exame then");
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Exame não localizado ou já iniciado para o usuário!");
                    exam.candidateControll = exam.candidateControll.filter(f => {
                        return f.candidateId.toString() === req.params.userId;
                    });
                    exam.candidateControll.forEach(f => {
                        f.startedAt = new Date();
                    });
                    exam.save().catch(next);
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
                    console.log("exam", exam);
                    if (!exam)
                        throw new restify_errors_1.NotFoundError("Exame não localizado ou já finalizado para o usuário!");
                    let success = 0;
                    let error = 0;
                    exam.candidateControll = exam.candidateControll.filter(f => {
                        return f.candidateId.toString() === req.params.userId;
                    });
                    exam.candidateControll.forEach(f => {
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
                        f.totalHits = success;
                        f.totalErrors = error;
                        f.doneAt = new Date();
                    });
                    exam.save().catch(next);
                    return resp.json({ totalHits: success, totalErrors: error });
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
                    exam.candidateControll = exam.candidateControll.filter(f => {
                        return f.candidateId.toString() === req.params.userId;
                    });
                    exam.candidateControll.forEach(f => {
                        f.questions.forEach(q => {
                            console.log("compare => ", q.questionId.toString() == req.params.questionId);
                            if (q.questionId.toString() == req.params.questionId) {
                                console.log("ALTERANDO VALOR DA QUESTÃO");
                                q.answer = req.body.answer;
                            }
                        });
                    });
                    console.log("SAVE");
                    exam.save().then(saved => {
                        return resp.send(204);
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
        application.post(`${this.basePath}/answer/jobs/:id/users/:userId/questions/:questionId`, [this.answerQuestion]);
        application.post(`${this.basePath}/done/jobs/:id/users/:userId`, [this.finishExam]);
        application.post(`${this.basePath}/start/jobs/:id/users/:userId`, [this.findAllQuestionsOfUser]);
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById]);
        application.post(`${this.basePath}`, [this.save]);
        application.put(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.replace]);
        application.patch(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.update]);
        application.del(`${this.basePath}/:id`, [authz_handler_1.authorize('admin'), this.validateId, this.delete]);
    }
}
exports.examRouter = new ExamRouter();

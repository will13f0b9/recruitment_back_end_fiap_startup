import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'
import { QueryPopulateOptions } from 'mongoose'
import { Exam } from './exams.model'
import { authorize } from '../security/authz.handler'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { Question } from '../questions/questions.model'
import { Job } from '../jobs/jobs.model'

class ExamRouter extends ModelRouter<Exam> {
  constructor() {
    super(Exam)
  }

  protected prepareOne(query: mongoose.DocumentQuery<Exam, Exam>): mongoose.DocumentQuery<Exam, Exam> {
    console.log('preapre')
    return query.populate('company', 'name')
  }

  findAllQuestionsOfUser = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do job na url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar id do usuário na url");

      const jobId = mongoose.Types.ObjectId(req.params.id);
      const userId = mongoose.Types.ObjectId(req.params.userId);

      Exam.findOne({ jobId: jobId, 'candidateControll.doneAt': null, 'candidateControll.candidateId': userId }).populate("candidateControll.questions.questionId", ["description", "title", "alternatives"]).then(exam => {
        console.log("Exame then")
        if (!exam) throw new NotFoundError("Exame não localizado ou já finalizado para o usuário!");
        exam.candidateControll = exam.candidateControll.filter(f => {
          return f.candidateId.toString() === req.params.userId;
        });
        let canSaveStartedDate = false;
        exam.candidateControll.forEach(f => {
          if (!f.startedAt) {
            canSaveStartedDate = true;
            f.startedAt = new Date();
          }
        })
        if (canSaveStartedDate) {
          exam.save().catch(next);
        }
        return resp.json(exam);
      }).catch(next);
    }).catch(next);
  }


  finishExam = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do job na url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar id do usuário na url");
      console.log("FINISH EXAM TO USER")
      const jobId = mongoose.Types.ObjectId(req.params.id);
      const userId = mongoose.Types.ObjectId(req.params.userId);
      const forceDone = req.query.forceDone


      Exam.findOne({ jobId: jobId, 'candidateControll.candidateId': userId, 'candidateControll.doneAt': null })
        .populate("candidateControll.questions.questionId", ["description", "title", "alternatives", "correctQuestionId"])
        .then(exam => {
          console.log("exam", exam);
          if (!exam) throw new NotFoundError("Exame não localizado ou já finalizado para o usuário!");
          let success = 0;
          let error = 0;
          exam.candidateControll = exam.candidateControll.filter(f => {
            return f.candidateId.toString() === req.params.userId;
          });
          let doneAt = undefined;
          let startedAt = undefined;
          let hitPercent = "0%";
          exam.candidateControll.forEach(f => {

            f.questions.forEach(q => {
              let correctQuestion = false;
              const question = <Question>q.questionId;
              if (!q.answer && !forceDone) throw new BadRequestError("Faltam responder questões para finalizar o exame!");
              if (q.answer === question.correctQuestionId) {
                success += 1;
              } else {
                error += 1;
              }
            })


            let total = error + success;
            if (total != 0) {
              hitPercent = `${parseFloat(((100 * success) / total).toString()).toFixed(2)}%`
            }

            f.totalHits = success;
            f.totalErrors = error;
            f.doneAt = new Date();
            doneAt = f.doneAt;
            startedAt = f.startedAt;
          })

          exam.save().catch(next);
          return resp.json({ totalHits: success, totalErrors: error, doneAt: doneAt, startedAt: startedAt, hitPercent: hitPercent });
        }).catch(next);
    }).catch(next);
  }

  answerQuestion = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do job na url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar id do usuário na url");
      if (!req.params.questionId) throw new BadRequestError("Necessário enviar id da questão na url");
      if (!req.body) throw new BadRequestError("Necessário enviar um body na requisição");
      if (!req.body.answer) throw new BadRequestError("Necessário enviar answer no corpo da requisição");

      const jobId = mongoose.Types.ObjectId(req.params.id);
      const userId = mongoose.Types.ObjectId(req.params.userId);
      const questionId = mongoose.Types.ObjectId(req.params.questionId);

      Exam.findOne(
        { jobId: jobId, 'candidateControll.candidateId': userId, 'candidateControll.doneAt': null, 'candidateControll.startedAt': { $ne: null } })
        .then(exam => {
          if (!exam) throw new NotFoundError("Questão não localizada ou não pode ter seu resultado alterado!");
          exam.candidateControll = exam.candidateControll.filter(f => {
            return f.candidateId.toString() === req.params.userId;
          });
          exam.candidateControll.forEach(f => {
            f.questions.forEach(q => {
              console.log("compare => ", q.questionId.toString() == req.params.questionId)
              if (q.questionId.toString() == req.params.questionId) {
                console.log("ALTERANDO VALOR DA QUESTÃO")
                q.answer = req.body.answer;
              }
            })
          })
          console.log("SAVE");
          exam.save().then(saved => {
            return resp.send(204);
          }).catch(next);
        }).catch(next);
    }).catch(next);
  }


  examsInfos = (req, res, next) => {
    new Promise((reslv, rjct) => {
      if (!req.params.jobId) throw new BadRequestError("Necessário enviar o jobId como parametro da url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar o userId como parametro da url");

      const jobId = req.params.jobId;
      const userId = req.params.userId;

      Job.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(jobId) } },
        { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
        { $project: { 'approved': 1, 'repproved': 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
        { $sort: { exams: 1 } }
      ])
        .then(jobs => {
          const data = {}
          jobs.forEach(f => {
            data['approved'] = f.approved;
            data['repproved'] = f.repproved;
              f.exams.forEach(e => {
                e.candidateControll.forEach(c => {
                  if (c.candidateId.toString() == userId.toString()) {
                    if(c.totalErrors != null && c.totalErrors != undefined 
                      && c.totalHits != null && c.totalHits != undefined 
                      ){
                        let total = c.totalErrors + c.totalHits
                        if(total == 0){
                          data['hitPercent'] = "0%";
                        }else{
                          data['hitPercent'] = `${parseFloat(((100 * c.totalHits) / total).toString()).toFixed(2)}%`
                        }
                    }
                  
                    data['totalHits'] = c.totalHits;
                    data['totalErrors'] = c.totalErrors;
                    data['doneAt'] = c.doneAt
                    data['startedAt'] = c.startedAt
                  }
                })
              })
            console.log("DELETE")
            delete f.exams
          })

          return res.json(data);
        }).catch(next);
    }).catch(next);
  }

  applyRoutes(application: restify.Server) {
    application.post(`${this.basePath}/answer/jobs/:id/users/:userId/questions/:questionId`, [this.answerQuestion])
    application.post(`${this.basePath}/done/jobs/:id/users/:userId`, [this.finishExam])
    application.post(`${this.basePath}/start/jobs/:id/users/:userId`, [this.findAllQuestionsOfUser])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.get(`${this.basePath}/infos/jobs/:jobId/users/:userId`, [this.examsInfos])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.replace])
    application.patch(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.update])
    application.del(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.delete])
  }

}

export const examRouter = new ExamRouter()

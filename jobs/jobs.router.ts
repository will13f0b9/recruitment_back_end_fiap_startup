import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'
import { QueryPopulateOptions } from 'mongoose'
import { Job } from './jobs.model'
import { authorize } from '../security/authz.handler'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { Exam, CandidateControll } from '../exams/exams.model'
import { Question } from '../questions/questions.model'

class JobsRouter extends ModelRouter<Job> {
  constructor() {
    super(Job)
  }

  protected prepareOne(query: mongoose.DocumentQuery<Job, Job>): mongoose.DocumentQuery<Job, Job> {
    console.log('preapre')
    return query.populate('company', 'name description')
  }

  findAllPopulate = (req, resp, next) => {
    const x = { path: "company", select: ["name", "employees"] };
    return this.findAll(req, resp, next, x);
  }


  findByFilters = (req, resp, next) => {
    if (req.query) {
      console.log(JSON.stringify(req.query))
      if (req.query.requiredSkills) {
        req.query.requiredSkills = { "$in": [req.query.requiredSkills.split(",")] }
      }
      Job.find(req.query).populate("name", "employees")
        .then(user => user ? user : [])
        .then(this.renderAll(resp, next, {
          pageSize: this.pageSize,
          url: req.url
        }))
        .catch(next)
    } else {
      next()
    }
  }

  pushViewed = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do job na url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar id do usuário na url");

      return Job.updateOne({ _id: req.params.id, usersWhoViewed: { $ne: req.params.userId } }, { $push: { usersWhoViewed: mongoose.Types.ObjectId(req.params.userId) } }).then(job => {
        if (job.nModified == 0) {
          resp.status(400)
          return resp.json({ message: "Usuário já vizualizou vaga" })
        } else {
          return resp.json({ message: "Visualização adicionada com sucesso" })
        }
      }).catch(next);
    }).catch(next);
  }

  candidateUser = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do job na url");
      if (!req.params.userId) throw new BadRequestError("Necessário enviar id do usuário na url");

      const jobId = mongoose.Types.ObjectId(req.params.id);
      const userId = mongoose.Types.ObjectId(req.params.userId);
      Job.findById(jobId).then(job => {
        if (!job) throw new NotFoundError("Job não localizado");
        return Job.updateOne({ _id: jobId, cadidateUsers: { $ne: userId } }, { $push: { cadidateUsers: userId } }).then(modified => {
          if (modified.nModified == 0) {
            resp.status(400)
            return resp.json({ message: "Usuário já está candidatado à vaga" })
          } else {
            console.log("Pode cadastrar exame??", job.examConfig && job.examConfig.length > 0);
            if (job.examConfig && job.examConfig.length > 0) {
              return Exam.findOne({ jobId: jobId }).then(async exam => {
                const candidateControll = { registerDate: new Date(), candidateId: userId, questions: [], startedAt: null, doneAt: null };

                for (let index = 0; index < job.examConfig.length; index++) {
                  const element = job.examConfig[index];
                  await Question.aggregate([{ $match: { skills: element.skill, difficulty: job.difficulty } }, { $sample: { size: element.quantity } }, { $project: { _id: 1 } }]).then(randomQuestion => {
                    console.log("RANDOM IDS QUESTIONS=", randomQuestion);
                    candidateControll.questions.push(...randomQuestion.map(f => {
                      const question = { questionId: f._id };
                      return question;
                    }));
                  }).catch(next);
                }
                console.log("CANDIDATE CONTROLL", candidateControll)
                if (exam) {
                  //registerUser in exam
                  //@ts-ignore
                  exam.candidateControll.push(candidateControll);
                  exam.save().then(exam => {
                    return resp.json({ message: "Usuário candidatado com sucesso a vaga e ao exame!" })
                  }).catch(next);
                } else {
                  const exam = new Exam();
                  exam.jobId = jobId;
                  //@ts-ignore
                  exam.candidateControll = [candidateControll];
                  exam.save().then(exam => {
                    return resp.json({ message: "Usuário candidatado com sucesso a vaga e ao exame!" })
                  }).catch(next);
                }
              }).catch(next);
            } else {
              return resp.json({ message: "Usuário candidatado com sucesso" })
            }
          }
        }).catch(next);
      }).catch(next);
    }).catch(next);
  }


  dashInfoForRecruiter = (req, resp, next) => {
    new Promise((rslve, rjct) => {
      if (!req.params) throw new BadRequestError("Necessário enviar parametros na url requisição")
      if (!req.params.companyId) throw new BadRequestError("Necessário enviar companyId como parametro na url requisição")
      const companyId = req.params.companyId;
      console.log(companyId)
      Job.aggregate([
        { $match: { "company": mongoose.Types.ObjectId(companyId) } },
        { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
        { $project: { usersWhoViewed: 1, done: 1, cadidateUsers: 1, 'hiring': 1, title: 1, salary: 1, requiredSkills: 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
        { $sort: { cadidateUsers: 1 } }
      ])
        .then(jobs => {
          const data = {
            dashInfo: { totalJobs: jobs.length }
          }
          console.log(jobs);
          jobs.forEach(f => {
            let candidateDoneExams = 0
            f.exams.forEach(e => {
              const exam = {}
              console.log("BEFORE FOREACH")
              e.candidateControll.forEach(c => {
                console.log("CANDIDATE FOR EC")
                if (c.doneAt) {
                  candidateDoneExams++;
                }
              })
            })
            f['candidateDoneExam'] = candidateDoneExams;
            f['usersWhoViewed'] = f.usersWhoViewed.length;
            f['cadidateUsers'] = f.cadidateUsers.length;
            delete f.exams
          })

          data.dashInfo['jobs'] = jobs;

          resp.json(data);
        }).catch(next);

    }).catch(next);
  }

  applyRoutes(application: restify.Server) {
    application.get(`${this.basePath}`, [this.findByFilters, this.findAllPopulate])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.post(`${this.basePath}/:id/viewed/:userId`, [this.pushViewed])
    application.post(`${this.basePath}/:id/candidate/:userId`, [this.candidateUser])
    application.put(`${this.basePath}/:id`, [this.validateId, this.replace])
    application.patch(`${this.basePath}/:id`, [this.validateId, this.update])
    application.del(`${this.basePath}/:id`, [this.validateId, this.delete])
    application.get(`${this.basePath}/company/:companyId`, [this.dashInfoForRecruiter])
  }

}

export const jobsRouter = new JobsRouter()

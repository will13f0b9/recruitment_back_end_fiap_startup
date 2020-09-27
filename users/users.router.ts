import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, BadRequestError } from 'restify-errors'
import { User } from './users.model'
import { authenticate } from '../security/auth.handler'
import { authorize } from '../security/authz.handler'
import * as mongoose from 'mongoose'
import * as fs from 'fs';
import { jobsRouter } from '../jobs/jobs.router'
import { Job } from '../jobs/jobs.model'
const { gzip, ungzip } = require('node-gzip');


class UsersRouter extends ModelRouter<User> {

  constructor() {
    super(User)
    this.on('beforeRender', document => {
      document.password = undefined
      //delete document.password
    })
  }

  findByEmail = (req, resp, next) => {
    if (req.query) {
      console.log(JSON.stringify(req.query))
      User.find(req.query)
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

  populateCompany = (req, resp, next) => {
    const document = new User(req.body)
    User.findOne({ email: document.email, profiles: document.profiles }).then(user => {
      if (user && document.companies) {
        document.companies.forEach(company => user.companies.push(company));
        user.save().then(user => resp.json(user)).catch(next);
      } else {
        next();
      }
    }).catch(next);
  }

  addNewCompanyToPreviousRecruiter = (req, resp, next) => {
    new Promise((res, rejct) => {
      if (!req.params.userId) throw new BadRequestError("Necessário enviar userId na url");
      if (!req.body) throw new BadRequestError("Necessário enviar um body na requisição");
      if (!req.body.companyId) throw new BadRequestError("Necessário enviar companyId no body da requisição");
      console.log(`PUSH COMPANYID=${req.body.companyId} TO USERID=${req.params.userId}`)
      User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.userId) }, { "$push": { "companies": req.body.companyId} }).then(next).catch(next);
      return resp.json()
    }).catch(next);
  }

  uploadCurriculum = (req, resp, next) => {
    // req.files.curriculum.name  | req.files.curriculum.path | req.files.curriculum.type
    new Promise((res, rejct) => {
      if (!req.params.id) throw new BadRequestError("Necessário enviar id do usuário na uri")
      if (!req.files) throw new BadRequestError("Necessário enviar formData no corpo da requisição")
      if (!req.files.curriculum) throw new BadRequestError("Necessário enviar formData com 'curriculum' de pdf do usuário no corpo da requisição")
      User.findById(req.params.id).then(user => {
        if (!user) throw new NotFoundError(`Usuário de id: ${req.params.id} não localizado`);
        const fileB64 = fs.readFileSync(req.files.curriculum.path).toString("base64");
        user.curriculum = fileB64;
        user.save().catch(next);
        return resp.json({ message: "Curriculum salvo com sucesso!" });
      }).catch(next)
    }).catch(next);
  }

  findByCompanyId = (req, resp, next) => {
    if (req.params && req.params.companyId) {
      console.log('COMPANIE')
      User.find({ 'companies': req.params.companyId }).lean()
        .then(user => user ? user : [])
        .then(async users => {
          console.log('COMPANIES USERS', users.length)
          for (const user of users) {
            const totalJobs = await Job.find({ owner: user._id })
            console.log(totalJobs.length);
            user['totalJobsPublished'] = totalJobs.length;
            user['totalJobsActived'] = 0;
            console.log(user)
            totalJobs.forEach(j => {
              if (!j.done) {
                user['totalJobsActived'] += 1
              }
            })
          }
          console.log(users)
          return resp.json(users)
        })
        .catch(next)
    } else {
      next()
    }
  }

  applyRoutes(application: restify.Server) {

    application.get({ path: `${this.basePath}`, version: '2.0.0' }, [this.findByEmail, this.findAll])
    application.get({ path: `${this.basePath}`, version: '1.0.0' }, [this.findAll])
    application.get({ path: `${this.basePath}/companies/:companyId` }, [this.findByCompanyId])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.populateCompany, this.save])
    application.put(`${this.basePath}/:id`, [this.validateId, this.replace])
    application.patch(`${this.basePath}/:id`, [this.validateId, this.update])
    application.del(`${this.basePath}/:id`, [this.validateId, this.delete])
    application.post(`${this.basePath}/:id/curriculum`, [this.uploadCurriculum])

    application.post(`${this.basePath}/:userId/companies/`, [this.addNewCompanyToPreviousRecruiter])

    application.post(`${this.basePath}/authenticate`, authenticate)
  }
}

export const usersRouter = new UsersRouter()

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
import { Company } from '../companies/companies.model'
const { gzip, ungzip } = require('node-gzip');
const nodemailer = require("nodemailer");


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
      User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.userId) }, { "$push": { "companies": req.body.companyId } }).then(next).catch(next);
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
      User.find({ 'companies': req.params.companyId }, { curriculum: 0 }).lean()
        .then(user => user ? user : [])
        .then(async users => {
          console.log('COMPANIES USERS', users.length)
          for (const user of users) {
            const totalJobs = await Job.find({ owner: user._id, company: req.params.companyId })
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

  resetPassword = async (req, resp, next) => {
    return new Promise(async (rslv, rjectd) => {
      try {

        if (!req.query.email) throw new BadRequestError("Necessário enviar email como queryString da url")
        if (req.query.isCompany == undefined) throw new BadRequestError("Necessário enviar isCompany como queryString da url")

        let user;
        console.log(req.query)
        if (req.query.isCompany == "true") {
          console.log('Company')
          user = await Company.findOne({ email: req.query.email }, { name: 1, email: 1, password: 1 }).catch(next);
        } else {
          console.log('User')
          user = await User.findOne({ email: req.query.email }, { name: 1, email: 1, password: 1 }).catch(next);
        }
        console.log(user);
        if (!user) throw new NotFoundError("Conta do e-mail informado não encontrado!");

        const newPassword = `${mongoose.Types.ObjectId()}${new Date().getTime()}`;

        console.log("NEW PASSWORD ", newPassword);

        user.password = newPassword;
        await user.save().catch(next);

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'vagacerta.noreply@gmail.com', // generated ethereal user
            pass: '5f822af35a50c9a9ef21c5d9', // generated ethereal password
          }
        });

        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: 'vagacerta.noreply@gmail.com', // sender address
          to: user.email, // list of receivers
          subject: "Recuperação de senha ✔", // Subject line
          html: `
              <div>Olá <strong>${user.name}</strong>!</div>
              Redefinimos sua senha no vaga certa.<br>
              Sua <strong>nova senha</strong> é: <h4>${newPassword}</h4>
              <small style='color: grey;'>Equipe Vaga Certa.<br>Vaga Certa © 2020 - Todos os Direitos Reservados.</small>
          `, // html body
        }).catch(next);

        console.log("Message sent", info);
        resp.json({ message: "Enviado e-mail com a nova senha" })
        return rslv();
      } catch (e) {
        return next(e);
      }
    }).catch(next);
  }

  dashInfo = (req, resp, next) => {
    if (!req.params.id) throw new BadRequestError("Necessário enviar id como param da url");
    const id = req.params.id;
    User.findById(id, '+password').populate('companies', 'name description', Company)
      .then(user => {
        if (!user) throw new NotFoundError("Usúario não encontrado");

        Job.aggregate([
          { $match: { "cadidateUsers": user._id } },
          { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
          { $project: { approved: 1, repproved: 1, title: 1, salary: 1, requiredSkills: 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
          { $sort: { exams: 1 } }
        ])
          .then(jobs => {
            const qntdVagas = jobs.length
            const data = {
              userInfo: {
                userId: user._id, name: user.name, email: user.email, profiles: user.profiles, curriculum: user.curriculum ? true : false,
                cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description
              },
              dashInfo: { totalJobsSubscribe: qntdVagas }
            }

            console.log("QNTD VAGAS", qntdVagas)
            jobs.forEach(f => {
              let hitAmountPercent = 0
              f.exams.forEach(e => {
                const exam = {}
                const filtered = e.candidateControll.filter(element => {
                  console.log(element)
                  return element.candidateId.toString() === user._id.toString()
                })
                console.log("BEFORE FOREACH")
                filtered.forEach(c => {
                  console.log("CANDIDATE FOR EC")

                  if (c.totalErrors != null && c.totalErrors != undefined
                    && c.totalHits != null && c.totalHits != undefined
                  ) {
                    let total = c.totalErrors + c.totalHits
                    if (total == 0) {
                      exam['hitPercent'] = undefined;
                    } else {
                      console.log("before calculate")
                      exam['hitPercent'] = `${parseFloat(((100 * c.totalHits) / total).toString()).toFixed(2)}%`
                    }
                  }
                  console.log("after calculate")

                  exam['doneAt'] = c.doneAt
                  exam['startedAt'] = c.startedAt
                  console.log("after candidate for ec")
                })
                f['exam'] = exam
              })
              console.log(f.approved);
              console.log(user._id);
              f['approved'] = f.approved && f.approved.filter(d => d.toString() == user._id.toString()).length > 0 ? true : false;
              f['repproved'] = f.repproved && f.repproved.filter(d => d.toString() == user._id.toString()).length > 0 ? true : false;
              console.log("DELETE")
              delete f.exams
            })
            data.dashInfo['jobs'] = jobs
            resp.json(data)
          }).catch(next)

      }).catch(next);
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
    application.post(`${this.basePath}/reset/password`, [this.resetPassword])

    application.post(`${this.basePath}/:userId/companies/`, [this.addNewCompanyToPreviousRecruiter])

    application.post(`${this.basePath}/authenticate`, authenticate)

    application.get(`${this.basePath}/dashInfo/:id`, [this.dashInfo])
  }
}

export const usersRouter = new UsersRouter()

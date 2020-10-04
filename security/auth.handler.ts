import * as restify from 'restify'
import * as jwt from 'jsonwebtoken'
import { NotAuthorizedError, BadRequestError, ForbiddenError } from 'restify-errors'
import { User } from '../users/users.model'
import { environment } from '../common/environment'
import { Company } from '../companies/companies.model'
import { Job } from '../jobs/jobs.model'
import * as mongoose from 'mongoose'

// const prepareOne = (query: mongoose.DocumentQuery<User, User>): mongoose.DocumentQuery<User, User> => {
//   console.log('preapre')
//   return query.populate('company', 'name description')
// }

export const authenticate: restify.RequestHandler = (req, resp, next) => {
  console.log("AUTHENTICATE");
  const { email, password, cnpj } = req.body
  if (email) {
    User.findOne({ email }, '+password').populate('companies', 'name description', Company) //1st
      .then(user => {
        if (user && user.matches(password)) { //2nd

          console.log("=================================================  USER ")
          const token = jwt.sign({ sub: user.email, iss: 'meat-api' },
            environment.security.apiSecret)
          if (!user.blocked) {
            if (user.profiles.indexOf("CANDIDATE") != -1) {
              candidateInfos(user, token, resp, next)
            } else {
              recruiterInfos(resp, user, token, next)
            }
          } else {
            return next(new ForbiddenError('Usuário bloqueado'))
          }

          return next(false)
        } else {
          return next(new NotAuthorizedError('Crendênciais inválidas'))
        }
      }).catch(next)
  } else if (cnpj) {
    Company.findByCnpj(cnpj, "+password")
      .then(company => {
        console.log("=================================================  COMPANY")
        console.log(company);
        if (company && company.matches(password)) {
          const token = jwt.sign({ sub: company.email, iss: 'meat-api' }, environment.security.apiSecret)
          console.log(company);
          resp.json({
            plan: company.plan,
            companyId: company._id, description: company.description, lastUpdateDate: company.lastUpdateDate,
            location: company.location, registerDate: company.registerDate, name: company.name, email: company.email, cnpj: company.cnpj, accessToken: token
          })
          return next(false)
        } else {
          return next(new NotAuthorizedError('Crendênciais inválidas'))
        }
      }).catch(next)
  } else {
    return next(new BadRequestError('Dados inválidos'))
  }
}
function recruiterInfos(resp: restify.Response, user: User, token: string, next: restify.Next) {
  console.log('RECRUITER')
  const userInfo = {
    userInfo: {
      companies: user.companies,
      userId: user._id, name: user.name, email: user.email, profiles: user.profiles, curriculum: user.curriculum ? true : false,
      cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token,
    }
  }
  return resp.json(userInfo);



  // Job.aggregate([
  //   { $match: { "company": companiId } },
  //   { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
  //   { $project: { usersWhoViewed: 1, done: 1, cadidateUsers: 1, 'hiring': 1, title: 1, salary: 1, requiredSkills: 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
  //   { $sort: { cadidateUsers: 1 } }
  // ])
  //   .then(jobs => {
  //     const data = {
  //       userInfo: {
  //         userId: user._id, name: user.name, email: user.email, profiles: user.profiles, bussinessAccount: user.companies,
  //         cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token,
  //       },
  //       dashInfo: { totalJobs: jobs.length }
  //     }
  //     jobs.forEach(f => {
  //       let candidateDoneExams = 0
  //       f.exams.forEach(e => {
  //         const exam = {}
  //         console.log("BEFORE FOREACH")
  //         e.candidateControll.forEach(c => {
  //           console.log("CANDIDATE FOR EC")
  //           if (c.doneAt) {
  //             candidateDoneExams++;
  //           }
  //         })
  //       })
  //       f['candidateDoneExam'] = candidateDoneExams;
  //       f['usersWhoViewed'] = f.usersWhoViewed.length;
  //       f['cadidateUsers'] = f.cadidateUsers.length;
  //       delete f.exams
  //     })

  //     data.dashInfo['jobs'] = jobs;

  //     resp.json(data);
  //   }).catch(next);
}

function candidateInfos(user: User, token: string, resp: restify.Response, next: restify.Next) {
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
          cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token,
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

            if(c.totalErrors != null && c.totalErrors != undefined 
              && c.totalHits != null && c.totalHits != undefined 
              ){
                let total = c.totalErrors + c.totalHits
                if(total == 0){
                  exam['hitPercent'] = undefined;
                }else{
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
}


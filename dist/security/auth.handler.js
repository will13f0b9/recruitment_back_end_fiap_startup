"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const restify_errors_1 = require("restify-errors");
const users_model_1 = require("../users/users.model");
const environment_1 = require("../common/environment");
const companies_model_1 = require("../companies/companies.model");
const jobs_model_1 = require("../jobs/jobs.model");
// const prepareOne = (query: mongoose.DocumentQuery<User, User>): mongoose.DocumentQuery<User, User> => {
//   console.log('preapre')
//   return query.populate('company', 'name description')
// }
exports.authenticate = (req, resp, next) => {
    console.log("AUTHENTICATE");
    const { email, password, cnpj } = req.body;
    if (email) {
        users_model_1.User.findOne({ email }, '+password').populate('companies', 'name description', companies_model_1.Company) //1st
            .then(user => {
            if (user && user.matches(password)) { //2nd
                console.log("=================================================  USER ");
                const token = jwt.sign({ sub: user.email, iss: 'meat-api' }, environment_1.environment.security.apiSecret);
                if (!user.blocked) {
                    if (user.profiles.indexOf("CANDIDATE") != -1) {
                        candidateInfos(user, token, resp, next);
                    }
                    else {
                        recruiterInfos(resp, user, token, next);
                    }
                }
                else {
                    return next(new restify_errors_1.ForbiddenError('Usuário bloqueado'));
                }
                return next(false);
            }
            else {
                return next(new restify_errors_1.NotAuthorizedError('Crendênciais inválidas'));
            }
        }).catch(next);
    }
    else if (cnpj) {
        companies_model_1.Company.findByCnpj(cnpj, "+password")
            .then(company => {
            console.log("=================================================  COMPANY");
            console.log(company);
            if (company && company.matches(password)) {
                const token = jwt.sign({ sub: company.email, iss: 'meat-api' }, environment_1.environment.security.apiSecret);
                console.log(company);
                resp.json({
                    plan: company.plan,
                    companyId: company._id, description: company.description, lastUpdateDate: company.lastUpdateDate,
                    location: company.location, registerDate: company.registerDate, name: company.name, email: company.email, cnpj: company.cnpj, accessToken: token
                });
                return next(false);
            }
            else {
                return next(new restify_errors_1.NotAuthorizedError('Crendênciais inválidas'));
            }
        }).catch(next);
    }
    else {
        return next(new restify_errors_1.BadRequestError('Dados inválidos'));
    }
};
function recruiterInfos(resp, user, token, next) {
    console.log('RECRUITER');
    const userInfo = {
        userInfo: {
            companies: user.companies,
            userId: user._id, name: user.name, email: user.email, profiles: user.profiles, curriculum: user.curriculum ? true : false,
            cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token,
        }
    };
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
function candidateInfos(user, token, resp, next) {
    jobs_model_1.Job.aggregate([
        { $match: { "cadidateUsers": user._id } },
        { $lookup: { from: "exams", as: "exams", localField: "_id", foreignField: "jobId" } },
        { $project: { approved: 1, repproved: 1, title: 1, salary: 1, requiredSkills: 1, 'exams.candidateControll.doneAt': 1, 'exams.candidateControll.startedAt': 1, 'exams.candidateControll.totalErrors': 1, 'exams.candidateControll.candidateId': 1, 'exams.candidateControll.totalHits': 1 } },
        { $sort: { exams: 1 } }
    ])
        .then(jobs => {
        const qntdVagas = jobs.length;
        const data = {
            userInfo: {
                userId: user._id, name: user.name, email: user.email, profiles: user.profiles, curriculum: user.curriculum ? true : false,
                cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token,
            },
            dashInfo: { totalJobsSubscribe: qntdVagas }
        };
        console.log("QNTD VAGAS", qntdVagas);
        jobs.forEach(f => {
            let hitAmountPercent = 0;
            f.exams.forEach(e => {
                const exam = {};
                const filtered = e.candidateControll.filter(element => {
                    console.log(element);
                    return element.candidateId.toString() === user._id.toString();
                });
                console.log("BEFORE FOREACH");
                filtered.forEach(c => {
                    console.log("CANDIDATE FOR EC");
                    let total = c.totalErrors + c.totalHits;
                    exam['hitPercent'] = `${parseFloat(((100 * c.totalHits) / total).toString()).toFixed(2)}%`;
                    exam['doneAt'] = c.doneAt;
                    exam['startedAt'] = c.startedAt;
                });
                f['exam'] = exam;
            });
            console.log(f.approved);
            console.log(user._id);
            console.log();
            f['approved'] = f.approved.filter(d => d.toString() == user._id.toString()).length > 0 ? true : false;
            f['repproved'] = f.repproved.filter(d => d.toString() == user._id.toString()).length > 0 ? true : false;
            console.log("DELETE");
            delete f.exams;
        });
        data.dashInfo['jobs'] = jobs;
        resp.json(data);
    }).catch(next);
}

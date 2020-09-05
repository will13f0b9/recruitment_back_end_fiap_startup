import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import {NotFoundError, BadRequestError} from 'restify-errors'
import {User} from './users.model'
import {authenticate} from '../security/auth.handler'
import {authorize} from '../security/authz.handler'
import * as mongoose from 'mongoose'


class UsersRouter extends ModelRouter<User> {

  constructor(){
    super(User)
    this.on('beforeRender', document=>{
      document.password = undefined
      //delete document.password
    })
  }

  findByEmail = (req, resp, next)=>{
    if(req.query.email){
      User.findByEmail(req.query.email)
          .then(user => user ? [user] : [])
          .then(this.renderAll(resp, next, {
                pageSize: this.pageSize,
                url: req.url
              }))
          .catch(next)
    }else{
      next()
    }
  }

  addNewCompanyToPreviousRecruiter = (req, resp, next) =>{
    if(!req.params.userId) return new BadRequestError("Necessário enviar userId na url");
    if(!req.body) return new BadRequestError("Necessário enviar um body na requisição");
    if(!req.body.companyId) return new BadRequestError("Necessário enviar companyId no body da requisição");
    console.log(`PUSH COMPANYID=${req.body.companyId} TO USERID=${req.params.userId}`)
    User.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.params.userId)}, {"$push": {"companies": req.body.companyId}}).then(next).catch(next);
    return resp.json()
  }

  applyRoutes(application: restify.Server){

    application.get({path:`${this.basePath}`, version: '2.0.0'}, [this.findByEmail,this.findAll])
    application.get({path:`${this.basePath}`, version: '1.0.0'}, [this.findAll])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [  this.validateId,this.replace])
    application.patch(`${this.basePath}/:id`, [this.validateId,this.update])
    application.del(`${this.basePath}/:id`, [this.validateId,this.delete])

    application.post(`${this.basePath}/:userId/companies/`, [this.addNewCompanyToPreviousRecruiter])

    application.post(`${this.basePath}/authenticate`, authenticate)
  }
}

export const usersRouter = new UsersRouter()

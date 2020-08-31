import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import {NotFoundError} from 'restify-errors'
import {Question} from './questions.model'
import {authorize} from '../security/authz.handler'

class QuestionRouter extends ModelRouter<Question> {
  constructor(){
    super(Question)
  }

  applyRoutes(application: restify.Server){
    application.get(`${this.basePath}`, this.findAll)
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [this.validateId,this.replace])
    application.patch(`${this.basePath}/:id`, [this.validateId,this.update])
    application.del(`${this.basePath}/:id`, [this.validateId,this.delete])
  }

}

export const questionRouter = new QuestionRouter()

import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import {NotFoundError} from 'restify-errors'
import {Plan} from './plans.model'
import {authorize} from '../security/authz.handler'

class PlansRouter extends ModelRouter<Plan> {
  constructor(){
    super(Plan)
  }

  applyRoutes(application: restify.Server){
    application.get(`${this.basePath}`, this.findAll)
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.replace])
    application.patch(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.update])
    application.del(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.delete])
  }

}

export const plansRouter = new PlansRouter()

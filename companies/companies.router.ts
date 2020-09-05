import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import {NotFoundError} from 'restify-errors'
import {Company} from './companies.model'
import {authorize} from '../security/authz.handler'

class CompaniesRouter extends ModelRouter<Company> {
  constructor(){
    super(Company)
  }


  findByCnpj = (req, resp, next)=>{
    if(req.query.cnpj){
      Company.findByCnpj(req.query.cnpj)
          .then(company => company ? [company] : [])
          .then(this.renderAll(resp, next, {
                pageSize: this.pageSize,
                url: req.url
              }))
          .catch(next)
    }else{
      next()
    }
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

export const companiesRouter = new CompaniesRouter()

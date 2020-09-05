import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import {NotFoundError} from 'restify-errors'
import {Question} from './questions.model'
import {authorize} from '../security/authz.handler'

class QuestionRouter extends ModelRouter<Question> {
  constructor(){
    super(Question)
  }


  findByFilters = (req, resp, next)=>{
    if(req.query){
      console.log(JSON.stringify(req.query))

      if(req.query.skills){
        req.query.skills = {"$in": req.query.skills.split(",")}
      }

      if(req.query.difficulty){
        req.query.difficulty = {"$in": req.query.difficulty.split(",")}
      }

      console.log(JSON.stringify(req.query));
      Question.find(req.query)
          .then(user => user ? user : [])
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
    application.get(`${this.basePath}`, [this.findByFilters, this.findAll])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [this.validateId,this.replace])
    application.patch(`${this.basePath}/:id`, [this.validateId,this.update])
    application.del(`${this.basePath}/:id`, [this.validateId,this.delete])
  }

}

export const questionRouter = new QuestionRouter()

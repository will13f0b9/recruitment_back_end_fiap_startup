import {ModelRouter} from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'
import {QueryPopulateOptions} from 'mongoose'
import {Job} from './jobs.model'
import {authorize} from '../security/authz.handler'

class JobsRouter extends ModelRouter<Job> {
  constructor(){
    super(Job)
  }

  protected prepareOne(query: mongoose.DocumentQuery<Job,Job>): mongoose.DocumentQuery<Job,Job>{
    console.log('preapre')
    return query.populate('company', 'name')
  }

  findAllPopulate = (req, resp, next) =>{
    const x = {path: "company", select: ["name","employees"]};
    return  this.findAll(req, resp, next, x);
  }


  findByFilters = (req, resp, next)=>{
    if(req.query){
      console.log(JSON.stringify(req.query))
      if(req.query.requiredSkills){
        req.query.requiredSkills = {"$in": [req.query.requiredSkills.split(",")]}
      }
      Job.find(req.query).populate("name", "employees")
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
    application.get(`${this.basePath}`, [this.findByFilters, this.findAllPopulate])
    application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    application.post(`${this.basePath}`, [this.save])
    application.put(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.replace])
    application.patch(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.update])
    application.del(`${this.basePath}/:id`, [authorize('admin'),this.validateId,this.delete])
  }

}

export const jobsRouter = new JobsRouter()

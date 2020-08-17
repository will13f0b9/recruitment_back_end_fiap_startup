import {Router} from './common/router'
import * as restify from 'restify'

class MainRouter extends Router {
  applyRoutes(application: restify.Server) {
    application.get('/', (req, resp, next)=>{
      resp.json({
        version: "1.0.0",
        users: '/users',
        jobs: '/jobs',
        certifications: '/certifications'
      })
    })
  }
}

export const mainRouter = new MainRouter()

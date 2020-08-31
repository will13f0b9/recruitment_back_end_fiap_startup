import {Server} from './server/server'
import {usersRouter} from './users/users.router'
import {restaurantsRouter} from './restaurants/restaurants.router'
import {reviewsRouter} from './reviews/reviews.router'
import {mainRouter} from './main.router'
import { plansRouter } from './plans/plans.router'
import { jobsRouter } from './jobs/jobs.router'
import { companiesRouter } from './companies/companies.router'
import { questionRouter } from './questions/questions.router'

const server = new Server()
server.bootstrap([
  usersRouter,
  restaurantsRouter,
  reviewsRouter,
  mainRouter,
  plansRouter,
  jobsRouter,
  companiesRouter,
  questionRouter
]).then(server=>{
  console.log('Server is listening on:', server.application.address())
}).catch(error=>{
  console.log('Server failed to start')
  console.error(error)
  process.exit(1)
})

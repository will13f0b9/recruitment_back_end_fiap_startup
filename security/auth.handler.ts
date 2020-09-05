import * as restify from 'restify'
import * as jwt from 'jsonwebtoken'
import {NotAuthorizedError, BadRequestError} from 'restify-errors'
import {User} from '../users/users.model'
import {environment} from '../common/environment'
import { Company } from '../companies/companies.model'

export const authenticate: restify.RequestHandler = (req, resp, next)=>{
  console.log("AUTHENTICATE");
  const {email, password, cnpj} = req.body
  if(email){
    User.findByEmail(email, '+password') //1st
    .then(user=>{
      if(user && user.matches(password)){ //2nd
        //gerar o token
        //3rd
        const token = jwt.sign({sub: user.email, iss: 'meat-api'},
                  environment.security.apiSecret)
                  console.log(user);
        resp.json({ userId: user._id, name: user.name, email: user.email, profiles: user.profiles, bussinessAccount: user.companies, 
          cpf: user.cpf, gender: user.gender, dateOfBirth: user.dateOfBirth, description: user.description, accessToken: token})
        return next(false)
      } else {
        return next(new NotAuthorizedError('Invalid Credentials'))
      }
  }).catch(next)
  } else if(cnpj){
    Company.findByCnpj(cnpj, "+password")
    .then(company=>{
      console.log(company);
      if(company && company.matches(password)){
        const token = jwt.sign({sub: company.email, iss: 'meat-api'}, environment.security.apiSecret)
        console.log(company);
        resp.json({companyId: company._id, description: company.description, lastUpdateDate: company.lastUpdateDate,
           location: company.location,registerDate: company.registerDate, name: company.name, email: company.email, cnpj: company.cnpj, accessToken: token})
        return next(false)
      }else{
        return next(new NotAuthorizedError('Invalid Credentials'))
      }
    }).catch(next)
  }else{
    return next(new BadRequestError('Invalid properties'))
  }
}

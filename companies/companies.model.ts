import * as mongoose from 'mongoose'
import * as bcrypt from 'bcrypt'
import {environment} from '../common/environment'

export interface Company extends mongoose.Document {
  name: string,
  cnpj: string,
  password: string,
  employees: number,
  description: string,
  location: string,
  email: string,
  lastUpdateDate: Date,
  registerDate: Date,
  matches(password: string): boolean
}

export interface CompanyModel extends mongoose.Model<Company> {
  findByCnpj(email: string, projection?: string): Promise<Company>
}

const restSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cnpj: {
    type: String,
    unique: true,
    required: true
  },
  employees: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  location: {
    type: String,
    required: true
  },
  lastUpdateDate: {
    type: Date,
    //ref: 'company',
    required: false,
    default: ()=> new Date()
  },
  registerDate: {
    type: Date,
    //ref: 'company',
    required: false,
    default: ()=> new Date()
  },
  password: {
    type: String,
    select: false,
    required: true
  },
  email: {
    type: String,
    unique: false,
    match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    required: false
  }
})



restSchema.statics.findByCnpj = function(cnpj: string, projection: string){
  return this.findOne({cnpj}, projection) //{email: email}
}

restSchema.methods.matches = function(password: string): boolean {
  return bcrypt.compareSync(password, this.password)
}

const hashPassword = (obj, next)=>{
  bcrypt.hash(obj.password, environment.security.saltRounds)
        .then(hash=>{
          obj.password = hash
          next()
        }).catch(next)
}

const saveMiddleware = function (next){
  const company: Company = this
  if(!company.isModified('password')){
    next()
  }else{
    hashPassword(company, next)
  }
}

const updateMiddleware = function (next){
  if(!this.getUpdate().password){
    next()
  }else{
    hashPassword(this.getUpdate(), next)
  }
}

restSchema.pre('save', saveMiddleware)
restSchema.pre('findOneAndUpdate', updateMiddleware)
restSchema.pre('update', updateMiddleware)

export const Company = mongoose.model<Company, CompanyModel>('Company', restSchema)

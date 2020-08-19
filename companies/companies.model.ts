import * as mongoose from 'mongoose'

export interface Company extends mongoose.Document {
  name: string,
  cnpj: string,
  employees: number,
  description: string,
  location: string
}

const restSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cnpj: {
    type: String,
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
    //ref: 'User',
    required: false,
    default: ()=> new Date()
  },
  registerDate: {
    type: Date,
    //ref: 'User',
    required: false,
    default: ()=> new Date()
  },
})


export const Company = mongoose.model<Company>('Company', restSchema)

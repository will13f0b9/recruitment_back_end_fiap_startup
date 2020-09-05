import * as mongoose from 'mongoose'
import { User } from '../users/users.model'
import { Company } from '../companies/companies.model'

export interface Job extends mongoose.Document {
  city: string,
  state: string,
  address: string,
  company: mongoose.Types.ObjectId | Company,//todo mudar any para company model dps
  openPositions: number,
  requiredSkills: string[],
  desirableSkills: string[],
  cadidateUsers: [mongoose.Types.ObjectId | User],
  usersWhoViewed: [mongoose.Types.ObjectId | User],
  title: string,
  anotherInfo: string,
  description: string,
  salary: number,
  hiring: string,
  questions: [mongoose.Types.ObjectId | any],//todo mudar any para company model dps
  lastUpdateDate: Date,
  registerDate: Date,
  benefits: string[],
  difficulty: string[]
}

const restSchema = new mongoose.Schema({
  city: {
    type: String,
    required: false
  },
  state: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  requiredSkills: {
    type: [String],
    required: true,
    default: []
  },
  desirableSkills: {
    type: [String],
    required: false,
    default: []
  },
  cadidateUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: false,
    default: []
  },
  usersWhoViewed: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: false,
    default: []
  },
  title: {
    type: String,
    required: true
  },
  anotherInfo: {
    type: String,
    required: false,
    maxlength: 1000
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  salary: {
    type: Number,
    required: false
  },
  hiring: {
    type: String,
    required: true,
    enum: ['PJ', 'CLT']
  },
  lastUpdateDate: {
    type: Date,
    required: false,
    default: ()=> new Date()
  },
  registerDate: {
    type: Date,
    required: false,
    default: ()=> new Date()
  },
  benefits: {
    type: [String],
    required: false
  },
  difficulty: {
    type: [String],
    required: true,
    enum: ["STAGE","JUNIOR", "PLENO", "SENIOR", "SPECIALIST"]
  }
})


export const Job = mongoose.model<Job>('Job', restSchema)

import * as mongoose from 'mongoose'
import { User } from '../users/users.model'
import { Company } from '../companies/companies.model'


export interface ExamConfig extends mongoose.Document {
  skill: string,
  quantity: number
}

const examConfigSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
})


export interface Job extends mongoose.Document {
  city: string,
  state: string,
  address: string,
  owner: mongoose.Types.ObjectId | User,
  company: mongoose.Types.ObjectId | Company,
  openPositions: number,
  requiredSkills: string[],
  desirableSkills: string[],
  cadidateUsers: mongoose.Types.ObjectId[] | User[],
  usersWhoViewed: mongoose.Types.ObjectId[] | User[],
  approved: mongoose.Types.ObjectId[] | User[],
  repproved: mongoose.Types.ObjectId[] | User[],
  title: string,
  anotherInfo: string,
  description: string,
  salary: number,
  hiring: string,
  lastUpdateDate: Date,
  registerDate: Date,
  benefits: string[],
  difficulty: string[],
  done: boolean,
  examConfig: ExamConfig[],
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  repproved: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: false,
    default: []
  },
  approved: {
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
    default: () => new Date()
  },
  registerDate: {
    type: Date,
    required: false,
    default: () => new Date()
  },
  benefits: {
    type: [String],
    required: false
  },
  difficulty: {
    type: [String],
    required: true,
    enum: ["STAGE", "JUNIOR", "PLENO", "SENIOR", "SPECIALIST"]
  },
  done: {
    type: Boolean,
    default: false
  },
  examConfig: {
    type: [examConfigSchema],
    required: false
  },
})


export const Job = mongoose.model<Job>('Job', restSchema)

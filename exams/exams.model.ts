import * as mongoose from 'mongoose'
import { Job } from '../jobs/jobs.model'
import { User } from '../users/users.model'
import { Question } from '../questions/questions.model'

export interface Questions extends mongoose.Document {
  questionId: mongoose.Types.ObjectId | Question,
  answer: string,
}

const questionsSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Types.ObjectId,
    ref: "Question",
    required: true
  },
  answer: {
    type: String,
    required: false,
    enum: ["A", "B", "C", "D", "E"]
  },
})

export interface CandidateControll extends mongoose.Document {
  registerDate: Date,
  startedAt: Date,
  doneAt: Date,
  candidateId: mongoose.Types.ObjectId | User,
  questions: Questions[]
}

const candidateControllSchema = new mongoose.Schema({
  registerDate: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date,
    required: false
  },
  doneAt: {
    type: Date
  },
  candidateId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  questions: {
    type: [questionsSchema],
    required: true
  }
})

export interface Exam extends mongoose.Document {
  jobId: mongoose.Types.ObjectId | Job
  candidateControll: CandidateControll[],
}

const restSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateControll: {
    type: [candidateControllSchema],
    required: false
  }
})


export const Exam = mongoose.model<Exam>('Exam', restSchema)

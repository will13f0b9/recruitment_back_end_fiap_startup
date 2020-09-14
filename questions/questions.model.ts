import * as mongoose from 'mongoose'

export interface Question extends mongoose.Document {
  skills: string[],
  difficulty: string[],
  title: string,
  description: string,
  alternatives: Alternative[],
  registerDate: Date,
  lastUpdateDate: Date,
  correctQuestionId: string
}

export interface Alternative extends mongoose.Document {
  description: string,
  id: string
}

const alternativeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true,
    enum: ["A", "B", "C", "D", "E"]
  }
})

const restSchema = new mongoose.Schema({
  skills: {
    type: [String],
    required: true
  },
  difficulty: {
    type: [String],
    required: true,
    enum: ["STAGE","JUNIOR", "PLENO", "SENIOR", "SPECIALIST"]
  },
  description: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
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
  alternatives: {
    type: [alternativeSchema],
    required: true
  },
  correctQuestionId: {
    type: String,
    required: true,
    enum: ["A", "B", "C", "D", "E"],
    select: false
  }
})


export const Question = mongoose.model<Question>('Question', restSchema)

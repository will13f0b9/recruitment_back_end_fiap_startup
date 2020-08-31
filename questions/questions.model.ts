import * as mongoose from 'mongoose'

export interface Question extends mongoose.Document {
  skills: string[],
  difficulty: string,
  registerDate: Date,
  lastUpdateDate: Date,
  title: string,
  description: string,
  questions: any
}

const restSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  benefits: {
    type: [String],
    required: false,
    default: []
  }

})


export const Question = mongoose.model<Question>('Question', restSchema)

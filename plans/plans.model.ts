import * as mongoose from 'mongoose'

export interface Plan extends mongoose.Document {
  name: string,
  price: number,
  description: string,
  benefits: string[]
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


export const Plan = mongoose.model<Plan>('Plan', restSchema)

import * as mongoose from 'mongoose'
import { validateCPF } from '../common/validators'
import * as bcrypt from 'bcrypt'
import { environment } from '../common/environment'
import { Company } from '../companies/companies.model'

export interface User extends mongoose.Document {
  name: string,
  email: string,
  password: string,
  cpf: string,
  gender: string,
  profiles: string[],
  companies: [mongoose.Types.ObjectId | Company],
  dateOfBirth: Date,
  description: string,
  matches(password: string): boolean,
  hasAny(...profiles: string[]): boolean,
  curriculum: string,
  lastUpdateDate: Date,
  blocked: boolean,
  registerDate: Date,
}

export interface UserModel extends mongoose.Model<User> {
  findByEmail(email: string, projection?: string): Promise<User>
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 80,
    minlength: 3
  },
  email: {
    type: String,
    unique: true,
    match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    required: true
  },
  password: {
    type: String,
    select: false,
    required: true
  },
  gender: {
    type: String,
    required: false,
    enum: ['Male', 'Female', 'Undefined']
  },
  cpf: {
    type: String,
    required: false,
    validate: {
      validator: validateCPF,
      message: '{PATH}: Invalid CPF ({VALUE})'
    }
  },
  profiles: {
    type: [String],
    required: true,
    enum: ['CANDIDATE', 'RECRUITER']
  },
  companies: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Company',
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  curriculum: {
    type: String,
    required: false
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
  blocked: {
    type: Boolean,
    default: false
  }
})

userSchema.statics.findByEmail = function (email: string, projection: string) {
  return this.findOne({ email }, projection) //{email: email}
}

userSchema.methods.matches = function (password: string): boolean {
  return bcrypt.compareSync(password, this.password)
}

userSchema.methods.hasAny = function (...profiles: string[]): boolean {
  return profiles.some(profile => this.profiles.indexOf(profile) !== -1)
}

const hashPassword = (obj, next) => {
  bcrypt.hash(obj.password, environment.security.saltRounds)
    .then(hash => {
      obj.password = hash
      next()
    }).catch(next)
}

const saveMiddleware = function (next) {
  const user: User = this
  if (!user.isModified('password')) {
    next()
  } else {
    hashPassword(user, next)
  }
}

const updateMiddleware = function (next) {
  if (!this.getUpdate().password) {
    next()
  } else {
    hashPassword(this.getUpdate(), next)
  }
}

userSchema.pre('save', saveMiddleware)
userSchema.pre('findOneAndUpdate', updateMiddleware)
userSchema.pre('update', updateMiddleware)

export const User = mongoose.model<User, UserModel>('User', userSchema)

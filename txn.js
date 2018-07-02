'use strict'

const _ = require('lodash')
const moment = require('moment')
const uuidv5 = require('uuid/v5')
const Joi = require('joi')
const MongoModels = require('mongo-models')

const UUID_NAMESPACE = 'b8aa0435-5d11-4f60-8cf4-bfa46a4d3f75'

const schema = Joi.object({
  _id: Joi.string(),
  date: Joi.date().required(),
  amount: Joi.number().precision(2).required(),
  type: Joi.string().required().lowercase().valid('debit', 'credit'),
  description: Joi.string().required(),
  raw_description: Joi.string().required(),
  category: Joi.string().required(),
  account_name: Joi.string().required(),
  account_type: Joi.string().required().lowercase(),
  bank: Joi.string().required(),
})

class Txn extends MongoModels {
  static create(record) {
    const document = new Txn(record)
    document._id = this._generateId(document)
    return this.updateOne({_id: document._id}, {$set: document}, {upsert: true})
  }

  // Generates a uuid for the given document.
  // This is a simple transform that should be sufficient for this use case.
  // A number of key attributes of a transaction are joined together as strings,
  // All spaces and non-alpha numeric characters are removed and the whole str
  // converted to lower case. Finally a uuid is generated based on a fixed
  // namespace and returned.
  static _generateId(document) {
    let raw_id =
      moment(document.date).format('X') +
      document.amount.toString() +
      document.type +
      document.account_name +
      document.raw_description
    raw_id = _.toLower(raw_id.replace(/[^A-Z0-9\.]+/ig, ''))
    return uuidv5(raw_id, UUID_NAMESPACE)
  }

  speak() {
    console.log(`${this.date} | ${this.amount} | ${this.description}`)
  }
}

Txn.collectionName = 'txns' // the mongodb collection name
Txn.schema = schema

module.exports = Txn

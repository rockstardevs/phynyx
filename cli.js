#!/usr/bin/env node

'use strict'

const _ = require('lodash')
const program = require('commander')
const csv = require('csv')
const signale = require('signale')
const fs = require('fs')
const MongoModels = require('mongo-models')

const pkg = require('./package.json')
const mapping = require('./mapping.js')
const Txn = require('./txn.js')
const {TxnWriter} = require('./writer.js')

let initialize = async (address, database) => {
  let db = MongoModels.connect({
    db : database,
    uri: address
  }, {useNewUrlParser: true})
  db.then(() => signale.info('database connected'))
    .catch(err => signale.error(`database connection failed ${err}`))
  return db
}

let importFromFile = async (filename) => {
  const db = await initialize(program.address, program.database)
  signale.info('inserting transactions from %s', filename)

  // Setup stream writer
  let writer = new TxnWriter()
  writer.on('error', err => signale.error(`writer error ${err}`))
  writer.on('finish', () => MongoModels.disconnect())

  // Setup normalize headers transform.
  let normalizeHeadersFn = (record) => {
    let result = {}
    _.each(record, (v, k) => {
      let key = mapping.columnMap[k] || null
      if (!key) {
        signale.warn(`skipping unknown column ${k}`)
        return
      }
      let valueFn = mapping.valueTransforms[key] || null
      result[key] = valueFn ? valueFn(v) : v
    })
    return result
  }
  const normalizeHeaders = csv.transform(normalizeHeadersFn)
  normalizeHeaders.on('error', err => signale.error(`normalize error ${err}`))

  // Setup parser.
  const opts = {
    columns                     : true,
    skip_empty_lines            : true,
    skip_lines_with_empty_values: true
  }
  const parser = csv.parse(opts)
  parser.on('error', err => signale.error(`parser error ${err}`))

  fs.createReadStream(filename)
    .pipe(parser)
    .pipe(normalizeHeaders)
    .pipe(writer)
}

// Command line parser.
program
  .version(pkg.version, '-v, --version')
  .option('-c, --credentials [credentials_file]', 'path to credentials file.', './config/db-credentials.json')
  .option('-a, --address [database_address]', 'address for mongodb database.', 'mongodb://localhost:27017')
  .option('-d, --database [database_url]', 'name for mongodb database.', 'phynyx')
  .option('-n, --collection [collection_name]', 'name for database collection', 'txns')

program
  .command('import <filename> [optional]')
  .description('imports txn records from the given filename (in csv format).')
  .action(importFromFile)

program.parse(process.argv)
if (!program.args.length) program.help()

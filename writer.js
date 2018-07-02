'use strict'

const signale = require('signale')
const { Writable } = require('stream')
const Txn = require('./txn.js')

// TxnWriter using writable stream.
class TxnWriter extends Writable {
  constructor() { super({objectMode: true}) }
  _write(chunk, encoding, callback) {
    Txn.create(chunk)
      .then(() => callback())
      .catch(err => signale.error(err))
  }
}
exports.TxnWriter = TxnWriter

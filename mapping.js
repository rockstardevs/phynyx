'use strict'

const _ = require('lodash')
const moment = require('moment')

module.exports = {
  valueTransforms: {
    'date': d => moment(d, 'YYYY-MM-DD').toDate(),
    'amount': parseFloat,
    'type': _.lowerCase,
    'account_type': _.lowerCase
  },
  columnMap: {
    'Date': 'date',
    'Description': 'description',
    'Original Bank Description': 'raw_description',
    'Amount': 'amount',
    'Transaction Type': 'type',
    'Category': 'category',
    'Bank': 'bank',
    'Account Name': 'account_name',
    'Account Type': 'account_type',
  },
}

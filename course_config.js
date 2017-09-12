const filenamify = require('filenamify')

// Modify this part ===============================================
const COURSE_NAME = 'Machine Learning Foundations: A Case Study Approach'
const COURSE_URL = 'https://www.coursera.org/learn/ml-foundations/home/welcome'
// End ============================================================

module.exports = {
  COURSE_NAME: filenamify(COURSE_NAME),
  COURSE_URL
}

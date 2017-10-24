const filenamify = require('filenamify')

// Modify this part ===============================================
const COURSE_NAME = 'Algorithms on Graphs'
const COURSE_URL = 'https://www.coursera.org/learn/algorithms-on-graphs/home/welcome'
// End ============================================================

module.exports = {
  COURSE_NAME: filenamify(COURSE_NAME),
  COURSE_URL
}

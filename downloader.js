const download = require('download')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const filenamify = require('filenamify')

// Loading crawler result from app.js, for example:
// "Week_1": [
//   {
//     "section": "Solving a More Challenging Code Problem",
//     "lesson": "Stress Test - Implementation",
//     "videoLink": "https://d3c33hcgiwev3.cloudfront.net/P4O7H8O2EeWu4ApYq4IbUQ.processed/full/360p/index.mp4?..."
//     "subtitleLink": "https://www.coursera.org/api/subtitleAssetProxy.v1/5KJ6kpv...OiAPF6Xdc_ik0&fileExtension=vtt",
//     "transcriptLink": "https://www.coursera.org/api/subtitleAssetProxy.v1/5KJ6k...qaO9gRLu3Q8zg&fileExtension=txt"
//   },
const COURSE_NAME = require('./course_config').COURSE_NAME
const courseInfo = require(`./videos/${COURSE_NAME}.json`)

;(async () => {
  for (const week of Object.keys(courseInfo)) {
    const lessons = courseInfo[week]
    let currentSection = ''
    let currentSectionIndex = 0
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]
      if (lesson.section !== currentSection) {
        currentSection = lesson.section
        currentSectionIndex++
      }
      const dirPath = path.join(
        __dirname, 'videos', COURSE_NAME, week, `${currentSectionIndex}_${filenamify(lesson.section)}`)
      const fileNamePrefix = `${i + 1}_${filenamify(lesson.lesson)}`

      // Download Video
      let fileName = `${fileNamePrefix}.mp4`
      console.log(await save(dirPath, fileName, lesson.videoLink))

      // Download Subtitle (vtt)
      fileName = `${fileNamePrefix}.vtt`
      console.log(await save(dirPath, fileName, lesson.subtitleLink))

      // Download Transcript (txt)
      fileName = `${fileNamePrefix}.txt`
      console.log(await save(dirPath, fileName, lesson.transcriptLink))
    }
  }
})()

async function save (dirPath, fileName, downloadUrl) {
  const filePath = path.resolve(dirPath, fileName)
  if (fs.existsSync(filePath)) {
    return `File already exists, skip: ${filePath}`
  }

  // We haven't downloaded this file before, start downloading
  if (!fs.existsSync(dirPath)) {
    mkdirp.sync(dirPath)
  }
  const data = await download(downloadUrl)
  fs.writeFileSync(filePath, data)

  return `Finished: ${fileName}`
}

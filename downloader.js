const download = require('download')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const filenamify = require('filenamify')

// Loading crawler result from app.js
const courseInfo = require('./videos/Algorithmic Toolbox.json')

const DOWNLOAD_FOLDER_NAME = 'Algorithmic Toolbox'

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
        __dirname, 'videos', DOWNLOAD_FOLDER_NAME, week, `${currentSectionIndex}_${filenamify(lesson.section)}`)
      const fileName = `${i + 1}_${filenamify(lesson.lesson)}.mp4`
      console.log(await save(dirPath, fileName, lesson.videoLink))
    }
  }
})()

async function save (dirPath, fileName, downloadUrl) {
  const data = await download(downloadUrl)

  if (!fs.existsSync(dirPath)) {
    mkdirp.sync(dirPath)
  }
  fs.writeFileSync(path.resolve(dirPath, fileName), data)

  return `Finished: ${fileName}`
}

//
// "Week_1": [
//   {
//     "section": "Welcome",
//     "lesson": "Welcome!",
//     "videoLink": "https://d3c33hcgiwev3.cloudfront.net/YJiV6ubAEeWIdgqHxZs34w.processed/full/360p/index.mp4?Expires=1505088000&Signature=Xavs1bR-hmahr~jwyIWgIhSLcIe8zmeRhBIPs9p~M-Ji5foYtnPmwh8E~1J~FWbcQ16WAXJyVARssVHcy812~4~cKYr8GUjyWUzAGvPngDDHQcg7tbthwBmqyeN-OMdyYljliof8tbyHLLfbo356Hz5C3w8CoJ74IFnzDhhXrMQ_&Key-Pair-Id=APKAJLTNE6QMUY6HBC5A"
//   },
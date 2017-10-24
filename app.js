const webdriver = require('selenium-webdriver')
const {By, until} = webdriver
const fs = require('fs')
const path = require('path')

const {COURSE_NAME, COURSE_URL} = require('./course_config')
const {COURSERA_ACCOUNT: ACCOUNT, COURSERA_PASSWORD: PW} = require('./secure_config')

const PAGE_LOAD_TIMEOUT = 20 * 1000
const ACTION_TIMEOUT = 10 * 1000

;(async () => {
  let driver = new webdriver.Builder().forBrowser('chrome')
  if (process.platform === 'win32') { // OS: Windows
    driver = driver.usingServer('http://localhost:9515')
  }
  driver = driver.build()

  // 1. Open browser
  driver.manage().window().maximize()
  driver.manage().setTimeouts({pageLoad: PAGE_LOAD_TIMEOUT})
  driver.get(COURSE_URL)

  // 2. Login
  // 2-1. Click login button
  const loginButton = driver.wait(until.elementLocated(By.css('li[class~="c-ph-log-in"] a')), PAGE_LOAD_TIMEOUT)
  await driver.executeScript('arguments[0].click()', loginButton)
  // 2-2. Account and password
  driver.wait(until.elementLocated(By.css('div[class="rc-LoginForm"]')), ACTION_TIMEOUT)
  let element = driver.findElement(By.css('input[type="email"]'))
  element.sendKeys(ACCOUNT)
  element = driver.findElement(By.css('input[type="password"]'))
  element.sendKeys(PW)
  // 2-3. Submit
  driver.findElement(By.css('button[data-courselenium="login-form-submit-button"]')).click()

  // 3. Go to course
  driver.wait(until.elementLocated(By.css('span[class="c-ph-username"]')), PAGE_LOAD_TIMEOUT)
  driver.findElement(By.css('div[class~="content-container"] div[class="rc-CourseEnrollButton"] a')).click()

  // 4. Course menu
  const weekCount = (await getWeekElements(driver)).length
  console.log(`Week Count: ${weekCount}`)

  // 5. Loop weeks
  const outputData = {} // Structure of course
  for (let i = 0; i < weekCount; i++) {
    // Query again because of navigating
    const weekElements = await getWeekElements(driver)
    // 5-1. Click that week
    weekElements[i].click()
    driver.wait(until.elementLocated(By.css('div[class="rc-ModuleLessons"]')), PAGE_LOAD_TIMEOUT)

    // 5-2. Click the first lesson
    const firstSection = await driver.findElement(
      By.css('div[class="rc-ModuleLessons"] div[class="rc-NamedItemList"]'))
    firstSection.findElement(By.css('span[class~="rc-ItemHonorsWrapper"] a')).click()

    // 5-3. In lessons page
    const weekTitle = `Week_${i + 1}`
    console.log(`Processing... ${weekTitle}`)
    outputData[weekTitle] = await fetchLessonsContent(driver)
  }

  // 6. Write to output file
  console.log('Writing to output file...')
  const dirPath = path.join(__dirname, 'videos')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
  fs.writeFileSync(
    path.resolve(dirPath, `${COURSE_NAME}.json`),
    JSON.stringify(outputData, null, '  ')
  )

  driver.quit()
})()

async function getWeekElements (driver) {
  driver.wait(until.elementLocated(By.css('div[class="rc-WeekCollectionNavigationItem"]')), PAGE_LOAD_TIMEOUT)
  return driver.findElements(By.css('div[class="rc-NavigationDrawer"] a[class~="rc-NavigationDrawerLink"]'))
}

async function fetchLessonsContent (driver) {
  const lessonsContent = []
  const targetLessonsIndex = await getTargetLessonsIndex(driver)
  // Loop sections
  for (let i = 0; i < targetLessonsIndex.length; i++) {
    const lessonsIndex = targetLessonsIndex[i]
    // This section has no lesson which have to be processed, continue
    if (lessonsIndex.length === 0) continue
    for (const index of lessonsIndex) {
      // Query again because of navigating
      const sectionElements = await getSectionElements(driver)
      const section = sectionElements[i]
      const sectionText = await section.findElement(By.css('h3')).getText()
      const lessonList = await getLessonList(section, driver)
      const lessons = await lessonList.findElements(By.css('ul li'))

      // Click the lesson button
      const lessonButton = await lessons[index].findElement(By.css('a'))
      await driver.executeScript('arguments[0].click()', lessonButton)

      // Parsing lesson content
      const lessonTitleElement = driver.wait(until.elementLocated(
        By.css('div[class~="c-video-title"] h1')), PAGE_LOAD_TIMEOUT)
      const lessonTitle = await lessonTitleElement.getText()
      const videoDownloadItem = driver.wait(until.elementLocated(
        By.css('li[class~="rc-LectureDownloadItem"] a')), PAGE_LOAD_TIMEOUT)
      const subtitleDownloadItem = driver.wait(until.elementLocated(
        By.css('li[class~="rc-SubtitleDownloadItem"] a')), PAGE_LOAD_TIMEOUT)
      const transcriptDownloadItem = driver.wait(until.elementLocated(
        By.css('li[class~="rc-TranscriptDownloadItem"] a')), PAGE_LOAD_TIMEOUT)

      lessonsContent.push({
        section: sectionText,
        lesson: lessonTitle,
        videoLink: await videoDownloadItem.getAttribute('href'),
        subtitleLink: await subtitleDownloadItem.getAttribute('href'),
        transcriptLink: await transcriptDownloadItem.getAttribute('href')
      })
    }
  }

  // Scroll to top and back to course menu
  const backButton = await driver.findElement(By.css('button[class~="back-button"]'))
  await driver.executeScript('arguments[0].click()', backButton)

  return lessonsContent
}

async function getSectionElements (driver) {
  driver.wait(until.elementLocated(By.css('button[class~="back-button"]')), PAGE_LOAD_TIMEOUT)
  return driver.findElements(By.css('ul[class~="rc-CollapsibleLessonList"] div[class="rc-CollapsibleLesson"]'))
}

async function getTargetLessonsIndex (driver) {
  const sections = []
  // Loop sections
  const sectionElements = await getSectionElements(driver)
  for (const section of sectionElements) {
    const lessonsWithVideo = []
    const lessonList = await getLessonList(section, driver)
    const lessons = await lessonList.findElements(By.css('ul li'))
    // Loop lessons
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]
      const completedPlayIcon = await lesson.findElements(By.css('i[class~="cif-play"]')) // Finished lesson
      const videoIcon = await lesson.findElements(By.css('i[class~="cif-item-video"]')) // Unfinished lesson
      // We only want the lesson with video
      if (completedPlayIcon.length > 0 || videoIcon.length > 0) {
        lessonsWithVideo.push(i)
      }
    }
    sections.push(lessonsWithVideo)
  }

  return sections
}

async function getLessonList (section, driver) {
  const lessonListLocator = By.css('div[class="item-list"]')
  // Check if it's already expanded
  const lessonList = await section.findElements(lessonListLocator)
  if (lessonList.length > 0) {
    // Expanded, just return lesson list
    return lessonList[0]
  } else {
    // Click section button and return lesson list
    const sectionButton = await section.findElement(By.css('button[class~="link-button"]'))
    await driver.executeScript('arguments[0].click()', sectionButton)
    return section.findElement(lessonListLocator)
  }
}

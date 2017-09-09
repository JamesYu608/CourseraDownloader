const download = require('download')
const fs = require('fs')
const path = require('path')

async function save (url) {
  const saveData = await download(url)

  const dirPath = path.join(__dirname, 'videos')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
  fs.writeFileSync(path.resolve(dirPath, 'test'), saveData)

  return 'done'
}

save('https://d3c33hcgiwev3.cloudfront.net/YJiV6ubAEeWIdgqHxZs34w.processed/full/360p/index.mp4?Expires=1505001600&Signature=LtRqCIDIfCId6kxdWKBaNewVLJp6Ga1~HFfQ-I7y~EXaHuOphU-jC5cwz6U0yxDvXCzFTvqswulcKnXBgCm7pthSMGisJi2VLNORm5~WstBc73mKpNHPfOn6DtBKelvOaVUid6IhvR65K7kEWBiUswv1PQBqtwOcSlYApmglCp0_&Key-Pair-Id=APKAJLTNE6QMUY6HBC5A')
  .then(res => console.log(res))

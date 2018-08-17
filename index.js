const { exec } = require('child_process')
const inputFile = process.argv[2]
const sampleLength = 0.5

exec(`mkdir -p tmp`, err => {
  if (err) throw err
  exec(`ffmpeg -i ${inputFile} -f segment -segment_time ${sampleLength} -c copy tmp/clip%03d.mp3`, err => {
    if (err) throw err
  })
})

const { exec } = require('child_process')
const { readdir, readFile } = require('fs')
const decode = require('audio-decode')
const average = require('average')
const map = require('async/map')
const sortBy = require('lodash.sortby')
const audioconcat = require('audioconcat')
const compact = require('lodash.compact')
const inputFile = process.argv[2]
const sampleLength = parseFloat(process.argv[3]) || 0.1

exec('rm -rf tmp', err => {
  if (err) throw err
  exec(`mkdir tmp`, err => {
    if (err) throw err
    exec(`ffmpeg -i ${inputFile} -f segment -segment_time ${sampleLength} -c copy tmp/clip%03d.mp3`, err => {
      if (err) throw err

      readdir('tmp', (err, clips) => {
        if (err) throw err
        const getRms = (clip, next) => {
          const filePath = `tmp/${clip}`
          readFile(filePath, (err, buf) => {
            if (err) throw err
            decode(buf).then(audioBuf => {
              const rms = Math.sqrt(average(audioBuf.getChannelData(0).map(d => d * d)))
              next(null, { filePath, rms })
            }).catch(err => {
              console.error(err)
              next(null)
            })
          })
        }

        map(clips, getRms, (err, clipData) => {
          if (err) throw err
          const filesSortedByAmp = compact(sortBy(clipData, 'rms')).map(d => d.filePath)
          audioconcat(filesSortedByAmp).concat('output.mp3')
        })
      })
    })
  })
})

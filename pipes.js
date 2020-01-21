const fs = require('fs');
const { Transform, Writable, pipeline } = require('stream');
const util = require('util');

let fileName = '7mm_companies.csv';

const promise = util.promisify(pipeline)

function processLineByLine() {
  const startDate = new Date();
  let size = 0;
  fs.stat( fileName, ( err, stat ) => {
    size = stat.size
  })

  const xSplit = function () {
    /*
    splits our stream output into their rows
    returns [...colums]
    */
    let counter = 0
    let buffCount = 0;
    let original = 0;
    const progress = (buff) => {
      if (buffCount === 0) {
        original = buff;
      }

      const buffer = buff * buffCount
      const percent = buff === original ? (buffer / size) * 100 : 100;
      const spoke = buffCount % 4 == 0
        ? String.fromCharCode(0x2502)
        : buffCount % 4 == 1
        ? String.fromCharCode(0x2571)
        : buffCount % 4 == 2
        ? String.fromCharCode(0x2500)
        : String.fromCharCode(0x2572)
      return `${spoke} ${percent.toFixed(9)}% ${spoke}`;
    }
    return new Transform({
      objectMode: true,
      transform: function (data, _, done) {
        const strs = data.toString().split('\n');
        for (const str of strs) {
          this.push([str, progress(data.length), counter++])
        }
        buffCount += 1;
        done()
      }
    })
  }
  const xParse = function () {
    /*
    parse columns of each row
    :returns [headers, properties]
    */
    const headers = []
    return new Transform({
      objectMode: true,
      transform: function (data, _, done) {
        const [str, progress, counter] = data;
        const splitter = str.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        if (splitter) {
          if (counter === 0) {
            headers.push(...splitter);
          } else {
            const obj = []
            for (let index = 0; index < headers.length; index += 1) {
              obj.push([headers[index], splitter[index]]) 
            }
            // pass the data downstream
            this.push([obj, progress])
          }
        }
        // finished processing current buffer, request next buffer upstream
        done()
      }
    })
  }
  const xObject = function () {
    /*
    transforms our output into JSON objects
    */
    return new Transform({
      objectMode: true,
      transform: function ([data, progress], _, done) {
        const entry = {}
        for (const [key, value] of data) {
          entry[key] = value;
        }
        // if we are writing to file of db... set timeout to process
        setTimeout(() => done(null, [entry, progress]), 2);
      }
    })
  }
  const Render = function () {
    /*
    write our data into the console
    */
    return new Writable({
      objectMode: true,
      write: ([entry, progress], _, done) => {
        console.clear()
        // console.log(progress),
        console.log(entry);
        done()
      }
    })
  }
  pipeline(
    fs.createReadStream(fileName),
    xSplit(),
    xParse(),
    xObject(),
    Render(),
    (err) => {
      const timeEnded = new Date() - startDate;
      const totalSecs = timeEnded / 1000;
      const [totalMinutes, secs] = [totalSecs / 60, totalSecs % 60];
      const [hours, minutes] = [totalMinutes / 60, totalMinutes % 60];
      const duration = `${hours | 0} hours, ${minutes | 0} minutes and ${secs | 0} seconds.`
      err
        ? console.error(err)
        : console.log(`completed in ${duration}`)
    }
  );
}
processLineByLine()

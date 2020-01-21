const fs = require('fs');
const readline = require('readline');
// const { parse, transform } = require('csv');

let fileName = '7mm_companies.csv';

async function* processLineByLine() {
  // const parser = parse({
  //   delimiter: ',',
  //   columns: true
  // });
  // const transformer = transform((record, callback) => {
  //   callback(null, record)
  // });
  const lines = readline.createInterface({
    input: fs.createReadStream(fileName),
    crlfDelay: Infinity
  })
  // const data = fs.createReadStream(fileName)
    //.pipe(parser)
    //.pipe(transformer)//.pipe(process.stdout); // only works for string output

  for await (const line of lines) {
    yield line.split(',');
  }
}

(async () => {
  let counter = 0;
  let headers = {}
  const data = {};
  const table = [];
  for await (const row of processLineByLine()) {
    let col = 0;
      for (let property = 0; property < row.length; property += 1) {
        if (counter === 0) {
          headers = { ...headers, [col]: row[property] };
        } else if (row[property][0] === '"' && row[property].slice(-1) !== '"') {
          let fullString = row[property]
          do {
            property += 1;
            fullString += row[property]
          } while (row[property].charAt(row[property].length - 1) !== '"')
          data[headers[col]] = fullString;
        } else {
          data[headers[col]] = row[property];
        }
        col += 1;
      }
      table.push(data);
    counter += 1
    console.log(table)
  }
})();

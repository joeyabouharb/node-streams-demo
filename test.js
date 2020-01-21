const fs = require('fs');

fs.readFile('./7mm_companies.csv', (err, data) => {
  console.log(data.toString());
})
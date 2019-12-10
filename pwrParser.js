
let  _FitFileParser, _fs , _parent, parsedPower, data

class FitParser {
  constructor(file) {
    this._source = file;
    _parent = this;
    _FitFileParser = require("fit-file-parser").default;
    _fs = require("fs");
    data,
    parsedPower
  }

  getRawData() {
    let data = _fs.readFileSync(this._source);
    return data;
  }

   parseRawData(data) {
    var fitParser = new _FitFileParser({
      force: true
    });

    return new Promise(function(resolve, reject) {
      fitParser.parse(data, function(error, data) {
        let result;
        if (data) {
          result = data;
        } else {
          result = "KO";
        }
        _parent.data = result
        resolve(result)
      });
    });
  }

   getPower(data) {
    
    
    return new Promise(function(resolve, reject) {
      let powerData = [];
      let records = data.records;
      
      try {
        records.forEach(record => {
          powerData.push({ x: (new Date(record.timestamp)).getTime(), y: record.power });
        });
      } catch (err) {}
      _parent.parsedPower = parsedPower
        resolve(powerData);
    });
  }

}


module.exports = {
    FitParser : FitParser
}

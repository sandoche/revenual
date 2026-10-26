// code from https://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data/1293163
export default (strData: string, strDelimiter: string) => {
    /* eslint-disable */
  strDelimiter = (strDelimiter || ",");

  var objPattern = new RegExp(
      (
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
  );

  var arrData: any[][] = [[]];

  var arrMatches = null;

  while (arrMatches = objPattern.exec(strData)) {
      var strMatchedDelimiter = arrMatches[1];

      if (
          strMatchedDelimiter.length &&
          strMatchedDelimiter !== strDelimiter
      ) {
          arrData.push([]);
      }

      var strMatchedValue;

      if (arrMatches[2]) {

          strMatchedValue = arrMatches[2].replace(
              new RegExp("\"\"", "g"),
              "\""
          );

      } else {
          strMatchedValue = arrMatches[3];

      }

      arrData[arrData.length - 1].push(strMatchedValue);
  }

  return arrData;
}

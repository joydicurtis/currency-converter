'use strict';

var apiKey = '970381a0-5e84-11ec-acb0-6b5a4d15d71e'
var baseUrl = 'https://freecurrencyapi.net/api/v2/latest?apikey=';
var request = new XMLHttpRequest();
var tableSelect = document.getElementById('js-currency-table-select');
var currencyTable = document.getElementById('js-currency-table');
var currencyTableBody = document.getElementById('js-currency-table').getElementsByTagName('tbody')[0];
var sourceSelect = document.getElementById('js-source-select');
var targetSelect = document.getElementById('js-target-select');
var userSum = document.getElementById('js-user-sum');
var userSumOne = document.getElementById('js-target-sum');
var converterResult = document.getElementById('js-converter-result');
var converterForm = document.querySelector('#js-converter-form');

class CurrencyConverter {
  constructor() {
    let initialSourceCur = 'USD';
    let initialTargetCur = 'UAH';
    let initialSourceSum = 1;
    converterForm.addEventListener('change', function(event) {
      let selectedTarget;
      let outputValue;
      let sourceValue;
      let selectedSource = event.target.value;
      switch (event.target.id) {
        case 'js-source-select':
          sourceValue = userSum.value;
          selectedTarget = targetSelect.value
          outputValue = userSumOne;
          convertIt(sourceValue, selectedSource, selectedTarget, outputValue);
          break;
        case 'js-target-select':
          sourceValue = userSumOne.value;
          selectedTarget = sourceSelect.value
          outputValue = userSum;
          convertIt(sourceValue, selectedSource, selectedTarget, outputValue);
          break;
      }
    });
    converterForm.addEventListener('input', function(event) {
      let sourceValue = event.target.value;
      let selectedSource;
      let selectedTarget;
      let outputValue;
      switch (event.target.id) {
        case 'js-user-sum':
          selectedSource = sourceSelect.value;
          selectedTarget = targetSelect.value;
          outputValue = userSumOne;
          convertIt(sourceValue, selectedSource, selectedTarget, outputValue);
          break;
        case 'js-target-sum':
          selectedSource = targetSelect.value;
          selectedTarget = sourceSelect.value;
          outputValue = userSum;
          convertIt(sourceValue, selectedSource, selectedTarget, outputValue);
          break;
      }
    });
    getSelectOptions(sourceSelect, initialSourceCur);
    getSelectOptions(targetSelect, initialTargetCur);
    getSelectOptions(tableSelect, initialSourceCur);
    convertIt(initialSourceSum, initialSourceCur, initialTargetCur, userSumOne);
    getHistoricalRate(initialSourceCur, initialTargetCur);
    changeTableValue();
  }
}

async function getRequestUrl(cur, apiKey) {
  if (cur) {
    let requestUrl = 'https://freecurrencyapi.net/api/v2/latest?apikey='+apiKey+'&base_currency='+cur;
    let res = await (await fetch(requestUrl)).json();
    return res.data;
  }
}

function setTableData(selectedCur, apiKey) {
  getRequestUrl(selectedCur, apiKey).then(data => {
    if (data) {
      delete_gameboard();
      let dataArray = [];
      for (let key in data) {
        dataArray.push({cur: key, value: data[key]});
      }
      for (let i = 0; i<dataArray.length; i++) {
        
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        let td1 = document.createElement("td");
        currencyTableBody.appendChild(tr);
        tr.appendChild(td).innerText = dataArray[i].cur;
        tr.appendChild(td1).innerText = dataArray[i].value;
      }
    }
  });
}

function delete_gameboard(){
  var rowCount = currencyTableBody.rows.length;
  for (var i=0; i < rowCount; i++) {
      currencyTableBody.deleteRow(0);
  }
}

function getSelectOptions(selectItem, cur) {
  allCurrencies.forEach(item => {
    if (item.value === cur) {
      item.selected = true;
    }
  });
  allCurrencies.forEach(item => {
    const someOption = document.createElement('option');
    someOption.setAttribute('value', item.value);
    someOption.innerText = item.label;
    if (item.selected) {
      someOption.setAttribute('selected', item.selected);
    }
    selectItem.appendChild(someOption);
  });
}

function changeTableValue() {
  let selectedCur = tableSelect.value;
  setTableData(selectedCur, apiKey);
}

function setNewTableValues(key) {
  while (currencyTableBody.hasChildNodes()) {
    currencyTableBody.removeChild(currencyTableBody.lastChild);
  }
  let tr = document.createElement("tr");
  let td = document.createElement("td");
  let td1 = document.createElement("td");
  let tdCur = document.createTextNode(key);
  let tdVal = document.createTextNode(res.data[key]);
  currencyTableBody.appendChild(tr);
  tr.appendChild(td).appendChild(tdCur);
  tr.appendChild(td1).appendChild(tdVal);
}

function convertIt(sourceValue, selectedSource, selectedTarget, outputValue) {
  let total;
  getRequestUrl(selectedSource, apiKey).then(data => {
    let sum = sourceValue;
    if (selectedSource === 'USD' && selectedTarget === 'USD' && !('USD' in data)) {
      total = sum;
      converterResult.value = total;
    }
    for (let key in data) {
      if (key === selectedTarget) {
        total = sum * data[key];
        outputValue.value = parseFloat(total).toFixed(2);
      }
    }
  })
}

function reverseCur() {
  let sourceValue = sourceSelect.value;
  let targetValue = targetSelect.value;
  let sourceSum = userSum.value;
  let targetSum = userSumOne.value;
  sourceSelect.value = targetValue;
  targetSelect.value = sourceValue; 
  userSum.value = targetSum;
  userSumOne.value = sourceSum;
}

async function getHistoricalRate(sourceValue, targetValue, fromDate, toDate) {
  var today = new Date();
  var weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);
  var tday = String(today.getDate()).padStart(2, '0');
  var tmonth = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var tyear = today.getFullYear();
  var day = String(weekAgo.getDate()).padStart(2, '0');
  var month = String(weekAgo.getMonth() + 1).padStart(2, '0'); //January is 0!
  var year = weekAgo.getFullYear();
  var todayDate = tyear + '-' + tmonth + '-' + tday;
  var weekAgoDate = year + '-' + month + '-' + day;
  sourceValue = sourceValue || 'USD';
  targetValue = targetValue || 'UAH';
  fromDate = fromDate || weekAgoDate;
  toDate = toDate || todayDate;
  let hisUrl = 'https://freecurrencyapi.net/api/v2/historical?apikey=970381a0-5e84-11ec-acb0-6b5a4d15d71e&base_currency='+sourceValue+'&date_from='+fromDate+'&date_to='+toDate;
  let hisRes = await (await fetch(hisUrl)).json();
  let res = hisRes.data;
  let historicalData = [];
  if (sourceValue === 'USD' && targetValue === 'USD' && !('USD' in res)) {
    let hisUrl = 'https://freecurrencyapi.net/api/v2/historical?apikey=970381a0-5e84-11ec-acb0-6b5a4d15d71e&base_currency='+'EUR'+'&date_from='+fromDate+'&date_to='+toDate;
    let hisRes = await (await fetch(hisUrl)).json();
    let res = hisRes.data;
    for (let key in res) {
      let data = res[key];
      for (let innerKey in data) {
        if (innerKey === 'EUR') {
          historicalData.push({x: new Date(key), y: data[innerKey]});
        }
      }
    }
  }
  for (let key in res) {
    let data = res[key];
    for (let innerKey in data) {
      if (innerKey === targetValue) {
        historicalData.push({x: new Date(key), y: data[innerKey]});
      }
    }
  }
  var chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    axisY: {
        valueFormatString: "#0.00",
        gridColor: "transparent",
        lineColor: "transparent",
        tickColor: "transparent",
        labelFontColor: "#c4c4c4",
        labelFontSize: 10
    },
    axisX:{
      tickColor: "transparent",
      lineColor: "transparent",
      labelFontColor: "#c4c4c4",
      labelFontSize: 10
    },
    toolTip: {
			fontColor: "#000",
			Content: "{x} : {y}",
      borderThickness: 0,
		},
    data: [{
        type: "spline",
        color: "rgba(128, 185, 108, 1)",
        markerSize: 5,
        xValueFormatString: "YYYY-MM-DD",
        yValueFormatString: "00.00",
        dataPoints: historicalData
    }]
  });

  chart.render();
}

function clearField() {
  userSum.value = null;
  userSumOne.value = null;
}

function setToDate(value) {
  var today = new Date(); 
  let timeAgo = '';
  let timeAgoDate = '';
  switch (value) {
    case '1 Week':
      timeAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);
      break;
    case '1 Month':
      timeAgo = new Date(today.getFullYear(), today.getMonth()-1, today.getDate());
      break;
    case '3 Months':
      timeAgo = new Date(today.getFullYear(), today.getMonth()-3, today.getDate());
      break;
    case '6 Months':
      timeAgo = new Date(today.getFullYear(), today.getMonth()-6, today.getDate());
      break;
    case '1 Year':
      timeAgo = new Date(today.getFullYear()-1, today.getMonth(), today.getDate());
      break;
    case '3 Years':
      timeAgo = new Date(today.getFullYear()-3, today.getMonth()-6, today.getDate());
      break;
  }
  var tday = String(today.getDate()).padStart(2, '0');
  var tmonth = String(today.getMonth() + 1).padStart(2, '0');
  var tyear = today.getFullYear();
  var day = String(timeAgo.getDate()).padStart(2, '0');
  var month = String(timeAgo.getMonth() + 1).padStart(2, '0');
  var year = timeAgo.getFullYear();
  var todayDate = tyear + '-' + tmonth + '-' + tday;
  timeAgoDate = year + '-' + month + '-' + day;
  var list = document.getElementsByClassName('tab-item');
  let activeItems = document.getElementsByClassName('tab-item-active');
  for (let i = 0; i< activeItems.length; i++) {
    activeItems[i].classList.remove('tab-item-active');
  }
  for (let i=0; i<list.length; i++) {
    list[i].onclick=function(){
      list[i].classList.add('tab-item-active');
    }
  }
  getHistoricalRate(sourceSelect.value, targetSelect.value, timeAgoDate, todayDate);
}

function changeSource() {
  getHistoricalRate(sourceSelect.value, targetSelect.value);
}

new CurrencyConverter();
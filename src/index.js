'use strict';

import { allCurrencies } from './js/custom/all-currencies.js';
import * as CanvasJS from './js/vendor/canvasjs.min.js';

const headerDate = document.getElementById('header-date');
var tableSelect = document.getElementById('js-currency-table-select');
var currencyTableBody = document.getElementById('js-currency-table').getElementsByTagName('tbody')[0];
var sourceSelect = document.getElementById('js-source-select');
var targetSelect = document.getElementById('js-target-select');
var userSum = document.getElementById('js-user-sum');
var userSumOne = document.getElementById('js-target-sum');
const tabs = document.querySelectorAll('.tab__item');
const btnClose = document.querySelectorAll('.converter-form__button');
const btnReverse = document.querySelector('#btn-reverse');

async function app(){

  const date = new Date();
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  headerDate.innerHTML = date.toLocaleDateString(undefined, dateOptions);
  let initialSourceCurrency = 'USD';
  let initialTargetCurrency = 'UAH';
  getSelectOptions(sourceSelect, initialSourceCurrency);
  getSelectOptions(targetSelect, initialTargetCurrency);
  getSelectOptions(tableSelect, initialSourceCurrency);
  const converterForm = document.querySelector('#js-converter-form');
  const formEvents = ['change', 'input'];
  let field1 = new UserField(userSum, sourceSelect, userSumOne, targetSelect);
  let field2 = new UserField(userSumOne, targetSelect, userSum, sourceSelect);
  let table = new Table(tableSelect, initialSourceCurrency);
  let chart = new Chart(initialSourceCurrency, initialTargetCurrency);
  chart.renderChart(initialSourceCurrency, initialTargetCurrency);
  field1.getData();
  table.fillTable(initialSourceCurrency);
  formEvents.forEach(event => {
    converterForm.addEventListener(event, async function(event) {
      let value = event.target.value;
      switch (event.target.id) {
        case 'js-user-sum':
          field1.getData();
          break;
        case 'js-source-select':
          chart.sourceCurrency = sourceSelect.value;
          chart.targetCurrency = targetSelect.value;
          field1.inputCurVal = value;
          field1.getData();
          break;
        case 'js-target-sum':
          field2.getData();
          break;
        case 'js-target-select':
          chart.sourceCurrency = sourceSelect.value;
          chart.targetCurrency = targetSelect.value;
          field1.outputCurVal = value;
          field1.getData();
          break;
      }
      chart.renderChart();
    });
   
  })
  tableSelect.addEventListener('change', event => {
    table.currency = event.target.value;
    table.fillTable();
  });
  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      let value = e.target.innerText;
      let range = setToDate(value, sourceSelect.value);
      chart.fromDate = range.startDate;
      chart.toDate = range.endDate;
      chart.renderChart();
      let activeItems = document.getElementsByClassName('tab__item--active');
      for (let i = 0; i< activeItems.length; i++) {
        activeItems[i].classList.remove('tab__item--active');
      }
      e.target.classList.add('tab__item--active');
    });
  });
  btnReverse.addEventListener('click', async function(e) {
    field1.inputCurVal = targetSelect.value;
    field1.outputCurVal = sourceSelect.value;
    sourceSelect.value = field1.inputCurVal;
    targetSelect.value = field1.outputCurVal;
    field1.inputCurVal = sourceSelect.value;
    field1.outputCurVal = targetSelect.value;
    field1.getData();
    chart.sourceCurrency = sourceSelect.value;
    chart.targetCurrency = targetSelect.value;
    chart.renderChart();
  });
  btnClose.forEach(btn => {
    btn.addEventListener('click', function(event) {
      switch (event.target.id) {
        case 'js-btn-clear-source':
          field1.clearField();
          userSum.value = 1;
          field1.getData();
          break;
        case 'js-btn-clear-target':
          field2.clearField();
          userSumOne.value = 1;
          field2.getData();
          break;
      }
    }, false);
  });
}

class UserField {
  constructor(inputSum, inputCur, outputSum, outputCur) {
    this.inputSum = inputSum;
    this.inputSumVal = inputSum.value;
    this.inputCur = inputCur;
    this.inputCurVal = inputCur.value || 'USD';
    this.outputSum = outputSum;
    this.outputSumVal = outputSum.value;
    this.outputCur = outputCur;
    this.outputCurVal = outputCur.value || 'UAH';
  }
  getData = () => { 
    convertSum(this.inputCurVal, this.outputCurVal, this.inputSum.value, this.outputSum);
  };
  updObjects = () => {
    updateObj(this.inputSum.value, this.inputCurVal)
  };
  clearField = () => {
    this.inputSum.value = 1;
  }
}
class Table {
  constructor(select, currency) {
    this.select = select;
    this.currency = currency;
  }
  fillTable = () => setTableData(this.currency);
}

class Chart {
  constructor(sourceCurrency, targetCurrency, fromDate, toDate) {
    this.sourceCurrency = sourceCurrency;
    this.targetCurrency = targetCurrency;
    this.fromDate = fromDate;
    this.toDate = toDate;
  } 
  renderChart = () => getHistoricalRate(this.sourceCurrency, this.targetCurrency, this.fromDate, this.toDate);
}

function getSelectOptions(selectItem, cur) {
  let optionList = allCurrencies.map(item => item.value === cur ?  {...item, selected: true } : item);
  optionList.forEach(item => {
    const someOption = document.createElement('option');
    
    someOption.setAttribute('value', item.value);
    someOption.innerText = item.label;
    if (item.selected) {
      someOption.setAttribute('selected', true);
    }
    selectItem.appendChild(someOption);
  });
}

async function convertSum(source, target, amount, field) {
  const requestURL = 'https://api.exchangerate.host/convert?from=' + source + '&to='+ target + '&amount=' + amount;
  const data = await requestData(requestURL);
  setTimeout(() => {
    field.value = data.result.toFixed(2).replace(".00","");
  }, 1000);
}

async function requestData(requestURL) {
  const response = await fetch(requestURL);
  var data = await response.json();
  return data;
}

function refreshTable(){
  var rowCount = currencyTableBody.rows.length;
  for (var i=0; i < rowCount; i++) {
      currencyTableBody.deleteRow(0);
  }
}

async function setTableData(selectedCur) {
  const requestURL = 'https://api.exchangerate.host/latest?base='+selectedCur;
  let data = await requestData(requestURL);
  if (data) {
    refreshTable();
    let rates = data.rates;
    for (let key in rates) {
      let tr = document.createElement("tr");
      let td = document.createElement("td");
      let td1 = document.createElement("td");
      td.classList.add('currency-table__body-cell');
      td1.classList.add('currency-table__body-cell');
      currencyTableBody.appendChild(tr);
      tr.appendChild(td).innerText = key;
      tr.appendChild(td1).innerText = rates[key];
    }
  }
}

function renderChart(data) {
  let chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    backgroundColor: "transparent",
    axisY: {
        valueFormatString: "#0.00",
        gridColor: "transparent",
        lineColor: "transparent",
        tickColor: "transparent",
        labelFontColor: "#1b2727",
        labelFontSize: 10
    },
    axisX:{
      tickColor: "transparent",
      lineColor: "transparent",
      labelFontColor: "#1b2727",
      labelFontSize: 10
    },
    toolTip: {
			fontColor: "#1b2727",
			Content: "{x} : {y}",
      borderThickness: 0,
		},
    data: [{
        type: "spline",
        color: "#6b8e4e",
        markerSize: 5,
        xValueFormatString: "YYYY-MM-DD",
        yValueFormatString: "00.00",
        dataPoints: data
    }]
    
  });

  chart.render();
}

async function getHistoricalRate(sourceValue, targetValue, fromDate, toDate) {
  const today = new Date();
  let weekAgo = new Date();
  let countDate = today.getDate() - 7;
  weekAgo.setDate(countDate);
  sourceValue = sourceValue || 'USD';
  targetValue = targetValue || 'UAH';
  toDate = toDate || today.toISOString().split('T')[0];
  fromDate = fromDate || weekAgo.toISOString().split('T')[0];
  
  const requestURL = 'https://api.exchangerate.host/timeseries?start_date='+fromDate+'&end_date='+toDate+'&base='+sourceValue;
  let data = await requestData(requestURL);
  let historicalData = [];
  const rates = data.rates;
  for (let key in rates) {
    let data = rates[key];
    for (let innerKey in data) {
      if (innerKey === targetValue) {
        historicalData.push({x: new Date(key), y: data[innerKey]});
      }
    }
  }
  renderChart(historicalData);
}

function setToDate(value) {
  const today = new Date();
  let weekAgo = new Date();
  let monthAgo = new Date();
  let threeMonthsAgo = new Date();
  let sixMonthsAgo = new Date();
  let yearAgo = new Date();
  let threeYearsAgo = new Date();
  let startDate;
  switch (value) {
    case '1 Week':
      weekAgo.setDate(today.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case '1 Month':
      monthAgo.setMonth(today.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    case '3 Months':
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      startDate = threeMonthsAgo.toISOString().split('T')[0];
      break;
    case '6 Months':
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      startDate = sixMonthsAgo.toISOString().split('T')[0];
      break;
    case '1 Year':
      yearAgo.setFullYear(today.getFullYear() - 1);
      startDate = yearAgo.toISOString().split('T')[0];
      break;
    case '3 Years':
      threeYearsAgo.setFullYear(today.getFullYear() - 3);
      startDate = threeYearsAgo.toISOString().split('T')[0];
      break;
  }
  const endDate = today.toISOString().split('T')[0];

  const dateRange = {'startDate': startDate, 'endDate': endDate}

  return dateRange;
}

app();
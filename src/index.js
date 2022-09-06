'use strict';

import './images/logo.svg';
import { allCurrencies } from './js/custom/all-currencies.js';
import * as CanvasJS from './js/vendor/canvasjs.min.js';

var tableSelect = document.getElementById('js-currency-table-select');
var currencyTableBody = document.getElementById('js-currency-table').getElementsByTagName('tbody')[0];
var sourceSelect = document.getElementById('js-source-select');
var targetSelect = document.getElementById('js-target-select');
var userSum = document.getElementById('js-user-sum');
var userSumOne = document.getElementById('js-target-sum');
var converterForm = document.querySelector('#js-converter-form');
const tabs = document.querySelectorAll('.tab-item');
class CurrencyConverter {
  constructor() {
    let initialSourceCur = 'USD';
    let initialTargetCur = 'UAH';
    let initialSourceSum = 1;
    let formEvents = ['change', 'input'];
    addMultipleEventListeners(converterForm, formEvents);
    (async () => {
      let data = await convertIt(initialSourceSum, initialSourceCur, initialTargetCur);
      userSumOne.value = data.result;
      await setTableData(initialTargetCur, data);
      await getHistoricalRate(initialSourceCur, initialTargetCur);
    })();

    tableSelect.addEventListener('change', function() {
      const selectedCur = tableSelect.value;
      setTableData(selectedCur);
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        let value = e.target.innerText;
        setToDate(value, sourceSelect.value);
      })
    })
  
    getSelectOptions(sourceSelect, initialSourceCur);
    getSelectOptions(targetSelect, initialTargetCur);
    getSelectOptions(tableSelect, initialSourceCur);
    convertIt(initialSourceSum, initialSourceCur, initialTargetCur, userSumOne);
    changeTableValue();
  }
}

async function addMultipleEventListeners(element, events) {
  let selectedTarget;
  let outputValue;
  let sourceValue;
  let selectedSource;
  let data;
  events.forEach(event => {
    element.addEventListener(event, async function(event) {
      switch (event.target.id) {
        case 'js-source-select':
        case 'js-user-sum':
          sourceValue = userSum.value;
          selectedSource = sourceSelect.value
          selectedTarget = targetSelect.value
          outputValue = userSumOne;
          break;
        case 'js-target-sum':
        case 'js-target-select':
          sourceValue = userSumOne.value;
          selectedSource = targetSelect.value;
          selectedTarget = sourceSelect.value;
          outputValue = userSum;
          break;
      }
      data = await convertIt(sourceValue, selectedSource, selectedTarget);
      outputValue.value = data.result;
      await getHistoricalRate(selectedSource, selectedTarget)
    });
  })
}

async function requestData(requestURL) {
  const response = await fetch(requestURL);
  var data = await response.json();
  return data;
}

async function setTableData(selectedCur) {
  const requestURL = 'https://api.exchangerate.host/latest?base='+selectedCur;
  let data = await requestData(requestURL);
  if (data) {
    delete_gameboard();
    let rates = data.rates;
    for (let key in rates) {
      let tr = document.createElement("tr");
      let td = document.createElement("td");
      let td1 = document.createElement("td");
      currencyTableBody.appendChild(tr);
      tr.appendChild(td).innerText = key;
      tr.appendChild(td1).innerText = rates[key];
    }
  }
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
  setTableData(selectedCur);
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

async function convertIt(sourceValue, selectedSource, selectedTarget) {
  const requestURL = 'https://api.exchangerate.host/convert?from=' + selectedSource + '&to='+ selectedTarget + '&amount=' + sourceValue;
  let data = await requestData(requestURL);
  return data;
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

function renderChart(data) {
  let chart = new CanvasJS.Chart("chartContainer", {
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
        dataPoints: data
    }]
  });

  chart.render();
}

function clearField() {
  userSum.value = null;
  userSumOne.value = null;
}

async function setToDate(value) {
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
  let list = document.getElementsByClassName('tab-item');
  let activeItems = document.getElementsByClassName('tab-item-active');
  for (let i = 0; i< activeItems.length; i++) {
    activeItems[i].classList.remove('tab-item-active');
  }
  for (let i=0; i<list.length; i++) {
    list[i].onclick=function(){
      list[i].classList.add('tab-item-active');
    }
  }
  
  const endDate = today.toISOString().split('T')[0];
  getHistoricalRate(sourceSelect.value, targetSelect.value, startDate, endDate);
}


new CurrencyConverter();
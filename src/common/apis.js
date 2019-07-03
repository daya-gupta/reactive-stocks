import axios from 'axios';
import _ from 'lodash';
import Highcharts from 'highcharts';
import $ from 'jquery';
import moment from 'moment'

function formatDate(duration) {
    var date = moment().subtract(duration, 'days').format('L').split('/');
    var month = date.shift();
    date.splice(1,0,month);
    date.join('-');
    return date;
}

function calculateAverageVolume(arr) {
    return _.meanBy(arr, function(obj) {
        return obj.y;
    }).toFixed(2);    
}

function getPreviousProfitAndRevenue(currentIndex, chartData) {
    var profitAndRevenue = {profit: 0, revenue: 0};
    var dataArrayLength = chartData.profit.length;
    var counter = 0;
    for(var i=currentIndex-1; i>=0; i--) {
        if(chartData.profit[i]) {
            if(++counter === 4) {
                profitAndRevenue.profit = chartData.profit[i];
                profitAndRevenue.revenue = chartData.revenue[i];
                break;
            }
        }
    }
    return profitAndRevenue;
}

function getIndexOfLastNonNullActualPrice(currentIndex, chartData) {
  for(var index = currentIndex-1; index>=0; index--) {
    if(chartData.actualPrice[index]) {
      break;
    }
  }
  return index;
}

export function getAPIData(dispatch, stock, duration, callback) {
    if(!isNaN(Number(stock.symbol))) {
        // CommonFactory.toggleMessageVisibility('stock not listed in nse !!', false);
        // stock.id = stock.symbol;
        // getAPIDataBSE();
        console.log('bse stock');
        return;
    }

    var chartData = {
        days: [],
        price: [],
        volume: [],
        revenue: [],
        profit: [],
    }

    if(duration.radioModel === 1) {
        delete(chartData.volume);
        delete(chartData.revenue);
        delete(chartData.profit);
        dispatch({ type: 'LOADING', data: true });
        axios.get('http://localhost:3001/apiData?CDSymbol='+stock.symbol+'&Segment=CM&Series=EQ&CDExpiryMonth=&FOExpiryMonth=&IRFExpiryMonth=&CDDate1=&CDDate2=&PeriodType=2&Periodicity=1&Template=tame_intraday_getQuote_closing_redgreen.jsp')
        .then(function(response) {
            dispatch({ type: 'LOADING', data: false });
            console.log(response);
            var temp = null;
            if(response.data && $(response.data).find('csv') && $(response.data).find('csv').find('data')[0]) {
                temp = $($(response.data).find('csv').find('data')[0]).text().split(' ');
                temp.forEach(function(obj, index) {
                    if(index){
                        obj = _.compact(obj.split(','));
                        chartData.days.push(obj[0].split(':').splice(0,2).join(':'));
                        chartData.price.push(Math.round(obj[1]*10)/10);
                    }
                });
                renderChart(chartData);
            }
        }, function(error) {
            console.log('Error!!');
        });
    }

    chartData.days = [];
    chartData.price = [];
    chartData.volume = [];
    chartData.revenue = [];
    chartData.profit = [];

    var symbol = stock.symbol;
    if(symbol.indexOf('&')!=-1) {
        symbol = symbol.replace('&', '%26');
    };
    // duration.radioModel = duration.radioModel > 1095 ? duration.radioModel : 1095;
    var fromDate = formatDate(duration.radioModel+1);
    var toDate = formatDate(0);

    // var date = new Date();
    // var day = date.getDate();
    // var month = date.getMonth();
    // var year = date.getFullYear();
    // var toDate = day + '/' + (month + 1) + '/' +  year;
    // var date2 = new Date(year, month, day - duration - 1);
    // var day2 = date2.getDate();
    // var month2 = date2.getMonth();
    // var year2 = date2.getFullYear();
    // var fromDate = day2 + '/' + (month2 + 1) + '/' +  year2;
    
    // get hostorical data from NSE
    dispatch({ type: 'LOADING', data: true });
    axios({
        method: 'get',
        cache: true,
        // url: 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol='+symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
        url: 'http://localhost:3001/getStockData?symbol='+symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
    
        // // url: 'https://www.nseindia.com/charts/webtame/tame_intraday_getQuote_closing_redgreen.jsp?CDSymbol='+stock.symbol+'&Segment=CM&Series=EQ&CDExpiryMonth=&FOExpiryMonth=&IRFExpiryMonth=&CDDate1=&CDDate2=&PeriodType=2&Periodicity=1&Template=tame_intraday_getQuote_closing_redgreen.jsp'
        // url: '/apiData?CDSymbol='+stock.symbol+'&Segment=CM&Series=EQ&CDExpiryMonth=&FOExpiryMonth=&IRFExpiryMonth=&CDDate1=&CDDate2=&PeriodType=2&Periodicity=1&Template=tame_intraday_getQuote_closing_redgreen.jsp'
        
    }).then(function(response) {
        dispatch({ type: 'LOADING', data: false });
        var day = $(response.data);
        // var dataRows = _.compact($(day[4]).find('tr'));
        var dataRows = [...day[4].rows];
        var noOfRecords = Math.round(duration.radioModel*.7);
        var headerArray = dataRows.splice(0,1);

        dataRows = dataRows.slice(0, noOfRecords).reverse();
        dataRows.forEach(function(obj,index) {
            var dataColumns = $(obj).find('td');
            chartData.days.push(dataColumns[0].innerHTML);
            chartData.price.push(Number(dataColumns[7].innerHTML.replace(/,/g,'')));
            chartData.volume.push(Number(dataColumns[8].innerHTML.replace(/,/g,''))/1000);
            if(chartData.price[index] > chartData.price[index-1] || index === 0) {
                chartData.volume[index] = {
                    y: chartData.volume[index],
                    color: '#44B544'
                };
            }
            else {
                chartData.volume[index] = {
                    y: chartData.volume[index]
                };
            }
            chartData.profit.push(null);
            chartData.revenue.push(null);
        });
        // renderChart(chartData);
        // return;

        // get today's data from NSE   
        dispatch({ type: 'LOADING', data: true });
        axios({
            method: 'get',
            // url: 'https://www1.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol='+symbol+'&illiquid=0&smeFlag=0&itpFlag=0'
            url: 'http://localhost:3001/getStockDataNSE?symbol='+symbol+'&illiquid=0&smeFlag=0&itpFlag=0'
        }).then(function(response) {
            dispatch({ type: 'LOADING', data: false });
            var stockDetailsJSON = null;
            var jqObject = null;
            var averageVolume = 0;

            averageVolume = calculateAverageVolume(chartData.volume.slice(chartData.volume.length > 22 ? chartData.volume.length-22 : 0, chartData.volume.length));
            
            jqObject = $(response.data).find('#responseDiv');

            if(jqObject && jqObject.length && JSON.parse(jqObject.text()).data) {
                stockDetailsJSON = JSON.parse(jqObject.text()).data[0];
                // append today's data to historical data array
                // if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) !== chartData.days[chartData.days.length-1].slice(0,2)) {
                if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) != moment().date()) {
                // if(stockDetailsJSON.lastUpdateTime && stockDetailsJSON.lastUpdateTime.split(' ')[0] !== chartData.days[chartData.days.length-1].toUpperCase()) {
                    // chartData.days.push(stockDetailsJSON.lastUpdateTime.split(' ')[0]);
                    chartData.days.push(moment().date());
                    // chartData.days.push(stockDetailsJSON.secDate);
                    chartData.price.push(Number(stockDetailsJSON.lastPrice.replace(/,/g,'')));
                    // chartData.volume.push(Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000);
                    if(chartData.price[chartData.price.length-1] > chartData.price[chartData.price.length-2]) {
                        chartData.volume.push({
                            y: Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000,
                            color: '#44B544'
                        });
                    }
                    else {
                        chartData.volume.push({
                            y: Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000
                        });
                    }
                    chartData.profit.push(null);
                    chartData.revenue.push(null);
                }
            
                // compute relative values etc
                // if(chartData.days.length > 2) {
                //     $scope.latestPriceVolumeData = {
                //         price: chartData.price[chartData.price.length-1],
                //         relativePrice: Math.round((chartData.price[chartData.price.length-1]-chartData.price[chartData.price.length-2])/chartData.price[chartData.price.length-2]*10000)/100,
                //         volume: chartData.volume[chartData.volume.length-1].y,
                //         averageVolume: averageVolume,
                //         relativeVolume: Math.round((chartData.volume[chartData.volume.length-1].y)/averageVolume*100)/100
                //     };
                // }

                if(duration.radioModel > 1) {
                    // profit and revenue data from screener
                    dispatch({ type: 'LOADING', data: true });
                    axios({
                        method: 'get',
                        // url: 'https://www.screener.in/company/'+symbol+'/consolidated/'
                        // url: 'https://www.screener.in/company/'+symbol
                        url: 'http://localhost:3001/getProfitData?symbol='+symbol
                    }).then(function(response) {
                        dispatch({ type: 'LOADING', data: false });
                        console.log(response.data);
                        const quartersNode = $(response.data).find('#quarters');
                        debugger
                        const dateItems = quartersNode.find('tr')[0].querySelectorAll('th');
                        const revenueItems = quartersNode.find('tr')[1].querySelectorAll('td');
                        const profitItems = quartersNode.find('tr')[10].querySelectorAll('td');

                        var index = -1;
                    
                        if(dateItems && dateItems.length) {
                            for(var j = 1; j < dateItems.length; j++) {
                                var t_sdate=dateItems[j].innerText;                  
                                var sptdate = String(t_sdate).split(" ");
                                var myMonth = sptdate[0];
                                // var myDay = sptdate[2];
                                var myDay = 30;
                                var myYear = sptdate[1];
                                var combineDatestr = myYear + "/" + myMonth + "/" + myDay;
                                myMonth = moment(combineDatestr).format('ll').split(' ')[0];
                                combineDatestr = myDay + "-" + myMonth + "-" + myYear;

                                for(var i = 0; i < 7; i++) {
                                    combineDatestr = (myDay-i) + "-" + myMonth + "-" + myYear;
                                    index = _.indexOf(chartData.days, combineDatestr);
                                    if(index !== -1) {
                                        chartData.profit[index] = Number(profitItems[j].innerText.trim().replace(/,/g, ''));
                                        chartData.revenue[index] = Number(revenueItems[j].innerText.trim().replace(/,/g, ''));
                                        break;
                                    }
                                }
                            }
                        }
                        renderChart(chartData);
                    });
                
                }

                // if(duration.radioModel > 1) {
                //     // profit and revenue data from screener
                //     $http({
                //         method: 'get',
                //         url: 'https://www.screener.in/api/company/'+symbol
                //     }).then(function(response) {
                //         var index = -1;
                    
                //         if(response.data) {
                //             for(var item in response.data.number_set.quarters[0][1]) {
                //                 var t_sdate=item;                  
                //                 var sptdate = String(t_sdate).split("-");
                //                 var myMonth = sptdate[1];
                //                 var myDay = sptdate[2];
                //                 var myYear = sptdate[0];
                //                 var combineDatestr = myYear + "/" + myMonth + "/" + myDay;
                //                 myMonth = moment(combineDatestr).format('ll').split(' ')[0];
                //                 combineDatestr = myDay + "-" + myMonth + "-" + myYear;

                //                 for(var i = 0; i < 7; i++) {
                //                     combineDatestr = (myDay-i) + "-" + myMonth + "-" + myYear;
                //                     index = _.indexOf(chartData.days, combineDatestr);
                //                     if(index !== -1) {
                //                         chartData.profit[index] = Number(response.data.number_set.quarters[9][1][item]);
                //                         chartData.revenue[index] = Number(response.data.number_set.quarters[0][1][item]);
                //                         break;
                //                     }
                //                 }
                //             }
                //         }
                //         CommonFactory.renderChart(chartData);
                //     });
                
                // }
                renderChart(chartData);

            }
        });
    }, function(error) {
        // CommonFactory.toggleMessageVisibility('Something went wrong. Please try after some time !!', false);
    });

    function renderChart(data) {
        window.chartData = data;
  
        // manipulate price array to mitigate the split effect
        for(var index=chartData.profit.length-1; index>0; index--) {
          // condition for split
          if(chartData.price[index-1]/chartData.price[index]>1.3) {
            var splitRatio = Math.round(chartData.price[index-1]*100/chartData.price[index])/100;
            for(var innerIndex=index-1; innerIndex>=0; innerIndex--) {
              chartData.price[innerIndex] = chartData.price[innerIndex]/splitRatio;
            }
          }
        }
  
        var originActualPrice = Math.round(_.sum(chartData.price.slice(0,350))/350);
        chartData.actualPrice = [];
        chartData.actualPriceUpper = [];
        chartData.actualPrice.length = chartData.price.length;
        chartData.actualPriceUpper.length = chartData.price.length;
  
        if(chartData.price.length > 400) {
            chartData.price.forEach(function(item, index) {
                if(index === 300) {
                    // chartData.actualPrice[index+50] = originActualPrice;
                    chartData.actualPrice[index] = originActualPrice;
                } else if(index > 300) {
                  if(chartData.profit[index] !== null) {
                    var indexOfLastNonNullActualPrice = getIndexOfLastNonNullActualPrice(index, chartData);
                    // when profit and revenue are positive;
                    if(chartData.profit[index] > 0) {
                      var previousProfitAndRevenue = getPreviousProfitAndRevenue(index, chartData);
                      var currentProfitAndRevenue = {profit: chartData.profit[index], revenue: chartData.revenue[index]};
                      var percentageProfitChange = Number(((currentProfitAndRevenue.profit - previousProfitAndRevenue.profit) / Math.abs(previousProfitAndRevenue.profit)).toFixed(2));
                      var percentageRevenueChange = Number(((currentProfitAndRevenue.revenue - previousProfitAndRevenue.revenue) / Math.abs(previousProfitAndRevenue.revenue)).toFixed(2));
                      if(percentageProfitChange + percentageRevenueChange <= .42) {
                        if(percentageProfitChange + percentageRevenueChange <= 0) {
                          if(percentageProfitChange >= .05) {
                            // increase actual price slightly
                            chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .03*(percentageProfitChange))).toFixed(2));
                          } else if(percentageProfitChange < .05 && percentageProfitChange > -.1) {
                            // keep the actual price intact
                            chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]).toFixed(2));
                          } else {
                            chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                          }
                        } else {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        } 
                        // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      } else if(percentageProfitChange + percentageRevenueChange > .42 && percentageProfitChange + percentageRevenueChange <= .84) {
                        // if most of change is driven by profit
                        if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .18 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        } else {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .25 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        }
                      } else if(percentageProfitChange + percentageRevenueChange > .84 && percentageProfitChange + percentageRevenueChange <= 1.68){
                        // if most of change is driven by profit
                        if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                          // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .1 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .15 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        } else {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .2 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        }
                      } else {
                        // if most of change is driven by profit
                        if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                          // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .08 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .12 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        } else {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .15 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        }
                      }
                    // when profit/revenue are negative;
                    } else {
                      chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*(.75)).toFixed(2));
                    }
                  }
                }
                if(!chartData.actualPrice[index]) {
                  chartData.actualPriceUpper[index] = null;
                } else {
                  chartData.actualPriceUpper[index] = Math.round(1.3 * chartData.actualPrice[index] * 100)/100;
                }
            });
  
            _.each(chartData.actualPrice, function(item, index) {
                if(!chartData.actualPrice[index]) {
                  chartData.actualPrice[index] = null;
                }
            });
        }
  
        chartData.movingAverage = [];
        var movingAverageBase = 33;
        _.each(chartData.price, function(item, index) {
          if(index < movingAverageBase) {
            chartData.movingAverage.push(null);
          } else {
            chartData.movingAverage.push(Math.round(_.sum(chartData.price.slice(index-movingAverageBase, index))/movingAverageBase));
          }
        })
  
        console.log(chartData);
  
        $(function () {
            // $('#chart-container').highcharts({
            Highcharts.chart('chart-container', {
                chart: {
                    zoomType: 'xy'
                },
                title: {
                    text: 'Stocks price - volume - earnings graph'
                },
                subtitle: {
                    text: 'Source: NA'
                },
                xAxis: [{
                    categories: chartData.days,
                    crosshair: true,
                }],
                yAxis: [{ // First yAxis
                    crosshair: true,
                    labels: {
                        format: 'Rs {value}',
                        style: {
                            color: Highcharts.getOptions().colors[0]
                        }
                    },
                    title: {
                        text: 'Price',
                        style: {
                            color: Highcharts.getOptions().colors[0]
                        }
                    },
                    max: _.max(chartData.price) > _.max(chartData.actualPrice) ? _.max(chartData.price) : _.max(chartData.actualPrice),
                    // min: _.min(chartData.price)
                    min: _.min(chartData.price) > _.min(chartData.actualPrice) ? _.min(chartData.actualPrice) : _.min(chartData.price)
                }, { // Second yAxis
                    labels: {
                        format: '{value} Cr',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    title: {
                        text: 'revenue',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    }
                  },  { // Third yAxis
                    title: {
                        text: 'Volume (thousand)',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    labels: {
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    opposite: true
                }, { // Fourth yAxis
                    gridLineWidth: 0,
                    title: {
                        text: 'Profit',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    labels: {
                        format: '{value} Cr',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    opposite: true
                }],
                tooltip: {
                    shared: true,
                      positioner: function () {
                          return { x: 800, y: 0 };
                      },
                      shadow: false,
                      borderWidth: 0
                },
                legend: {}, 
                series: [
                  {
                      name: 'Volume',
                      type: 'column',
                      yAxis: 2,
                      data: chartData.volume,
                      tooltip: {
                          valueSuffix: ' ths'
                      },
                      color: Highcharts.getOptions().colors[3]
                  }, {
                      name: 'revenue',
                      type: 'column',
                      connectNulls: true,
                      yAxis: 1,
                      data: chartData.revenue || [],
                      dashStyle: 'shortdot',
                      tooltip: {
                          valueSuffix: ' Cr'
                      },
                      color: Highcharts.getOptions().colors[1]
                  }, {
                      name: 'profit',
                      type: 'spline',
                      connectNulls: true,
                      yAxis: 3,
                      data: chartData.profit || [],
                      dashStyle: 'shortdot',
                      tooltip: {
                          valueSuffix: ' Cr'
                      },
                      color: Highcharts.getOptions().colors[2]
                  }, {
                      name: 'Actual Price',
                      type: 'spline',
                      yAxis: 0,
                      data: chartData.actualPrice,
                      connectNulls: true,
                      tooltip: {
                          valueSuffix: ''
                      },
                      color: Highcharts.getOptions().colors[4],
                      fillColor: {
                          linearGradient: [0, 0, 0, 200],
                          stops: [
                              [0, Highcharts.getOptions().colors[0]],
                              [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                          ]
                      }
                  }, {
                      name: 'Actual Price U',
                      type: 'spline',
                      yAxis: 0,
                      data: chartData.actualPriceUpper,
                      connectNulls: true,
                      dashStyle: 'shortdot',
                      tooltip: {
                          valueSuffix: ''
                      },
                      color: Highcharts.getOptions().colors[5],
                      fillColor: {
                          linearGradient: [0, 0, 0, 200],
                          stops: [
                              [0, Highcharts.getOptions().colors[0]],
                              [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                          ]
                      }
                  }, {
                      name: 'moving Price',
                      type: 'spline',
                      yAxis: 0,
                      data: chartData.movingAverage,
                      connectNulls: true,
                      dashStyle: 'shortdot',
                      tooltip: {
                          valueSuffix: ''
                      },
                      color: Highcharts.getOptions().colors[6],
                      fillColor: {
                          linearGradient: [0, 0, 0, 200],
                          stops: [
                              [0, Highcharts.getOptions().colors[0]],
                              [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                          ]
                      }
                  }, {
                      name: 'price',
                      type: 'area',
                      yAxis: 0,
                      data: chartData.price,
                      tooltip: {
                          valueSuffix: ''
                      },
                        color: Highcharts.getOptions().colors[0],
                        fillColor: {
                            linearGradient: [0, 0, 0, 200],
                            stops: [
                                [0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            ]
                        }
                  }
                ]
            });
        });
      }
}
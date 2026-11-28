/* Pure V12 forecast math. No browser, ledger writes, network, dates or implicit estimates. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AreaProfitEngine=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function money(x){return typeof x==='number'&&Number.isFinite(x)&&x>=0;}
 function calculate(input){
  input=input||{};var issues=[],contract=input.netContractValue,cost=input.actualAccruedCost,etc=input.estimatedRemainingCost,overhead=input.allocatedOverhead;
  if(!money(contract)||contract<=0)issues.push('CONTRACT_MISSING');
  if(!money(cost))issues.push('COST_INVALID');
  if(!money(etc))issues.push('ETC_MISSING');
  if(!money(overhead))issues.push('OVERHEAD_MISSING');
  if(input.basisConfirmed!==true)issues.push('BASIS_UNCONFIRMED');
  if(!input.source||!input.asOf)issues.push('PROVENANCE_MISSING');
  if(input.dataIssue)issues.push('SOURCE_REVIEW_REQUIRED');
  var ready=issues.length===0,eac=ready?cost+etc+overhead:null;
  if(ready&&!Number.isFinite(eac)){ready=false;eac=null;issues.push('TOTAL_OVERFLOW');}
  var profit=ready?contract-eac:null,margin=ready?profit/contract*100:null;
  var spread=money(contract)&&contract>0&&money(cost)?contract-cost:null;
  var cash=Number.isFinite(input.received)&&Number.isFinite(input.paid)?input.received-input.paid:null;
  return {pid:input.pid||'',ready:ready,issues:issues,netContractValue:money(contract)?contract:null,actualAccruedCost:money(cost)?cost:null,estimatedRemainingCost:money(etc)?etc:null,allocatedOverhead:money(overhead)?overhead:null,estimateAtCompletion:eac,forecastProfit:profit,forecastMarginPercent:margin,currentGrossSpread:spread,cashNet:cash,source:input.source||'',asOf:input.asOf||'',targetMargin:typeof input.targetMargin==='number'&&Number.isFinite(input.targetMargin)?input.targetMargin:null};
 }
 function portfolio(rows){
  var covered=rows.filter(function(x){return x.ready;}),contract=0,profit=0,totalKnownContract=0;
  rows.forEach(function(x){if(money(x.netContractValue))totalKnownContract+=x.netContractValue;});
  covered.forEach(function(x){contract+=x.netContractValue;profit+=x.forecastProfit;});
  var finite=Number.isFinite(contract)&&Number.isFinite(profit),complete=covered.length===rows.length&&rows.length>0&&finite;
  return {count:rows.length,covered:covered.length,missing:rows.length-covered.length,totalKnownContract:totalKnownContract,coveredContract:contract,coveredProfit:profit,coveredMarginPercent:finite&&contract>0?profit/contract*100:null,forecastProfit:complete?profit:null,forecastMarginPercent:complete&&contract>0?profit/contract*100:null,complete:complete};
 }
 function alert(row){if(!row.ready)return 'ยังประเมินไม่ได้';if(row.forecastProfit<0)return 'คาดการณ์ขาดทุน';if(row.forecastProfit===0)return 'คาดการณ์คุ้มทุน';if(row.targetMargin!==null&&row.forecastMarginPercent<row.targetMargin)return 'ต่ำกว่าเป้าหมายที่ตั้งไว้';return 'คาดการณ์มีกำไร';}
 function csvCell(value){if(value===null||value===undefined)return '""';var s=String(value);if(typeof value!=='number'&&/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function csv(rows){return '\ufeff'+rows.map(function(row){return row.map(csvCell).join(',');}).join('\r\n');}
 return Object.freeze({calculate:calculate,portfolio:portfolio,alert:alert,csv:csv});
});

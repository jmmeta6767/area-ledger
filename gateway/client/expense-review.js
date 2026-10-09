/* BEGIN expense-review module */
function expensePaymentStatus(value){
  var v=String(value==null?'':value).trim().toLowerCase();
  if(['paid','ชำระแล้ว','จ่ายแล้ว'].indexOf(v)>=0)return 'paid';
  if(['unpaid','pending','ค้างชำระ','ยังไม่ชำระ','ค้างจ่าย'].indexOf(v)>=0)return 'unpaid';
  return '';
}
function expenseReviewIssues(t){
  var issues=[];
  if(t.sub&&!expenseOcrCleanDescriptionForProject(t.sub,t.pid))issues.push('รายละเอียดคล้ายหัวตาราง');
  if(t.partner&&!expenseOcrCleanPartnerForProject(t.partner,t.pid))issues.push('ผู้รับเงินคล้ายหัวตารางหรือชื่อโครงการ');
  if(t.ocrSource&&t.sourceRowCount>1&&!t.ocrPaymentReviewed)issues.push('ตรวจสถานะชำระเงินกับรูปต้นฉบับ');
  return issues;
}
function expenseBatchPaymentFields(x,i,disabled){
  return '<label class="expense-batch-field"><span>สถานะชำระเงิน</span><select data-exp-batch="'+i+'" data-k="paymentStatus" aria-label="สถานะชำระเงิน รายการ '+(i+1)+'"'+disabled+'><option value="">ต้องเลือกสถานะ</option><option value="paid"'+(x.paymentStatus==='paid'?' selected':'')+'>จ่ายแล้ว</option><option value="unpaid"'+(x.paymentStatus==='unpaid'?' selected':'')+'>ค้างจ่าย</option></select></label>';
}
/* END expense-review module */

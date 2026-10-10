/*
 * NodeSeek Loon conversion
 * Converted from Nullwhy/Egern NodeSeek.js
 * Captures request headers when enabled, then performs scheduled attendance.
 */
const SCRIPT_NAME = "NodeSeek🎉";
const STORE_KEY = "nodeseek_headers";
const ATTEND_BASE = "https://www.nodeseek.com/api/attendance";
const DEFAULT_HEADERS = {
  "Connection":"keep-alive", "Accept-Encoding":"gzip, deflate, br",
  "Priority":"u=3, i", "Content-Type":"text/plain;charset=UTF-8",
  "Origin":"https://www.nodeseek.com", "refract-sign":"",
  "User-Agent":"Mozilla/5.0", "refract-key":"", "Sec-Fetch-Mode":"cors",
  "Cookie":"", "Host":"www.nodeseek.com", "Referer":"https://www.nodeseek.com/",
  "Accept-Language":"zh-CN,zh-Hans;q=0.9", "Accept":"*/*"
};
const HEADER_KEYS = Object.keys(DEFAULT_HEADERS);
function log(s){console.log("["+SCRIPT_NAME+"] "+s);}
function notify(subtitle,body){log(subtitle+": "+body);$notification.post(SCRIPT_NAME,subtitle,body);}
function enabled(v){return v===true || String(v).toLowerCase()==="true" || String(v)==="1";}
function value(src,key){return src[key] || src[key.toLowerCase()] || src[key.toUpperCase()] || "";}
function pick(src){var out={};HEADER_KEYS.forEach(function(k){var v=value(src||{},k);if(v)out[k]=v;});return out;}
function build(saved){var out={};HEADER_KEYS.forEach(function(k){out[k]=(saved&&saved[k])||DEFAULT_HEADERS[k];});return out;}
function finish(){ $done(); }
function capture(){
  var argument = (typeof $argument !== "undefined" && $argument) ? $argument : {};
  if(!enabled(argument.enable_capture)){log("Cookie 开关已关闭，跳过");return finish();}
  var requestHeaders = (typeof $request !== "undefined" && $request && $request.headers) ? $request.headers : {};
  var saved=pick(requestHeaders);
  if(!Object.keys(saved).length){notify("Cookie 失败","未获取到请求头，请确认使用 Request Script 并访问个人页面");return finish();}
  $persistentStore.write(JSON.stringify(saved),STORE_KEY);
  notify("Cookie 成功","请求头已保存，请关闭模块「Cookie」开关");
  finish();
}
function checkin(){
  var argument = (typeof $argument !== "undefined" && $argument) ? $argument : {};
  var fixed=enabled(argument.fixed_legs);
  var url=ATTEND_BASE+"?random="+(fixed?"false":"true");
  var raw=$persistentStore.read(STORE_KEY);
  if(!raw){notify("缺少请求头","请先打开 Cookie 并访问个人页面");return finish();}
  var saved;
  try{saved=JSON.parse(raw);}catch(e){notify("数据异常","请重新打开 Cookie 并访问个人页面");return finish();}
  $httpClient.post({url:url,headers:build(saved),body:"",timeout:10000},function(err,resp,data){
    if(err){notify("网络错误","请检查网络连接");log(err);return finish();}
    var status=resp.statusCode||resp.status||0,msg="";
    try{msg=(JSON.parse(data)||{}).message||"";}catch(e){}
    if(status===403)notify("被风控","403，稍后重试");
    else if(status===500)notify("服务器错误","500");
    else if(status>=200&&status<300)notify("签到成功（"+(fixed?"固定":"随机")+"）",msg||"签到完成");
    else notify("请求异常","HTTP "+status);
    finish();
  });
}
var argument = (typeof $argument !== "undefined" && $argument) ? $argument : {};
var isCapture = Object.prototype.hasOwnProperty.call(argument, "enable_capture");
if(isCapture) capture();
else checkin();


/**
 * @name	CeL function for date / time operations.
 * @fileoverview
 * 本檔案包含了 date / time 的功能。
 * @since
 * 
 * TODO:<br />
 * 曆法轉換。<br />
 */

'use strict';
if (typeof CeL === 'function')
CeL.run(
{
name:'data.date',
require : 'data.code.parse_escape|data.native.pad|data.native.set_bind',

code : function(library_namespace) {

//	requiring
var parse_escape, pad, set_bind;
eval(this.use());


/**
 * null module constructor
 * @class	date objects 的 functions
 */
var _// JSDT:_module_
= function() {
	//	null module constructor
};


/**
 * for JSDT: 有 prototype 才會將之當作 Class
 */
_// JSDT:_module_
.prototype = {
};






/*	opposite of toUTCString()
	尚不成熟！假如是type=='date'，不如用new Date()!
	string大部分可用new Date(Date.parse(str))代替!
	http://www.comsharp.com/GetKnowledge/zh-CN/TeamBlogTimothyPage_K742.aspx

var UTCDay,UTCMonth;
set_Object_value('UTCDay','Sun,Mon,Tue,Wed,Thu,Fri,Sat',1);
set_Object_value('UTCMonth','Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',1);
var fromUTCStringFormat=[[0,3,2,1,4],[0,5,1,2,3],[0,4,1,2,3]];	//	0:[Mon, 9 Aug 2004 12:05:00 GMT],1:[Thu Sep 30 18:12:08 UTC+0800 2004],2:[Sat Jun 26 18:19:46 2004]
function fromUTCString(str,format){
 var s=''+str,f;
 if(!s)return;
 if(typeof format=='undefined')if(f=Date.parse(s))return new Date(f);else return 'Unknown format!';//format=0;
 if(!isNaN(format)&&format<fromUTCStringFormat.length)f=fromUTCStringFormat[format];
 else return 'Yet support this kind of format['+format+']!\nWe support to '+fromUTCStringFormat.length+'.';
 if(!f[0])f[0]=' ';
 s=s.replace(new RegExp(f[0]+'+','g'),f[0]).split(f[0]);
 if(s.length<f.length)return 'The item length of data: '+s.length+' is less then format['+format+']: '+f.length+'!\n'+s.join(',');// new Date
 if(f.length==5)s[f[4]]=s[f[4]].split(':');
 else if(f.length==7)s[f[4]]=[s[f[4]],s[f[5]],s[f[6]]];
 else return 'Illegal date format!';
 if(format==1&&s[4].match(/([+-]\d{2})/))s[f[4]][0]=parseInt(s[f[3]][0])+parseInt(RegExp.$1);
 library_namespace.debug(str+'\n'+s[f[1]]+','+s[f[2]]+'('+UTCMonth[s[f[2]]]+'),'+s[f[3]]+','+s[f[4]][0]+','+s[f[4]][1]+','+s[f[4]][2]);
 //	check,可以包括星期
 if( !(s[f[2]]=UTCMonth[s[f[2]]]) || !(s=new Date(s[f[1]],s[f[2]],s[f[3]],s[f[4]][0],s[f[4]][1],s[f[4]][2])) )	//	Date.UTC()
  s='Input data error!';
 return s;
}
*/

//----------------------------------------------------------------------------------------------------------------------------------------------------------//


/**
 * convert the string to Date object.
 * 
 * @example <code>
 * '2003/1-4 12:53:5.45PM'.to_Date('CST').format();
 * '12:53:5.45PM 2003/1-4'.to_Date('CST').format();
 * </code>
 * 
 * @param {String}date_string
 *            date string
 * @param {Object}options {
 *            <br />
 *            {String|RegExp}format: the format used.<br />
 *            {Function}parser: the parser used. if set to unrecognized (e.g.,
 *            null) parser, it will use Date.parse() ONLY.<br />
 *            {String|Number}zone: 設定 date_string 之 time zone or country (e.g.,
 *            'CST', 'TW') || 時差 in hour (例如 TW: UTC+8 → 8, 可使用.5).<br />
 *            {Date}reform: 對某些特殊 paser，如 CE，需要特別設定改曆日期時用。<br />
 *            <br />
 *            {Boolean}period_end:<br />
 *            將指定內容視為一時段，並取得此期間之結束（終結）時間，因此 parse 後將得到第一個不屬於此範圍之時刻。<br />
 *            e.g., '2000/5' → 2000/6/1 0:0:0<br />
 *            e.g., '5/3' → 5/4 0:0:0<br />
 *            e.g., '5/3 12:' → 5/4 13:0:0<br />
 *            e.g., '5/3 12:50' → 5/4 12:51:0<br /> }
 * 
 * @returns {Date} new Date
 * @since 2012/3/22 23:58:38 重構並測試。
 * @see <a href="http://msdn.microsoft.com/zh-tw/library/t5580e8h.aspx"
 *      accessdate="2012/3/23 23:26">JScript Date 物件</a>
 */
function String_to_Date(date_string, options) {
	//	檢測輸入引數(arguments)，將之正規化(normalization)，處理、轉換為規範之標準型態。
	library_namespace.debug('parse (' + typeof date_string + ') [' + date_string
			+ ']', 3, 'String_to_Date');

	if (typeof date_string === 'date')
		// 應對在 Excel 等外部程式會出現的東西。
		return new Date(date_string);
	if (library_namespace.is_type(date_string, 'Date'))
		return date_string;

	if (!date_string) {
		// this.toString();
		//date_string = this.valueOf();
		return;
	}

	var tmp,
	minute_offset;

	if (!library_namespace.is_Object(options)) {
		tmp = options;
		options = library_namespace.null_Object();
		if (tmp)
			if (tmp in String_to_Date.parser)
				options.parser = String_to_Date.parser[tmp];
			else if ((tmp in String_to_Date.zone) || !isNaN(tmp))
				options.zone = tmp;
			else
				//	判斷是否為正規 format。
				options.format = tmp;
	}

	//	設定指定 time zone 之 offset in minutes.
	tmp = options.zone;

	library_namespace.debug('設定 time zone / offset hours: ' + tmp, 2);
	if (tmp in String_to_Date.zone)
		tmp = String_to_Date.zone[tmp];
	//	TODO: for Daylight Saving Time (DST) time zones, etc.
	if (library_namespace.is_Function(tmp))
		tmp = tmp();

	minute_offset = typeof tmp === 'string' && (minute_offset = tmp.match(/UTC([+-]?\d{1,2})(?:(\d{1,2))?/)) ?
			//	先嘗試 UTC+08:00 之類的標準表示法。
			60 * minute_offset[1] + (minute_offset[2] || 0) + String_to_Date.default_offset
			//	再測試純數字。
			:-12 < tmp && tmp < 12 ? 60 * tmp + String_to_Date.default_offset : 0;
	library_namespace.debug('最終設定 offset ' + minute_offset + ' minutes.', 2);

	//	判別 parser。
	tmp = library_namespace.is_Function(tmp = options.parser) ? tmp
			: String_to_Date.parser[tmp] || String_to_Date.default_parser;

	if (library_namespace.is_Function(tmp)) {
		library_namespace.debug('use customize parser to parse (' + typeof date_string + ') [' + date_string + '].', 2);
		if (tmp = tmp(date_string, minute_offset, options))
			return tmp;
	}

	library_namespace.debug('無法以 parser 判別。use Date.parse() to parse.', 2);
	if (tmp = Date.parse(date_string)) {
		//	TODO: period_end 無效。
		tmp = new Date(tmp);
		tmp.setMinutes(tmp.getMinutes() - minute_offset);
		return tmp;
	}
}


//Date.parse(date_string) 與 new Date() 會自動附上的當地時間差距。
//e.g., CST: -8*60.
String_to_Date.default_offset = (new Date).getTimezoneOffset();

/*
主要指是否計算 0 year。
.no_year_0 = true: 將 astronomical year numbering 轉成一般紀年法（1 BCE→1 CE）。
僅用於計算 Gregorian calendar, Julian calendar。

normal	astronomical
2	2
1	1
-1	0
-2	-1
-3	-2
*/
String_to_Date.no_year_0 = Date_to_String.no_year_0 = true;

var stem_branch_date_pattern;
(function() {
	//	pattern of date. 當今會準確使用的時間，為 -47xx BCE (Julian day 0) 至 2xxx CE。
	var date_pattern = /(?:([-前]?(?:[0-4]?\d{3}|\d{1,3}))[\/.\-年 ])?\s*([01]?\d)(?:[\/.\-月 ]\s*([0-3]?\d)日?)?/.source,
	// pattern of time.
	time_pattern = /([0-2]?\d)[:時时]\s*(?:([0-5]?\d)(?:[:分]\s*([0-5]?\d)(?:\.(\d+))?)?)?\s*(?:([PA])M)?/i.source;
	// 日期先: date [time]
	String_to_Date_default_parser.date_first = new RegExp(date_pattern + '(?:\\s+' + time_pattern + ')?', 'i');
	// 時間先: time [date]
	String_to_Date_default_parser.time_first = new RegExp(time_pattern + '(?:\\s+' + date_pattern + ')?', 'i');

	//	將於下方作初始化。
	stem_branch_date_pattern = date_pattern;
})();

/**
 * Input {@Regexp} object and index, return new Date.
 * 
 * @param {RegExp.matchd}match
 * @param {Integer}Y
 *            year index
 * @param {Integer}m
 *            month index
 * @param {Integer}d
 *            Day of the month index
 * @param {Integer}A
 *            Ante meridiem and Post meridiem index
 * @param {Integer}H
 *            24-hour format of an hour index
 * @param {Integer}M
 *            Minutes index
 * @param {Integer}S
 *            Seconds index
 * @param {Integer}ms
 *            milliseconds index
 * @param {Integer}minute_offset
 *            (指定 time zone 之) offset in minutes.
 * @param {Integer}year_padding
 *            0~99 的年份會加上此年份。
 * @param {Boolean}period_end
 *            將指定內容視為一時段，並取得此期間之結束（終結）時間，因此 parse 後將得到第一個不屬於此範圍之時刻。<br />
 *            e.g., '2000/5' → 2000/6/1 0:0:0<br />
 *            e.g., '5/3' → 5/4 0:0:0<br />
 *            e.g., '5/3 12:' → 5/4 13:0:0<br />
 *            e.g., '5/3 12:50' → 5/4 12:51:0<br />
 * 
 * @returns {Date} new Date
 * @see <a href="http://php.net/manual/en/function.date.php"
 *      accessdate="2012/3/23 20:51">PHP: date - Manual</a>
 */
String_to_Date.match_to_Date = function match_to_Date(matched, Y, m, d, A, H, M, S, ms, minute_offset, year_padding, period_end) {
	library_namespace.debug([matched[Y], matched[m], matched[d], matched[H], matched[A], matched[M], matched[S], matched[ms]].join('/'), 2, 'String_to_Date.match_to_Date');

	var date_value,
	//	calling ToNumber
	year = +matched[Y];
	if (isNaN(year) && /^前/.test(matched[Y]))
		year = -matched[Y].slice(1);
	if (year_padding && year >= 0 && year < 100 && matched[Y].length < 3)
		year += year_padding;

	if (period_end) {
		//	IE 中，String.prototype.match() 未成功時會回傳 ''，而 !isNaN('')===true，因此無法正確判別。
		var setted = function(i) {
			return !isNaN(matched[i]) && matched[i] !== '';
		};
		// 將第一個有指定的加一即可。
		matched[setted(ms) ? ms : setted(S) ? S : setted(M) ? M
				: setted(H) ? H : setted(d) ? d
						: setted(m) ? m : setted(Y) ? Y : 0]++;
	}

	//	先設定小單位，再設定大單位：設定小單位時會影響到大單位。反之不然。
	date_value = new Date(0, 0, 0,
			(matched[A] === 'P' || matched[A] === 'p' ? 12 : 0) + (+matched[H] || 0),
			(+matched[M] || 0) - (minute_offset || 0), matched[S] || 0, matched[ms] || 0);
	// new Date(10, ..) === new Date(1910, ..)
	date_value.setFullYear(year || 0, matched[m] ? matched[m] - 1 : 0, matched[d] || 1);

	return date_value;
};

/**
 * parse date_string and return the new Date.
 * 
 * @param {String}date_string
 *            date string.
 * @param {Integer}minute_offset
 *            (指定 time zone 之) offset in minutes.
 * @param {Object}options {
 *            {Boolean}period_end:<br />
 *            將指定內容視為一時段，並取得此期間之結束（終結）時間，因此 parse 後將得到第一個不屬於此範圍之時刻。<br />
 *            e.g., '2000/5' → 2000/6/1 0:0:0<br />
 *            e.g., '5/3' → 5/4 0:0:0<br />
 *            e.g., '5/3 12:' → 5/4 13:0:0<br />
 *            e.g., '5/3 12:50' → 5/4 12:51:0<br /> }
 * 
 * @returns {Date} new Date
 */
function String_to_Date_default_parser(date_string, minute_offset, options) {
	if (library_namespace.is_type(date_string, 'Date'))
		return date_string;

	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	var date, tmp, year_padding = isNaN(options.year_padding) ? String_to_Date_default_parser.year_padding : options.year_padding,
	//	matched string
	matched;

	if (matched = date_string.match(/^[^\d\/\-:日月年]*([0-4]?\d{3}|[-前]\d{1,4})[^\d\/\-:日月]*$/))
		// 僅有 xxx/1xxx/2xxx 年(year)時的bug
		date_string = matched[1] + '/1';
	else
		//	依照中文之習慣，日期 + 時間中間可不加空格。
		date_string = date_string.replace(/日(\d)/, '日 $1');

	matched = date_string.match(String_to_Date_default_parser.date_first);
	if (matched && isNaN(matched[0])) {
		// needless
		//for ( var i = 1; i < 11; i++) matched[i] = matched[i] ? Math.floor(matched[i]) : 0;
		date = String_to_Date.match_to_Date(matched, 1, 2, 3, 8, 4, 5, 6, 7, minute_offset, year_padding, options.period_end);
		library_namespace.debug('輸入格式: 日期 (+ 時間): ' + date, 2);
	} else if (matched = date_string.match(String_to_Date_default_parser.time_first)) {
		date = String_to_Date.match_to_Date(matched, 6, 7, 8, 5, 1, 2, 3, 4, minute_offset, year_padding, options.period_end);
		library_namespace.debug('輸入格式: 時間 + 日期: 未匹配或僅有一數字: ' + date, 2);
	}

	if (matched) {
		//	$2:year, $3:month, $5:mday.
		library_namespace.debug(matched.join('<br />'), 2, 'String_to_Date_default_parser');

		// 判別未輸入時預設年份設對了沒：以最接近 Now 的為基準。
		if (!date.getFullYear() && date - new Date(0, 0, 2) > 0) {
			matched = new Date(date.getTime());
			date.setFullYear(date_string = (tmp = new Date).getFullYear());
			matched.setFullYear(date - tmp > 0 ? date_string - 1 : date_string + 1);
			if (date - tmp > 0 && date - tmp > tmp - matched || date - tmp < 0 && date - tmp < tmp - matched)
				date = matched;
		}
		return date;
	}

	//	自力無法解決。
}

// 0~99 的年份會加上此年份。
String_to_Date_default_parser.year_padding = 1900;
String_to_Date.default_parser = String_to_Date_default_parser;

String_to_Date.parser = {

	//紀年法:日本年號,元号/年号
	Japan : function() {
		//	TODO
		throw new Error(1, 'String_to_Date.parser.元号: Not Yet Implemented!');
	},

	Julian: Julian_String_to_Date,
	//	Common Era / Before the Common Era, CE / BCE. 公元/西元.
	CE : function(date_string, minute_offset, options) {
		var date_value = String_to_Date_default_parser.apply(null, arguments);
		if (!library_namespace.is_Object(options))
			options = library_namespace.null_Object();
		if (date_value < (options.reform || _.Gregorian_reform_date)) {
			options.original_input = date_string;
			// 避免重複執行 String_to_Date_default_parser。
			date_value = Julian_String_to_Date(date_value, minute_offset, options);
		}
		return date_value;
	},

	//	<a href="http://php.net/manual/en/function.date.php" accessdate="2012/3/23 20:51">PHP: date - Manual</a>
	PHP : function() {
		//	TODO
		throw new Error(1, 'String_to_Date.parser.PHP: Not Yet Implemented!');
	},
	//	<a href="http://www.freebsd.org/cgi/man.cgi?query=strftime" accessdate="2012/3/23 20:59">strftime</a>,
	//	<a href="http://hacks.bluesmoon.info/strftime/" accessdate="2012/3/23 21:9">strftime: strftime for Javascript</a>
	strftime : function() {
		//	TODO
		throw new Error(1, 'String_to_Date.parser.strftime: Not Yet Implemented!');
	}
};


//	時區縮寫。
//	<a href="http://en.wikipedia.org/wiki/List_of_time_zone_abbreviations" accessdate="2012/12/2 13:0" title="List of time zone abbreviations">time zone abbreviations</a> and offset in hour.
//	TODO: Daylight Saving Time (DST).
String_to_Date.zone = {
		//	UTC+08:00
		//	China Standard Time
		CST : 8,
		Z中國 : 8,

		JST : 9,
		Z日本 : 9,

		EST : -5,
		PST : -8,

		//	Greenwich Mean Time
		GMT : 0,
		//	Coordinated Universal Time
		UTC : 0
};

_// JSDT:_module_
.
String_to_Date = String_to_Date;






//---------------------------------------------------------


/*

test data:

CeL.run('data.date');

CeL.String_to_Date.no_year_0 = false;

CeL.assert(["1582/10/15 0:0:0.000",'1582/10/5'.to_Date('CE').format()]);

CeL.assert(["100/2/26 0:0:0.000",'100/2/28'.to_Date('CE').format()]);
CeL.assert(["100/2/27 0:0:0.000",'100/2/29'.to_Date('CE').format()]);
CeL.assert(["100/2/28 0:0:0.000",'100/3/1'.to_Date('CE').format()]);

CeL.assert(["-300/2/23 0:0:0.000",'-0300/2/28'.to_Date('CE').format()]);
CeL.assert(["-300/2/24 0:0:0.000",'-0300/2/29'.to_Date('CE').format()]);
CeL.assert(["-300/2/25 0:0:0.000",'-0300/3/1'.to_Date('CE').format()]);

CeL.assert(["-4714/11/24 0:0:0.000",'-4713/1/1'.to_Date('CE').format()]);

CeL.assert(["2000/2/27 0:0:0.000",'2000/2/26'.to_Date({parser:'CE',period_end:true}).format()]);


Date.parse('100/2/29')===Date.parse('100/3/1')
/(?:^|[^\d])29(?:[^\d]|$)/.test('100/2/29');

/(?!\d)29(?!\d|$)/.test('100/2/29');


*/

/**
 * parse proleptic Julian calendar　date_string and return the new Date.<br />
 * 
 * 借用系統內建的計時機制。其他 arguments 見 String_to_Date_default_parser()。
 * 
 * @param {String}date_string
 *            Julian calendar　date string.
 * 
 * @returns {Date} new Date
 */
function Julian_String_to_Date(date_string, minute_offset, options) {
	var date_value = String_to_Date_default_parser.apply(null, arguments),
	//
	year = date_value.getFullYear(),
	// 計算 Gregorian 與 Julian 的 different days。0年時，差了 2日。
	different_days = options && options.original_input;

	if (different_days)
		date_string = different_days;

	// fix browser Date.parse() bug for BCE.
	if (year > 0 && (/(?:^|[^a-z])B\.?C\.?E?(?:[^a-z]|$)/i.test(date_string) ||
	//
	new RegExp('(?:^|[^\d-])-' + year).test(date_string)))
		// 轉成<a href="http://en.wikipedia.org/wiki/Astronomical_year_numbering"
		// accessdate="2013/2/11 15:40" title="Astronomical year
		// numbering">天文年號</a>。
		// (BCE) 1 → 0, 2 → -1, 3 → -2, ..
		date_value
				.setFullYear(year = (String_to_Date.no_year_0 ? 1 : 0) - year);
	else if (year < 0 && String_to_Date.no_year_0)
		date_value.setFullYear(year += 1);

	// 計算 Gregorian 與 Julian 的 different days。0年時，差了 2日。
	different_days = 2 + (year / 400 | 0) - (year / 100 | 0);

	if (year % 100 === 0 && year % 400 !== 0) {
		// 有差異的當年。
		// before Julian calendar leap day.
		if (date_value.getMonth() < 2 ||
		// is Julian calendar leap day.
		date_value.getMonth() === 2
		&& date_value.getDate() === 1
		&& /(?:^|[^\d])29(?:[^\d]|$)/.test(date_string)
		)
			different_days++;
		if (year < 0)
			different_days--;
	}
	if (different_days)
		date_value.setDate(date_value.getDate() - different_days);

	return date_value;
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

/**
 * 顯示格式化日期時間 string：依照指定格式輸出日期與時間。<br />
 * TODO:<br />
 * 各 locale 有不同 format 與 time zone offset.
 * 
 * @example <code>
 * CeL.debug((new Date).format('\\%m\\x61%m/%d/%Y'));
 * 
 * var t='2001/8/7 03:35:8PM';
 * CeL.debug(t+' → '+t.to_Date('CST')+' → '+t.to_Date('CST').format('%Y年%m月%d日%H時%M分%S秒%f毫秒'));
 * CeL.assert(['2001年8月7日15時35分8秒000毫秒',t.to_Date('CST').format('%Y年%m月%d日%H時%M分%S秒%f毫秒')]);
 * CeL.assert(['2001年08月07日',t.to_Date('CST').format('%Y年%2m月%2d日')]);
 * </code>
 * 
 * @param {Date}date_value
 *            要轉換的 date, TODO? 值過小時當作時間, <0 轉成當下時間.
 * @param {Object|String|Function}options
 *            選擇性功能: {<br />
 *            {String|Function}parser: 格式字串分析器 'strftime',<br />
 *            {String}format: 格式字串 '%Y/%m/%d %H:%M:%S.%f',<br />
 *            {String}locale: 地區語系設定<br /> }
 * 
 * @returns {String} 依照指定格式格式化後輸出的日期與時間.
 * 
 * @see<br />
 * <a href="http://blog.csdn.net/xzknet/article/details/2278101" accessdate="2012/3/24 15:11" title="如何使用Javascript格式化日期显示 - 虫二的专栏~~在路上~~~ - 博客频道 - CSDN.NET">JsJava中提供了專用的類，專門對日期進行指定格式的字符串輸出</a>,<br />
 * <a href="http://www.merlyn.demon.co.uk/js-date8.htm" accessdate="2012/3/25 1:42">Merlyn - JSDT 8 : Enhancing the Object - J R Stockton</a>,<br />
 * U.S. Naval Observatory <a href="http://aa.usno.navy.mil/data/docs/JulianDate.php" accessdate="2012/3/25 1:42">Julian Date Converter</a><br />
 * ISO 8601:2004(E)
 * 
 * @_memberOf	_module_
 */
function Date_to_String(date_value, options) {
	if (typeof options === 'string')
		options = options in Date_to_String.parser ? {
			parser : Date_to_String.parser[options]
		} : {
			format : options
		};
	else if (typeof options === 'function')
		options = {
			parser : options
		};
	else if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	if (false)
	if (options.parser
			&& !library_namespace.is_Function(options.parser)
			&& !library_namespace
					.is_Function(String_to_Date.parser[options.parser]))
		library_namespace.warn('Date_to_String: 無法判斷 parser ['
				+ options.parser + ']！');

	// if (!date_value) date_value = new Date;

	// String_to_Date() 會幫忙做正規化。
	if (date_value = String_to_Date(date_value))
		return (library_namespace.is_Function(options.parser) ? options.parser
				: Date_to_String.parser[options.parser]
						|| Date_to_String.default_parser)(date_value,
								options.format,
				library_namespace.gettext ? library_namespace.gettext
						.to_standard(options.locale) : options.locale, options);

	library_namespace.warn('Date_to_String: 無法判斷 date value [' + date_value
			+ ']！');
}

//	default parser.
Date_to_String.default_parser = strftime;

Date_to_String.parser = {
	//	中國傳統曆法
	Chinese : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.Chinese: Not Yet Implemented!');
	},
	//	中國農曆日期和韓國農曆日期也不一致。日本從1685年開始，就自行編製農曆，一直到明治六年。
	Japan : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.Japan: Not Yet Implemented!');
	},
	Korean : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.Korean: Not Yet Implemented!');
	},

	//	<a href="http://php.net/manual/en/function.date.php" accessdate="2012/3/23 20:51">PHP: date - Manual</a>
	PHP : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.PHP: Not Yet Implemented!');
	},
	//	ISO 8601:2004(E)
	ISO8601 : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.ISO8601: Not Yet Implemented!');
	},
	//	.NET standard format string (standard date and time format string)	<a href="http://msdn.microsoft.com/zh-tw/library/az4se3k1.aspx" accessdate="2012/3/24 17:43">標準日期和時間格式字串</a>
	SFS : function(date_value, format, locale) {
		//	TODO
		throw new Error('Date_to_String.parser.SFS: Not Yet Implemented!');
	},
	//	<a href="http://www.freebsd.org/cgi/man.cgi?query=strftime" accessdate="2012/3/23 20:59">strftime</a>,
	//	<a href="http://hacks.bluesmoon.info/strftime/" accessdate="2012/3/23 21:9">strftime: strftime for Javascript</a>
	strftime : strftime,

	Gregorian : Date_to_Gregorian,
	Julian : Date_to_Julian,
	//	Common Era / Before the Common Era, CE / BCE.
	CE : function(date_value, format, locale, options) {
		return (date_value < (options && options.reform || _.Gregorian_reform_date) ? Date_to_Julian : Date_to_Gregorian).apply(null, arguments);
	},

	//	Turn to RFC 822 date-time
	//	<a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/toUTCString" accessdate="2012/3/24 8:5" title="toUTCString - MDN">The most common return value is a RFC-1123 formatted date stamp, which is a slightly updated version of RFC-822 date stamps.</a>
	//Date_to_RFC822[generateCode.dLK]='String_to_Date';
	RFC822 : function(date_value) {
		return date_value.toUTCString().replace(/UTC/gi, 'GMT');
	}
};


_// JSDT:_module_
.
Date_to_String = Date_to_String;


//---------------------------------------------------------


/**
 * 依照指定 strftime 格式輸出日期與時間。
 * 
 * @param {Date}date_value
 *            要格式化的日期。
 * @param {String}format
 *            輸出的格式字串。
 * @param {String}locale
 *            輸出的地區語系設定。
 * @param {Object}options
 *            選擇性功能。
 * 
 * @returns {String} 依照指定格式輸出的日期與時間。
 * 
 * @see<br />
 * <a href="http://www.freebsd.org/cgi/man.cgi?query=strftime" accessdate="2012/3/23 20:59">strftime</a>,<br />
 * <a href="http://hacks.bluesmoon.info/strftime/" accessdate="2012/3/23 21:9">strftime: strftime for Javascript</a>,
 */
function strftime(date_value, format, locale, options) {
	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	var original_Date = options.original_Date || date_value,
	/**
	 * 支援的 conversion specifications (轉換規格).
	 */
	conversion = strftime.conversion[locale] || strftime.conversion[strftime.null_domain],
	/**
	 * 所須搜尋的 conversion specifications (轉換規格) pattern.
	 */
	search = strftime.search[locale] || strftime.search[strftime.null_domain];

	function convertor(s) {
		return s.replace(search, function($0, $1, $2) {
			//	可以在 conversion 中，用
			//	this[conversion name].apply(this, arguments)
			//	來取得另一 conversion 之結果。
			var v = $2 in original_Date ? original_Date[$2]
				// original_Date[$2] 為物件本身之特殊屬性，應當排在泛用函數 conversion[$2] 之前。
				: typeof (v = conversion[$2]) === 'function' ? v.call(conversion, date_value, options)
				//
				: v in original_Date ? original_Date[v]
				// 將之當作 format。
				: /%/.test(v) ? parse_escape(v, convertor)
				//
				: v;
			//library_namespace.debug([v, $1, $2]);
			return $1 ? pad(v, $1): v;
		});
	}

	return parse_escape(format || strftime.default_format, convertor);
}

strftime.default_format = '%Y/%m/%d %H:%M:%S.%f';


/**
 * 設定支援的 conversion specifications (轉換規格).<br />
 * 將直接使用輸入，因此呼叫後若改變 conversion specifications object 將出現問題！<br />
 * 
 * @example <code>
 * library_namespace.Date_to_String.parser.strftime.set_conversion({
	date : function() {
		return this.getDate();
	}
}, 'cmn-Hant-TW');
 * </code>
 * 
 * @param {Object}conversion
 *            conversion specifications (轉換規格)。
 * @param {String}locale
 *            輸出的地區語系設定。
 * 
 * @returns {RegExp} 所須搜尋的 conversion specifications (轉換規格) pattern。
 */
strftime.set_conversion = function(conversion, locale) {
	var i, v, locale_conversion, gettext = library_namespace.gettext,
	//	escape special char.
	escape_string = function(s) {
		return s.replace(/[*?!+.()\[\]\|\-^$\\\/]/g, '\\$0');
	},
	/**
	 * 所須搜尋的 conversion specifications (轉換規格) pattern.
	 */
	search;

	if (!strftime.search) {
		library_namespace.debug('初始化 strftime', 2, 'strftime.set_conversion');
		strftime.search = library_namespace.null_Object();
		strftime.conversion = library_namespace.null_Object();
	}

	if (locale && gettext)
		locale = gettext.to_standard(locale);
	if (!locale)
		locale = strftime.null_domain;

	if (!(locale in (locale_conversion = strftime.conversion)))
		locale_conversion[locale] = library_namespace.null_Object();
	locale_conversion = locale_conversion[locale];
	for (i in conversion) {
		//	不變更引數 conversion，且允許重複添增。
		locale_conversion[i] = v = conversion[i];
		if (v in locale_conversion) {
			search = [ v ];
			while (v in locale_conversion) {
				// 處理 alias。
				locale_conversion[i] = v = locale_conversion[v];
				if (search.indexOf(v) !== NOT_FOUND)
					// 預防迴圈。
					break;
				search.push(v);
			}
		}
	}

	v = '';
	search = [];
	//	造出 search pattern。
	for (i in locale_conversion)
		if ((i = escape_string(i)).length > 1)
			search.push(i);
		else
			v += i;
	// 從長的排到短的。
	search.sort(function(a, b) {
		return b.length - a.length;
	});
	if (v)
		search.push('[' + v + ']');
	strftime.search[locale] = search = new RegExp('%(\\d?)(' + search.join('|') + ')', 'g');
	library_namespace.debug('use conversion specifications ' + locale + ': ' + search, 2, 'strftime.set_conversion');

	return search;
};

strftime.null_domain = '';

var gettext_date = library_namespace.gettext.date;

//<a href="http://help.adobe.com/zh_TW/as2/reference/flashlite/WS5b3ccc516d4fbf351e63e3d118cd9b5f6e-7923.html" accessdate="2012/3/24 15:29">Adobe Flash Platform * Date</a>
//<a href="http://msdn.microsoft.com/zh-tw/library/dca21baa.aspx" accessdate="2012/3/24 15:30">Date 物件</a>
//<a href="http://www.cppreference.com/wiki/cn/chrono/c/strftime" accessdate="2012/3/24 15:23">strftime    [C++ Reference]</a>
strftime.default_conversion = {
	// 完整年份(非兩位數的數字，近十年應為四位數的數字，如2013)
	Y : function(date_value, options) {
		return gettext_date.year(date_value.getFullYear(), options.numeral || options.locale);
	},
	// 月分 (1-12)。
	m : function(date_value, options) {
		return gettext_date.month(1 + date_value.getMonth(), options.locale);
	},
	// 月中的第幾天 (1-31)
	d : function(date_value, options) {
		return gettext_date.date(date_value.getDate(), options.locale);
	},

	// 星期 (0-6)
	w : function(date_value, options) {
		return gettext_date.date(date_value.getDay(), options.locale);
	},

	// 小時數 (0-23)
	H : function(d) {
		return d.getHours();
	},
	// 分鐘數 (0-59)
	M : function(d) {
		return d.getMinutes();
	},
	// 秒數 (0-59)
	S : function(d) {
		return d.getSeconds();
	},
	/**
	 * 毫秒(milliseconds) (000-999)
	 * 
	 * @see
	 * %f: zero-padded millisecond / microsecond:
	 * <a href="http://bugs.python.org/issue1982" accessdate="2012/3/24 12:44">Issue 1982: Feature: extend strftime to accept milliseconds - Python tracker</a>
	 */
	f : function(d) {
		var ms = d.getMilliseconds();
		return ms > 99 ? ms : ms > 9 ? '0' + ms : '00' + ms;
	},

	//	有相同開頭的時候，長的要放前面！
	//(new Date).format('%JDN')
	JDN : Date_to_JDN,
	//(new Date).format('%JD')
	JD : Date_to_JD
};

strftime.set_conversion(strftime.default_conversion, strftime.null_domain);



function Date_to_Gregorian(date_value, format, locale, options) {

	if (Date_to_String.no_year_0) {
		var Year = date_value.getYear(), FullYear = date_value.getFullYear(), UTCFullYear = date_value
				.getUTCFullYear();

		if (FullYear < 1 || UTCFullYear < 1) {
			// 處理 0 year: Gregorian 與 Julian 沒有 0 year。
			// 因為公元前之公曆閏年出現在 1, 5, 9, 13, .. BC，因此無法以「除以4」計算。
			// 應該直接改年分，而不是將時間直接將其值減掉 (0/1/1 0:-1/1/1 0:),
			// 而當作彷彿沒有 0年這段期間的存在，直接從-1年開始。
			//
			// <a
			// href="http://en.wikipedia.org/wiki/Astronomical_year_numbering"
			// accessdate="2013/2/11 15:40" title="Astronomical year
			// numbering">天文年號</a>
			// <a
			// href="http://en.wikipedia.org/wiki/Gregorian_calendar#Proleptic_Gregorian_calendar"
			// accessdate="2013/2/11 9:7">Gregorian calendar</a>
			//
			// For dates before the year 1, unlike the proleptic Gregorian
			// calendar used in the international standard ISO 8601, the traditional
			// proleptic Gregorian calendar (like the Julian calendar) does not
			// have a year 0 and instead uses the ordinal numbers 1, 2, … both for
			// years AD and BC.

			if (!library_namespace.is_Object(options))
				options = library_namespace.null_Object();

			if (!options.no_new_Date)
				//	IE 需要 .getTime()：IE8 以 new Date(Date object) 會得到 NaN！
				date_value = new Date(date_value.getTime());

			if (FullYear < 1) {
				date_value.getYear = new Function('return ' + (Year - 1));
				date_value.getFullYear = new Function('return ' + (FullYear - 1));
			}
			if (UTCFullYear < 1)
				date_value.getUTCFullYear = FullYear === UTCFullYear ?
				// 一般情況 (FullYear === UTCFullYear)。
				// else: 預防 1/1, 12/31 時，getYear() 與 getUTCFullYear() 可能會有不同值。
				// 盡量少帶入變數。
				date_value.getFullYear : new Function('return ' + (UTCFullYear - 1));

		}
	}

	return strftime(date_value, format, locale, options);
}


/*

test data:

CeL.run('data.date');

for(var y=-2000;y<2010;y++)if(y){
	CeL.assert([y+"/1/1 0:0:0.000",(y.pad(4)+'/1/1').to_Date('CE').format('CE')]);
	CeL.assert([y+"/2/28 0:0:0.000",(y.pad(4)+'/2/28').to_Date('CE').format('CE')]);
	CeL.assert([y+"/3/1 0:0:0.000",(y.pad(4)+'/3/1').to_Date('CE').format('CE')]);
	CeL.assert([y+"/12/31 0:0:0.000",(y.pad(4)+'/12/31').to_Date('CE').format('CE')]);
}
CeL.log('Basic test OK.');


CeL.Date_to_String.no_year_0 = CeL.String_to_Date.no_year_0 = false;


CeL.assert(["-300/2/28 0:0:0.000",'-0300/2/23'.to_Date().format('CE')]);
CeL.assert(["-300/2/29 0:0:0.000",'-0300/2/24'.to_Date().format('CE')]);
CeL.assert(["-300/3/1 0:0:0.000",'-0300/2/25'.to_Date().format('CE')]);

CeL.assert(["-100/2/28 0:0:0.000",'-0100/2/25'.to_Date().format('CE')]);
CeL.assert(["-100/2/29 0:0:0.000",'-0100/2/26'.to_Date().format('CE')]);
CeL.assert(["-100/3/1 0:0:0.000",'-0100/2/27'.to_Date().format('CE')]);

CeL.assert(["-99/1/3 0:0:0.000",'-0099/1/1'.to_Date().format('CE')]);

CeL.assert(["-1/1/3 0:0:0.000",'-0001/1/1'.to_Date().format('CE')]);
CeL.assert(["0/1/3 0:0:0.000",'0000/1/1'.to_Date().format('CE')]);
CeL.assert(["1/1/3 0:0:0.000",'0001/1/1'.to_Date().format('CE')]);

CeL.assert(["100/2/28 0:0:0.000",'0100/2/26'.to_Date().format('CE')]);
CeL.assert(["100/2/29 0:0:0.000",'0100/2/27'.to_Date().format('CE')]);
CeL.assert(["100/3/1 0:0:0.000",'0100/2/28'.to_Date().format('CE')]);

CeL.assert(["1582/10/4 0:0:0.000",'1582/10/14'.to_Date().format('CE')],'Gregorian calendar 改曆前。');
CeL.assert(["1582/10/15 0:0:0.000",'1582/10/15'.to_Date().format('CE')],'Gregorian calendar 改曆後。');
CeL.assert(["1582/10/5 0:0:0.000",'1582/10/15'.to_Date().format('Julian')],'Gregorian calendar 改曆後 using Julian。');

CeL.assert(["1700/2/28 0:0:0.000",'1700/3/10'.to_Date().format('Julian')],'Julian 1700 閏日前。');
CeL.assert(["1700/2/29 0:0:0.000",'1700/3/11'.to_Date().format('Julian')],'Julian 1700 閏日當日。');
CeL.assert(["1700/3/1 0:0:0.000",'1700/3/12'.to_Date().format('Julian')],'Julian 1700 閏日後。');



*/

//	代替 getDate() 用。
var leap_date = new Function('return 29');

/**
 * proleptic Julian calendar.<br />
 * 
 * 以系統內建的計時機制，<br />
 * 將擴展/外推/延伸的格里曆, proleptic Gregorian calendar<br />
 * → proleptic Julian calendar for 4713 BCE－2200 CE.
 * 
 * @param {Date}date_value
 *            要格式化的日期。
 * @param {String}format
 *            輸出的格式字串。
 * @param {String}locale
 *            輸出的地區語系設定。
 * @param {Object}options
 *            選擇性功能。
 * 
 * @returns {String} 依照指定格式輸出的日期與時間。
 * 
 * @see<br />
 *      <a
 *      href="http://en.wikipedia.org/wiki/Conversion_between_Julian_and_Gregorian_calendars"
 *      accessdate="2013/2/11 9:8">Conversion between Julian and Gregorian
 *      calendars</a>
 */
function Date_to_Julian(date_value, format, locale, options) {
	// 計算與 UTC 的差距。
	var year = date_value.getFullYear(), week_day = date_value.getDay(),
	// 計算 Gregorian 與 Julian 的 different days。0年時，差了 2日。
	different_days = 2 + (year / 400 | 0) - (year / 100 | 0);

	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();
	//	因為可能會更改 date_value，因此把本來的 date_value 放在 options 中供有需要的取用。
	options.original_Date = date_value;

	// 不改變原先的 date_value。
	// 以新的 UTC Date instance 模擬 Julian calendar。
	//	IE 需要 .getTime()：IE8 以 new Date(Date object) 會得到 NaN！
	date_value = new Date(date_value.getTime());

	if (different_days)
		date_value.setDate(date_value.getDate() + different_days);

	if (year % 100 === 0 && year % 400 !== 0) {
		// 當年 Julian 與 UTC 為不同閏年規定：格里曆當年沒有閏日，但儒略曆有。
		// 2/27 → 2/28
		// 2/28 → 2/29
		// 3/1 → 3/1

		// year < 0: 修正對負小數之模數計算。
		// 原因出自上面計算 different_days 時，其實應採用 Math.floor()。
		// Math.floor(-1.1) → -2。
		// 但以 "-1.1 | 0", "-1.1 >> 0", "~~-1.1" 會  → -1。
		// 效能:
		// http://jsperf.com/math-floor-vs-math-round-vs-parseint
		var delta = year < 0 ? -1 : 0,
		//
		month = date_value.getMonth(), day = date_value.getDate(),
		//
		is_leap_day = delta && month === 2 && day === 1
		//
		|| !delta && month === 1 && day === 28;

		if (is_leap_day)
			// 便宜行事: 不設 delta，直接把 3/1 → 2/28，再強制使 .getDate() = 29。
			// TODO: .getDay() 恐有誤。
			// 當 Julian date 2/29 閏日當日，UTC 非閏日的時候，需要特別處理。
			date_value.getDate = leap_date;

		else if (month < 2 && year === date_value.getFullYear()
		// 分水嶺: 以 Julian date 3/1 0:0 為分界。
		|| month===11 && year === date_value.getFullYear() + 1)
			// 多算的，須更正。在不同閏年當年，Julian date 3/1 前還不能加上此閏日。
			delta++;

		// else: Julian date 2/29 閏日後。

		if (delta) {
			different_days += delta;
			date_value.setDate(day + delta);
		}
	}

	// 處理 day of the week: 就算以另一個日期模擬 UTC，原先的星期不會改變。
	if (date_value.getDay() !== week_day)
		date_value.getDay = new Function('return ' + week_day);
	// TODO: .getUTCDay()

	options.no_new_Date = true;

	return Date_to_Gregorian(date_value, format, locale, options);
}



/*



There is no year 0 in the Julian system!


The Julian date for CE  1582 October  4 00:00:00.0 UT is
JD 2299159.500000

The dates 5 through 14 October, 1582, do not exist in the Gregorian Calendar!

The Julian date for CE  1582 October 15 00:00:00.0 UT is
JD 2299160.500000

JD 2299159.000000 is
CE 1582 October 03 12:00:00.0 UT  Wednesday

JD 2299160.000000 is
CE 1582 October 04 12:00:00.0 UT  Thursday

JD 2299161.000000 is
CE 1582 October 15 12:00:00.0 UT  Friday



JD      0.000000 is
BCE 4713 January 01 12:00:00.0 UT  Monday

JD      1.000000 is
BCE 4713 January 02 12:00:00.0 UT  Tuesday




The Julian date for CE     1 January  1 00:00:00.0 UT is
JD 1721423.500000

JD 1721423.000000 is
BCE    1 December 31 12:00:00.0 UT  Friday

JD 1721424.000000 is
CE    1 January 01 12:00:00.0 UT  Saturday


The Julian date for CE     1 March  1 00:00:00.0 UT is
JD 1721482.500000

JD 1721482.000000 is
CE    1 February 28 12:00:00.0 UT  Monday



The Julian date for CE  1000 February  1 00:00:00.0 UT is
JD 2086338.500000

The Julian date for CE  1000 February 29 00:00:00.0 UT is
JD 2086366.500000

JD 2086367.000000 is
CE 1000 February 29 12:00:00.0 UT  Thursday




The Julian date for CE   500 February 29 00:00:00.0 UT is
JD 1903741.500000

JD 1903742.000000 is
CE  500 February 29 12:00:00.0 UT  Tuesday




The Julian date for CE   100 March  1 00:00:00.0 UT is
JD 1757642.500000

JD 1757642.000000 is
CE  100 February 29 12:00:00.0 UT  Saturday

The Julian date for CE     4 March  1 00:00:00.0 UT is
JD 1722578.500000

JD 1722578.000000 is
CE    4 February 29 12:00:00.0 UT  Friday

The Julian date for CE  2000 January  1 12:00:00.0 UT is
JD 2451545.000000




The Julian date for BCE  1000 January  1 12:00:00.0 UT is
JD 1356174.000000


The Julian date for BCE  4000 January  1 12:00:00.0 UT is
JD 260424.000000


The Julian date for BCE  4710 January  1 12:00:00.0 UT is
JD   1096.000000


The Julian date for BCE  4701 January  1 12:00:00.0 UT is
JD   4383.000000

The Julian date for BCE  4700 January  1 12:00:00.0 UT is
JD   4749.000000

The Julian date for BCE  4700 February 28 12:00:00.0 UT is
JD   4807.000000

The Julian date for BCE   101 February 29 12:00:00.0 UT is
JD 1684592.000000



date=new Date(1582,10,15);
CeL.Date_to_JDN(new Date(1582,10,15));






test data:

CeL.run('data.date');

CeL.Date_to_String.no_year_0 = CeL.String_to_Date.no_year_0 = true;


CeL.assert([0,			CeL.Date_to_JD('-4713/1/1 12:0'.to_Date({parser:'CE',zone:0}))],'JD 0');

CeL.assert([1096,		CeL.Date_to_JD('-4710/1/1 12:0'.to_Date({parser:'CE',zone:0}))]);
CeL.assert([4383,		CeL.Date_to_JD('-4701/1/1 12:0'.to_Date({parser:'CE',zone:0}))]);
CeL.assert([4749,		CeL.Date_to_JD('-4700/1/1 12:0'.to_Date({parser:'CE',zone:0}))]);
CeL.assert([4807,		CeL.Date_to_JD('-4700/2/28 12:0'.to_Date({parser:'CE',zone:0}))]);
CeL.assert([260424,		CeL.Date_to_JD('-4000/1/1 12:0'.to_Date({parser:'CE',zone:0}))]);
CeL.assert([1356174,	CeL.Date_to_JD('-1000/1/1 12:0'.to_Date({parser:'CE',zone:0}))],'1000 BCE');

CeL.assert([1721057.5,	CeL.Date_to_JD('-0001/1/1 0:0'.to_Date({parser:'CE',zone:0}))],'-1 CE');
CeL.assert([1721057.5,	CeL.Date_to_JD('0000/1/1 0:0'.to_Date({parser:'CE',zone:0}))],'bad test: 0 CE');

CeL.assert([1721423,	CeL.Date_to_JD('-0001/12/31 12:0'.to_Date({parser:'CE',zone:0}))],'1 BCE');
CeL.assert([1721423.5,	CeL.Date_to_JD('0001/1/1 0:0'.to_Date({parser:'CE',zone:0}))],'1 CE');

CeL.assert([1722578,	CeL.Date_to_JD('0004/2/29 12:0'.to_Date({parser:'CE',zone:0}))],'4 CE leap day');
CeL.assert([1722578.5,	CeL.Date_to_JD('0004/3/1 0:0'.to_Date({parser:'CE',zone:0}))],'after 4 CE leap day');

CeL.assert([2299159.5,	CeL.Date_to_JD('1582/10/4 0:0'.to_Date({parser:'CE',zone:0}))],'before reform');
CeL.assert([2299160.5,	CeL.Date_to_JD('1582/10/15 0:0'.to_Date({parser:'CE',zone:0}))],'after reform');

CeL.assert([2451545,	CeL.Date_to_JD('2000/1/1 12:0'.to_Date({parser:'CE',zone:0}))],'標準曆元 J2000.0');



*/

//Julian Date (JD)
//<a href="http://aa.usno.navy.mil/data/docs/JulianDate.php" accessdate="2013/2/11 9:10">Julian Date Converter</a>
// CeL.assert([2451545,CeL.Date_to_JD('2000/1/1 12:'.to_Date({zone:0}))],'J2000.0 fault');
function Date_to_JD(date_value, options) {
	return ((options && options.original_Date || date_value) - Julian_Date_offset)
	/ ONE_DAY_LENGTH_VALUE;
}
//Julian Day Number (JDN)
function Date_to_JDN(date_value, options) {
	//	JDN = JD + (0 ~ .99..)
	return Math.floor(Date_to_JD(date_value, options));
}
function JD_to_Date(JD) {
	return new Date(Julian_Date_offset + ONE_DAY_LENGTH_VALUE * JD);
}

_.Date_to_JD = Date_to_JD;
_.Date_to_JDN = Date_to_JDN;
_.JD_to_Date = JD_to_Date;

//---------------------------------------------------------------------------//
//	常數計算。


//	一整天的 time 值。should be 86400000.
var ONE_DAY_LENGTH_VALUE = new Date(0, 0, 2) - new Date(0, 0, 1),
//	一整時辰的 time 值。should be 7200000.
ONE_時辰_LENGTH_VALUE = new Date(0, 0, 0, 2) - new Date(0, 0, 0, 0),

//for Julian Date (JD), Julian Day Number (JDN).
//Julian Date: 由公元前4713年1月1日，協調世界時中午12時開始所經過的天數。
//	原點實際設在  -004713-11-24T12:00:00.000Z。
//	http://www.tondering.dk/claus/cal/julperiod.php
//	http://aa.usno.navy.mil/data/docs/JulianDate.php
Julian_Date_offset = String_to_Date('-4713/1/1 12:0', {
	parser : 'Julian',
	zone : 0
}).getTime();

// 預設的 Gregorian calendar 改曆日期:
// Julian calendar → Gregorian calendar.
//
// 這天之前使用 Julian calendar。
// e.g., UTC/Gregorian 1582/10/14 → Julian 1582/10/4.
//
// 西曆改曆分界點。這天之後採用 Gregorian calendar 表示。
// 西曆以1582年10月15日為改曆分界點，Julian calendar（儒略曆）1582年10月4日的下一日為 Gregorian calendar（格里高利曆）1582年10月15日。
_.Gregorian_reform_date = new Date(1582, 9, 15);

//---------------------------------------------------------------------------//
//	文化功能。


/*

test data:

CeL.run('data.date');

//CeL.Date_to_String.no_year_0 = CeL.String_to_Date.no_year_0 = true;
CeL.String_to_Date.default_parser.year_padding = 0;

CeL.assert(["甲子",'1912年2月18日'.to_Date('CE').format({format:'%日干支',locale:'cmn-Hant-TW'})],'1912年（中華民國元年）2月18日，合農曆壬子年正月初一，是「甲子日」');

CeL.assert(["己巳",'公元前720年2月22日'.to_Date('CE').format({format:'%日干支',locale:'cmn-Hant-TW'})],'《春秋》所記，魯隱公三年夏曆二月己巳日（周平王五十一年，公元前720年2月22日）之日食');

CeL.assert(["甲子",'1923年12月17日'.to_Date('CE').format({format:'%日干支',locale:'cmn-Hant-TW'})],'1923年12月17日 甲子日');

CeL.assert(["庚辰庚辰",'1940年4月7日'.to_Date('CE').format({format:'%歲次%日干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日庚辰時");

CeL.assert(["庚辰庚辰庚辰",'1940年4月7日7時'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日庚辰時");
CeL.assert(["庚辰庚辰庚辰",'1940年4月7日8時59分59秒'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日庚辰時");
CeL.assert(["庚辰庚辰辛巳",'1940年4月7日9時'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日辛巳時");

CeL.assert(["庚辰庚辰庚辰",'2120年4月23日7時'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日庚辰時始");
CeL.assert(["庚辰庚辰庚辰",'2120年4月23日8時59分59秒'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日庚辰時止");
CeL.assert(["庚辰庚辰辛巳",'2120年4月23日9時'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"庚辰年庚辰月庚辰日辛巳時");

CeL.assert(["甲子甲子甲子",'1984/3/31 0:0'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"(甲子年丁卯月)甲子日甲子時始");
CeL.assert(["甲子甲子甲子",'1984/3/31 0:59:59.999'.to_Date('CE').format({format:'%歲次%日干支%時干支',locale:'cmn-Hant-TW'})],"(甲子年丁卯月)甲子日甲子時止");

CeL.assert(["甲子壬辰",'西元4年3月1日'.to_Date('CE').format({format:'%歲次%日干支',locale:'cmn-Hant-TW'})],"西元4年3月1日");



CeL.assert(["1616/2/27 壬午",'1616年2月壬午'.to_Date('Chinese').format({format:'%Y/%m/%d %日干支',locale:'cmn-Hant-TW'})],'String_to_Date.parser.Chinese');
CeL.assert(["1645/9/30 庚寅",'1645/9/庚寅'.to_Date('Chinese').format({format:'%Y/%m/%d %日干支',locale:'cmn-Hant-TW'})],'String_to_Date.parser.Chinese');
CeL.assert(["1645/10/10 庚子",'1645/9/庚子'.to_Date('Chinese').format({format:'%Y/%m/%d %日干支',locale:'cmn-Hant-TW'})],'String_to_Date.parser.Chinese');
CeL.assert(["1329/2/27 丙戌",'1329/2/丙戌'.to_Date('Chinese').format({format:'%Y/%m/%d %日干支',locale:'cmn-Hant-TW',parser:'CE'})],'String_to_Date.parser.Chinese: 元明宗天厯二年正月丙戌即位');



*/

//	const
//基本上與程式碼設計合一，僅表示名義，不可更改。
var NOT_FOUND = -1,
//天干. celestial stem, Heavenly Stem
STEM_LIST = '甲乙丙丁戊己庚辛壬癸',
// 地支. Earthly Branches
BRANCH_LIST = '子丑寅卯辰巳午未申酉戌亥',
// 60: lcm(STEM_LIST.length, BRANCH_LIST.length);
SEXAGENARY_CYCLE_LENGTH = 60,

//	當考慮以 CST，或以當地時間為準。
//	因為八字與經度，以及該經度與太陽的日照相對夾角有關，因此採當地時間為準。

// CE YEAR_STEM_BRANCH_OFFSET 3-12月為甲子年。
// 以此計算 new Date(0) 之 offset。
// 黃帝紀元元年 (year -2696 in proleptic Gregorian calendar) 為甲子年。
YEAR_STEM_BRANCH_OFFSET = -2696,
//	1984/3/31 0:0 (甲子年丁卯月)甲子日始: 以此計算 new Date(0) 之 offset。
DATE_STEM_BRANCH_OFFSET = new Date(1984, 2, 31),
//	1984/3/31 23:0 (甲子年丁卯月)甲子日甲子時始: 以此計算 new Date(0) 之 offset。
HOUR_STEM_BRANCH_OFFSET = new Date(1984, 2, 30, 23);

_.STEM_LIST = STEM_LIST;
_.BRANCH_LIST = BRANCH_LIST;
_.SEXAGENARY_CYCLE_LENGTH = SEXAGENARY_CYCLE_LENGTH;

_.YEAR_STEM_BRANCH_OFFSET = YEAR_STEM_BRANCH_OFFSET;

// 日干支序。
// 注意：此處"序"指的是 Array index，從 0 開始。
function date_stem_branch_index(date_value, options) {
	if (options && options.original_Date)
		date_value = options.original_Date;
	var index = (date_value - DATE_STEM_BRANCH_OFFSET) / ONE_DAY_LENGTH_VALUE;
	//	針對需要子初分日者特別處理:直接算入下一天。
	if (Date_to_String['子初分日'] && date_value.getHours() === 23)
		index++;
	if ((index %= SEXAGENARY_CYCLE_LENGTH) < 0)
		index += SEXAGENARY_CYCLE_LENGTH;
	return index;
}

// 時干支序。
// 注意：此處"序"指的是 Array index，從 0 開始。
function hour_stem_branch_index(date_value, options) {
	return ((options && options.original_Date || date_value) - HOUR_STEM_BRANCH_OFFSET) / ONE_時辰_LENGTH_VALUE;
}


// 極大程度依賴 date_pattern 的寫法！
stem_branch_date_pattern = new RegExp(stem_branch_date_pattern.replace(/\([^()]+\)日/, '(['
		+ STEM_LIST + '][' + BRANCH_LIST + '])日'));

/**
 * parse 日干支：取得最接近 date_value 之指定日干支。
 * 
 * @param {String|Integer}stem_branch
 *            指定日干支。
 * @param {Date}date_value
 *            基準日。
 * @param [options]
 * @returns
 */
function convert_stem_branch_date(stem_branch, date_value, end_date_diff) {

	if (!isNaN(stem_branch)
			|| !isNaN(stem_branch = stem_branch_to_index(stem_branch))) {

		if (!date_value)
			date_value = new Date;

		// assert: 加入干支之 date 可被正常 parse，但日干支本身會被忽略。
		// stem_branch_diff. [3]: see date_pattern.

		// 取得日干支差距。
		stem_branch -= date_stem_branch_index(date_value);

		if (!end_date_diff)
			// 設在月底。
			end_date_diff = new Date(date_value).setMonth(date_value
					.getMonth() + 1, 0)
					- date_value;
		else if (end_date_diff < 0)
			// assert: !!period_end === true
			stem_branch += end_date_diff;

		if (stem_branch < 0)
			// 轉成最接近 0 之正 index。
			stem_branch = SEXAGENARY_CYCLE_LENGTH
					+ (stem_branch % SEXAGENARY_CYCLE_LENGTH);
		if (Math.abs(end_date_diff) < stem_branch) {
			// 找出距離範圍最近的日干支。
			library_namespace.warn('convert_stem_branch_date: 所欲求之日干支 ['+stem_branch+'] 並不在範圍內！');
			if (stem_branch - Math.abs(end_date_diff) > SEXAGENARY_CYCLE_LENGTH
					- stem_branch)
				stem_branch -= SEXAGENARY_CYCLE_LENGTH;
		}
		date_value.setDate(date_value.getDate() + stem_branch
				+ (end_date_diff < 0 ? end_date_diff : 0));
	}

	return date_value;
}

_.convert_stem_branch_date = convert_stem_branch_date;

// 會變更 options!
String_to_Date.parser.Chinese = function(date_string, minute_offset, options) {
	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	if (isNaN(options.year_padding))
		options.year_padding = 0;

	var date_value = String_to_Date.parser.CE(date_string,
			minute_offset, options),
	//
	stem_branch = date_value && date_string.match(stem_branch_date_pattern),
	//
	end_date_diff, period_end;

	// for 中國年號/中華民國紀年。
	// date_value.setFullYear(1911 + date_value.getFullYear());

	if (stem_branch
	// 確定真有 match 到干支。
	// 若沒 match 到，IE 中為 ""，其他為 undefined。
	&& (stem_branch = stem_branch[3])) {
		// 取得評估日期範圍。
		options.period_end = !(period_end = options.period_end);
		end_date_diff = (String_to_Date.parser.CE(date_string, minute_offset, options) - date_value)
				/ ONE_DAY_LENGTH_VALUE;
		// assert: if (end_date_diff < 0) than !!period_end === true

		// 復原 options。
		options.period_end = period_end;

		date_value = convert_stem_branch_date(stem_branch, date_value, end_date_diff);
	}

	return date_value;
};


/*

for(i=0;i<60;i++)CeL.assert([i,CeL.stem_branch_index(CeL.to_stem_branch(i))]);

*/


/**
 * 計算干支/天干與地支<br />
 * Chinese sexagenary cycle.
 * 
 * @param {Integer}index
 *            序數 (0-59)。
 * @returns
 */
function index_to_stem_branch(index) {
	// NaN | 0 → 0, 過大的數 | 0 可能成負數。
	if (!isNaN(index = +index % SEXAGENARY_CYCLE_LENGTH)) {
		if ((index = Math.floor(index)) < 0)
			index += SEXAGENARY_CYCLE_LENGTH;

		// 10: STEM_LIST.length
		return STEM_LIST.charAt(index % 10)
		// 12: BRANCH_LIST.length
		+ BRANCH_LIST.charAt(index % 12);
	}
}


// 取得指定日干支之序數 (0-59)。
function stem_branch_to_index(stem_branch) {
	if (!stem_branch || !(stem_branch = String(stem_branch)))
		return;

	var _0 = stem_branch.charAt(0), index = STEM_LIST.indexOf(_0);
	if (stem_branch.length > 1) {
		// '甲子'
		if (index !== NOT_FOUND && (_0 = BRANCH_LIST.indexOf(stem_branch.charAt(1))) !== NOT_FOUND)
			// 解一次同餘式組
			//index = (SEXAGENARY_CYCLE_LENGTH + 6 * index - 5 * _0) % SEXAGENARY_CYCLE_LENGTH;
			index = (6 * index + 55 * _0) % SEXAGENARY_CYCLE_LENGTH;
	} else if (index === NOT_FOUND)
		// '甲' / '子'
		index = BRANCH_LIST.indexOf(_0);

	if (index >= 0)
		return index;
}


_.to_stem_branch = index_to_stem_branch;
_.stem_branch_index = function(value, options) {
	return library_namespace.is_type(value, 'Date')
			? options && options.hour ? hour_stem_branch_index(value) : date_stem_branch_index(value)
			: stem_branch_to_index(value);
};



function guess_year_stem_branch(date_value, options) {
	if (options && options.original_Date)
		date_value = options.original_Date;
	var year = date_value.getFullYear() - YEAR_STEM_BRANCH_OFFSET, month = date_value
			.getMonth(), date;
	if (month < 2)
		// 正月初一的日期落在大寒至雨水
		// （一般在公曆1月19日至2月20日）之間。
		// 立春則一般在2月4日或2月5日。
		if ((date = date_value.getDate()) < 19 && month === 0)
			// 上一年。
			year--;
		else if (date < 20 || month < 1)
			// 無法判別：需要 include 'data.date.era'!
			return '(歲次' + index_to_stem_branch(year - 1) + '或'
					+ index_to_stem_branch(year) + ')';
	return index_to_stem_branch(year);
}

_.guess_year_stem_branch = guess_year_stem_branch;


//Date_to_String['子初分日'] = false;
//Date_to_String.子初分日 = false;

strftime.set_conversion(library_namespace.extend(strftime.default_conversion, {
	歲次 : guess_year_stem_branch,
	//	alias
	年干支 : '歲次',
	年柱 : '歲次',

	日干支序 : date_stem_branch_index,
	//	計算距離甲子共有幾日，再於 index_to_stem_branch() 取模數。
	//	假定為不間斷之循環紀日。
	日干支 : function(date_value, options) {
		return index_to_stem_branch(date_stem_branch_index(date_value, options));
	},
	日柱 : '日干支',

	// 時辰干支: 計算距離甲子共有幾個時辰，再於 index_to_stem_branch() 取模數。
	//	時干支不受子初分日(子初換日/子正換日)影響。
	時干支序 : hour_stem_branch_index,
	時干支 : function(date_value, options) {
		return index_to_stem_branch(hour_stem_branch_index(date_value, options));
	},
	時柱 : '時干支',
	//	每刻15分。
	//	e.g., 子正初刻
	//	隋後普遍行百刻制，每天100刻。至順治二年（公元1645年）頒行時憲曆後，改為日96刻，每時辰八刻（初初刻、初一刻、初二刻、初三刻、正初刻、正一刻、正二刻、正三刻）[7,13,14]。自此每刻15分，無「四刻」之名。
	時刻 : function(date_value, options) {
		if (options && options.original_Date)
			date_value = options.original_Date;
		// 12: BRANCH_LIST.length
		var diff = Math.floor((date_value - HOUR_STEM_BRANCH_OFFSET) / ONE_時辰_LENGTH_VALUE) % 12;
		if (diff < 0)
			diff += 12;
		return BRANCH_LIST.charAt(diff) + (diff % 2 ? '正' : '初')
				+ '初一二三'.charAt(date_value.getMinutes() / 4 | 0) + '刻';
	},

	// 完整民國紀年年份(2 or 3位數的數字，如 98, 102)
	R : function(date_value) {
		if((date_value = date_value.getFullYear()) > 900)
			date_value -= 1911;
		return date_value;
	}
}), 'cmn-Hant-TW');




//----------------------------------------------------------------------------------------------------------------------------------------------------------//
//Tabular Islamic calendar / Hijri calendar / التقويم الهجري المجدول /
//http://en.wikipedia.org/wiki/Tabular_Islamic_calendar
//伊斯蘭曆(回回曆)
//陳垣編的《中西回史日曆》(中華書局1962年修訂重印)。
//陈氏中西回史日历冬至订误，鲁实先


/*

CeL.run('data.date');

//正解
CeL.assert(["-1/12/29",'622/7/15'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);
CeL.assert(["1/1/1",'622/7/16'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);
CeL.assert(["1/1/2",'622/7/17'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);

CeL.assert(["1/1/30",'622/8/14'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);
CeL.assert(["1/2/1",'622/8/15'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);

CeL.assert(["1/12/29",'623/7/4'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);
CeL.assert(["2/1/1",'623/7/5'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);

CeL.assert(["30/12/29",'651/8/23'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);
CeL.assert(["31/1/1",'651/8/24'.to_Date('CE').to_Tabular().slice(0,3).join('/')]);

//反解
CeL.assert(["-1,12,29",CeL.Tabular_to_Date(-1,12,29).to_Tabular().slice(0,3).join(',')]);
CeL.assert(["1,1,1",CeL.Tabular_to_Date(1,1,1).to_Tabular().slice(0,3).join(',')]);
CeL.assert(["1,1,2",CeL.Tabular_to_Date(1,1,2).to_Tabular().slice(0,3).join(',')]);

CeL.assert(["1,1,30",CeL.Tabular_to_Date(1,1,30).to_Tabular().slice(0,3).join(',')]);
CeL.assert(["1,2,1",CeL.Tabular_to_Date(1,2,1).to_Tabular().slice(0,3).join(',')]);

CeL.assert(["1,12,29",CeL.Tabular_to_Date(1,12,29).to_Tabular().slice(0,3).join(',')]);
CeL.assert(["2,1,1",CeL.Tabular_to_Date(2,1,1).to_Tabular().slice(0,3).join(',')]);

CeL.assert(["30,12,29",CeL.Tabular_to_Date(30,12,29).to_Tabular().slice(0,3).join(',')]);
CeL.assert(["31,1,1",CeL.Tabular_to_Date(31,1,1).to_Tabular().slice(0,3).join(',')]);

*/


var Tabular_cycle_years = 30, Tabular_half_cycle = 15,
//平年日數。6=(12 / 2)
//每年有12個月。奇數個月有30天，偶數個月有29天，除第12/最後一個月在閏年有30天。
Tabular_common_year_days = (30 + 29) * 6,
//每一30年周期內設11閏年。
Tabular_leaps_in_cycle = 11,
//
Tabular_cycle_days = Tabular_common_year_days * Tabular_cycle_years + Tabular_leaps_in_cycle,
// 622/7/15 18:
// 伊斯蘭曆每日以日落時分日。例如 AH 1/1/1 可與公元 622/7/16 互換，但 AH 1/1/1 事實上是從 622/7/15 的日落時算起，一直到 622/7/16 的日落前為止。
// '622/7/16'.to_Date('CE').format(): '622/7/19' === new Date(622, 6, 19)
Tabular_start_offset = String_to_Date('622/7/16', {
	parser : 'CE'
}).getTime(),
//Tabular_leap_count[shift + Tabular_cycle_years]=new Array(30:[各年於30年周期內已累積 leap days])
Tabular_leap_count = [],
// 各月累積日數。[0, 30, 30+29, 30+29+30, ..]
Tabular_month_days = [ 0 ];

(function () {
	for(var month = 0, count = 0; month < 12;)
		Tabular_month_days.push(count += (month++ %2 === 0 ? 30 : 29));
	//assert: Tabular_common_year_days === Tabular_month_days.pop();
})();

function list_leap() {
	for ( var s = -Tabular_cycle_years; s <= Tabular_cycle_years; s++) {
		for ( var year = 1, shift = s, leap = []; year <= Tabular_cycle_years; year++)
			if ((shift += Tabular_leaps_in_cycle) > Tabular_half_cycle)
				shift -= Tabular_cycle_years, leap.push(year);
		library_namespace.log(s + ': ' + leap);
	}
}

//0: 2,5,7,10,13,16,18,21,24,26,29
//-3: 2,5,8,10,13,16,19,21,24,27,29
//1: 2,5,7,10,13,15,18,21,24,26,29
//-5: 2,5,8,11,13,16,19,21,24,27,30

//shift: 小餘, -30 ~ 30.
function get_Tabular_leap_count(shift, year_serial) {
	if (0 < (shift |= 0))
		shift %= Tabular_cycle_years;
	else
		shift = 0;
	// + Tabular_cycle_years: 預防有負數。
	if (!((shift + Tabular_cycle_years) in Tabular_leap_count))
		// 計算各年於30年周期內已累積 leap days。
		for ( var year = 0, count = 0,
		// new Array(Tabular_cycle_years)
		leap_days_count = Tabular_leap_count[shift +  Tabular_cycle_years] = [ 0 ];
		//
		year < Tabular_cycle_years; year++) {
			if ((shift += Tabular_leaps_in_cycle) > Tabular_half_cycle)
				shift -= Tabular_cycle_years, count++;
			leap_days_count.push(count);
		}

	return Tabular_leap_count[shift +  Tabular_cycle_years][year_serial];
}

function Tabular_to_Date(year, month, date, shift) {
	return new Date(Tabular_start_offset +
	// 計算距離 Tabular_start_offset 日數。
	(Math.floor((year = year < 0 ? year | 0 : year > 0 ? year - 1 : 0) / Tabular_cycle_years) * Tabular_cycle_days
	// 添上閏年數。
	+ get_Tabular_leap_count(shift,
	// 確認 year >=0。
	(year %= Tabular_cycle_years) < 0 ? (year += Tabular_cycle_years) : year )
	// 添上年之日數。
	+ year * Tabular_common_year_days
	// 添上月之日數。
	+ Tabular_month_days[(month || 1) - 1]
	// 添上日數。
	+ (date || 1) - 1 ) * ONE_DAY_LENGTH_VALUE);
}

//[ year, month, date, 餘下時間值(單位:日) ]
function Date_to_Tabular(date, shift) {
	var month,
	// 距離 Tabular_start_offset 的日數。
	tmp = (date - Tabular_start_offset) / ONE_DAY_LENGTH_VALUE,
	//
	delta = tmp - (date = Math.floor(tmp)),
	// 距離 Tabular_start_offset 的30年周期之年數。
	year = Math.floor(date / Tabular_cycle_days) * Tabular_cycle_years;

	// 本30年周期內之日數。
	date %= Tabular_cycle_days;
	// 保證 date >=0。
	if (date < 0)
		date += Tabular_cycle_days;

	// 本30年周期內之年數: 0~30。
	// 30: 第29年年底。
	tmp = (date / Tabular_common_year_days) | 0;
	year += tmp;
	date %= Tabular_common_year_days;

	// 求出為本年第幾天之序數。
	// 減去累積到第 tmp 年首日，應該有幾個閏日。
	date -= get_Tabular_leap_count(shift, tmp);
	if (date < 0)
		// 退位
		year--, date += Tabular_common_year_days;

	// 至此確定年序數與求出本年第幾天之序數。

	// 這邊的計算法為 Tabular Islamic calendar 特殊設計過，並不普適。
	// 理據: 每月日數 >=29 && 末月累積日數 - 29*月數 < 29 (不會 overflow)

	// tmp 可能是本月，或是下月累積日數。
	tmp = Tabular_month_days[ month = (date / 29) | 0 ];
	if (date < tmp)
		// tmp 是下月累積日數。
		tmp = Tabular_month_days[ --month ];
	// 本月日數。
	date -= tmp;

	// 序數→日期名
	return [ year + (year < 0 ? 0 : 1), month + 1, date + 1, delta ];
}


_.Tabular_to_Date = Tabular_to_Date;

//----------------------------------------------------------------------------------------------------------------------------------------------------------//



/*
mode:
	+4:不顯示時間,
	+3:顯示時間至時,
	+2:顯示時間至分,
	+1:顯示時間至秒,
	+0:顯示時間至毫秒(milliseconds)

	+32(4<<3):不顯示日期,
	+24(3<<3):顯示日期mm/dd,
	+16(2<<3):顯示日期yyyy/mm,
	+8(1<<3):顯示日期yyyy/mm/dd(星期),
	+0:顯示日期yyyy/mm/dd

	+64(1<<6):input UTC
	+128(2<<6):output UTC

NOTE:
在現有時制下要轉換其他時區之時間成正確time:
d=_其他時區之時間_;
diff=其他時區之時差(例如 TW: UTC+8)
d.setTime(d.getTime()-60000*((new Date).getTimezoneOffset()+diff*60))

*/

/**
 * 顯示格式化日期 string
 * 
 * @deprecated use Date_to_String.
 * 
 * @param date_value
 *            要轉換的 date, 值過小時當作時間, <0 轉成當下時間
 * @param {Number}
 *            mode 要轉換的 mode
 * @param {Boolean}
 *            zero_fill 對 0-9 是否補零
 * @param {String}
 *            date_separator date separator
 * @param {String}
 *            time_separator time separator
 * @return {String} 格式化後的日期
 * @example alert(format_date());
 * @since 2003/10/18 1:04 修正
 * @since 2010/4/16 10:37:30 重構(refactoring)
 * @requires to_fixed
 * @see http://www.merlyn.demon.co.uk/js-dates.htm,
 *      http://aa.usno.navy.mil/data/docs/JulianDate.html
 * @_memberOf _module_
 */
function format_date(date_value, mode, zero_fill, date_separator, time_separator) {
	//library_namespace.debug('[' + (typeof date_value) + '] ' + date_value + ', mode: ' + mode);

	// initiate
	if (!mode)
		mode = 0;

	var output_UTC, a, b = mode, time_mode, return_string = '',
	show_number = zero_fill ? function(n) {
		return n > 9 ? n : '0' + n;
	} : function(n) {
		return n;
	};

	//	date & time mode
	mode %= 64;
	//	UTC mode
	b = (b - mode) / 64;
	//	input UTC
	a = b % 2 == 1 ? 1 : 0;
	output_UTC = b - a === 1;

	time_mode = mode % 8;
	//	date mode
	mode = (mode - time_mode) / 8;
	// time_mode > 4 && mode > 3: error mode: 沒啥好顯示的了

	//	處理各種不同的 date
	b = typeof date_value;
	if (b === 'number' && date_value >= 0){
		// 全球標準時間(UCT)與本地時間之差距
		// UTC time = local time + format_date.UTC_offset(milliseconds)
		if (!a && isNaN(a = format_date.UTC_offset))
			//	input UTC 時之差距(milliseconds)
			//	.getTimezoneOffset() is in minute. 60*1000(milliseconds)=6e4(milliseconds)
			a = format_date.UTC_offset = 6e4 * (new Date).getTimezoneOffset();

		// 值過小時當作時間: d<90000000~24*60*60*1000，判別為當天，只顯示時間。不允許 d<0！
		date_value = new Date(Math.abs(a += date_value) < 9e7 ? a : date_value);
		mode = 32;
	} else if (b === 'string' && (a = date_value.toDate()))
		date_value = a;
	else if (b === 'date')
		// 應對在 Excel 等外部程式會出現的東西。
		date_value = new Date(date_value);
	else if (
			//	http://www.interq.or.jp/student/exeal/dss/ejs/1/1.html
			//	引数がオブジェクトを要求してくる場合は instanceof 演算子を使用します
			//	typeof date_value!=='object'||date_value.constructor!=Date
			!(date_value instanceof Date))
		//	new Date === new Date()
		date_value = new Date;


	// 處理 date
	if (mode < 4) {
		return_string = show_number((output_UTC ? date_value.getUTCMonth()
				: date_value.getMonth()) + 1);
		if (!date_separator)
			date_separator = '/';
		if (mode < 3)
			return_string = (output_UTC ? date_value.getUTCFullYear() : date_value
					.getFullYear())
					+ date_separator + return_string;
		if (mode !== 2) {
			return_string += date_separator
			+ show_number(output_UTC ? date_value.getUTCDate() : date_value
					.getDate());
			if (mode === 1)
				return_string += '(' + (output_UTC ? date_value.getUTCDay()
						: date_value.getDay()) + ')';
		}
	}

	// 處理 time
	if (time_mode < 4) {
		if (mode < 4)
			// 日期 & 時間中間分隔
			return_string += ' ';
		if (!time_separator)
			time_separator = ':';
		return_string += show_number(output_UTC ? date_value.getUTCHours()
				: date_value.getHours());
		if (time_mode < 3) {
			return_string += time_separator
			+ show_number(output_UTC ? date_value.getUTCMinutes()
					: date_value.getMinutes());
			if (time_mode < 2)
				return_string += time_separator
				+ (time_mode ? show_number(output_UTC ? date_value
						.getUTCSeconds() : date_value.getSeconds())
						: (output_UTC ? date_value.getUTCSeconds()
								+ date_value.getUTCMilliseconds() / 1e3
								: date_value.getSeconds() + date_value.getMilliseconds() / 1e3
							).to_fixed(3));
		}
	}

	return return_string;
};




library_namespace.extend({
	to_Date : set_bind(String_to_Date)
}, String.prototype, null, 'function');

library_namespace.extend({
	format : set_bind(Date_to_String),
	to_Tabular : set_bind(Date_to_Tabular)
}, Date.prototype, null, 'function');


return (
	_// JSDT:_module_
);
}


});


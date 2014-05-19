
/**
 * @name	CeL function for calendrical calculations.
 * @fileoverview
 * 本檔案包含了曆法轉換的功能。
 * @since
 * 2014/4/12 15:37:56
 * 
 * TODO:
 * weekday name
 */

// http://www.funaba.org/calendar-conversion
// http://www.fourmilab.ch/documents/calendar/
// http://the-light.com/cal/converter/
// http://www.viewiran.com/calendar-converter.php
// http://keith-wood.name/calendars.html
// http://www.cc.kyoto-su.ac.jp/~yanom/pancanga/index.html


'use strict';
if (typeof CeL === 'function')
CeL.run(
{
name : 'data.date.calendar',
require : 'data.code.compatibility.|data.native.set_bind|data.date.String_to_Date|data.date.is_leap_year',

code : function(library_namespace) {

//	requiring
var set_bind, String_to_Date, is_leap_year;
eval(this.use());


/**
 * null module constructor
 * @class	calendars 的 functions
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


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 工具函數。


// copy from data.date.
// 一整天的 time 值。should be 24 * 60 * 60 * 1000 = 86400000.
var ONE_DAY_LENGTH_VALUE = new Date(0, 0, 2) - new Date(0, 0, 1),
// 24 hours
ONE_DAY_HOURS = (new Date(1, 1, 1, -1)).getHours() | 0,
// set weekday name converter.
KEY_WEEK = 'week';

// non-negative (positive) modulo
// return [ 商, 餘數 ]
// http://stackoverflow.com/questions/14997165/fastest-way-to-get-a-positive-modulo-in-c-c
// 轉正。保證變數值非負數。
function mod(dividend, divisor) {
	return [ Math.floor(dividend / divisor),
			(dividend % divisor + divisor) % divisor ];
}


function _Date(year, month, date) {
	if (year < 100) {
		// 僅使用 new Date(0) 的話，會含入 timezone offset (.getTimezoneOffset)。
		// 因此得使用 new Date(0, 0)。
		var d = new Date(0, 0);
		d.setFullYear(year, month, date);
		return d;
	}
	return new Date(year, month, date);
}

function _time(year, month, date, hour) {
	if (year < 100) {
		// 僅使用 new Date(0) 的話，會含入 timezone offset (.getTimezoneOffset)。
		// 因此得使用 new Date(0, 0)。
		var d = new Date(0, 0);
		d.setFullYear(year, month, date, hour);
		return d;
	}
	return new Date(year, month, date, hour);
}



/**
 * format 回傳處理。
 * 
 * <code>
 * API:

Date_to_Calendar({Date}, {Object}options)

options.format = 'serial':
	return 數字序號 (numerical serial) [ {Integer}year, {Integer}month, {Integer}date ]

options.format = 'item':
	一般會:
	return [ {Integer}year, {String}month name, {Integer}date ]
	return [ {Integer}year, {String}month name, {Integer}date, {小數}餘下不到一日之時間值 remainder (單位:日) ]

options.format = 'text':
	return {String} 當地語言之表現法。常是 "weekday, date month year"。

others:
	default: text

 * </code>
 * 
 * @param {Array}date [
 *            {Integer}year, {Integer}month, {Integer}date ],<br />
 *            date[KEY_WEEK] = {Integer}weekday
 * @param {Object}options
 *            options that called
 * @param {Array|Function}to_name [
 *            {Function}year serial to name, {Function}month serial to name,
 *            {Function}date serial to name, {Function}weekday serial to name ]
 * @returns
 */
function _format(date, options, to_name, is_leap) {
	var format = options && options.format;

	if (format === 'serial')
		return date;

	if (typeof to_name === 'function')
		// 當作 month_to_name。
		date[1] = to_name(date[1], is_leap);
	else if (Array.isArray(to_name))
		to_name.forEach(function(func, index) {
			if (index === 3)
				index = KEY_WEEK;
			date[index] = func(date[index], is_leap);
		});
	else
		library_namespace.warn('_format: 無法辨識之 to_name: ' + to_name);

	if (format === 'item')
		return date;

	format = date.slice(0, 3).reverse().join(' ');
	if (date[KEY_WEEK])
		format = date[KEY_WEEK] + ', ' + format;
	return format;
}



/**
 * 創建測試器。<br />
 * test: 經過正反轉換運算，應該回到相同的日子。
 * 
 * @param {Function}to_Calendar
 * @param {Function}to_Date
 * @param {Object}options
 * @returns {Function}測試器。
 */
function new_tester(to_Calendar, to_Date, options) {
	options = Object.assign(library_namespace.null_Object(),
			new_tester.default_options, options);
	var epoch = options.epoch || to_Date.epoch || 0,
	//
	month_days = options.month_days, CE_format = options.CE_format, continued_month = options.continued_month;

	return function(start_Date, end_Date, error_limit) {
		start_Date = typeof start_Date === 'number' ? epoch + (start_Date | 0)
				* ONE_DAY_LENGTH_VALUE : start_Date - 0;
		var tmp = typeof end_Date === 'string'
				&& end_Date.trim().match(/^\+(\d+)$/);
		end_Date = tmp || typeof end_Date === 'number' ? (tmp ? start_Date
				: epoch)
				+ end_Date * ONE_DAY_LENGTH_VALUE : end_Date - 0;
		if (isNaN(start_Date) || isNaN(end_Date))
			return;

		function get_month_serial(month) {
			if (isNaN(month)) {
				var matched = month.match(/^[^\d]?(\d{1,2})$/);
				if (!matched)
					throw 'Illegal month name: ' + month;
				month = matched[1] | 0;
			}
			return month;
		}

		var start = new Date, date_name, old_date_name, error = [];
		if (!(0 < error_limit && error_limit < 1e9))
			error_limit = new_tester.default_options.error_limit;

		for (; start_Date <= end_Date && error.length < error_limit; start_Date += ONE_DAY_LENGTH_VALUE) {
			// 正解: Date → calendar date
			date_name = to_Calendar(new Date(start_Date), options);
			if (old_date_name
					//
					&& (date_name[2] - old_date_name[2] !== 1 || old_date_name[1] !== date_name[1])) {
				if (false)
					library_namespace.log((start_Date - epoch)
							/ ONE_DAY_LENGTH_VALUE + ': ' + date_name.join());
				// 確定 old_date_name 的下一個天為 date_name。
				// 月差距
				tmp = get_month_serial(date_name[1])
						- get_month_serial(old_date_name[1]);
				// 隔日。
				if (date_name[2] - old_date_name[2] === 1 ? tmp !== 0
				// 隔月/隔年。
				: date_name[2] !== 1 || !(old_date_name[2] in month_days)
						|| tmp !== 1 && (tmp !== 0
						// 這邊不再檢查年份是否差一，因為可能是閏月。
						// || date_name[0] - old_date_name[0] !== 1
						) && !continued_month(date_name[1], old_date_name[1])
						// 日期名相同。
						|| date_name[2] === old_date_name[2])
					error.push('日期名未接續: ' + old_date_name.join('/') + ' ⇨ '
							+ date_name.join('/') + ' ('
							+ (new Date(start_Date)).format(CE_format) + ')');
			}
			old_date_name = date_name;

			// 反解: calendar date → Date
			tmp = to_Date(date_name[0], date_name[1], date_name[2]);
			if (start_Date - tmp !== 0)
				error.push(start_Date + ' ('
						+ (new Date(start_Date)).format(CE_format) + ', '
						+ (start_Date - epoch) / ONE_DAY_LENGTH_VALUE
						+ ' days): ' + date_name.join('/') + ' → '
						+ tmp.format(CE_format));
		}

		library_namespace.debug((new Date - start) + ' ms, error '
				+ error.length + '/' + error_limit);
		return error;
	};
}

new_tester.default_options = {
	month_days : {
		'29' : '大月',
		'30' : '小月'
	},
	CE_format : {
		parser : 'CE',
		format : '%Y/%m/%d CE'
	},
	// 延續的月序，月序未中斷。continued/non-interrupted month serial.
	continued_month : function(month, old_month) {
		return month === 1 && (old_month === 12 || old_month === 13);
	},
	// get 數字序號 (numerical serial).
	format : 'serial',
	error_limit : 20
};


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: 伊斯蘭曆

// Tabular Islamic calendar / Hijri calendar / التقويم الهجري المجدول /
// http://en.wikipedia.org/wiki/Tabular_Islamic_calendar
// 伊斯蘭曆(回回曆)
// 陳垣編的《中西回史日曆》(中華書局1962年修訂重印)。
// 陈氏中西回史日历冬至订误，鲁实先


// There are 11 leap years in a 30 year cycle.
var Tabular_cycle_years = 30 | 0, Tabular_half_cycle = 15 | 0,
// 平年日數。6=(12個月 / 2)
// 每年有12個月。奇數個月有30天，偶數個月有29天，除第12/最後一個月在閏年有30天。
Tabular_common_year_days = (30 + 29) * 6 | 0,
// 每一30年周期內設11閏年。
Tabular_leaps_in_cycle = 11 | 0,
//
Tabular_cycle_days = Tabular_common_year_days * Tabular_cycle_years
		+ Tabular_leaps_in_cycle,

// Tabular_leap_count[shift + Tabular_cycle_years]
// = new Array( 30 : [ 各年於30年周期內已累積 intercalary days ] )
Tabular_leap_count = [],
// 各月1日累積日數。
// = [0, 30, 30+29, 30+29+30, ..]
// Tabular_month_days.length = 12
Tabular_month_days = [ 0 ];

(function() {
	for (var month = 0, count = 0; month < 12;)
		Tabular_month_days.push(count += (month++ % 2 === 0 ? 30 : 29));
	// assert: Tabular_common_year_days === Tabular_month_days.pop();
})();

function Tabular_list_leap() {
	for (var s = -Tabular_cycle_years; s <= Tabular_cycle_years; s++) {
		for (var year = 1, shift = s, leap = []; year <= Tabular_cycle_years; year++)
			if ((shift += Tabular_leaps_in_cycle) > Tabular_half_cycle)
				shift -= Tabular_cycle_years, leap.push(year);
		library_namespace.log(s + ': ' + leap);
	}
}

// 0: 2,5,7,10,13,16,18,21,24,26,29
// -3: 2,5,8,10,13,16,19,21,24,27,29
// 1: 2,5,7,10,13,15,18,21,24,26,29
// -5: 2,5,8,11,13,16,19,21,24,27,30

// shift: 小餘, -30－30.
function get_Tabular_leap_count(shift, year_serial) {
	if (0 < (shift |= 0))
		shift %= Tabular_cycle_years;
	else
		shift = 0;
	// + Tabular_cycle_years: 預防有負數。
	if (!((shift + Tabular_cycle_years) in Tabular_leap_count))
		// 計算各年於30年周期內已累積 intercalary days。
		for (var year = 0, count = 0,
		// new Array(Tabular_cycle_years)
		intercalary_days_count = Tabular_leap_count[shift + Tabular_cycle_years] = [ 0 ];
		//
		year < Tabular_cycle_years; year++) {
			if ((shift += Tabular_leaps_in_cycle) > Tabular_half_cycle)
				shift -= Tabular_cycle_years, count++;
			intercalary_days_count.push(count);
		}

	return Tabular_leap_count[shift + Tabular_cycle_years][year_serial];
}

// Tabular date to Date.
function Tabular_Date(year, month, date, shift) {
	return new Date(Tabular_Date.epoch +
	// 計算距離 Tabular_Date.epoch 日數。
	(Math.floor((year = year < 0 ? year | 0 : year > 0 ? year - 1 : 0)
	// ↑ No year 0.
	/ Tabular_cycle_years) * Tabular_cycle_days
	// 添上閏年數。
	+ get_Tabular_leap_count(shift,
	// 確認 year >=0。
	(year %= Tabular_cycle_years) < 0 ? (year += Tabular_cycle_years) : year)
	// 添上年之日數。
	+ year * Tabular_common_year_days
	// 添上月之日數。
	+ Tabular_month_days[(month || 1) - 1]
	// 添上日數。
	+ (date || 1) - 1) * ONE_DAY_LENGTH_VALUE);
}

// 622/7/15 18:0 Tabular start offset
// 伊斯蘭曆每日以日落時分日。例如 AH 1/1/1 可與公元 622/7/16 互換，
// 但 AH 1/1/1 事實上是從 622/7/15 的日落時算起，一直到 622/7/16 的日落前為止。
// '622/7/16'.to_Date('CE').format(): '622/7/19' === new Date(622, 7 - 1, 19)
Tabular_Date.epoch = String_to_Date('622/7/16', {
	parser : 'CE'
}).getTime();

var Tabular_month_name_of_serial = '|Muḥarram|Ṣafar|Rabīʿ I|Rabīʿ II|Jumādā I|Jumādā II|Rajab|Shaʿbān|Ramaḍān|Shawwāl|Dhū al-Qaʿda|Dhū al-Ḥijja'.split('|');
Tabular_Date.month_name = function(month_serial) {
	return Tabular_month_name_of_serial[month_serial];
};

Tabular_Date.is_leap = function(year, shift) {
	// 轉正。保證變數值非負數。
	if ((year %= Tabular_cycle_years) < 1)
		year += Tabular_cycle_years;
	return get_Tabular_leap_count(shift, year)
			- get_Tabular_leap_count(shift, year - 1);
};

// 有更快的方法。
function Date_to_Tabular(date, options) {
	var month,
	// 距離 Tabular_Date.epoch 的日數。
	tmp = (date - Tabular_Date.epoch) / ONE_DAY_LENGTH_VALUE,
	//
	delta = tmp - (date = Math.floor(tmp)),
	// 距離 Tabular_Date.epoch 的30年周期之年數。
	year = Math.floor(date / Tabular_cycle_days) * Tabular_cycle_years;

	// 本30年周期內之日數。
	date %= Tabular_cycle_days;
	// 保證 date >=0。
	if (date < 0)
		date += Tabular_cycle_days;

	// month: 本30年周期內之積年數: 0－30。
	// 30: 第29年年底。
	month = (date / Tabular_common_year_days) | 0;
	year += month;
	date %= Tabular_common_year_days;

	// 求出為本年第幾天之序數。
	// 減去累積到第 month 年首日，應該有幾個閏日。
	tmp = get_Tabular_leap_count(options && options.shift, month);
	if (date < tmp)
		// 退位。
		year--, date += Tabular_common_year_days
		//
		- get_Tabular_leap_count(options && options.shift, month - 1);
	else
		date -= tmp;


	// 至此確定年序數與求出本年第幾天之序數。

	// 這邊的計算法為 Tabular Islamic calendar 特殊設計過，並不普適。
	// 理據: 每月日數 >=29 && 末月累積日數 - 29*月數 < 29 (不會 overflow)

	// tmp 可能是本月，或是下月累積日數。
	tmp = Tabular_month_days[month = (date / 29) | 0];
	if (date < tmp
	// assert: month === 12: 年內最後一天。
	|| month === 12)
		// tmp 是下月累積日數。
		tmp = Tabular_month_days[--month];
	// 本月日數。
	date -= tmp;

	// 日期序數→日期名。year/month/date index to serial.
	// There is no year 0.
	if (year >= 0)
		year++;

	// [ year, month, date, 餘下時間值(單位:日) ]
	return _format([ year, month + 1, date + 1, delta ], options,
			Tabular_Date.month_name);
}

/*

CeL.run('data.date.calendar');


CeL.Tabular_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

'624/6/23'.to_Date('CE').to_Tabular({format : 'serial'})
// [2, 12, 30, 0]

CeL.Tabular_Date(3, 7, 1).format('CE')

*/
Tabular_Date.test = new_tester(Date_to_Tabular, Tabular_Date);


_.Tabular_Date = Tabular_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: הַלּוּחַ הָעִבְרִי / Hebrew calendar / Jewish Calendar / 希伯來曆 / 猶太曆計算
// https://en.wikipedia.org/wiki/Hebrew_calendar
// http://www.stevemorse.org/jcal/rules.htm
// http://www.jewishgen.org/infofiles/m_calint.htm


// Hebrew_month_serial[month_name] = month serial (1 － 12 or 13)
var Hebrew_month_serial = library_namespace.null_Object(),
// Hour is divided into 1080 parts called haliq (singular of halaqim)
Hebrew_1_HOUR = 1080 | 0,
// hour length in halaqim
Hebrew_1_DAY = 24 * Hebrew_1_HOUR | 0,
// month length in halaqim
// The Jewish month is defined to be 29 days, 12 hours, 793 halaqim.
Hebrew_1_MONTH = 29 * Hebrew_1_DAY + 12 * Hebrew_1_HOUR + 793 | 0,
// Metonic cycle length in halaqim
// Metonic cycle = 235 months (about 19 years): Hebrew calendar 採十九年七閏法
//Hebrew_1_cycle = (19 * 12 + 7) * Hebrew_1_MONTH | 0,

ONE_HOUR_LENGTH_VALUE = Date.parse('1/1/1 2:0') - Date.parse('1/1/1 1:0'),
// 1 hour of Date / 1 hour of halaqim (Hebrew calendar).
// (length of halaqim) * halaqim_to_Date_ratio = length value of Date
halaqim_to_Date_ratio = ONE_HOUR_LENGTH_VALUE / Hebrew_1_HOUR,

// http://www.stevemorse.org/jcal/rules.htm
// Molad of Tishri in year 1 occurred on Monday at 5hr, 204hq (5hr, 11mn, 20 sc)
// i.e., evening before Monday daytime at 11 min and 20 sec after 11 PM
Hebrew_epoch_halaqim = 5 * Hebrew_1_HOUR + 204 | 0,
// https://en.wikipedia.org/wiki/Molad
// The traditional epoch of the cycle was 5 hours 11 minutes and 20 seconds
// after the mean sunset (considered to be 6 hours before midnight) at the epoch
// of the Hebrew calendar (first eve of Tishrei of Hebrew year 1).
Hebrew_epoch_shift_halaqim = -6 * Hebrew_1_HOUR | 0,
// for reduce error.
Hebrew_epoch_shift = Math.round(Hebrew_epoch_shift_halaqim
		* halaqim_to_Date_ratio),
// 1/Tishri/1: Julian -3761/10/7
//
// https://en.wikipedia.org/wiki/Hebrew_calendar
// The Jewish calendar's epoch (reference date), 1 Tishrei AM 1, is equivalent
// to Monday, 7 October 3761 BC/BCE in the proleptic Julian calendar, the
// equivalent tabular date (same daylight period) and is about one year before
// the traditional Jewish date of Creation on 25 Elul AM 1, based upon the Seder
// Olam Rabbah.
//
// http://www.stevemorse.org/jcal/jcal.html
// http://www.fourmilab.ch/documents/calendar/
Hebrew_epoch = String_to_Date('-3761/10/7', {
	parser : 'Julian'
}).getTime();

// ---------------------------------------------------------------------------//
// Hebrew to Date

// Hebrew year, month, date
// get_days: get days of year
function Hebrew_Date(year, month, date, get_days) {
	if (year < 0 && !Hebrew_Date.year_0)
		// year: -1 → 0
		++year;

	var is_leap = Hebrew_Date.is_leap(year),
	//
	days = isNaN(date) ? 0 : date - 1 | 0,
	// days diff (year type)
	// add_days = -1 (defective) / 0 (normal) / 1 (complete)
	add_days = Hebrew_Date.days_of_year(year) - 354 | 0;

	if (add_days > 1)
		add_days -= 30;

	if (!month)
		// month index 0
		month = 0;
	else if (isNaN(month = Hebrew_Date.month_index(month, is_leap)))
		return;

	// month: month index (0 － 11 or 12)

	if (month > 2 || month === 2 && add_days > 0) {
		// 所有後面的月份皆須加上此 add_days。
		days += add_days;
		if (is_leap && month > 5)
			// subtract the 30 days of leap month Adar I.
			month--, days += 30;
	}

	days += (month >> 1) * (30 + 29);
	if (month % 2 === 1)
		days += 30;

	// days: days from new year day

	return get_days ? days : Hebrew_Date.new_year_days(year, days, true);
}

// Are there year 0?
// 警告：除了 Hebrew_Date(), Date_to_Hebrew() 之外，其他函數皆假定有 year 0！
Hebrew_Date.year_0 = false;

//---------------------------------------------------------------------------//
// tools for month name

// https://en.wikipedia.org/wiki/Hebrew_Academy
// Academy name of specified month serial.
// common year: Nisan: 1, Iyyar: 2, .. Adar: 12
// leap year: Nisan: 1, Iyyar: 2, .. (Adar I): 12, (Adar II/Adar/Ve'Adar): 13
(Hebrew_Date.month_name_of_serial = "|Nisan|Iyyar|Sivan|Tammuz|Av|Elul|Tishri|Marẖeshvan|Kislev|Tevet|Shvat|Adar"
		.split('|'))
//
.forEach(function(month_name, month_serial) {
	if (month_serial > 0)
		Hebrew_month_serial[month_name.toLowerCase()] = month_serial;
});
// other common names.
// all should be in lower case!
Object.assign(Hebrew_month_serial, {
	nissan : 1,
	iyar : 2,
	siwan : 3,
	tamuz : 4,
	ab : 5,
	tishrei : 7,
	heshvan : 8,
	marcheshvan : 8,
	cheshvan : 8,
	'marẖeshwan' : 8,
	chisleu : 9,
	chislev : 9,
	tebeth : 10,
	shevat : 11,
	shebat : 11,
	sebat : 11,
	// 'adar 1':12,
	// 'adar 2':12,

	// Occasionally instead of Adar I and Adar II, "Adar" and "Ve'Adar" are used
	// (Ve means 'and' thus: And Adar).
	veadar : 13,
	"ve'adar" : 13
});

// return Academy name of specified month serial.
// common year: 1: Nisan, 2: Iyyar, .. 12: Adar
// leap year: 1: Nisan, 2: Iyyar, .. 12: Adar, 13: Adar II
Hebrew_Date.month_name = function(month_serial, is_leap_year) {
	if (month_serial >= 12 && (month_serial === 13 || is_leap_year))
		return month_serial === 12 ? 'Adar I' : 'Adar II';
	return Hebrew_Date.month_name_of_serial[month_serial];
};

// return month serial.
// common year: Nisan: 1, Iyyar: 2, .. Adar: 12
// leap year: Nisan: 1, Iyyar: 2, .. (Adar I): 12, (Adar II/Adar/Ve'Adar): 13
Hebrew_Date.month_serial = function(month_name, is_leap_year) {
	if (typeof month_name === 'string') {
		// normalize month name.
		month_name = month_name.trim().toLowerCase();
		if (/^adar\s*[1i]$/i.test(month_name))
			// Only in Leap years.
			return 12;
		if (/^adar\s*(2|ii)$/i.test(month_name))
			// Only in Leap years.
			return 13;
		if (month_name === 'adar')
			if (is_leap_year)
				return 13;
			else if (is_leap_year === undefined) {
				if (library_namespace.is_debug(2))
					library_namespace
							.warn('May be 12, but will return 13 for Adar.');
				return 13;
			}
		if (month_name in Hebrew_month_serial)
			return Hebrew_month_serial[month_name];
	}

	library_namespace.err('Hebrew_Date.month_serial: Unknown month name: '
			+ month_name);
	return month_name;
};

// month: month name or serial
//
// return 0: Tishri, 1: Heshvan, ..
//
// common year: 0－11
// leap year: 0－12
//
// for numeral month name (i.e. month serial):
// Hebrew year start at 7/1, then month 8, 9, .. 12, 1, 2, .. 6.
//
// common year: 7→0 (Tishri), 8→1, .. 12→5 (Adar),
// 1→6 (Nisan), 2→7, .. 6→11 (Elul)
//
// leap year: 7→0 (Tishri), 8→1, .. 12→5 (Adar I), 13→6 (Adar II),
// 1→7 (Nisan), 2→8, .. 6→12 (Elul)
Hebrew_Date.month_index = function(month, is_leap_year) {
	if (isNaN(month))
		// month name to serial
		month = Hebrew_Date.month_serial(month, is_leap_year);

	if (month === (month | 0))
		if (month === 13)
			// Adar II
			return 6;
		else if (1 <= month && month <= 12 && (month -= 7) < 0)
			// leap 1→-6→7, ..
			// common: 1→-6→6, ..
			month += is_leap_year ? 13 : 12;

	if (Number.isNaN(month))
		library_namespace.err('Hebrew_Date.month_index: Unknown month: '
				+ month);
	return month;
};

//---------------------------------------------------------------------------//


/*

for (y = 0; y < 19; y++)
	if (Hebrew_Date.is_leap(y))
		console.log(y);

*/

// the years 3, 6, 8, 11, 14, 17, and 19
// are the long (13-month) years of the Metonic cycle
Hebrew_Date.is_leap = function(year) {
	year = (7 * (year | 0) + 1) % 19;
	// 轉正。保證變數值非負數。
	if (year < 0)
		year += 19;
	return year < 7;
};


/*
累積 leap:
(7 * year - 6) / 19 | 0

Simplify[12*(year - 1) + (7*year - 6)/19]
1/19 (-234 + 235 year)
*/
// 累積 months of new year start (7/1)
Hebrew_Date.month_count = function(year, month_index) {
	return Math.floor((235 * year - 234 | 0) / 19) + (month_index | 0);
};

// halaqim of molad from Hebrew_epoch
// month_index 0: Tishri
// CeL.Hebrew_Date.molad(1,0,true).format('CE')==="-3761/10/6 23:11:20.000"
Hebrew_Date.molad = function(year, month_index, get_Date) {
	year = Hebrew_Date.month_count(year, month_index) * Hebrew_1_MONTH
			+ Hebrew_epoch_halaqim;
	return get_Date ? new Date(Hebrew_epoch + Hebrew_epoch_shift + year
			* halaqim_to_Date_ratio) : year;
};

// return [ week_day (0:Sunday, 1:Monday, .. 6),
// hour (0－23 from sunset 18:0 of previous day), halaqim (0－) ]
// @see
// http://www.stevemorse.org/jcal/molad.htm?year=1
Hebrew_Date.molad_date = function(year, month_index) {
	var halaqim = Hebrew_Date.molad(year, month_index),
	// the first day of 1/1/1 is Monday, index 1.
	week_day = (Math.floor(halaqim / Hebrew_1_DAY) + 1) % 7 | 0;
	// 轉正。保證變數值非負數。
	if (week_day < 0)
		week_day += 7;
	halaqim %= Hebrew_1_DAY;
	if (halaqim < 0)
		halaqim += Hebrew_1_DAY;
	return [ week_day, halaqim / Hebrew_1_HOUR | 0, halaqim % Hebrew_1_HOUR | 0 ];
};

// cache
var Hebrew_delay_days = [], Hebrew_new_year_days = [];

/*
test:

for (year = 0; year < 1e4; year++)
	if (CeL.Hebrew_Date.delay_days(year) === 2
			&& (!CeL.Hebrew_Date.delay_days(year - 1) || !CeL.Hebrew_Date
					.delay_days(year + 1)))
		throw year;

*/

// return 0, 1, 2
Hebrew_Date.delay_days = function(year) {
	if ((year |= 0) in Hebrew_delay_days)
		return Hebrew_delay_days[year];

	var delay_days = Hebrew_Date.molad_date(year),
	//
	week_day = delay_days[0] | 0, hour = delay_days[1] | 0, halaqim = delay_days[2] | 0;

	// phase 1
	// http://www.stevemorse.org/jcal/rules.htm
	// Computing the start of year (Rosh Hashanah):
	if (delay_days =
	// (2) If molad Tishri occurs at 18 hr (i.e., noon) or later, Tishri 1 must
	// be delayed by one day.
	hour >= 18
	// (3) If molad Tishri in a common year falls on Tuesday at 9 hr 204 hq
	// (i.e., 3:11:20 AM) or later, then Tishri 1 is delayed by one day
	|| week_day === 2 && (hour > 9 || hour === 9 && halaqim >= 204)
			&& !Hebrew_Date.is_leap(year)
			// (4) If molad Tishri following a leap year falls on Monday at 15
			// hr 589 hq (9:32:43 1/3 AM) or later, Tishri 1 is delayed by one
			// day
			|| week_day === 1 && (hour > 15 || hour === 15 && halaqim >= 589)
			&& Hebrew_Date.is_leap(year - 1)
	// default: no delayed
	? 1 : 0)
		week_day++;

	// phase 2
	// (1) If molad Tishri occurs on Sunday, Wednesday, or Friday, Tishri 1 must
	// be delayed by one day
	//
	// since the molad Tishri of year 2 falls on a Friday, Tishri 1 of that year
	// should have been delayed by rule 1 so that Yom Kippor wouldn't be on the
	// day after the Sabbath. However Adam and Eve would not yet have sinned as
	// of the start of that year, so there was no predetermined need for them to
	// fast on that first Yom Kippor, and the delay rule would not have been
	// needed. And if year 2 was not delayed, the Sunday to Friday of creation
	// would not have been from 24-29 Elul but rather from 25 Elul to 1 Tishri.
	// In other words, Tishri 1 in the year 2 is not the first Sabbath, but
	// rather it is the day that Adam and Eve were created.
	//
	// http://www.stevemorse.org/jcal/jcal.js
	// year 3 wants to start on Wed according to its molad, so delaying year
	// 3 by the WFS rule would require too many days in year 2, therefore
	// WFS must be suspended for year 3 as well
	if (3 * week_day % 7 < 3 && 3 < year)
		delay_days++;

	return Hebrew_delay_days[year] = delay_days | 0;
};

// return days of year's first day.
Hebrew_Date.new_year_Date_original = function(year, days) {
	days = new Date(Hebrew_epoch + Hebrew_Date.molad(year)
			* halaqim_to_Date_ratio
			+ (Hebrew_Date.delay_days(year) + (days | 0))
			* ONE_DAY_LENGTH_VALUE);
	// set to 0:0 of the day
	days.setHours(0, 0, 0, 0);
	return days;
};

// caculate days from 1/1/1.
// simplify from Hebrew_Date.new_year_Date_original()
// new_year_days(1) = 0
// new_year_days(2) = 354
// new_year_days(3) = 709
// CeL.Hebrew_Date.new_year_days(1,0,true).format('CE')
Hebrew_Date.new_year_days = function(year, days, get_Date) {
	if (!(year in Hebrew_new_year_days))
		Hebrew_new_year_days[year] = Math.floor(Hebrew_Date.molad(year)
				/ Hebrew_1_DAY)
				//
				+ Hebrew_Date.delay_days(year) | 0;
	year = Hebrew_new_year_days[year] + (days | 0);
	return get_Date ? new Date(Hebrew_epoch + year * ONE_DAY_LENGTH_VALUE)
			: year;
};

// return days of year's first day.
// Please use Hebrew_Date.new_year_days(year, days, true) instead.
if (false)
	Hebrew_Date.new_year_Date = function(year, days) {
		return Hebrew_Date.new_year_days(year, days, true);
	};



/*
test:

for (var year = 0, d, d2; year <= 1e5; year++) {
	d = CeL.Hebrew_Date.days_of_year_original(year);
	d2 = CeL.Hebrew_Date.days_of_year(year);
	if (d !== d2)
		throw year + ': ' + d + '!==' + d2;
	// common year has 353 (defective), 354 (normal), or 355 (complete) days
	d -= 354;
	if (d > 1)
		d -= 30;
	if (d !== Math.sign(d))
		throw year + ': ' + d2 + ' days';
}
console.log('OK');

*/

// day count of year.
Hebrew_Date.days_of_year_original = function(year) {
	// common year has 353 (defective), 354 (normal), or 355 (complete) days
	// leap year has 383 (defective), 384 (normal), or 385 (complete) days
	return (Hebrew_Date.new_year_Date_original(year + 1) - Hebrew_Date
			.new_year_Date_original(year))
			/ ONE_DAY_LENGTH_VALUE | 0;
};

// day count of year.
// days_of_year(1) = 354
// days_of_year(2) = 354
// days_of_year(3) = 384
// common year has 353 (defective), 354 (normal), or 355 (complete) days
// leap year has 383 (defective), 384 (normal), or 385 (complete) days
Hebrew_Date.days_of_year = function(year) {
	return Hebrew_Date.new_year_days(year + 1)
			- Hebrew_Date.new_year_days(year);
};

// month days of normal common year
var Hebrew_normal_month_days = [];
(function() {
	for (var m = 0; m < 12; m++)
		Hebrew_normal_month_days.push(m % 2 === 0 ? 30 : 29);
})();

Hebrew_Date.year_data = function(year) {
	var days = Hebrew_Date.days_of_year(year) | 0,
	// copy from normal
	data = Hebrew_normal_month_days.slice();
	data.days = days;

	days -= 354;
	if (days > 1)
		days -= 30, data.leap = true, data.splice(5, 0, 30);
	// assert: days = -1 (defective) / 0 (normal) / 1 (complete)
	data.add_days = days;

	if (days > 0)
		data[1]++;
	else if (days < 0)
		data[2]--;

	return Object.assign(data, {
		delay_days : Hebrew_Date.delay_days(year),
		new_year_days : Hebrew_Date.new_year_days(year)
	});
};

//---------------------------------------------------------------------------//
// Date to Hebrew

/*

days = new_year_days + Δ
# 0 <= Δ < 385
new_year_days = days - Δ

Math.floor(Hebrew_Date.molad(year) / Hebrew_1_DAY) + Hebrew_Date.delay_days(year)
= new_year_days

→

Math.floor((Hebrew_Date.month_count(year, month_index) * Hebrew_1_MONTH + Hebrew_epoch_halaqim) / Hebrew_1_DAY) + Hebrew_Date.delay_days(year)
= new_year_days

→

Math.floor((Math.floor((235 * year - 234 | 0) / 19) * Hebrew_1_MONTH + Hebrew_epoch_halaqim) / Hebrew_1_DAY) + Hebrew_Date.delay_days(year)
= new_year_days

→

(((235 * year - 234) / 19 + Δ2) * Hebrew_1_MONTH + Hebrew_epoch_halaqim) / Hebrew_1_DAY + Δ1 + delay_days
= new_year_days

# 0 <= (Δ1, Δ2) <1
# delay_days = 0, 1, 2

→

year
= ((((days - Δ - Δ1 - delay_days) * Hebrew_1_DAY - Hebrew_epoch_halaqim) / Hebrew_1_MONTH - Δ2) * 19 + 234) / 235
<= ((days * Hebrew_1_DAY - Hebrew_epoch_halaqim) / Hebrew_1_MONTH * 19 + 234) / 235
< (days * Hebrew_1_DAY - Hebrew_epoch_halaqim) / Hebrew_1_MONTH * 19 / 235 + 1


test:

var start = new Date;
for (var year = 0, new_year_days, days = 0; year <= 1e5; year++)
	for (new_year_days = CeL.Hebrew_Date.new_year_days(year + 1); days < new_year_days; days++)
		if (CeL.Hebrew_Date.year_of_days(days) !== year)
			throw 'CeL.Hebrew_Date.year_of_days(' + days + ') = '
					+ CeL.Hebrew_Date.year_of_days(days) + ' != ' + year;
console.log('CeL.Hebrew_Date.year_of_days() 使用時間: ' + (new Date - start) / 1000);
//CeL.Hebrew_Date.year_of_days() 使用時間: 154.131

*/

// return year of the day;
Hebrew_Date.year_of_days = function(days) {
	// 即使預先計算參數(coefficient)，以加快速度，也不會顯著加快。@ Chrome/36
	var year = Math.ceil((days * Hebrew_1_DAY - Hebrew_epoch_halaqim)
			/ Hebrew_1_MONTH * 19 / 235) + 1 | 0;

	// assert: 最多減兩次。
	// 經測試 0－4e6，96% 皆為減一次。
	// [ 139779, 3859350, 871 ]
	while (days < Hebrew_Date.new_year_days(year))
		year--;

	return year;
};


/*
d = '-3761/10/7'.to_Date('CE').to_Hebrew();
*/
function Date_to_Hebrew(date, options) {
	var tmp, month, days = date - Hebrew_epoch - Hebrew_epoch_shift,
	//
	hour = days % ONE_DAY_LENGTH_VALUE,
	//
	year = Hebrew_Date.year_of_days(days = Math.floor(days
			/ ONE_DAY_LENGTH_VALUE) | 0),
	//
	is_leap = Hebrew_Date.is_leap(year),
	//
	add_days = Hebrew_Date.days_of_year(year) - 354 | 0;

	// 轉正。保證變數值非負數。
	if (hour < 0)
		hour += ONE_DAY_LENGTH_VALUE;

	days -= Hebrew_Date.new_year_days(year);
	// assert: days: days from new year day

	if (add_days > 1)
		// assert: is_leap === true
		add_days -= 30;
	// assert: add_days = -1 (defective) / 0 (normal) / 1 (complete)

	// 將 days 模擬成 normal common year.
	// 因此需要作相應的處理:
	// 從前面的日期處理到後面的，
	// 自開始被影響，與 normal common year 不同的那天起將之改成與 normal common year 相同。
	// days → month index / days index of month
	if (add_days !== 0)
		if (add_days === 1) {
			// 30 + 29: complete year 開始被影響的一日。
			if (days === 30 + 29)
				// 因為 normal common year 沒有辦法表現 8/30，須特別處理 8/30。
				month = 1, days = 29, tmp = true;
			else if (days > 30 + 29)
				days--;
		} else if (days >= 30 + 29 + 29)
			// 30 + 29 + 29: defective year 開始被影響的一日。
			// assert: add_days === -1
			days++;

	if (!tmp) {
		// is_leap 還會用到，因此將 tmp 當作暫用值。
		// 3 * (30 + 29): leap year 開始被影響的一日。
		if (tmp = is_leap && days >= 3 * (30 + 29))
			days -= 30;

		// 計算有幾組 (30 + 29) 月份。
		month = days / (30 + 29) | 0;
		// 計算 date in month。
		days -= month * (30 + 29);
		// 每組 (30 + 29) 月份有 2個月。
		month <<= 1;
		// normal common year 每組 (30 + 29) 月份，首月 30日。
		if (days >= 30)
			month++, days -= 30;
		if (tmp)
			// 加上 leap month.
			month++;
	}

	// 日期序數→日期名。year/month/date index to serial.
	// index 0 → serial 7
	month += 7;
	// add_days: months of the year.
	tmp = is_leap ? 13 : 12;
	if (month > tmp)
		month -= tmp;
	if (year <= 0 && !Hebrew_Date.year_0)
		// year: 0 → -1
		--year;

	// 前置處理。
	if (!library_namespace.is_Object(options))
		if (options === true)
			options = {
				// month serial to name
				month_name : true
			};
		else
			options = library_namespace.null_Object();

	return _format([ year, month, days + 1,
	// hour
	Math.floor(hour / ONE_HOUR_LENGTH_VALUE) | 0,
	// halaqim
	(hour % ONE_HOUR_LENGTH_VALUE) / halaqim_to_Date_ratio ], options,
			Hebrew_Date.month_name, is_leap);
}


/*

CeL.Hebrew_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

'-3762/9/18'.to_Date('CE').to_Hebrew({format : 'serial'})
// -1/6/29

CeL.Hebrew_Date(3, 7, 1).format('CE')

*/
Hebrew_Date.test = new_tester(Date_to_Hebrew, Hebrew_Date, {
	epoch : Hebrew_epoch
});


_.Hebrew_Date = Hebrew_Date;

//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: Mesoamerican Long Count calendar / 馬雅長紀曆
// <a href="https://en.wikipedia.org/wiki/Mesoamerican_Long_Count_calendar" accessdate="2014/4/28 22:15" title="Mesoamerican Long Count calendar">中美洲長紀曆</a>

// GMT correlation: starting-point is equivalent to August 11, 3114 BCE in the proleptic Gregorian calendar
var Maya_epoch = (new Date(-3114 + 1, 8 - 1, 11)).getTime(),
// Era Base date, the date of creation is expressed as 13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.0.0.0.0 4 Ajaw 8 Kumk'u
/*
// get offset:
// 4 Ajaw → 3/13, 19/20
for (i = 0, d = 3, l = 20; i < l; i++, d += 13)
	if (d % l === 19)
		throw d;
// 159
*/
Tzolkin_day_offset = 159,
Tzolkin_day_period = 13 * 20,
/*
// get offset:
// 8 Kumk'u → 348/(20 * 18 + 5)
365 - 17 = 348
*/
Haab_day_offset = 348, Haab_day_period = 20 * 18 + 5;

function Maya_Date(date) {
	if (typeof date === 'string')
		date = date.split(/[,.]/);
	else if (!Array.isArray(date))
		return new Date(NaN);

	var days = 0, length = date.length - 2, i = 0;
	while (i < length)
		days = days * 20 + (date[i++] | 0);
	days = (days * 18 + (date[i] | 0)) * 20 + (date[++i] | 0);
	return new Date(days * ONE_DAY_LENGTH_VALUE + Maya_epoch);
}

Maya_Date.days = function(date) {
	return Math.floor((date - Maya_epoch) / ONE_DAY_LENGTH_VALUE);
};

Maya_Date.to_Long_Count = function(date, get_Array) {
	var days = Maya_Date.days(date),
	// Mesoamerican Long Count calendar.
	Long_Count;
	if (!Number.isFinite(days))
		// NaN
		return;
	if (days <= 0)
		// give a 13.0.0.0.0
		// but it should be:
		// 13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.13.0.0.0.0
		days += 13 * 20 * 20 * 18 * 20;
	Long_Count = [ days % 20 ];
	days = Math.floor(days / 20);
	Long_Count.unshift(days % 18);
	days = Math.floor(days / 18) | 0;
	while (days > 0 || Long_Count.length < 5) {
		Long_Count.unshift(days % 20);
		days = days / 20 | 0;
	}
	return get_Array ? Long_Count : Long_Count.join('.');
};

Maya_Date.Tzolkin_day_name = "Imix'|Ik'|Ak'b'al|K'an|Chikchan|Kimi|Manik'|Lamat|Muluk|Ok|Chuwen|Eb'|B'en|Ix|Men|Kib'|Kab'an|Etz'nab'|Kawak|Ajaw"
		.split('|');
// <a href="https://en.wikipedia.org/wiki/Tzolk%27in" accessdate="2014/4/30
// 18:56">Tzolk'in</a>
// type = 1: {Array} [ 13-day cycle index, 20-day cycle index ] (index: start
// from 0),
//
// 2: {Array} [ 13-day cycle name, 20-day cycle ordinal/serial: start from 1,
// 20-day cycle name ],
//
// 3: {Array} [ 13-day cycle name, 20-day cycle name ],
// others (default): {String} (13-day cycle name) (20-day cycle name)
Maya_Date.to_Tzolkin = function(date, type) {
	var days = Maya_Date.days(date) + Tzolkin_day_offset;
	// 轉正。保證變數值非負數。
	if (days < 0)
		days = days % Tzolkin_day_period + Tzolkin_day_period;

	// 20: Maya_Date.Tzolkin_day_name.length
	days = [ days % 13, days % 20 ];
	if (type === 1)
		return days;

	days[0]++;
	var day_name = Maya_Date.Tzolkin_day_name[days[1]];
	if (type === 2) {
		days[1]++;
		days[2] = day_name;
	} else if (type === 3)
		days[1] = day_name;
	else
		// 先日子，再月份。
		days = days[0] + ' ' + day_name;
	return days;
};

Maya_Date.Haab_month_name = "Pop|Wo'|Sip|Sotz'|Sek|Xul|Yaxk'in'|Mol|Ch'en|Yax|Sak'|Keh|Mak|K'ank'in|Muwan'|Pax|K'ayab|Kumk'u|Wayeb'"
		.split('|');
// <a href="https://en.wikipedia.org/wiki/Haab%27" accessdate="2014/4/30
// 18:56">Haab'</a>
// type = 1: {Array} [ date index, month index ] (index: start from 0),
//
// 2: {Array} [ date ordinal/serial: start from 1, month ordinal/serial: start
// from 1, date name, month name ],
//
// 3: {Array} [ date name, month name ],
// others (default): {String} (date name) (month name)
Maya_Date.to_Haab = function(date, type) {
	var days = (Maya_Date.days(date) + Haab_day_offset) % Haab_day_period;
	// 轉正。保證變數值非負數。
	if (days < 0)
		days += Haab_day_period;

	// 20 days in a month.
	days = [ days % 20, days / 20 | 0 ];
	if (type === 1)
		return days;

	// Day numbers began with a glyph translated as the "seating of" a named
	// month, which is usually regarded as day 0 of that month, although a
	// minority treat it as day 20 of the month preceding the named month. In
	// the latter case, the seating of Pop is day 5 of Wayeb'. For the majority,
	// the first day of the year was Seating Pop. This was followed by 1 Pop, 2
	// Pop ... 19 Pop, Seating Wo, 1 Wo and so on.
	days[2] = days[0] === 0 ? 'Seating' : days[0];
	days[3] = Maya_Date.Haab_month_name[days[1]];
	if (type === 2)
		days[1]++;
	else {
		days.splice(0, 2);
		if (type !== 3)
			// 先日子，再月份。
			days = days.join(' ');
	}
	return days;
};


_.Maya_Date = Maya_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: 西雙版納傣曆計算。傣历 / Dai Calendar
// 適用範圍: 傣曆 714年至 3190年期間內。

/*

基本上按张公瑾:《西双版纳傣文〈历法星卜要略〉历法部分译注》、《傣历中的纪元纪时法》計算公式推算，加上過去暦書多有出入，因此與實暦恐有一兩天差距。
《中国天文学史文集 第三集》


http://blog.sina.com.cn/s/blog_4131e58f0101fikx.html
傣曆和農曆一樣，用干支紀年和紀日。傣曆干支約於東漢時由漢地傳入，使用年代早於紀元紀時的方法。不過傣族十二地支所代表的對象和漢族不完全相同，如「子」不以表鼠而代表大象，「辰」不代表龍，而代表蛟或大蛇。


[张公瑾,陈久金] 傣历中的干支及其与汉历的关系 (傣曆中的干支及其與漢曆的關係, 《中央民族学院学报》1977年第04期)
值得注意的是, 傣历中称干支日为“腕乃” 或‘婉傣” , 意思是“ 里面的日子” 或“傣族的日子” , 而一周一匕日的周日, 明显地是从外面传进来的, 则称为“腕诺” 或,’m 命” , 即“外面的日子· 或“ 你的日子’, , 两者你我相对, 内外有8lJ, 是很清楚的。很明显, 傣历甲的干支纪年与纪日是从汉历中吸收过来的, 而且已经成了傣历中不可分害少的组成部分。在傣文的两本最基本的推算历法书‘苏定》和《苏力牙》中, 干支纪年与纪日的名称冠全书之首, 可见汉历成份在傣历中的重要性。


《中央民族學院學報》 1979年03期
傣曆中的紀元紀時法
張公瑾
傣曆中的紀元紀時法,與公曆的紀時法相近似,即以某一個時間為傣曆紀元開始累計的時間,以後就順此按年月日往下記,至今年(1979年)10月1日(農曆己未年八月十一)為傣曆1341年12月月出11日,這是一種情況。
還有一種情況是:公元1979年10月1日又是傣曆紀元的第1341年、傣曆紀元的第16592月,並是傣曆紀元的第489982日。對這種年月日的累計數,現譯稱為傣曆紀元年數、紀元積月數和紀元積日數。

*/


/*
year:
傣曆紀元年數。

應可處理元旦，空日，除夕，閏月，後六月，後七月等。

Dai_Date(紀元積日數)
Dai_Date(紀元年數, 特殊日期)
	特殊日期: 元旦/除夕/空1/空2
Dai_Date(紀元年數, 0, 當年日序數)
Dai_Date(紀元年數, 月, 日)
	月: 1－12/閏/後6/後7

元旦：
	Dai_Date(year, 0)
	Dai_Date(year, '元旦')
當年日序 n：
	Dai_Date(year, 0, n)
空日（當年元旦之前的）：
	Dai_Date(year, '空1日')
	Dai_Date(year, '空2日')
	Dai_Date(year, 0, -1)
	Dai_Date(year, 0, -2)
除夕（當年元旦之前的）：
	Dai_Date(year, '除夕')
閏月：
	Dai_Date(year, '閏9', date)
	Dai_Date(year, '雙9', date)
	Dai_Date(year, '閏', date)

後六月：
	Dai_Date(year, '後6', date)

後七月：
	Dai_Date(year, '後7', date)


注意：由於傣曆元旦不固定在某月某日，因此同一年可能出現相同月分與日期的日子。例如傣曆1376年（公元2014年）就有兩個六月下五日。

為了維持獨一性，此處以"後六月"稱第二次出現的六月同日。

*/
function Dai_Date(year, month, date, get_days) {
	if (isNaN(year = Dai_Date.to_valid_year(year)))
		return get_days ? NaN : new Date(NaN);

	var days = typeof date === 'string'
			&& (date = date.trim()).match(/^([^\d]*)(\d+)/), is_leap;
	// 處理如「六月下一日」或「六月月下一日」即傣曆6月16日。
	if (days) {
		date = days[2] | 0;
		if (/月?上/.test(days[1]))
			date += 15;
	} else
		date |= 0;

	if (typeof month === 'string')
		if (/^[閏雙後][9九]?月?$/.test(month))
			month = 9, is_leap = true;
		else if (days = month.match(/^後([67])/))
			month = days[1];

	if (isNaN(month) || month < 1 || 12 < month) {
		// 確定元旦之前的空日數目。
		days = Dai_Date.null_days(year - 1);
		switch (month) {
		case '空2日':
			// 若有空2日，其必為元旦前一日。
			date--;
		case '空日':
		case '空1日':
			date -= days;
		case '除夕':
			date -= days + 1;
		}

		// 當作當年日序。
		days = Dai_Date.new_year_days(year) + date | 0;

	} else {
		// 將 (month) 轉成月序：
		// 6月 → 0
		// 7月 → 1
		// ...
		// 12月 → 6
		// 1月 → 7
		if ((month -= 6) < 0
		// 後6月, 後7月
		|| days)
			month += 12;

		// 處理應為年末之6月, 7月的情況。
		if (month < 2 && 0 < date
		// 七月: 7/1 → 6/30, 7/2 → 6/31..
		&& (month === 0 ? date : 29 + date) <
		//
		Dai_Date.new_year_date_serial(year))
			month += 12;

		days = Dai_Date.days_6_1(year) + date - 1
		//
		+ (month >> 1) * (29 + 30) | 0;
		if (month % 2 === 1)
			days += 29;

		if ((month > 3 || month === 3 && is_leap)
		// 處理閏月。
		&& Dai_Date.is_leap(year))
			days += 30;
		if (month > 2 && Dai_Date.is_full8(year))
			days++;
	}

	return get_days ? days : new Date(Dai_Date.epoch + days
			* ONE_DAY_LENGTH_VALUE);
}

// 適用範圍: 傣曆 0－103295 年
Dai_Date.to_valid_year = function(year, ignore_range) {
	if (false && year < 0)
		library_namespace.warn('Dai_Date.to_valid_year: 公式不適用於過小之年分：' + year);
	return !isNaN(year) && (ignore_range ||
	// 一般情況
	// -1e2 < year && year < 103296
	// from new_year_date_serial()
	0 <= year && (year < 2 || 714 <= year && year <= 3190)
	//
	) && year == (year | 0) ? year | 0 : NaN;
};

// 傣曆採十九年七閏法，平年有12個月，閏年有13個月。閏月固定在9月，所以閏年又稱為「雙九月」年
// 閏9月, 閏九月。
// 適用範圍: 傣曆 0－ 年
Dai_Date.is_leap = function(year) {
	// 傣曆零年當年九月置閏月。
	return year == 0 ||
	// 攝 = (year + 1) % 19;
	(((7 * year | 0) - 6) % 19 + 19) % 19 < 7;
};


// 當年日數。365 or 366.
Dai_Date.year_days = function(year) {
	return Dai_Date.new_year_days(year + 1) - Dai_Date.new_year_days(year);
};

// 當年空日數目。1 or 2.
// 注意：這邊之年分，指的是當年除夕後，即明年（隔年）元旦之前的空日數目。與 Dai_Date() 不同！
// e.g., Dai_Date.null_days(100) 指的是傣曆100年除夕後，即傣曆101年元旦之前的空日數目。
// 依 Dai_Date.date_of_days() 的做法，空日本身會被算在前一年內。
Dai_Date.null_days = function(year) {
	// 傣曆潑水節末日之元旦（新年的第一天）與隔年元旦間，一般為365日（有「宛腦」一天）或366日（有「宛腦」兩天）。
	return Dai_Date.year_days(year) - 364;
};

/*

傣历算法剖析

原法@曆法星卜要略, 傣曆中的紀元紀時法：
x := year + 1
y := Floor[(year + 4)/9]
z := Floor[(year - y)/3]
r := Floor[(x - z)/2]
R := year - r + 49049
S := Floor[(36525875 year + R)/100000]
d := S + 1
Simplify[d]

1 + Floor[(
  49049 + 36525876 year - 
   Floor[1/2 (1 + year - Floor[1/3 (year - Floor[(4 + year)/9])])])/
  100000]


簡化法：
x := year + 1
y := ((year + 4)/9)
z := ((year - y)/3)
r := ((x - z)/2)
R := year - r + 49049
S := ((36525875 year + R)/100000)
d := S + 1
Simplify[d]

(1609723 + 394479457 year)/1080000


// test 簡化法 @ Javascript:
for (var year = -1000000, days; year <= 1000000; year++) {
	if (CeL.Dai_Date.new_year_days(year) !== CeL.Dai_Date
			.new_year_days_original(year))
		console.error('new_year_days: ' + year);
	var days = CeL.Dai_Date.new_year_days(year);
	if (CeL.Dai_Date.year_of_days(days) !== year
			|| CeL.Dai_Date.year_of_days(days - 1) !== year - 1)
		console.error('year_of_days: ' + year);
}


// get:
-976704
-803518
-630332
-523297
-350111
-176925
-69890
103296
276482
449668
556703
729889
903075

*/

// 元旦紀元積日數, accumulated days
// 原法@曆法星卜要略：
Dai_Date.new_year_days_original = function(year) {
	return 1 + Math
			.floor((49049 + 36525876 * year - Math.floor((1 + year - Math
					.floor((year - Math.floor((4 + year) / 9)) / 3)) / 2)) / 100000);
};


// 元旦紀元積日數, accumulated days
// 簡化法：適用於 -69889－103295 年
Dai_Date.new_year_days = function(year, get_remainder) {
	// 防止 overflow。但效果相同。
	// var v = 365 * year + 1 + (279457 * year + 529723) / 1080000,
	var v = (394479457 * year + 1609723) / 1080000 | 0,
	//
	f = Math.floor(v);
	// 餘數
	return get_remainder ? v - f : f;
};

// 簡化法：適用於 -3738－1000000 年
Dai_Date.year_of_days = function(days) {
	return Math.floor((1080000 * (days + 1) - 1609723) / 394479457) | 0;
};


// 紀元積月數, accumulated month


/*

原法@傣曆中的紀元紀時法：
day = 元旦紀元積日數

b := 11 day + 633
c := Floor[(day + 7368)/8878]
d := Floor[(b - c)/692]
dd := day + d
e := Floor[dd/30]
f := Mod[dd, 30]
Simplify[e]
Simplify[f]

e:
Floor[1/30 (day + 
    Floor[1/692 (633 + 11 day - Floor[(7368 + day)/8878])])]

f:
Mod[day + Floor[1/692 (633 + 11 day - Floor[(7368 + day)/8878])], 30]

*/


// cache
var new_year_date_serial = [ 30 ];

// 元旦之當月日序基數
// d = 30－35: 7/(d-29)
// others: 6/d
Dai_Date.new_year_date_serial = function(year, days, ignore_year_limit) {
	if (year in new_year_date_serial)
		return new_year_date_serial[year];

	if (isNaN(year = Dai_Date.to_valid_year(year, ignore_year_limit)))
		return NaN;

	// days: 元旦紀元積日數。
	if (isNaN(days))
		days = Dai_Date.new_year_days(year) | 0;
	else if (days < 0)
		library_namespace.warn('Dai_Date.new_year_date_serial: 輸入負數日數 [' + days + ']!');

	// 參考用元旦之當月日序基數：常常須作調整。
	var date = (days +
	// 小月補足日數
	Math.floor((633 + 11 * days - Math.floor((7368 + days) / 8878)) / 692)
	// (date / 30 | 0) 是元旦所在月的紀元積月數
	) % 30 | 0;

	// 年初之6/1累積日數
	var days_diff
	// 平年年初累積日數
	= year * 354
	// 閏月年初累積日數 = 30 * (年初累積閏月數 (7r-6)/19+1=(7r+13)/19)
	+ 30 * (((7 * (year - 1) - 6) / 19) + 2 | 0)
	// 八月滿月年初累積日數。.194: 經手動測試，誤差=0 or 1日@部分0－1400年
	+ (.194 * year | 0)
	// 為傣曆紀元始於 7/1，而非 6/1；以及 date 由 6/1 而非 6/0 起始而調整。
	- 30
	// 至上方為年初之6/1累積日數，因此需要再加上元旦之當月日序基數，才是元旦紀元積日數。
	+ date
	// 計算兩者差距。
	- days | 0;

	// assert: -31 < days_diff < 2
	// for (var i = 0, j, y; i < 1200; i++) if ((j = CeL.Dai_Date.new_year_date_serial(i)) > 1 || j < -31) y = i;
	// 599
	// for (var i = 1200, j, y; i < 103296; i++) if ((j = CeL.Dai_Date.new_year_date_serial(i)) > 1 || j < -31) throw i;
	// 3191
	// return days_diff;
	if (false && library_namespace.is_debug(3)
			&& !(-31 < days_diff && days_diff < 2))
		library_namespace.warn('days_diff of ' + year + ': ' + days_diff);

	// 判斷 date 在 6月 或 7月：選擇與應有日數差距較小的。
	if (Math.abs(days_diff) > Math.abs(days_diff + 30))
		// 七月. 7/date0 → 6/30, 7/date1 → 6/31..
		date += 30;

	// 微調：當前後年 6/1 間不是指定的日數時，應當前後移動一兩日。但據調查發現，除前一年是雙九月暨八月滿月外，毋須微調。
	// 六月出一日與隔年六月出一日間，平年354天（八月小月）或355天（八月滿月），雙九月之年384天。
	if (Dai_Date.is_leap(year - 1)) {
		var last_days = Dai_Date.new_year_days(year - 1);
		if ((days - date) - (
		// 前一年是雙九月暨八月滿月，則將八月滿月推移至本年，元旦之當月日序基數後調一日。
		last_days - Dai_Date.new_year_date_serial(year - 1, last_days, true)) === 354 + 30 + 1)
			date++;
	}

	// cache
	return new_year_date_serial[year] = date | 0;
};


// 6/1 紀元積日數, accumulated days
// 簡化法：適用於 -69889－103295 年
Dai_Date.days_6_1 = function(year, days) {
	// days: 元旦紀元積日數。
	if (isNaN(days))
		days = Dai_Date.new_year_days(year) | 0;

	var date = Dai_Date.new_year_date_serial(year, days) | 0;

	return days - date + 1 | 0;
};


/*





// 求取反函數 caculator[-1](result)
function get_boundary(caculator, result, down, up, limit) {
	if (up - down === 0)
		return up;

	var boundary, value, increase;
	// assert: caculator(down) － caculator(up) 為嚴格遞增/嚴格遞減函數。
	if (caculator(up) - caculator(down) < 0)
		// swap.
		boundary = up, up = down, down = boundary;

	// assert: caculator(down)<caculator(up)
	increase = down < up;
	if (!(limit > 0))
		limit = 800;

	do {
		boundary = (up + down) / 2;
		// console.log(down + ' － ' + boundary + ' － ' + up);
		if (boundary === down || boundary === up)
			return boundary;
		value = result - caculator(boundary);
		if (value === 0) {
			if (result - caculator(down) === 0)
				down = boundary, value = true;
			if (result - caculator(up) === 0)
				up = boundary, value = true;
			if (value && (increase ? up - down > 0 : up - down < 0))
				continue;
			return boundary;
		}
		if (value > 0)
			down = boundary;
		else
			up = boundary;
	} while (--limit > 0 && (increase ? up - down > 0 : up - down < 0));

	throw 'get_boundary: caculator is not either strictly increasing or decreasing?';
}






(394479457 * 19) / 1080000
=
7495109683/1080000
=
6939.916373148^_  (period 3)


354*19+30*7
=
6936


19/(7495109683/1080000-6936)
=
20520000/4229683
=
4.851427400114854943030009577549901493799889968113449636769469...

「八月滿月」 4.8514274 年一次?


→
(year+k)/4.85142740011485494303|0 = 累積八月滿月?
0<=k<4.85142740011485494303

八月滿月 years:
1166－:
1167, 1172, 1176, 


d := 20520000/4229683
Floor[(1168+k)/d]-Floor[(1167+k)/d]==1





var d = 20520000 / 4229683, year;
function get_diff(k){return ((year+1+k)/d|0)-((year+k)/d|0);}

for(var i=0,last=-1,v,a=[];i<d;i+=.01,last=v)if(last!==(v=get_diff(i)))a.push(String(i).slice(0,7)+': '+v);a.join('\n');

function get_full8_range(full8_years) {
	var range = [ 0, Infinity ];

	// 八月滿月 years
	full8_years.forEach(function(y) {
		year = y;

		var low, high, b = 1;
		if (y > 1200 && y < 1280)
			b = 0;
		if (get_diff(b) == get_diff(b + 1)
				|| get_diff(b + 1) == get_diff(b + 2))
			throw '1==2 or 2==3 on ' + y;

		low = get_boundary(get_diff, 1, b, b + 1);
		y = (low - 1) * 4229683;
		if (Math.abs(y - Math.round(y)) > 1e-5)
			throw 'Error low on ' + year;
		if (range[0] < y)
			range[0] = Math.round(y);

		high = get_boundary(get_diff, 1, b + 1, b + 2);
		if (Math.abs(high - low - 1) > 1e-5)
			throw 'high-low!=1 on ' + year;
		y = (high - 2) * 4229683;
		if (Math.abs(y - Math.round(y)) > 1e-5)
			throw 'Error high on ' + year;
		if (range[1] > y)
			range[1] = Math.round(y);
	});

	range.push('function full8_days(year){return (4229683*year+'
			+ (4229683 + ((range[0] + range[1]) >> 1)) + ')/20520000|0;}');
	return range;
}


get_full8_range([ 1167, 1172, 1176, 1207, 1216, 1221, 1226, 1281, 1295 ])



year = 1167;
get_boundary(get_diff, 1, 1, 2);
// 1.1940034276800588=1+820573/4229683
get_boundary(get_diff, 1, 2, 3);
// 2.194003427680059=2+820573/4229683

.194003427680059~~820573/4229683

1+820573/4229683
<=k<
2+820573/4229683



year = 1172;
get_boundary(get_diff, 1, 1, 2);
// 1.045430827794803=1+192158/4229683
get_boundary(get_diff, 1, 2, 3);
// 2.045430827794803=2+192158/4229683


year = 1176;
get_boundary(get_diff, 1, 1, 2);
// 1.8968582279097745=1+3793426/4229683
get_boundary(get_diff, 1, 2, 3);
// 2.8968582279097745=2+3793426/4229683


1+820573/4229683
<=k<
2+192158/4229683




function _get_diff(k){return ((4229683*(year+1)+k)/20520000|0)-((4229683*(year)+k)/20520000|0);}

八月滿月 year:


year = 1207;
get_diff(1) != get_diff(2) && (get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 3793426
get_diff(2) != get_diff(3) && (get_boundary(get_diff, 1, 2, 3) - 2) * 4229683
// 3793426


year = 1216;
(get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 2995789
(get_boundary(get_diff, 1, 2, 3) - 2) * 4229683

year = 1221;
(get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 2367374

year = 1226;
(get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 1738959

year = 1281;
(get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 4229683

year = 1295;
(get_boundary(get_diff, 1, 1, 2) - 1) * 4229683
// 4229683



1+820573/4229683
<=k<
2+1738959/4229683

(1+820573/4229683+2+1738959/4229683)/2


Math.floor(year / 19) * (19 * 354 + 7 * 30) + (7 * y / 19)

但由前面幾組即可發現，不存在此k值。

事實上，1398年年初累積八月滿月日數為271。
因此另設
年初累積八月滿月日數為:
Math.floor(a*year+b)

1397年為八月滿月，
1397年年初累積八月滿月日數為270
1398年年初累積八月滿月日數為271
→
(271-2)/1397<a<(271+1)/(1397+1)
-(271+1)/(1397+1)<b<(1397-4*(271-2))/1397


// 八月滿月 full8_years: { full8_year : 隔年年初累積八月滿月日數 }
function get_full8_range(full8_years) {
	var range = [ 0, 1, -1, 1 ], days, boundary;

	for ( var year in full8_years) {
		days = full8_years[year |= 0] | 0;
		// range[0]<a<range[1]
		// range[2]<b<range[3]
		boundary = (days - 2) / year;
		if (range[0] < boundary)
			range[0] = boundary;
		boundary = (days + 1) / (year + 1);
		if (range[1] > boundary)
			range[1] = boundary;
		boundary = -boundary;
		if (range[2] < boundary)
			range[2] = boundary;
		boundary = (year - 4 * (days - 2)) / year;
		if (range[3] > boundary)
			range[3] = boundary;
	}

	return range;
}

get_full8_range({
	1184 : 230,
	1207 : 234,
	1216 : 236,
	1221 : 237,
	1226 : 238,
	1397 : 271
});
[0.19256756756756757, 0.1945364238410596, -0.1945364238410596, 0.22972972972972974]


*/

// 當年是否為八月滿月。
Dai_Date.is_full8 = function(year) {
	if (year == 0)
		// 0年 days_diff = 29，排成無八月滿月較合適。
		return 0;
	var days_diff = Dai_Date.days_6_1(year + 1) - Dai_Date.days_6_1(year) - 354
			| 0;
	// assert: 0: 無閏月, 30: 閏9月.
	// assert: 雙九月與八月滿月不置在同一年。
	if (days_diff >= 30)
		days_diff -= 30;
	// assert: days_diff == 0 || 1
	return days_diff;
};

/*

CeL.Dai_Date(0).format({
	parser : 'CE',
	format : '%Y/%m/%d %年干支年%日干支日',
	locale : 'cmn-Hant-TW'
});

for (var y = 1233, i = 0, m; i < 12; i++) {
	m = i + 6 > 12 ? i - 6 : i + 6;
	console.log(y + '/' + m + '/' + 1 + ': ' + CeL.Dai_Date(y, m, 1).format({
		parser : 'CE',
		format : '%年干支年%日干支日',
		locale : 'cmn-Hant-TW'
	}));
}

*/

Dai_Date.date_name = function(date) {
	return date > 15 ? '下' + (date - 15) : date === 15 ? '望' : '出' + date;
};

// 當年日序 : 節日名
var Dai_festivals = {
	1 : '潑水節 元旦',
	364 : '潑水節 除夕',
	365 : '潑水節 空1日',
	366 : '潑水節 空2日'
};

// return 紀元積日數之 [ year, month, date, festival ];
Dai_Date.date_of_days = function(days, options) {
	// 前置處理。
	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	var date, festival,
	//
	year = Dai_Date.to_valid_year(Dai_Date.year_of_days(days),
			options.ignore_year_limit),
	//
	date_name = options.format === 'serial' ? function(d) {
		return d;
	} : Dai_Date.date_name;
	if (isNaN(year))
		// 超出可轉換之範圍。
		return [];

	date = Dai_Date.new_year_days(year) | 0;
	// 節日
	festival = Dai_festivals[days - date + 1];
	// 取得自 6/1 起之日數(當年日序數)
	date = days - Dai_Date.days_6_1(year, date);
	if (date >= (29 + 30 + 29)) {
		if (Dai_Date.is_full8(year)) {
			if (date === (29 + 30 + 29))
				return [ year, 8, date_name(30), festival ];
			date--;
		}
		if (date >= 2 * (29 + 30) && Dai_Date.is_leap(year)) {
			if (date < 2 * (29 + 30) + 30) {
				if ((date -= 2 * (29 + 30) - 1) === 15)
					festival = '關門節';
				return [ year, '閏9', date_name(date), festival ];
			}
			date -= 30;
		}
	}

	// month starts @ 6.
	var month = 6 + ((date / (29 + 30) | 0) << 1) | 0;
	if ((date %= 29 + 30) >= 29)
		month++, date -= 29;
	date++;
	if (month > 12) {
		month -= 12;
		if (month >= 6 && ((month > 6 ? date + 29 : date)
		// 在 date < 今年元旦日序的情況下，由於仍具有獨一性，因此不加上'後'。
		>= Dai_Date.new_year_date_serial(year)))
			// 會將空日視為前面的一年。
			month = '後' + month;
	}
	if (!festival && date === 15)
		if (month === 12)
			festival = '開門節';
		else if (month === 9 && !Dai_Date.is_leap(year))
			festival = '關門節';

	return [ year, month, date_name(date), festival ];
};


// 傣曆紀元起算日期。
Dai_Date.epoch = String_to_Date('638/3/22', {
	parser : 'Julian'
}).getTime()
// 傣曆紀元積日數 = JDN - 1954166
- Dai_Date.new_year_days(0) * ONE_DAY_LENGTH_VALUE;


/*

console.error(CeL.Dai_Date.test(-20 * 366, 20000 * 366).join('\n'));
console.error(CeL.Dai_Date.test('699/3/21'.to_Date('CE'), 4).join('\n'));

console.error(CeL.Dai_Date.test(1000 * 366, 2000 * 366).join('\n'));
console.error(CeL.Dai_Date.test(new Date('1845/4/11'), 4).join('\n'));

// get:
-42657868800000 (-7304): -20/6/20
-42626332800000 (-6939): -19/6/1
-42594796800000 (-6574): -18/6/12
-42563174400000 (-6208): -17/6/24
-42531638400000 (-5843): -16/6/5
-42500102400000 (-5478): -15/6/15
-42468566400000 (-5113): -14/6/26
-42436944000000 (-4747): -13/6/8
-42405408000000 (-4382): -12/6/19
-42342336000000 (-3652): -10/6/10
-42310713600000 (-3286): -9/6/22
-42279177600000 (-2921): -8/6/3
-42247641600000 (-2556): -7/6/14
-42216105600000 (-2191): -6/6/25
-42184483200000 (-1825): -5/6/6
-42152947200000 (-1460): -4/6/17
-42121411200000 (-1095): -3/6/28
-42089875200000 (-730): -2/6/9
-42058252800000 (-364): -1/6/21


2014/4/27 13:44:6
CeL.Dai_Date.test(CeL.Dai_Date.new_year_days(0,0,1),CeL.Dai_Date.new_year_days(3192,0,1)).join('\n')
日期名未接續: 0/6/9/潑水節 空1日 ⇨ 1/6/12/潑水節 元旦 (639/3/22 CE)
日期名未接續: 1/5/22/潑水節 空2日 ⇨ 2/6/0/潑水節 元旦 (640/3/22 CE)
...

CeL.Dai_Date.test(CeL.Dai_Date.new_year_days(712,0,1),CeL.Dai_Date.new_year_days(3192,0,1)).join('\n')
...
日期名未接續: 712/5/9/潑水節 空1日 ⇨ 713/6/0/潑水節 元旦 (1351/3/28 CE)
...
日期名未接續: 3190/後7/29/潑水節 空2日 ⇨ 3191/6/0/潑水節 元旦 (3829/5/16 CE)
...

CeL.Dai_Date.test(CeL.Dai_Date.new_year_days(714, 0, 1), CeL.Dai_Date.new_year_days(3191, 0, 1) - 1).join('\n') || 'OK';
// "OK"

*/

Dai_Date.test = new_tester(function(date) {
	return date.to_Dai({
		ignore_year_limit : true,
		format : 'serial'
	});
}, Dai_Date);


_.Dai_Date = Dai_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: भारतीय राष्ट्रीय पंचांग / Indian national calendar / Saka calendar / 印度國定曆
// https://en.wikipedia.org/wiki/Indian_national_calendar

// Years are counted in the Saka Era, which starts its year 0 in the year 78 of the Common Era.
var Saka_epoch_year = 78 | 0,
// 前六個月日數。
Indian_national_6_months_days = 6 * 31 | 0,
// Indian_national_month_name[month_serial] = month name
Indian_national_month_name = '|Chaitra|Vaishākha|Jyaishtha|Āshādha|Shrāvana|Bhādrapada|Āshwin|Kārtika|Agrahayana|Pausha|Māgha|Phālguna'.split('|');

function Indian_national_Date(year, month, date) {
	year += Saka_epoch_year;
	// 預設當作閏年，3/21 起 Indian_national_6_months_days 日 + 6*30日。
	if (--month > 0
	// 則只有平年一月份需特別處理。
	|| is_leap_year(year))
		date--;
	date += month < 6 ? 31 * month : Indian_national_6_months_days + 30
			* (month - 6);

	return _Date(year, 3 - 1, 21 + date);
}

// Usage officially started at Chaitra 1, 1879 Saka Era, or March 22, 1957.
Indian_national_Date.epoch = _Date(Saka_epoch_year, 3 - 1, 22).getTime();

Indian_national_Date.is_leap = function(year) {
	return is_leap_year(Saka_epoch_year + year);
};

Indian_national_Date.month_name = function(month_serial) {
	return Indian_national_month_name[month_serial];
};


function Date_to_Indian_national(date, options) {
	var year = date.getFullYear() | 0, month = date.getMonth() | 0, days;

	if (month < 3 - 1 || month === 3 - 1 && ((days = date.getDate()) < 21
	// 3/20 or 3/21 (平年) 與之前，起始點算在前一年。
	// In leap years, Chaitra has 31 days and starts on March 21 instead.
	|| days === 21 && !is_leap_year(year)))
		year--;

	days = (date - _Date(year, 3 - 1, 21)) / ONE_DAY_LENGTH_VALUE | 0;
	// assert : days >= 0

	if (days >= Indian_national_6_months_days)
		days -= Indian_national_6_months_days,
		//
		month = 6 + days / 30 | 0, days %= 30;

	else if ((month = days / 31 | 0) > 0)
		days %= 31;
	else if (!is_leap_year(year))
		days--;

	// 日期序數→日期名。year/month/date index to serial.
	return _format([ year - Saka_epoch_year, month + 1, days + 1 ], options,
			Date_to_Indian_national.to_name);
}

Date_to_Indian_national.to_name = [ library_namespace.to_Devanagari_numeral,
		Indian_national_Date.month_name,
		library_namespace.to_Devanagari_numeral ];

/*

CeL.Indian_national_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

'0078/3/24'.to_Date().to_Indian_national()
// [0, 1, 3]

*/
Indian_national_Date.test = new_tester(Date_to_Indian_national,
		Indian_national_Date, {
			month_days : {
				'31' : 'first 6 months',
				'30' : 'last 6 months'
			}
		});


_.Indian_national_Date = Indian_national_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: 巴哈伊曆法 / Bahá'í calendar / Badí‘ calendar
// https://en.wikipedia.org/wiki/Bah%C3%A1'%C3%AD_calendar
// http://www.bahai.us/welcome/principles-and-practices/bahai-calendar/


// month (Bahai_Ha): month serial of Ayyám-i-Há (intercalary days)
// assert: Bahai_Ha != 1, 2, 3, .. 19.
var Bahai_Ha = -1 | 0,
// start hour of day: -6.
Bahai_start_hour_of_day = -6 | 0,
// i.e., 18:0
Bahai_start_hour_of_day_non_negative = (Bahai_start_hour_of_day % ONE_DAY_HOURS + ONE_DAY_HOURS)
		% ONE_DAY_HOURS | 0,
// 1844 CE
Bahai_epoch_year = 1844 | 0,
//
Bahai_year_months = 19 | 0,
//
Bahai_Vahid_years = 19 | 0, Bahai_Kull_i_Shay_years = 19 * Bahai_Vahid_years | 0,
// Years in a Váḥid
Bahai_year_name = "Alif|Bá’|Ab|Dál|Báb|Váv|Abad|Jád|Bahá'|Ḥubb|Bahháj|Javáb|Aḥad|Vahháb|Vidád|Badí‘|Bahí|Abhá|Váḥid".split('|'),
// Bahai_month_name[month_serial] = month name
// the days of the month have the same names as the names of the month
Bahai_month_name = '|Bahá|Jalál|Jamál|‘Aẓamat|Núr|Raḥmat|Kalimát|Kamál|Asmá’|‘Izzat|Mashíyyat|‘Ilm|Qudrat|Qawl|Masá’il|Sharaf|Sulṭán|Mulk|‘Alá’'.split('|');
Bahai_month_name[Bahai_Ha] = 'Ayyám-i-Há';

function Bahai_Date(year, month, date) {
	if (month == Bahai_year_months)
		month = 0, year++;
	else if (month == Bahai_Ha)
		month = Bahai_year_months;

	date = new Date(_Date(Bahai_epoch_year - 1 + year, 3 - 1, 2
	// , Bahai_start_hour_of_day
	).getTime() + (month * Bahai_year_months + date - 1)
			* ONE_DAY_LENGTH_VALUE);

	return date;
}

// 1844/3/21
Bahai_Date.epoch = new Date(Bahai_epoch_year, 3 - 1, 21).getTime();

Bahai_Date.month_name = function(month_serial) {
	return Bahai_month_name[month_serial];
};

// return [ Kull-i-Shay’, Váḥid, Bahá'í year ]
Bahai_Date.Vahid = function(year, numerical) {
	var Kull_i_Shay = Math.floor(--year / Bahai_Kull_i_Shay_years) + 1 | 0, Vahid = year
			% Bahai_Kull_i_Shay_years | 0;
	// 轉正。保證變數值非負數。
	if (Vahid < 0)
		Vahid += Bahai_Kull_i_Shay_years;
	year = Vahid % Bahai_Vahid_years | 0;
	return [ Kull_i_Shay, (Vahid / Bahai_Vahid_years | 0) + 1,
			numerical ? year + 1 : Bahai_year_name[year] ];
};


function Date_to_Bahai(date, options) {
	var year = date.getFullYear(), month = date.getMonth(), days, delta;

	if (month < 3 - 1 || month === 3 - 1 && date.getDate() === 1
			&& date.getHours() < Bahai_start_hour_of_day_non_negative)
		// 3/1 18: 之前，起始點算在前一年。
		year--;

	days = (date - _Date(year, 3 - 1, 2, Bahai_start_hour_of_day))
			/ ONE_DAY_LENGTH_VALUE;
	// assert: days>=0
	delta = days % 1;
	month = (days |= 0) / Bahai_year_months | 0;
	days %= Bahai_year_months;
	if (month === 0)
		// ‘Alá’
		month = Bahai_year_months, year--;
	else if (month === Bahai_year_months)
		month = Bahai_Ha;

	// 前置處理。
	if (!library_namespace.is_Object(options))
		options = library_namespace.null_Object();

	// 日期序數→日期名。year/month/date index to serial.
	year -= Bahai_epoch_year - 1;
	date = options.single_year ? [ year ] : Bahai_Date.Vahid(year,
			options.numerical_date);
	++days;
	if (options.format !== 'serial') {
		days = Bahai_Date.month_name(days);
		month = Bahai_Date.month_name(month);
	}
	date.push(month, days, delta);
	if (options.format !== 'serial' && options.format !== 'item') {
		// popup delta.
		date.pop();
		date = date.reverse().join(' ');
	}

	return date;
}



/*

CeL.Bahai_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

'1845/3/2'.to_Date('CE').to_Bahai({single_year : true})
// -1/6/29

*/
Bahai_Date.test = new_tester(Date_to_Bahai, Bahai_Date, {
	month_days : {
		'19' : 'common month',
		'4' : 'intercalary month',
		'5' : 'intercalary month + intercalary day'
	},
	continued_month : function(month, old_month) {
		return old_month === Bahai_year_months && month === 1
				|| old_month === Bahai_year_months - 1 && month === Bahai_Ha
				|| old_month === Bahai_Ha && month === Bahai_year_months;
	},
	CE_format : {
		parser : 'CE',
		format : '%Y/%m/%d %H: CE'
	},
	single_year : true
});


_.Bahai_Date = Bahai_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: 科普特曆 / Coptic calendar / Alexandrian calendar
// 埃及東正教仍然在使用。
// http://orthodoxwiki.org/Coptic_calendar
// Egypt used the Coptic Calendar till the Khedive Ismael adopted the Western Gregorian Calendar in the nineteenth century and applied it in Egypt's government departments.
// The Coptic calendar has 13 months, 12 of 30 days each and an intercalary month at the end of the year of 5 or 6 days, depending whether the year is a leap year or not. The year starts on 29 August in the Julian Calendar or on the 30th in the year before (Julian) Leap Years. The Coptic Leap Year follows the same rules as the Julian Calendar so that the extra month always has six days in the year before a Julian Leap Year.
// The Feast of Neyrouz marks the first day of the Coptic year. Its celebration falls on the 1st day of the month of Thout, the first month of the Coptic year, which for AD 1901 to 2098 usually coincides with 11 September, except before a Gregorian leap year when it's September 12. Coptic years are counted from AD 284, the year Diocletian became Roman Emperor, whose reign was marked by tortures and mass executions of Christians, especially in Egypt. Hence, the Coptic year is identified by the abbreviation A.M. (for Anno Martyrum or "Year of the Martyrs"). The A.M. abbreviation is also used for the unrelated Jewish year (Anno Mundi).
// To obtain the Coptic year number, subtract from the Julian year number either 283 (before the Julian new year) or 284 (after it).
// http://orthodoxwiki.org/Calendar

var Coptic_common_month = 30,
//
Coptic_common_year_days = 12 * Coptic_common_month + 5 | 0,
// Coptic 4 year cycle days.
Coptic_cycle_days = 4 * Coptic_common_year_days + 1 | 0,
//
Coptic_month_name = '|Thout|Paopi|Hathor|Koiak|Tobi|Meshir|Paremhat|Paremoude|Pashons|Paoni|Epip|Mesori|Pi Kogi Enavot'
		.split('|');

function Coptic_Date(year, month, date, get_days, year_0) {
	if (year < 0 && !year_0)
		// year: -1 → 0
		++year;

	var days = Math.floor(--year / 4) * Coptic_cycle_days | 0;
	// 轉正。保證變數值非負數。
	if ((year %= 4) < 0)
		year += 4;
	days += year * Coptic_common_year_days | 0;
	// all days @ year 3 of the cycle (0~3) needs to add 1 day for the
	// intercalary day of year 3.
	if (year === 3)
		days++;

	days += (month - 1) * Coptic_common_month + date - 1 | 0;
	return get_days ? days : new Date(Coptic_Date.epoch + days
			* ONE_DAY_LENGTH_VALUE);
}

// year 1/1/1 starts at 284/8/29.
// year 0/1/1 starts at 283/8/30.
// the Coptic_Date.epoch is Coptic 1/1/1!
Coptic_Date.epoch = String_to_Date('284/8/29', {
	parser : 'Julian'
}).getTime();

// leap year: 3, 3+4, 3+8, ..
// e.g., year 3: 286/8/29~287/8/29 CE, 366 days.
Coptic_Date.is_leap = function(year) {
	// 轉正。保證變數值非負數。
	if ((year %= 4) < 0)
		year += 4;
	return year === 3;
};

Coptic_Date.month_name = function(month) {
	return Coptic_month_name[month];
};


function Date_to_Coptic(date, options) {
	var days = Math.floor((date - Coptic_Date.epoch) / ONE_DAY_LENGTH_VALUE) | 0,
	//
	year = Math.floor(days / Coptic_cycle_days) * 4 + 1 | 0,
	//
	month = 3 * Coptic_common_year_days | 0;
	// 轉正。保證變數值非負數。
	if ((days %= Coptic_cycle_days) < 0)
		days += Coptic_cycle_days;

	if (days === month)
		// (3+4k)/13/6.
		// e.g., 287/8/29
		year += 2, month = 12, date = 5;
	else {
		if (days < month) {
			month = days / Coptic_common_year_days | 0;
			year += month;
			days -= month * Coptic_common_year_days;
		} else
			year += 3, days -= month + 1;

		month = days / Coptic_common_month | 0;
		date = days % Coptic_common_month;
	}

	// 日期序數→日期名。year/month/date index to serial.
	if (year <= 0 && (!options || !options.year_0))
		// year: 0 → -1
		--year;

	return _format([ year, month + 1, date + 1 ], options,
			Coptic_Date.month_name);
}


/*

CeL.Coptic_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

*/
Coptic_Date.test = new_tester(Date_to_Coptic, Coptic_Date, {
	month_days : {
		'30' : 'common month',
		'5' : 'intercalary month',
		'6' : 'intercalary month + intercalary day'
	}
});


_.Coptic_Date = Coptic_Date;


//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// 長曆: የኢትዮጵያ ዘመን አቆጣጠር / 衣索比亞曆 / 埃塞俄比亚历 / Ethiopian calendar
// https://am.wikipedia.org/wiki/%E1%8B%A8%E1%8A%A2%E1%89%B5%E1%8B%AE%E1%8C%B5%E1%8B%AB_%E1%8B%98%E1%88%98%E1%8A%95_%E1%8A%A0%E1%89%86%E1%8C%A3%E1%8C%A0%E1%88%AD
// The Ethiopian months begin on the same days as those of the Coptic calendar, but their names are in Ge'ez.
// http://www.ethiopiancalendar.net/


function Ethiopian_Date(year, month, date, year_0) {
	if (year < 0 && !year_0)
		// year: -1 → 0
		++year;

	year += Ethiopian_year_to_Coptic;

	return Coptic_Date(year, month, date, false, true);
}

// year 1/1/1 starts at 8/8/29.
// Ethiopians and followers of the Eritrean churches today use the Incarnation Era, which dates from the Annunciation or Incarnation of Jesus on March 25 of 9 AD (Julian), as calculated by Annianus of Alexandria c. 400; thus its first civil year began seven months earlier on August 29, 8 AD. Meanwhile, Europeans eventually adopted the calculations made by Dionysius Exiguus in 525 AD instead, which placed the Annunciation eight years earlier than had Annianus.
Ethiopian_Date.epoch = String_to_Date('008/8/29', {
	parser : 'Julian'
}).getTime();

var Ethiopian_year_to_Coptic = (new Date(Ethiopian_Date.epoch)).getFullYear()
		- (new Date(Coptic_Date.epoch)).getFullYear(),
//
Ethiopian_month_name = '|Mäskäräm (መስከረም)|Ṭəqəmt(i) (ጥቅምት)|Ḫədar (ኅዳር)|Taḫśaś ( ታኅሣሥ)|Ṭərr(i) (ጥር)|Yäkatit (Tn. Läkatit) (የካቲት)|Mägabit (መጋቢት)|Miyazya (ሚያዝያ)|Gənbot (ግንቦት)|Säne (ሰኔ)|Ḥamle (ሐምሌ)|Nähase (ነሐሴ)|Ṗagʷəmen/Ṗagume (ጳጐሜን/ጳጉሜ)'
		.split('|');

Ethiopian_Date.month_name = function(month) {
	return Ethiopian_month_name[month];
};


function Date_to_Ethiopian(date, options) {
	date = Date_to_Coptic(date, {
		format : 'serial',
		year_0 : true
	});
	date[0] -= Ethiopian_year_to_Coptic;

	// 日期序數→日期名。year/month/date index to serial.
	if (date[0] <= 0 && (!options || !options.year_0))
		// year: 0 → -1
		--date[0];

	return _format(date, options, Ethiopian_Date.month_name);
}



/*

CeL.Ethiopian_Date.test(-2e4, 4e6, 4).join('\n') || 'OK';
// "OK"

*/
Ethiopian_Date.test = new_tester(Date_to_Ethiopian, Ethiopian_Date, {
	month_days : {
		'30' : 'common month',
		'5' : 'intercalary month',
		'6' : 'intercalary month + intercalary day'
	}
});


_.Ethiopian_Date = Ethiopian_Date;

//----------------------------------------------------------------------------------------------------------------------------------------------------------//
// export methods.


library_namespace.set_method(Date.prototype, {
	to_Long_Count : set_bind(Maya_Date.to_Long_Count),
	to_Tabular : set_bind(Date_to_Tabular),
	to_Hebrew : set_bind(Date_to_Hebrew),
	to_Dai : function(options) {
		// 轉成紀元積日數。
		return Dai_Date.date_of_days((this - Dai_Date.epoch)
				/ ONE_DAY_LENGTH_VALUE | 0, options);
	},
	to_Indian_national : set_bind(Date_to_Indian_national),
	to_Bahai : set_bind(Date_to_Bahai),
	to_Coptic : set_bind(Date_to_Coptic),
	to_Ethiopian : set_bind(Date_to_Ethiopian)
});


return (
	_// JSDT:_module_
);
}


});



/**
 * @name	CeL integer function
 * @fileoverview
 * 本檔案包含了整數 (integer) 的 functions。<br />
 * 藉由原生計算功能，盡可能提供高效的大數計算。<br />
 * integer 大數基本上即為 Integer.BASE 進位制之數字系統。
 *
 * @example
 * <code>
 * CeL.run('data.math.integer');
 * var integer = new CeL.integer('654561264556287547824234523');
 * CeL.log(integer.add('096527893048039647894'));
 * </code>
 *
 * @since	2013/9/8 13:42:58
 */


/*
TODO:


http://msdn.microsoft.com/zh-tw/library/system.numerics.biginteger.aspx
http://docs.oracle.com/javase/7/docs/api/java/math/BigInteger.html


https://github.com/silentmatt/javascript-biginteger
https://github.com/peterolson/BigInteger.js
https://github.com/peterolson/BigRational.js
https://github.com/cwacek/bigint-node/blob/master/lib/bigint.js

http://www.leemon.com/crypto/BigInt.html
http://www-cs-students.stanford.edu/~tjw/jsbn/
http://java.sun.com/javase/6/docs/api/java/math/BigInteger.html


規格書:

integer = new Integer(number,        do not set fraction = false, base = default base);
integer = new Integer(number String, base of String,              base = default base);
integer = new Integer(Integer,       (ignored),                   base = default base);

// digit Array
integer[{integer}digit index] = the digit of base ^ (index + exponent)
integer[KEY_NEGATIVE]		= {Undefined|Boolean}this integer is negative
integer[KEY_BASE]			= {natural number}base of this integer
integer[KEY_EXPONENT]		= {integer}exponent of this integer
integer[KEY_CACHE]			= {Undefined|Array}cache String of value
integer[KEY_CACHE][base]	= {String}value in base
integer[KEY_TYPE]			= {Undefined|Number}NaN / Infinity
integer[KEY_FACTORS]		= {Undefined|Array}factors / 因數
integer[KEY_FACTORS].sort(function(a,b){var na=Array.isArray(a),nb=Array.isArray(b);return na^nb?na^0:na&&nb?a.length-b.length||a[a.length-1]-b[b.length-1]:a-b;});


*/



'use strict';
if (typeof CeL === 'function')
	CeL.run(
	{
		name: 'data.math.integer',
		require: 'data.code.compatibility|data.native|data.math.GCD|data.math.factorization',
		code: function (library_namespace) {

			//	requiring
			var GCD, factorization;
			eval(this.use());

			// ---------------------------------------------------------------------//
			// 定義基本常數。

			// {safe integer} MIN_BASE <= instance[KEY_BASE] <= MAX_BASE
			// instance[KEY_BASE] 初始設定完後，除非歸零，否則不可再改變!
			var KEY_BASE = 'base',
			// sign. true: *this* is negative, false/undefined: positive.
			KEY_NEGATIVE = 'negative',
			//{Integer}[exponent]	輸入數值標記之科學記數法指數 in instance[KEY_BASE]。default 0.
			KEY_EXPONENT = 'exponent',
			//僅為大數整數分解（因數分解, integer factorization）存在。
			// this[KEY_FACTORS] = [ {safe integer}scalar純量, Integer, ..]
			KEY_FACTORS = 'factors',
			// instance[KEY_CACHE][base] = string in base;
			KEY_CACHE = 'cache',
			//instance[KEY_TYPE] = NaN / Infinity; unset: instance is normal number.
			// ** instance[\d] 本身僅存儲純數字。
			KEY_TYPE = 'type',

			// 本 library 所允許之最大可安全計算整數。MAX_SAFE_INTEGER <= Number.MAX_SAFE_INTEGER。
			MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER,

			// see for_each_digit()
			//之後再作初始化。
			//assert: 0 < MIN_BASE <= MAX_BASE
			MIN_BASE = 0,
			// assert: MAX_BASE * MAX_BASE < MAX_SAFE_INTEGER + 2
			// see change_base_to(), for_each_digit()
			//	為方便乘法處理，因此取自乘不致 overflow ( > MAX_SAFE_INTEGER) 之值，預防 overflow 用。
			MAX_BASE = Math.floor(Math.sqrt(MAX_SAFE_INTEGER)),

			//可辨認之數字字串。
			//	[ full , sign, integer part 整數部分, fractional part 小數部分, exponent 指數 ]
			PATTERN_NUMBER = /([+\-]?)([\da-z]*)(?:\.([\da-z]+))?(?:[eE]([+\-]?\d+))?/,

			DECIMAL_BASE = (1 + '0'.repeat(Math.log10(MAX_SAFE_INTEGER) >> 1)) | 0,
			//	default base.
			DEFAULT_BASE = DECIMAL_BASE,

			MULTIPLICATION_BOUNDARY = multiplication_boundary(DEFAULT_BASE),

			/**
			 * parseInt( , radix) 可處理之最大 radix，<br />
			 * 與 Number.prototype.toString ( [ radix ] )<br />
			 * 可用之最大基數 (radix, base)。<br />
			 * 10 Arabic numerals + 26 Latin alphabet.<br />
			 * 之後再作初始化。
			 *
			 * @inner
			 * @see
			 * <a href="http://en.wikipedia.org/wiki/Hexadecimal" accessdate="2013/9/8 17:26">Hexadecimal</a>
			 */
			MAX_RADIX = 0,
			//之後再作初始化。
			MIN_RADIX = 0,
			// 應與 parseInt() 一致。
			DEFAULT_RADIX = parseInt('10', undefined),
			// 數字過大，parseInt() 無法獲得精確數值時使用 DEFAULT_DIGITS。不分大小寫。應與 parseInt() 一致。
			// assert: DEFAULT_DIGITS.length === MAX_RADIX
			// assert: DEFAULT_DIGITS.toLowerCase() === DEFAULT_DIGITS
			DEFAULT_DIGITS = '',
			DEFAULT_DIGITS_CACHE,

			// 乘法單位元素
			// https://en.wikipedia.org/wiki/Identity_element
			MULTIPLICATIVE_IDENTITY = 1 / 1,
			// http://en.wikipedia.org/wiki/Absorbing_element
			ABSORBING_ELEMENT = 0,

			trim_0,

			// Array 或 Uint32Array。
			array_type = Array,
			// array_clone(from, to[, assignment]): 在不改變 to 之 reference 下，將 to 之陣列內容改為與 from 相同。
			array_clone,
			//reset digits of (this)
			array_reset,
			//
			shift_digits;


			// ---------------------------------------------------------------------//
			// 初始調整並規範基本常數。

			/**
			 * 工具函數：轉換 ['a','b','c'] → {a:0,b:1,c:2}。
			 *
			 * @param	{Array}[base]	輸入數值採用之進位制基底/數字 digit 字集。
			 *
			 * @return	回傳 cache 物件。
			 *
			 * @inner
			 */
			function digit_cache(base) {
				var digits = library_namespace.null_Object();
				base.forEach(function (digit, index) {
					if (digit.length !== 1)
						library_namespace.err('Invalid digit: [' + digit + '].');
					else if (digit in digits)
						library_namespace.err('Digit already exists: [' + digit + '] = ' + digits[digit]);
					else
						digits[digit] = index;
				});
				return digits;
			}

			// 工具函數
			//truncation
			function Array_reset(array, length) {
				// 或可參考:
				// http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
				length = array.length - (length || 0);
				while (0 < length--)
					array.pop();
				return array;
			}

			function General_reset(array) {
				var i = array.length;
				while (0 < i--)
					array[i] = 0;
				return [];
			}

			function Array_clone(from, to) {
				if (from !== to) {
					Array_reset(to);
					array_type.prototype.push.apply(to, from);
				}
			}

			function General_clone(from, to) {
				if (from !== to) {
					var index = to.length, l = from.length;
					if (index < l) {
						library_namespace.warn('General_clone: Target array has a shorter length!');
						//index = l;
					} else
						while (l < index)
							//高位補 0。
							to[--index] = 0;
					//assert: index <= from.length, should be (from.length).
					while (0 < index--)
						to[index] = from[index];
				}
			}

			// 清理高數位的 0。
			function Array_trim_0(integer, preserve) {
				var index = integer.length;
				// 1 < index: 直接保留最後一個，省得麻煩。
				if (preserve === undefined)
					preserve = 1;
				//assert: integer[index] is integer
				while (preserve < index-- && integer[index] === 0);
				integer.length = index + 1;
				return integer;
			}

			//exponent>0 時會去掉尾數 exponent 個 digits。
			//exponent<0 時會補上尾數 exponent 個 digits。
			function Array_shift_digits(integer, exponent) {
				if (exponent |= 0) {
					integer[KEY_EXPONENT] += exponent;
					if (0 < exponent)
						integer.splice(0, exponent);
					else {
						var a = new Array(-exponent);
						a.fill(0);
						Array.prototype.unshift.apply(integer, a);
					}
				}
			}

			function General_shift_digits(integer, exponent) {
				if (exponent |= 0) {
					integer[KEY_EXPONENT] += exponent;
					if (0 < exponent)
						for (var i = 0, l = integer.length; i < l; i++)
							integer[i] = i + exponent < l ? integer[i + exponent] : 0;
					else
						for (var i = integer.length - 1; 0 <= i; i--)
							integer[i] = i + exponent < 0 ? 0 : integer[i + exponent];
				}
			}


			//找出最小可用之 radix。
			while (Number.isNaN(parseInt('1', ++MIN_RADIX)));
			try {
				for (; ;) {
					//console.log(MAX_RADIX + ' ' + DEFAULT_DIGITS);
					// will be '0123456789abcdefghijklmnopqrstuvwxyz'
					DEFAULT_DIGITS += MAX_RADIX.toString(1 < ++MAX_RADIX ? MAX_RADIX : undefined);
				}
			} catch (e) { }
			// 將 DEFAULT_DIGITS 轉成小寫。
			DEFAULT_DIGITS = DEFAULT_DIGITS.toLowerCase();
			DEFAULT_DIGITS_CACHE = digit_cache(DEFAULT_DIGITS.split(''));

			//規範 MAX_SAFE_INTEGER
			if (MAX_SAFE_INTEGER > Number.MAX_SAFE_INTEGER)
				MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

			//決定 MIN_BASE
			while ((MAX_SAFE_INTEGER / ++MIN_BASE | 0) < 0);

			(function () {
				// 測試 array_type 可存取 attributes。
				var a = array_type && new array_type(2), b;
				if (a)
					a[KEY_BASE] = 9;
				if (!a || a[KEY_BASE] !== 9)
					// assert: Array 可存取 attributes。
					a = new (array_type = Array);
				else if (0 < a.BYTES_PER_ELEMENT) {
					// for TypedArray, 決定 MAX_BASE。
					// 1 byte = 8 bits
					b = Math.floor(Math.sqrt(1 << 8 * a.BYTES_PER_ELEMENT));
					if (b < MAX_BASE) {
						if (a.BYTES_PER_ELEMENT < 4)
							library_namespace.warn('所使用之 array type 能存放之值過小，將影響效能！');
						MAX_BASE = b;
					} else if (MAX_BASE < b)
						// 一般說來，TypedArray 不可能存放超過 Number.MAX_SAFE_INTEGER 之整數值，因此不應該執行到這！
						library_namespace.err('所使用之 array type 能存放超過最大可安全計算整數 Number.MAX_SAFE_INTEGER 之值，恐造成錯誤計算結果！');
				}

				// 決定可用的 .push() 等 array 工具函數。
				if (array_type.prototype.push) {
					array_type.prototype.push.apply(a = new array_type, [4, 3]);
					if (a[1] === 3 && a.length === 2) {
						a.length = 0;
						if (a.length === 0) {
							//可設定 .length
							array_clone = Array_clone;
							array_reset = Array_reset;
							trim_0 = Array_trim_0;
							shift_digits = Array_shift_digits;
						}
					}
				}
				if (!array_clone) {
					array_clone = General_clone;
					//無法設定 .length
					array_reset = General_reset;
					trim_0 = function (integer) {
						return integer;
					};
					shift_digits = General_shift_digits;
				}
			})();

			// ---------------------------------------------------------------------//
			// 工具函數

			//為正規 base。
			function valid_base(base) {
				// assert: MAX_BASE === MAX_BASE | 0
				if (base === (base | 0) && MIN_BASE <= base && base <= MAX_BASE
					//&& base !== Integer.prototype[KEY_BASE]
					)
					return base;
			}

			// 超過此界限，與元素(Integer digit)相乘時即有可能超過 Number.MAX_SAFE_INTEGER。
			// boundary(base+2)<Number.MAX_SAFE_INTEGER
			function multiplication_boundary(base) {
				//assert: return > 1
				return valid_base(base) ? Math.floor(MAX_SAFE_INTEGER / base) : MULTIPLICATION_BOUNDARY;
			}


			// 若為準確次方，則回傳次方數。
			// number = base ^ count_exponent(number, base)
			function count_exponent(number, base) {
				if (number < base)
					return -count_exponent(base, number);

				var exponent = 0;
				while (number !== 0 && 0 === number % base)
					number /= base, exponent++;
				// 1: (any number) ^ 0
				if (number === 1)
					return exponent;
			}

			function do_modified(integer) {
				delete integer[KEY_CACHE];
			}

			// ---------------------------------------------------------------------//
			//	definition of module integer

			/**
			 * 任意大小、帶正負號的整數。integer instance.
			 *
			 * @example
			 * <code>
			 * CeL.log((new CeL.integer('876567896')).op('*','6456789976545678'));
			 * </code>
			 *
			 * @class	Integer 的 constructor
			 * @constructor
			 */
			function Integer(number) {
				var integer = new_instance();
				if (number !== undefined)
					assignment.apply(integer, arguments);

				return integer;
			}
			var new_instance = Array.derive(Integer, array_type),
			//
			is_Integer = (new Integer) instanceof Integer ? function (number) {
				return number instanceof Integer;
			} : array_type === Array ? Array.isArray
			//
			: library_namespace.type_tester(library_namespace.is_type(new array_type));

			//	class public interface	---------------------------

			function Integer_compare(number1, number2) {
				if (typeof number1 === 'number' && typeof number2 === 'number')
					return number1 - number2;

				if (!is_Integer(number1))
					number1 = new Integer(number1, null, is_Integer(number2) && number2[KEY_BASE]);
				return number1.compare(number2);
			}

			library_namespace.extend({
				compare: Integer_compare
			}, Integer);

			//	instance public interface	-------------------

			//	每個位數存放 {safe integer} 0 ~ 此數-1，大於等於 此數 即須進位。
			//read-only
			Integer.prototype[KEY_BASE] = DEFAULT_BASE;
			// 預設為 0 次方。
			Integer.prototype[KEY_EXPONENT] = 0;

			if (!Integer.prototype.forEach)
				Integer.prototype.forEach = Array.prototype.forEach;

			library_namespace.extend({
				// 下面全部皆為 assignment，例如 '+' 實為 '+='
				'=': assignment,
				assignment: assignment,

				'+': add,
				'-': subtract,
				'*': multiply,
				'/': divide,
				'%': modulus,
				// add_assignment
				add: add,
				// subtract_assignment
				subtract: subtract,
				// multiply_assignment
				multiply: multiply,
				// divide_assignment
				divide: divide,
				modulus: modulus,

				division: division,
				// 至此為 assignment。

				'==': compare,
				compare: compare,
				compare_amount: compare_amount,

				op: operate,
				for_each_digit: for_each_digit,
				valueOf: valueOf,
				toString: toString
			}, Integer.prototype);

			// ---------------------------------------------------------------------//

			/**
			 * assignment value of integer instance.<br />
			 * 僅設定單一值。
			 *
			 * @param	{Number|String|Integer}number 輸入數值(value/number)大小。
			 * @param	{natural number|String|Array}[base]	輸入數值採用之進位制基底/數字 digit 字集。區分大小寫。
			 * @param	{natural number}[to_base]	內採基底/進位制。
			 *
			 * @example
			 * <code>
			 * CeL.log((new CeL.integer('876567896')).op('*','6456789976545678'));
			 * </code>
			 *
			 * @return	回傳 integer 物件。
			 */
			function assignment(number, base, to_base) {

				/**
				 * 前期處理: String → Number / Integer<br />
				 * 轉換指定進位的數字文字，成為{Number}純量或 {Integer} 物件。<br />
				 * treat arguments as: (number_String, base, to_base)
				 *
				 * @see
				 * <a href="http://en.wikipedia.org/wiki/Numerical_digit" accessdate="2010/4/16 20:47">Numerical digit</a>
				 */
				if (typeof number === 'string' && (number = number.trim())) {
					// 正規化(normalize) base

					// {Array}base → {String}base
					if (Array.isArray(base)) {
						base.forEach(function (digit) {
							if (digit.length !== 1)
								library_namespace.err('assignment: Invalid digit of base: [' + digit + '].');
						});
						base = base.join('');
					}
					if (typeof base === 'string' && DEFAULT_DIGITS.startsWith(base.toLowerCase()))
						// 使用 DEFAULT_DIGITS。
						base = base.length;

					if (typeof base === 'string' ? base.length < 2
						//base is number
						: base !== (base | 0) || base < MIN_RADIX || MAX_RADIX < base) {
						if (base)
							library_namespace.err('assignment: Invalid base: [' + base + ']');
						base = undefined;
					}

					var digits, value;

					if (typeof base === 'string') {
						digits = digit_cache(base.split(''));
						value = number.split('');
						number = new Integer(0, null, base = base.length);

						// 嘗試以 native method 取得。
					} else if (Number.isSafeInteger(value = base ? parseInt(number, base) : parseFloat(number)))
						number = value;

						// 數字過大，native method 無法獲得精確數值時使用 DEFAULT_DIGITS。不分大小寫。基本上應與 parseInt() 一致。

						// 將轉成小寫。
						//	[ full , sign, integer part 整數部分, fractional part 小數部分, decimal exponent 指數 ]
					else if (value = number.toLowerCase().match(PATTERN_NUMBER)) {
						if (!base)
							base = DEFAULT_RADIX;
						number = new Integer(0, null, base);
						//處理 sign
						if (value[1] === '-')
							number[KEY_NEGATIVE] = true;
						//處理指數
						value[4] |= 0;
						if (value[3]) {
							//處理掉 fractional part 小數部分
							value[4] -= value[3].length;
							value[2] += value[3];
						}
						if ((digits = value[2].match(/^(.*)(0+)$/))
							//1e4: 若是 exponent 不大，則基本上無須處理，直接展開即可。
						&& (value[4] < 0 || 1e4 < value[4] + digits[2].length)) {
							//去掉最後的 0
							value[4] += digits[2].length;
							value[2] = digits[1];
						}
						if (value[4])
							//1e4: 若是 exponent 不大，則基本上無須處理，直接展開即可。
							if (value[4] < 0 || 1e4 < value[4])
								number[KEY_EXPONENT] = value[4];
							else
								value[2] += '0'.repeat(value[4]);

						value = value[2].split('');
						digits = DEFAULT_DIGITS_CACHE;

					} else {
						library_namespace.err('assignment: Invalid number string: [' + number + '].');
						number = NaN;
					}

					if (Array.isArray(value)) {
						//base: {natural number}length of base.
						//digits: {Object}base cache.
						//value: {Array}digits of specified base
						// number: 欲轉換 base 之 {Integer}。

						value.reverse();
						//Array.map()
						value.forEach(function (digit, index) {
							if (digit in digits)
								number[index] = digits[digit];
							else
								library_namespace.err('assignment: Invalid number digit: [' + digit + '].');
						});
						if (!to_base && count_exponent(DEFAULT_BASE, base))
							to_base = DEFAULT_BASE;
					}
				}


				// ---------------------------------------
				if (is_Integer(number)) {
					// 已經是 Integer 了。
					// clone, deep_copy。

					//let to_base === this[KEY_BASE], base === number[KEY_BASE]
					// 無設定 to_base 時，將 base 視作 to_base。
					//assert: number[KEY_BASE] 為正規 base。
					to_base = valid_base(to_base || base) || number[KEY_BASE];
					base = number[KEY_BASE];

					if (this !== number || base !== to_base) {
						if (this === number)
							number = new Integer(number);
						else {
							// copy attributes.
							this[KEY_NEGATIVE] = number[KEY_NEGATIVE];

							if (KEY_CACHE in number) {
								var array = this[KEY_CACHE] = [];
								number[KEY_CACHE].forEach(function (string, radix) {
									array[radix] = string;
								});
							} else
								delete this[KEY_CACHE];

							if (KEY_FACTORS in number) {
								var array = this[KEY_FACTORS] = [];
								number[KEY_FACTORS].forEach(function (factor) {
									if (factor)
										array.push(is_Integer(factor) ? new Integer(factor) : factor);
								});
							} else
								delete this[KEY_FACTORS];
						}

						do_modified(this);

						this[KEY_BASE] = to_base;

						if (KEY_TYPE in number) {
							this[KEY_TYPE] = number[KEY_TYPE];
							delete this[KEY_EXPONENT];
							array_reset([], this);

						} else if (to_base === base || number.length < 2 && !(to_base <= number[0])) {
							if (number[KEY_EXPONENT])
								this[KEY_EXPONENT] = number[KEY_EXPONENT];
							else
								delete this[KEY_EXPONENT];
							array_clone(number, this);

						} else {
							// change base to / set base
							//http://en.wikipedia.org/wiki/Change_of_base
							//http://en.wikipedia.org/wiki/Base_conversion

							var exponent = count_exponent(to_base, base), to_digit_Array = array_reset(this),
							scalar = 0,
							// 1: (any number) ^ 0
							base_now = 1;

							// 對 exponent 做特殊處置，增加效率。
							if (0 < exponent) {
								// e.g., base 10 → to_base 100
								if (number[KEY_EXPONENT]) {
									//因為會改變 number，因此新造一個。
									number = new Integer(number);
									if (0 < number[KEY_EXPONENT]) {
										// e.g., base=1e1, to_base=1e7, 23e(+17*1) = 23000e(+2*7)
										this[KEY_EXPONENT] = number[KEY_EXPONENT] / exponent | 0;
										shift_digits(number, -number[KEY_EXPONENT] % exponent);
									} else {
										// e.g., base=1e1, to_base=1e7, 23e(-17*1) = 230000e(-3*7)
										this[KEY_EXPONENT] = (number[KEY_EXPONENT] / exponent | 0) - 1;
										shift_digits(number, -(number[KEY_EXPONENT] % exponent) - exponent);
									}
								}

								number.forEach(function (digit, index) {
									scalar += digit * base_now;
									if ((index + 1) % exponent === 0)
										to_digit_Array.push(scalar), scalar = 0, base_now = 1;
									else
										base_now *= base;
								});
								if (scalar)
									to_digit_Array.push(scalar);
								array_clone(to_digit_Array, this);

							} else if (exponent < 0) {
								// e.g., base 100 → to_base 10
								exponent = -exponent;
								if (number[KEY_EXPONENT])
									// e.g., base=1e7, to_base=1e1, 2300e(+2*7) = 2300e(+14*1)
									// e.g., base=1e7, to_base=1e1, 2300e(-2*7) = 2300e(-14*1)
									this[KEY_EXPONENT] = exponent * number[KEY_EXPONENT];
								number.forEach(function (digit, index) {
									for (var i = 0; i < exponent; i++)
										to_digit_Array.push(digit % to_base), digit = digit / to_base | 0;
								});
								trim_0(to_digit_Array);
								array_clone(to_digit_Array, this);

							} else {
								var fraction = 0, index, boundary = multiplication_boundary(to_base);

								if (number[KEY_EXPONENT]) {
									//因為會改變 number，因此新造一個。
									number = new Integer(number);
									if (0 < number[KEY_EXPONENT])
										//直接展開
										shift_digits(number, -number[KEY_EXPONENT]);
									else {
										library_namespace.err('assignment: Unable to convert from base ' + base + ' to base ' + to_base + ' with exponent ' + number[KEY_EXPONENT] + ' without loss of significance.');
										//計算 fraction
										index = -number[KEY_EXPONENT];
										for (var fraction_base = 1; fraction_base && index;)
											fraction += number[--index] * (fraction_base /= base);
										//去掉 fraction
										shift_digits(number, -number[KEY_EXPONENT]);
									}
								}

								index = number.length;
								while (0 < index--) {
									base_now *= base;
									scalar = scalar * base + number[index];
									if (boundary < base_now * base || index === 0) {
										this.for_each_digit(function (digit, carry, index) {
											// 除了積本身，這邊可能出現 scalar<=(boundary-1), carry<=(base-1)。
											// (base-1)*boundary+(boundary-1)+(base-1) <= Number.MAX_SAFE_INTEGER
											// This is also the limit of (base), therefore:
											// MAX_BASE<=Math.sqrt(Number.MAX_SAFE_INTEGER+2),
											// boundary<=(Number.MAX_SAFE_INTEGER+2)/base-1,
											return digit * base_now + carry + (index ? 0 : scalar);
										});
										//reset
										scalar = 0, base_now = 1;
									}
								}

								if (fraction)
									this.add(fraction, this[KEY_NEGATIVE]);

								if (0 === number.length)
									//assert: Array.(number)
									number.push(0);
							}
						}
					}

					// ---------------------------------------
				} else {
					if (typeof number !== 'number') {
						library_namespace.err('assignment: Invalid number: [' + number + '].');
						number = NaN;
					}

					if (base !== to_base
						//
						|| this.valueOf(TYPE_TEST) !== number) {
						do_modified(this);

						// value/scalar純量 to digit Array.
						// treat arguments as: (number, do not set fraction = false, to_base)

						// 對於非數字，無法斷定。
						if (number < 0)
							number = -number,
							this[KEY_NEGATIVE] = true;
						else
							delete this[KEY_NEGATIVE];

						delete this[KEY_FACTORS];
						delete this[KEY_EXPONENT];

						if (!isFinite(number)) {
							//NaN, Infinity, -Infinity
							this[KEY_TYPE] = number;
							array_reset(this);

						} else {
							delete this[KEY_TYPE];
							//to_base 實為欲轉換之標的 base。
							if (to_base = valid_base(to_base))
								this[KEY_BASE] = to_base;
							else
								to_base = this[KEY_BASE];
							//base 實為是否不轉換小數部分。
							if (base && number !== Math.floor(number)) {
								//number 有小數部分。
								library_namespace.warn('assignment: Number has a fractional part: [' + number + '].');
								number = Math.floor(number);
							}
							if (number < to_base && number === (number | 0))
								// 僅設定scalar純量部份。
								array_clone([number], this);

							else {
								var digit_Array = array_reset(this);

								//assert: 1 < to_base
								if (number !== Math.floor(number)) {
									// 當 base_now === 0，表示系統已無法處理較這更小的數字，再保留這之下的數值已無意義。
									for (var base_now = 1, reminder = number % 1; reminder && (base_now /= to_base) ;)
										digit_Array.unshift((reminder *= to_base) | 0), reminder %= 1;
									this[KEY_EXPONENT] = -digit_Array.length;
									number = Math.floor(number);
								} else if (!Number.isSafeInteger(number))
									//test only
									library_namespace.warn('assignment: Number is too large: [' + number + '].');

								while (0 < number) {
									digit_Array.push(number % to_base);
									number = Math.floor(number / to_base);
								}
								array_clone(digit_Array, this);
							}
						}
					}
				}

				return this;
			}


			function get_test_value(number) {
				return is_Integer(number) ? number.valueOf(TYPE_TEST) : +number;
			}


			/**
			 * 測試大小/比大小
			 * @param number	the number to compare
			 * @return	{Number}	0:==, <0:<, >0:>
			 * @_name	_module_.prototype.compare_to
			 */
			// return < 0 : this < number
			// return === 0 : this === number
			// return > 0 : this > number
			// return others : invalid number
			function compare_amount(number) {
				var i = typeof number === 'string' ? 0 : get_test_value(number), l;
				if ((KEY_TYPE in this) || !isFinite(i))
					// NaN 等極端數字的情形。
					return Math.floor(this[KEY_TYPE]) - Math.floor(i);

				// 強制轉成同底的 Integer 再處理。
				if (!is_Integer(number) || this[KEY_BASE] !== number[KEY_BASE])
					number = new Integer(number, null, this[KEY_BASE]);

				i = this.length, l = i - number.length;
				if (!l)
					//找到第一個兩者不同的位數。
					while (0 < i-- && !(l = (this[i] || 0) - (number[i] || 0)));

				return l;
			}

			function compare(number) {
				var c = typeof number === 'string' ? 0 : get_test_value(number);
				if ((KEY_TYPE in this) || !isFinite(c))
					// NaN 等極端數字的情形。
					return this[KEY_TYPE] - c;

				if (!is_Integer(number))
					number = new Integer(number, null, this[KEY_BASE]);

				if (this[KEY_NEGATIVE] ^ number[KEY_NEGATIVE])
					return this[KEY_NEGATIVE] ? -1 : 1;

				c = this.compare_amount(number);
				return this[KEY_NEGATIVE] ? -c : c;
			}



			// 工具函數
			// 將 this integer instance 自低位依 callcack() 處理至高位，
			// 結果存至 target_Integer[跳過 target_shift 個] || this。
			// 可自動處理進退位。無法處理 overflow 問題。
			// assert: callcack() 任一回傳，皆 isSafeInteger() === true。
			function for_each_digit(callcack, target_Integer, target_shift) {
				if (!target_Integer)
					target_Integer = this;
				target_shift |= 0;

				var base = target_Integer[KEY_BASE], carry = 0, length = this.length, index = 0, digit;
				if (!Number.isSafeInteger(base))
					library_namespace.err('for_each_digit: Invalid base: [' + base + '].');

				for (; index < length || carry !== 0 ; index++, target_shift++)
					// 當 index >= length，僅作進位處理。
					if (typeof (digit = index < length ? callcack(this[index] || 0, carry, index)
						// 當 this 皆 callcack() 過後，僅處理進退位。
						: carry + (target_Integer[target_shift] || 0)) === 'number') {
						if (digit < 0 && index < length) {
							// 處理退位。
							carry = digit / base | 0;
							if ((digit %= base) < 0)
								carry--, digit += base;
						} else if (base <= digit) {
							// 處理進位。
							// assert: 0 < (digit / base | 0)
							// MIN_BASE: 因為用 `|0`，故 base < 5 會出現問題:
							// (Number.MAX_SAFE_INTEGER / 4 | 0) < 0, 0 < (Number.MAX_SAFE_INTEGER / 5 | 0)
							carry = digit / base | 0;
							digit %= base;
						} else
							carry = 0;
						target_Integer[target_shift] = digit;
					} else
						carry = 0;

				trim_0(target_Integer);

				if (carry)
					library_namespace.warn('for_each_digit: carry [' + scalar + '] left.');
				return carry;
			}


			//和
			function add(addend, is_subtract) {
				// test if addend is zero.
				if (Number.isNaN(this[KEY_TYPE]) || get_test_value(addend) === 0)
					return this;

				// 強制轉成同底的 Integer 再處理。
				if (!is_Integer(addend) || this[KEY_BASE] !== addend[KEY_BASE])
					addend = new Integer(addend, null, this[KEY_BASE]);

				if ((KEY_TYPE in this) || (KEY_TYPE in addend)) {
					addend = addend.valueOf(TYPE_TEST);
					//do simulation: 模擬與 NaN 等極端數字作運算。
					addend = this.valueOf(TYPE_TEST) + (is_subtract ? -addend : addend)
					if (addend !== this.valueOf(TYPE_TEST))
						this.assignment(addend);
					return this;
				}

				// 至此特殊值處理完畢。
				do_modified(this);

				var reverse = (is_subtract ^= this[KEY_NEGATIVE] ^ addend[KEY_NEGATIVE])
				//
				&& this.compare_amount(addend) < 0,
				//
				shift = addend[KEY_EXPONENT] - this[KEY_EXPONENT], _t = this;

				if (reverse)
					//abs(this) < abs(addend)，需要反向，將 addend 放在前項，改成 this = (addend - this)。
					this[KEY_NEGATIVE] = !this[KEY_NEGATIVE];

				if (shift < 0)
					//為了位數對齊，須補足不足的位數。
					shift_digits(this, shift), shift = 0;

				addend.for_each_digit(
					// (addend digit, carry, index)
					(reverse ? function (d, c, i) { return c + d - (this[i] || 0); }
					: is_subtract ? function (d, c, i) { return c + (this[i] || 0) - d; }
					: function (d, c, i) { return c + (this[i] || 0) + d; }).bind(this)
				, this,
				//位數對齊。
				shift);

				if (this[KEY_NEGATIVE] && !this.valueOf(TYPE_TEST))
					delete this[KEY_NEGATIVE];

				return this;
			}

			//差
			function subtract(number) {
				return this.add(number, true);
			}



			//乘除法之先期處理。
			//@inner
			function multiply_preprocess(integer, number, is_division) {
				var value = get_test_value(number);
				// NaN (+-×÷) number = NaN
				if (Number.isNaN(integer[KEY_TYPE])
					// test if number is MULTIPLICATIVE_IDENTITY.
					|| value === MULTIPLICATIVE_IDENTITY && (!is_division || !integer[KEY_EXPONENT]))
					return;

				if (value === -MULTIPLICATIVE_IDENTITY && (!is_division || !integer[KEY_EXPONENT])) {
					//Be sure not 0, NaN.
					if (integer.valueOf(TYPE_TEST)) {
						do_modified(integer);
						integer[KEY_NEGATIVE] = !integer[KEY_NEGATIVE];
					}
					return;
				}

				if (!is_Integer(number) || integer[KEY_BASE] !== number[KEY_BASE])
					// 強制轉成同底的 Integer 再處理。
					number = new Integer(number, null, integer[KEY_BASE]);

				if (value === ABSORBING_ELEMENT
					//
					|| (KEY_TYPE in integer) || (KEY_TYPE in number)
					//
					|| integer.valueOf(TYPE_TEST) === ABSORBING_ELEMENT) {
					//do simulation: 模擬與 NaN 等極端數字作運算。
					var v = integer.valueOf(TYPE_TEST), r;
					if (is_division) {
						r = v / value;
						value = v % value;
					} else
						value = v * value;
					if (value !== v)
						integer.assignment(value);
					return r;
				}

				// 至此特殊值處理完畢。
				do_modified(integer);

				return number;
			}


			// number multiplier

			// test:
			// check base & value: Integer (test if .is_safe_integer(true)===0, ±1, NaN)
			// show error and exit: NaN, ±Infinity
			// exit: 1
			// set sign and exit: -1
			// set value and exit: 0
			// translate to Integer: safe integer(e.g., 123), 1.23e123, '123'+'4'.repeat(400), '123'+'4'.repeat(16); the string type & negative
			// has a fractional part (有小數部分): .123, 1.123, 1903719924734991.36479887; the string type & negative; '123'+'4'.repeat(16)+'.1234'

			function multiply(number) {
				if (number = multiply_preprocess(this, number)) {
					// copy factors, cache 用
					if (!(KEY_FACTORS in this))
						this[KEY_FACTORS] = [];
					this[KEY_FACTORS].push(number);

					this[KEY_EXPONENT] += number[KEY_EXPONENT];

					if (number[KEY_NEGATIVE])
						this[KEY_NEGATIVE] = !this[KEY_NEGATIVE];

					//	scalar * this，結果放在 target_digit_Array。
					var target_digit_Array = [];
					target_digit_Array[KEY_BASE] = this[KEY_BASE];

					// assert: number 任一元素與 this 任一元素相乘，皆 isSafeInteger() === true。
					number.forEach(function (scalar, shift) {
						if (scalar)
							this.for_each_digit(function (digit, carry, index) {
								// assert: target_digit_Array[] is natural number < base
								// 除了積本身，這邊可能出現 carry<=(base-2), target_digit_Array[]<=(base-1), 共 (2*base-3)。
								// assert: Number.isSafeInteger(base*base-2)
								// therefore: base<=Math.sqrt(Number.MAX_SAFE_INTEGER+2)
								return digit * scalar + carry + (target_digit_Array[index + shift] || 0);
							}, target_digit_Array, shift);
					}, this);

					//回存。
					array_clone(target_digit_Array, this);

					//預防中空跳號。
					if (Array.isArray(this)) {
						var index = this.length;
						while (0 < index--)
							if (this[index] === undefined)
								this[index] = 0;
					}
					if (this[KEY_NEGATIVE] && !this.valueOf(TYPE_TEST))
						delete this[KEY_NEGATIVE];
				}

				return this;
			}

			// this → remainder。
			// return {digit Array}quotient
			function division(denominator, exponent) {
				if (!is_Integer(denominator = multiply_preprocess(this, denominator, true))) {
					if (denominator === undefined)
						// denominator == ±1
						if (Number.isNaN(this[KEY_TYPE]))
							// NaN (+-×÷) number = NaN
							denominator = NaN;
						else if (get_test_value(this)) {
							// integer / ±1 = ±d, remainder 0.
							denominator = new Integer(this);
							this.assignment(0);
						} else
							denominator = 0;
					return denominator;
				}

				// (dividend or numerator) ÷ (divisor or denominator) = quotient + remainder / denominator
				var numerator = this, base = this[KEY_BASE], quotient = new Integer(0, null, base),
				// N: the highest digits of numerator.
				// D: the highest digits of denominator.
				N, NI, D, DI, Q;

				quotient[KEY_EXPONENT] = this[KEY_EXPONENT] - denominator[KEY_EXPONENT];

				//When denominator is bigger than numerator, the quotient will be 0 and the remainder will be numerator itself.
				while (0 < (DI = denominator.length) && DI <= (NI = numerator.length)) {
					// Get ths first non zero digit D of denominator.
					while (!(D = denominator[--DI]) && 0 < DI);

					// Get ths first digits N of numerator.
					N = 0;
					// 多取一位 numerator，確保 N >= D。
					while ((N = N * base + numerator[--NI]) < D && 0 < NI && DI <= NI);
					if (NI < DI || N < D)
						break;
					//assert: N >= D, NI >= DI

					//決定 Q = thie next digit of quotient
					// assert: (N + 1) / D | 0 === Math.floor((N + 1) / D)
					if (DI === 0)
						//There is no digits of denominator lefting. The quotient digit has no other possibility.
						Q = N / D | 0;
					else
						//考慮兩個因素:
						//N, D 將在 Number.isSafeInteger() 的範圍內，一直乘到 N/(D+1)|0===(N+1)/D|0 為止。此兩數為當前 quotient 最高位數之可能值範圍。
						while (((Q = N / (D + 1) | 0) < ((N + 1) / D | 0))
							//
							&& 0 < DI && Number.isSafeInteger(N * base)) {
							N = N * base + numerator[--NI];
							D = D * base + denominator[--DI];
						}

					// 通常發生在 numerator 極為接近 denominator 之 Q 或 Q+1 倍時，會無法判別應該用 Q 或 Q+1。
					if (Q === 0) {
						// assert: numerator, denominator 前面幾位大小相同。
						// assert: index of quotient Array === NI - DI，尚未 borrowed。
						// 確認 numerator, denominator 孰大孰小。
						while (0 < DI && numerator[--NI] === denominator[--DI]);
						if (numerator[NI] < denominator[DI])
							if (--NI < DI)
								// numerator now (= reminder) < denominator
								break;
							else
								Q = base - 1;
						else
							// 剛好足夠減一。
							Q = 1;
					}

					//NI → index of quotient Array, the diff of numerator and denominator.
					NI -= DI;
					quotient[NI] = (quotient[NI] || 0) + Q;

					//numerator → reminder
					// numerator -= Q * denominator * base ^ (index of quotient Array = NI)
					denominator.for_each_digit(function (digit, carry, index) {
						return carry + (numerator[index + NI] || 0) - Q * digit;
					}, numerator, NI);
				}

				// remainder 不受 denominator 正負影響。
				// quotient 受 denominator 正負影響。
				if (quotient.valueOf(TYPE_TEST))
					// quotient is not 0 or NaN
					//e.g., 4/-5
					quotient[KEY_NEGATIVE] = this[KEY_NEGATIVE] ^ denominator[KEY_NEGATIVE];

				if (!this.valueOf(TYPE_TEST))
					// remainder is not 0 or NaN
					delete this[KEY_NEGATIVE];

				// this → remainder,
				// return {digit Array}quotient
				return quotient;
			}

			function divide() {
				return this.assignment(division.apply(this, arguments));
			}

			function modulus() {
				division.apply(this, arguments);
				return this;
			}


			// https://en.wikipedia.org/wiki/Operation_(mathematics)
			var OP_REFERENCE = {
				'+': add,
				'-': subtract,
				'*': multiply,
				'/': divide,
				'%': modulus,
				'=': assignment
			};

			// http://en.wikipedia.org/wiki/Elementary_arithmetic
			/**
			 * 四則運算加減乘除 + - * / (+-×÷)**[=]
			 * @param {String}operator	operator
			 * @param number	the second integer
			 * @return	計算後的結果
			 * @see
			 * <a href="http://www.javaworld.com.tw/jute/post/view?bid=35&amp;id=30169&amp;tpg=1&amp;ppg=1&amp;sty=1&amp;age=0#30169" accessdate="2010/4/16 20:47">JavaWorld@TW Java論壇 - post.view</a>
			 * @_name	_module_.prototype.op
			 */
			function operate(operator, number, flag) {
				var target;
				if (operator.slice(-1) === '=') {
					operator = operator.slice(0, -1);
					if (!operator)
						operator = '=';
					else if (operator === '=')
						return !this.compare(number);
					else if (operator === '==')
						return this === number;
					target = this;
				} else
					target = new Integer(this);

				if (operator in OP_REFERENCE)
					OP_REFERENCE[operator].call(target, number, flag);
				else
					library_namespace.err('operate: Invalid operator [' + operator + ']!');

				return target;
			}

			//強迫回傳 {Number}
			var TYPE_FORCE_Number = 1,
			//與 NaN 等極端數字作運算用。
			TYPE_TEST = 2;
			//WARNING: 若回傳非 Number.isSafeInteger()，則會有誤差，不能等於最佳近似值。
			function valueOf(type) {
				var value;
				if (KEY_TYPE in this)
					value = this[KEY_TYPE];

				else if (type === TYPE_TEST && this.length < 2) {
					if ((value = this[0] || 0) && this[KEY_EXPONENT])
						value *= Math.pow(base, this[KEY_EXPONENT]);

				} else {
					value = 0;
					for (var index = this.length, base = this[KEY_BASE]; 0 < index--;) {
						value = value * base + this[index];
						if (!isFinite(value * base)) {
							if (type) {
								if (type === TYPE_FORCE_Number)
									value = Infinity;
								else
									//與 NaN 等極端數字相較，再大的 Integer 都只是小兒科。因為不在乎精度，無須再處理。
									//但須注意 assignment() 之使用。
									;
							} else {
								value = Math.log10(value) + Math.log10(base) * (index + 1 + this[KEY_EXPONENT]);
								value = Math.pow(10, value % 1) + 'e+' + (value | 0);
							}
							break;
						}
					}
					if (this[KEY_EXPONENT] && typeof value === 'number' && value)
						value *= Math.pow(base, this[KEY_EXPONENT]);
				}
				return this[KEY_NEGATIVE] ? typeof value === 'number' ? -value : '-' + value : value;
			}

			function toString(radix) {
				var base;
				if (radix && isNaN(radix))
					radix = (base = Array.isArray(radix) ? radix : String(radix).split('')).length;
				else if (!(MIN_RADIX <= radix && radix <= MAX_RADIX))
					radix = DEFAULT_RADIX;
				if (!base && this[KEY_CACHE] && this[KEY_CACHE][radix])
					return this[KEY_CACHE][radix];

				var digits, value;
				if (KEY_TYPE in this)
					digits = [this[KEY_TYPE]];
				else {
					if (!base)
						//assert: 'ab'[1]==='b'
						base = DEFAULT_DIGITS;
					digits = [];
					value = new Integer(this, radix);
					value.forEach(function (digit) {
						digits.push(base[digit]);
					});
					if (value = value[KEY_EXPONENT])
						if (0 < value)
							digits.unshift(base[0].repeat(value));
						else {
							digits.splice(-value, 0, '.');
							while (digits[0] == 0)
								//去除末端的 '0'
								digits.shift();
							if (digits[0] === '.')
								digits.shift();
						}
				}

				//去除前導的 '0'
				if (value = digits.length)
					while (0 < --value && digits[value] == 0)
						digits.pop();
				else
					digits = [0];

				if (this[KEY_NEGATIVE])
					digits.push('-');

				digits.reverse();

				if (!this[KEY_CACHE])
					this[KEY_CACHE] = [];
				return this[KEY_CACHE][radix] = digits.join('');
			}


			// ---------------------------------------------------------------------//

			return Integer;
		}

	});


if (typeof test === true) (function () {

	CeL.run('data.math.integer');

	//some basic example
	CeL.assert([new CeL.integer(123).add(2).toString(), '125']);
	CeL.assert([new CeL.integer(123).add(-2).toString(), '121']);
	var v;
	v = '76350768902347890756892374607'; CeL.assert([new CeL.integer(v).toString(), v]);
	v = '654561264556287547824234523'; CeL.assert(Math.abs(parseInt(v) / new CeL.integer(v).valueOf() - 1) < 1e15);
	v = '46545343687545453441534'; CeL.assert([new CeL.integer(v).add('100000000000000000000').toString(), '46645343687545453441534']);
	v = '46545343687545453441534'; CeL.assert([new CeL.integer(v).add('-100000000000000000000').toString(), '46445343687545453441534']);
	v = '46545343687545453441534'; CeL.assert([new CeL.integer(v).subtract('1000000000000000000').toString(), '46544343687545453441534']);
	v = '46545343687545453441534'; CeL.assert([new CeL.integer(v).subtract('-1000000000000000000').toString(), '46546343687545453441534']);
	v = '102030405060708090'; CeL.assert([new CeL.integer(v).multiply(2).toString(), '204060810121416180']);
	v = '102030405060708090'; CeL.assert([new CeL.integer(v).multiply('2000000000').toString(), '204060810121416180000000000']);
	v = '102030405060708090'; CeL.assert([new CeL.integer(v).modulus(20).toString(), '10']);
	v = '204060802040608020406080'; CeL.assert([new CeL.integer(v).divide(20).toString(), '10203040102030401020304']);


	CeL.assert([new CeL.integer('1.37').add('.64').toString(), '2.01']);

	//normal number test. 正常測試案例。
	a = b = 0;
	var BASE = (1 + '0'.repeat(Math.log10(Number.MAX_SAFE_INTEGER) >> 1)) | 0,
	MAX_BASE = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER + 1)),
	_OP = '+,-,*,/,%'.split(','), OP = {},
	normal_test_case = [0, 1,
	//.64, 1.37,
	2, 12, 16, 17, 32, 1000, 1024, 1024 * 1024,
	BASE - 1, BASE, BASE + 1,// BASE - .9, BASE + .1, BASE + 1.1,
	MAX_BASE - 1, MAX_BASE, MAX_BASE + 1,// MAX_BASE - .9, MAX_BASE + .1, MAX_BASE + 1.1,
	Math.floor(Number.MAX_SAFE_INTEGER / 2)
	],

	do_test = function () {
		var op, _op, i, m;
		function test(assignment) {
			_op = op + (assignment ? '=' : '');
			m = '(' + typeof a + ')' + a + ' ' + _op + ' (' + typeof b + ')' + b + ' !== ' + v + '; i=new CeL.integer(' + a + ');i.op("' + _op + '",' + b + ');i.toString();';
			try {
				i = new CeL.integer(a);
				i = i.op(_op, b);
				i = i.toString();
			} catch (e) {
				console.error('throw @ ' + m + ':');
				throw e;
			}
			if (String(v) !== i && (Number.isSafeInteger(v) || 1 < 1e9 * Math.abs(v / i - 1)))
				CeL.assert([i, String(v)], m + (Number.isSafeInteger(v) ? '' : ' (' + 1 < 1e9 * Math.abs(v / i - 1) + ')'));
		}

		for (var op in OP) {
			//CeL.log(m);
			v = OP[op](+a, +b);
			test(true);
			test();
		}
	};

	_OP.forEach(function (op, index) {
		OP[op] = new Function('a', 'b', 'var v=a' + op + 'b;return v<0?-Math.floor(-v):Math.floor(v)');
	});

	normal_test_case.forEach(function (va) {
		[va, -va].forEach(function (va) {
			[va, '' + va].forEach(function (va) {
				normal_test_case.forEach(function (vb) {
					[vb, -vb].forEach(function (vb) {
						[vb, '' + vb].forEach(function (vb) {
							a = va, b = vb, do_test();
						});
					});
				});
			});
		});
	});

	CeL.info('All ' + normal_test_case.length * 2 * 2 * normal_test_case.length * 2 * 2 * _OP.length + ' tests OK');

})();


/**
 * @name	CeL log function
 * @fileoverview
 * 本檔案包含了記錄用 functions。
 * 
 * @since	2009/11/17
 * @see
 * <a href="http://getfirebug.com/lite.html" accessdate="2010/1/1 14:54">Firebug Lite</a>,
 * <a href="http://www.mozilla.org/projects/venkman/" accessdate="2010/1/1 16:43">Venkman JavaScript Debugger project page</a>
 */

//	http://blogs.msdn.com/b/webdevtools/archive/2007/03/02/jscript-intellisense-in-orcas.aspx
///	<reference path="../ce.js" />

/*
TODO:
emergency/urgent situation alert
會盡量以網頁上方/頂部黄色的導航條/警告條展示
「不再顯示」功能
.format()
	將 div format 成 log panel。
分群, http://developer.yahoo.com/yui/examples/uploader/uploader-simple-button.html
*/


/*	to include:
	include code_for_including
	<div id="debug_panel"></div>
	var SL=new Debug.log('debug_panel'),sl=function(){SL.log.apply(SL,arguments);},err=function(){SL.err.apply(SL,arguments);},warn=function(){SL.warn.apply(SL,arguments);};

	http://www.comsharp.com/GetKnowledge/zh-CN/TeamBlogTimothyPage_K742.aspx

	if possible, use Firebug Lite instead.
	http://benalman.com/projects/javascript-debug-console-log/
*/

'use strict';

typeof CeL === 'function' && CeL.run({

name : 'application.debug.log',
// Object.is()
require : 'data.code.compatibility.',
code : function(library_namespace) {


//WScript.Echo(this);

var

//	class private	-----------------------------------

//	class name, 需要用到這個都不是好方法。
//cn='Debug.log',

/**
 * private storage pool
 * @ignore
 */
p = [],


has_performance_now,


log_data = function(message, options) {
	//	由於 .set_method() 會用到 .debug()，若在 log 的 core 中用上 .set_method() 會循環呼叫，造成 stack overflow。
	// ** NG: library_namespace.set_method(this, options);
	if (library_namespace.is_Object(options))
		Object.assign(this, options);

	this.date = new Date();
	if (has_performance_now)
		this.time = performance.now();
	this.message = message;
	return this;
},

/**
 * default write/show log function
 * @ignore
 * @param	{string}id	element id
 */
write_log = function(id) {
	var o, m, c, _p = p[id], _t = _p.instance,
	/**
	 * buffer
	 * @inner
	 * @ignore
	 */
	b = _p.buf,
	B = _p.board, F = _p.do_function, level;

	if (_p.clean)
		_t.clear(), _p.clean = 0;

	if (!B && !F)
		return;

	while (b.length) {
		// 預防 multi-threading 時重複顯示。
		m = b.shift();

		if (F)
			F(m);

		//	IE8: 'constructor' 是 null 或不是一個物件
		try {
			c = m.constructor;
			// alert((m.constructor === log_data) + '\n' + m.constructor + '\n' + m);
		} catch (e) {
		}
		if (c === log_data) {
			if (!isNaN(m.level) && m.level < library_namespace.set_debug())
				continue;
			c = m.level in _t.className_set ? m.level : 0;
			o = m.add_class;
			//	添加各種標記。
			m = [ _t.message_prefix(c),
					_t.show_time(m.date, m.time), m.message ];
			c = _t.className_set[c];
			if (o)
				c += ' ' + o;

		} else {
			//	add default style set
			if (c = _t.message_prefix('log'))
				m = [c, m];
			c = _t.className_set.log || 0;
		}
		_p.lbuf.push(m);

		if (B) { // && typeof document==='object'
			o = _p.instance.log_tag;
			if (o) {
				o = document.createElement(o);
				if (c)
					o.className = c;

				new_node(m, o);

			} else {
				o = document.createTextNode(m);
			}
			B.appendChild(o);
		}
	}

	//if(_t.auto_hide)B.style.display=B.innerHTML?'block':'none';
	//	TODO: 有時無法捲到最新。
	if (B && _t.auto_scroll)
		B.scrollTop = B.scrollHeight - B.clientHeight;
},


/**
 * save log.
 * @ignore
 * @param	m	message
 * @param	{string} id	element id
 * @param	force	force to clean the message area
 */
do_save_log = function(m, id, force) {
	var _p = p[id], _t = _p.instance,
	// log file handler
	f = _p.logF, s = _t.save_log;
	if (!s || typeof s === 'function' && !s(m, l))
		return;

	if (m)
		_p.sbuf.push(m = (_t.save_date && typeof gDate == 'function' ? _t.save_line_separator
				+ gDate() + _t.save_line_separator
				: '')
				+ m);

	if (force || _t.flush || _p.sbufL > _t.save_limit)
		try {
			if (f
					|| _t.log_file
					&& (f = _p.logF = fso.OpenTextFile(_t.log_file,
							/* ForAppending */8, /* create */true,
							_t.log_encoding)))
				f.Write(_p.sbuf.join(_t.save_line_separator)), _p.sbuf = [],
						_p.sbufL = 0, _t.error_message = 0;
		} catch (e) {
			// err(e);
			_t.error_message = e;
		}
	else if (m)
		_p.sbufL += m.length;
},

using_DOM_new_node = false,
//	使 log 能用到 new_node 的功能。
new_node = function(o, layer) {
	if (library_namespace.is_Function(library_namespace.new_node)) {
		//alert('開始利用 library 之 new_node。');
		using_DOM_new_node = true;
		return (new_node = library_namespace.new_node)(o, layer);
	}

	var list = [];

	//	workaround: 簡易版 new_node().
	(function add(o) {
		var node, tag, child;
		if (Array.isArray(o))
			for (node = 0; node < o.length; node++)
				add(o[node]);
		else if (library_namespace.is_Object(o)) {
			if (o.$) {
				tag = o.$;
				list.push('<' + tag);
				delete o.$;
			}
			for (node in o) {
				if (tag)
					list.push(' ' + node + '="' + ('' + o[node]).replace(/"/g, '&quot;') + '"');
				else {
					tag = node;
					list.push('<' + tag);
					child = o[node] || null;
				}
			}
			if (child === null)
				list.push(' />');
			else {
				list.push('>');
				add(child);
				list.push('</' + tag + '>');
			}
		} else
			list.push(o);
	})(o);

	layer.innerHTML = list.join('');

	return using_DOM_new_node;
},

show_date = function(date) {
	var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds(), ms = date.getMilliseconds();
	return (h || m || s ? (h || m ? (h ? h + ':' : '') + m + ':' : '') + s : '')
			+ '.' + (ms > 99 ? '' : ms > 9 ? '0' : '00') + ms;
},


has_caller,

//	instance constructor	---------------------------
//	(document object)
/*

_=this


TODO:
set class in each input
input array
show file path & directory functional	可從 FSO operation.hta 移植。

count
c.f.: GLog

dependency:

*/
/**
 * initial a log tool's instance/object
 * @class	log function
 * @_see	usage: <a href="#.extend">_module_.extend</a>
 * @since	2008/8/20 23:9:48
 * @requires	gDate(),line_separator,fso

 * @constructor
 * @_name	_module_
 * @param	{String|object HTMLElement} obj	log target: message area element or id
 * @param	{Object} [className_set]	class name set
 */
_// JSDT:_tmp;_module_
= function(obj, className_set) {
	// Initial instance object. You can set it yourself.
	/**
	 * log 時 warning/error message 之 className
	 * @_name	_module_.prototype.className_set
	 */
	this.className_set = className_set || {
			/**
			 * @_description	當呼叫 {@link _module_.prototype.log} 時使用的 className, DEFAULT className.
			 * @_name	_module_.prototype.className_set.log
			 */
			log : 'debug_log',
			/**
			 * @_description	當呼叫 {@link _module_.prototype.warn} 時使用的 className
			 * @_name	_module_.prototype.className_set.warn
			 */
			warn : 'debug_warn',
			/**
			 * @_description	當呼叫 {@link _module_.prototype.err} 時使用的 className
			 * @_name	_module_.prototype.className_set.err
			 */
			err : 'debug_err',
			/**
			 * @_description	當顯示時間時使用的 className
			 * @_name	_module_.prototype.className_set.time
			 */
			time : 'debug_time',
			/**
			 * @_description	當呼叫 {@link _module_.prototype.set_board} 時設定 log panel 使用的 className
			 * @_name	_module_.prototype.className_set.panel
			 */
			panel : 'debug_panel'
	};
	this.class_hide = {};

	var prefix = {
		/**
		 * @_description	當呼叫 {@link _module_.prototype.log} 時使用的 prefix, DEFAULT prefix.
		 * @_name	_module_.prototype.message_prefix.log
		 */
		log : '',
		/**
		 * @_description	當呼叫 {@link _module_.prototype.warn} 時使用的 prefix
		 * @_name	_module_.prototype.message_prefix.warn
		 */
		warn : '',
		/**
		 * @_description	表示當呼叫 {@link _module_.prototype.err}, 是錯誤 error message 時使用的 prefix
		 * @_name	_module_.prototype.message_prefix.err
		 */
		err : '<em>!! Error !!</em> '
	};
	/**
	 * log 時 warning/error message 之 prefix。
	 * @_name	_module_.prototype.message_prefix
	 */
	this.message_prefix = function(level) {
		return level in prefix ? prefix[level] : '';
	};

	this.id = p.length;
	p.push( {
		instance : this,
		/**
		 * write buffer
		 */
		buf : [],
		/**
		 * save buffer when we need to save the messages
		 */
		sbuf : [],
		/**
		 * length of save buffer
		 */
		sbufL : 0,
		/**
		 * now logged buffer
		 */
		lbuf : []
	}); 
	this.set_board(obj);
};


try {
	has_performance_now = performance.now() > 0;
} catch (e) {
}

try {
	has_caller = function(a){
		'use strict';
		return arguments.callee.caller !== undefined;
	};
	has_caller = (function(){
		return has_caller();
	})();
} catch (e) {
	has_caller = false;
}


//	class public interface	---------------------------

_// JSDT:_module_
.
/**
 * do the log action
 * @_memberOf	_module_
 * @private
 */
do_log = function(id) {
/*	這段應該只在 module namespace 重複定義時才會發生
 var I=p[id];
 if(!I){
  alert('.do_log: not exist: ['+id+']');
  return;
 }
 I=I.instance;
*/
	var I = p[id].instance;
	if (I.do_log)
		I.do_log();
};


_// JSDT:_module_
.
/**
 * 對各種不同 error object 作應對，獲得可理解的 error message。
 * @param	e	error object
 * @param	line_separator	line separator
 * @param	caller	function caller
 * @_memberOf	_module_
 * @see
 * http://msdn.microsoft.com/en-us/library/ms976144.aspx
 * The facility code establishes who originated the error. For example, all internal script engine errors generated by the JScript engine have a facility code of "A".
 * http://msdn.microsoft.com/en-us/library/ms690088(VS.85).aspx
 * 
 * http://msdn.microsoft.com/en-us/library/t9zk6eay.aspx
 * http://msdn.microsoft.com/en-us/library/microsoft.jscript.errorobject.aspx
 * Specifies the name of the type of the error.
 * Possible values include Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, and URIError.
 */
get_error_message = function get_error_message(e, line_separator, caller) {
	if (!line_separator)
		line_separator = _.prototype.save_line_separator;

	if (!caller || typeof caller !== 'string'){
		if (typeof caller !== 'function' && has_caller)
			caller = get_error_message.caller;

		if (caller === null)
			caller = 'from the top level';
		else if (typeof caller === 'function')
			caller = '@' + (library_namespace.get_function_name(caller) || caller);
		else
			caller = '@' + library_namespace.Class;
	}


	// from popErr()
	//	type
	var T = library_namespace.is_type(e),
	//	message
	m = T === 'Error' ?
			'Error ' + caller + ': '
			//	http://msdn.microsoft.com/en-us/library/cc231198(PROT.10).aspx
			//	<a href="http://msdn.microsoft.com/en-us/library/ms819773.aspx">Winerror.h</a>: error code definitions for the Win32 API functions
			//	(e.number & 0xFFFF): See 錯誤代碼 /錯誤提示碼 <a href="http://msdn.microsoft.com/en-us/library/ms681381%28VS.85%29.aspx">System Error Codes</a>
			//	http://social.msdn.microsoft.com/Search/zh-TW/?Query=%22System+Error+Codes%22+740&AddEnglish=1
			//	http://msdn.microsoft.com/en-us/library/aa394559(VS.85).aspx
			//	net helpmsg (e.number & 0xFFFF)
			+ (e.number & 0xFFFF) + (e.name ? ' [' + e.name + '] ' : ' ')
			+ '(facility code ' + (e.number >> 16 & 0x1FFF) + '): '
			+ line_separator
			+ (e.message || '').replace(/\r?\n/g, '<br />')
			//	.message 為主，.description 是舊的。
			+ (!e.description || e.description === e.message ?
				'' :
				line_separator
					+ line_separator
					+ ('' + e.description).replace(/\r?\n/g, '<br />')
			)

		: T === 'DOMException'?
			//	http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-17189187
			'[' + T + '] ' + e.code + ': ' + e.message

		: !e || T === 'string' ? e

		: '[' + T + '] ' + (e.message || e);


	if (library_namespace.is_debug(2) && typeof e === 'object' && e)
		for (T in e)
			try {
				//	Firefox has (new Error).stack
				//	http://eriwen.com/javascript/js-stack-trace/
				m += '<br /> <span class="debug_debug">' + T + '</span>: '
						+ (typeof e[T] === 'string' && T === 'stack' ?
								e[T].replace(/[\r\n]+$/, '').replace(/(@)([a-z\-]+:\/\/.+)(:)(\d+)$/gm, '$1<a href="view-source:$2#$4" target="_blank">$2</a>$3$4').replace(/\n/g, '<br />- ')
								: typeof e[T] === 'string' && T === 'fileName' ? '<a href="view-source:' + e[T] + '" target="_blank">' + e[T] + '</a>'
								: e[T]);
			} catch (e) {
				// TODO: handle exception
			}

	// m += ' (' + arguments.callee.caller + ')';
	return m;
};


_// JSDT:_module_
.
/**
 * get node description
 * 
 * @param node
 *            HTML node
 * @_memberOf _module_
 */
node_description = function(node, flag) {
	if (typeof node === 'string')
		node = document.getElementById(node);
	if (!node)
		return;

	var description = '';

	if (node.id)
		description += '#' + node.id;

	if (node.className)
		description += '.' + node.className;

	if (node.tagName)
		description = '&lt;' + node.tagName + description + '&gt;';

	if (!description && node.innerHTML) {
		description = node.innerHTML;
		if (description.length > 40)
			description = description.slice(0, 40);
		description = description.replace(/</g, '&lt;');
	}

	//	TODO: 對 Range object 之類的處理
	//	http://help.dottoro.com/ljxsqnoi.php
	return description || '(null description node: ' + library_namespace.is_type(node) + ')';
};


_// JSDT:_module_
.
default_log_target = function(message_data) {
	var level = typeof message_data === 'object' && message_data.level, logger;
	if (logger = level && library_namespace.debug_console[level])
		logger(message_data.message);
	else
		console.log(level ? '[' + level + '] ' + message_data.message : message_data);
};


_// JSDT:_module_
.
/**
 * get new extend instance
 * @param	{String|object HTMLElement} [obj]	message area element or id
 * @return	{Array} [ instance of this module, log function, warning function, error function ]
 * @_example
 * 
 * //	status logger
 * var SL=new _module_('log'),sl=SL[1],warn=SL[2],err=SL[3];
 * sl(msg);
 * sl(msg,clear);
 * 
 * //	general log
 * function_set = new _module_.extend('panel',{});
 * // 1.
 * function_set = new CeL.code.log.extend('panel',{});
 * logger = function_set[1];
 * // 2.
 * log_only = (new CeL.code.log.extend('panel',{}))[1];
 * 
 * @_memberOf	_module_
 * @since	2009/8/24 20:15:31
 */
extend = function(obj, className_set) {
	//CeL.Log=new CeL.code.log(function(m){var F=typeof JSalert==='function'?JSalert:typeof alert==='function'?alert:WScript.Echo;F(typeof m==='object'?'['+m.level+'] '+m.message:m);});
	/**
	 * new instance
	 * @_type	_module_
	 * @inner
	 * @ignore
	 */
	var log_controller = new _// JSDT:_module_
			(obj || _.default_log_target, className_set);

	// TODO: do not use arguments
	return [ log_controller, function() {
		log_controller.log.apply(log_controller, arguments);
	}, function() {
		log_controller.warn.apply(log_controller, arguments);
	}, function() {
		log_controller.err.apply(log_controller, arguments);
	} ];

};


/*
_.option_open=function(p){

};

_.option_file=function(p){
};

_.option_folder=function(p){
};
*/

//	class constructor	---------------------------


_// JSDT:_module_
.prototype = {

//	instance public interface	-------------------

/**
 * 當執行寫檔案或任何錯誤發生時之錯誤訊息。<br />
 * while error occurred.. should read only
 * @_name	_module_.prototype.error_message
 */
error_message : '',

/**
 * 超過這長度才 save。<=0 表示 autoflash，非數字則不紀錄。
 * @_name	_module_.prototype.save_limit
 * @type	Number
 */
save_limit : 4000,

/**
 * 在 log 結束時執行，相當於 VB 中 DoEvent() 或 。
 * @_name	_module_.prototype.do_event
 */
do_event : library_namespace.DoNoting || null,


/**
 * log 時使用之 tagName, 可用 div / span 等。若不設定會用 document.createTextNode
 * @_name	_module_.prototype.log_tag
 */
log_tag : 'div',


/**
 * boolean or function(message, log level) return save or not
 * 
 * @_name _module_.prototype.save_log
 * @type Boolean
 */
save_log : false,
/**
 * save log to this file path
 * 
 * @_name _module_.prototype.log_file
 * @type Boolean
 */
log_file : false,
/**
 * auto save log. 若未設定，記得在 onunload 時 .save()
 * 
 * @_name _module_.prototype.flush
 * @type Boolean
 */
flush : false,
/**
 * 在 save log 時 add date
 * 
 * @_name _module_.prototype.save_date
 * @type Boolean
 */
save_date : true,
/**
 * 在 save log 時的換行
 * 
 * @_name _module_.prototype.save_line_separator
 * @type string
 */
save_line_separator : library_namespace.env.line_separator || '\r\n',
/**
 * 在 save log 時的 encoding
 * 
 * @_name _module_.prototype.log_encoding
 */
log_encoding : -1,//TristateTrue


/**
 * 自動捲動
 * 
 * @_name _module_.prototype.auto_scroll
 * @type Boolean
 */
auto_scroll : true,
/**
 * 沒有內容時自動隱藏
 * 
 * @deprecated TODO
 * @_name _module_.prototype.auto_hide
 * @type Boolean
 */
auto_hide : false,

/**
 * 等待多久才顯示 log。若為 0 則直接顯示。<br />
 * e.g., 即時顯示，不延遲顯示： CeL.Log.interval = 0;<br />
 * (WScript 沒有 setTimeout)
 * @_name	_module_.prototype.interval
 */
interval : typeof setTimeout === 'undefined' ? 0 : 1,

/**
 * log function (no delay)
 * @_name	_module_.prototype.do_log
 */
do_log : function(level) {
	// if(p[this.id].th)clearTimeout(p[this.id].th);

	// reset timeout handler
	p[this.id].th = 0;

	//	TODO: 提升效率.
	if('controller' in this)
		this.set_controller();

	write_log(this.id);
},

/**
 * class instance 預設作 log 之 function
 * 
 * @param {String}
 *            message message
 * @param {Boolean}clean
 *            clean message area
 * @param {Object}options
 *            選擇性項目. { level : log level, 記錄複雜度. }
 * @return
 * @_name _module_.prototype.log
 */
log : function(message, clean, options) {
	var t = this, _p = p[t.id], level, force_save;

	if (library_namespace.is_Object(options)) {
		level = options.level;
		force_save = options.save;
	} else if (options) {
		force_save = level = options;
		(options = {}).level = level;
	}

	//var message_head=(arguments.callee.caller+'').match(/function\do_save_log([^\(]+)/);if(message_head)message_head=message_head[1]+' ';
	do_save_log(message, t.id, force_save);

	// window.status = message;
	if (options) {
		message = new log_data(message, options);
	}

	if (clean) {
		// clean log next time
		_p.clean = 1, _p.buf = [ message ];
	} else {
		_p.buf.push(message);
	}

	if (!(t.interval>0))
		t.do_log();
	else if (!_p.th)
		// no window.setTimeout @ node.js
		if (typeof setTimeout === 'undefined')
			t.interval = 0, t.do_log();
		else
			// _p.th=setTimeout(cn+'.do_log('+t.id+');',t.interval);
			_p.th = setTimeout(function() {
				_.do_log(t.id);
			}, t.interval);

	if (t.do_event)
		t.do_event();
},

/*
TODO:
other methods: INFO,DEBUG,WARNING,ERROR,FATAL,UNKNOWN
*/

/**
 * save message
 * @_name	_module_.prototype.save
 */
save : function() {
	do_save_log('', this.id, 1/* force */);
},

//	** important ** 這邊不能作 object 之 initialization，否則因為 object 只會 copy reference，因此 new 時東西會一樣。initialization 得在 _() 中作！
//className_set:{},

/**
 * log a warning / caution / alert / 警告.
 * @_name	_module_.prototype.warn
 */
warn : function(m, clean) {
	this.log(m, clean, 'warn');
},

/**
 * deal with error message
 * @_name	_module_.prototype.err
 */
err : function err(e, clean) {
	var caller = '';
	if (has_caller) {
		caller = '' + err.caller;
		if (caller.indexOf('.err.apply(') !== -1)
			// ** 判斷 call from _.extend. TODO: 應該避免!
			caller = caller.caller;
	}

	this.log(Array.isArray(e) || library_namespace.is_Object(e) ? e : _
			.get_error_message(e, this.save_line_separator, caller), clean, 'err');
},


timezone_offset : /* msPerMinute */ 60000 * (new Date).getTimezoneOffset(),

/**
 * 在 log 中依照格式顯示時間。
 * @param	{Date}date
 * @returns	{String}	依照格式顯示成之時間。
 * @_name	_module_.prototype.show_time
 * @since	2012/3/16 22:36:46
 */
show_time : function show_time(date, time) {
	var add_s, _diff_ms,
	//
	date_stamp = (date.getMonth() + 1) + '/' + date.getDate() + ' ' + show_date(date),
	//
	diff_ms = has_performance_now && this.last_show ? time - this.last_show : (_diff_ms = date - (this.last_show || this.timezone_offset));

	if (diff_ms > 0)
		if (diff_ms < 60000) {
			add_s = diff_ms >= 1000 && (diff_ms /= 1000);
			diff_ms = diff_ms.to_fixed ? String(diff_ms.to_fixed(3)).replace(/^0/, '')
					//: diff_ms.toFixed ? diff_ms.toFixed(3)
					: (diff_ms | 0);
			if (add_s)
				diff_ms += 's';
		} else
			diff_ms = show_date(new Date(diff_ms + this.timezone_offset));

	this.last_show = has_performance_now ? time : date;

	// 不用 CSS.quotes: 在舊版 browser 上可能無效，但本 module 須在舊版上亦正常作動。
	return '<span class="' + this.className_set.time + '" title="'
			+ date_stamp + '  ' + (has_performance_now ? time : '+' + _diff_ms)
			+ ' ms">[' + diff_ms + ']</span> ';
},

/**
 * 設定寫入到哪<br />
 * set log board for each instance (document object)
 * @_name	_module_.prototype.set_board
 */
set_board : function(o) {
	var _t = this, _p = p[_t.id];
	if (o)
		if (typeof o === 'function')
			_p.do_function = o;

		else {
			if (typeof o !== 'object'
				&& typeof document === 'object')
				o = document.getElementById(o);
			if (o
					// TODO
					// && library_namespace.is_HTML_obj(o)
				) {
				_p.board = o;
				_t.set_controller();
				if (_t = _t.className_set.panel)
					o.className += ' ' + _t;
				delete _p.do_function;
			}
		}

	return _p.board;
},

//	TODO: 若之後才 include 'interact.DOM'，則 controller 沒辦法顯示出來 @ Chrome/25。
set_controller : function(c) {
	var b = p[this.id].board;
	if (b && (c || (c = this.controller))
			&& (c = new_node(c, [ b, 0 ])) !== using_DOM_new_node) {
		if ('controller' in this)
			delete this.controller;
		//c.style.height = '1em';
		//c.style.height = '';
	}
},

/**
 * 獲取當前 buffer 中的 log。
 * @_name	_module_.prototype.get_log
 */
get_log : function() {
	return p[this.id].lbuf;
},

/**
 * show/hide log board. 切換可見狀態。
 * @_name	_module_.prototype.toggle
 */
toggle : function(s) {
	return library_namespace.toggle_display(p[this.id].board, s) !== 'none';
},

/**
 * clear log board.
 * TODO:
 * use .remove_all_child().
 * @_name	_module_.prototype.clear_board
 */
clear_board : function(b) {
	b.innerHTML = '';
},

/**
 * 清除全部訊息 clear message
 * @_name	_module_.prototype.clear
 */
clear : function() {
	var _p = p[this.id];
	if (_p.board) {
		this.clear_board(_p.board);
	}
	_p.lbuf = [];
}

};



return (
	_// JSDT:_module_
);

},

no_extend : 'this,do_log,extend',

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

finish : function(name_space) {
//	為 module log 所作的初始化工作。

var module_name = this.id;

//確認 cssRules 之後才作 delete，否則就得按順序先增者後減。因為刪掉 [2] 之後，後面全部皆會遞補，[3] 會變成 [2]。
//	TODO: 一般化。
function search_CSS_rule(style_sheet, selector) {
	var rules = style_sheet.cssRules || style_sheet.rules, i = 0, l = rules.length;
	for (; i < l; i++)
		if (selector === rules[i].selectorText)
			return i;
}

//WScript.Echo(n.extend);

//code_for_including[generateCode.dLK]='*var Debug={log:code_for_including()};';

//	include resource of module.
CeL.run(CeL.get_module_path(module_name, 'log.css'));

//	為本 library 用
if (!CeL.Log) {
	var i, l, log_controller = name_space.extend(), has_caller,
	//	偵錯等級, debug level, log level.
	log_icon = {
		/*
		 * MEMO (U+1F4DD).
		 * http://codepoints.net/U+1F4DD
		 * http://wiki.livedoor.jp/qvarie/
		 */
		log : '📝',
		/*
		 * emphasized text
		 * U+2383 EMPHASIS SYMBOL
		 * http://codepoints.net/U+2383
		 */
		em : '⎃',
		/*
		 * 資訊,消息,報告,通知,情報
		 * WARNING SIGN (U+26A0) @ Miscellaneous Symbols.
		 */
		warn : '⚠',
		/*
		 * error / fault
		 * U+2620 SKULL AND CROSSBONES
		 */
		err : '☠',
		/*
		 * U+2139 INFORMATION SOURCE
		 * http://en.wiktionary.org/wiki/%E2%84%B9
		 */
		info : 'ℹ',
		/*
		 * U+1F41B BUG
		 */
		debug : '🐛'
	},
	//	base path of icon
	icon_path = CeL.get_module_path(module_name, 'icon/');

	try {
		has_caller = function(a){
			'use strict';
			return arguments.callee.caller !== undefined;
		};
		has_caller = (function(){
			return has_caller();
		})();
	} catch (e) {
		has_caller = false;
	}


	//console.log('override: CeL.Log = ' + log_controller[0]);
	CeL.Log = log_controller[0];
	//console.log('setup CeL.Log.className_set');
	Object.assign(CeL.Log.className_set, {
		info : 'debug_info',
		em : 'debug_em',
		debug : 'debug_debug'
	});

	//	log 支援 gettext.
	CeL.Log.message_prefix = function(level){
		if (level in log_icon) {
			return {
				img : null,
				'class' : 'debug_icon',
				src : icon_path + level + '.png',
				alt : '[' + log_icon[level] + ']',
				title : log_icon[level] + ' ' + (CeL.gettext ? CeL.gettext(level) : level)
			};
		}
		return '';
	};

	//	TODO: copy result, paste code.
	var controller = [ ':', {
		// U+239A	CLEAR SCREEN SYMBOL
		a : '⎚',
		href : '#',
		title : "clear / 清除所有訊息",
		onclick : function() {
			CeL.Log.clear();
			return false;
		}
	}, {
		// toggle / switch
		// U+1F50C ELECTRIC PLUG
		a : '🔌',
		href : '#',
		title : "切換訊息面板\nshow/hidden log panel",
		onclick : function() {
			CeL.set_class(this, 'debug_hide', {
				remove : CeL.Log.toggle()
			});
			return false;
		}
	}, {
		span : '↑',
		title : "提升偵錯等級",
		S : 'cursor:pointer;font-size:.7em;',
		onselect : function() {
			return false;
		},
		onclick : function() {
			CeL.set_debug(CeL.is_debug() + 1);
			CeL.debug('提升偵錯等級至 ' + CeL.is_debug(), 1, 'Log.controller');
			return false;
		}
	}, {
		span : '↓',
		title : "降低偵錯等級",
		S : 'cursor:pointer;font-size:.7em;',
		onselect : function() {
			return false;
		},
		onclick : function() {
			CeL.set_debug(CeL.is_debug() - 1);
			CeL.debug('降低偵錯等級至 ' + CeL.is_debug(), 0, 'Log.controller');
			return false;
		}
	}, {
		span : '↓',
		title : "取消 debug",
		S : 'cursor:pointer;font-size:.7em;text-decoration:underline;',
		onselect : function() {
			return false;
		},
		onclick : function() {
			CeL.set_debug(0);
			return false;
		}
	}, {
		br : null
	} ];
	l = {
			debug : 0,
			log : 0,
			info : 'information',
			em : 'emphasis',
			warn : 'warning',
			err : 'error'
	};
	for (i in l) {
		controller.push(' ', {
			a : log_icon[i],
			href : '#',
			title : 'toggle [' + i + ']\n切換 ' + (l[i] || i) + ' 訊息',
			onclick : function() {
				var tag = this.title.match(/\[([^\]]+)\]/);
				if (tag)
					CeL.set_class(this, 'debug_hide', {
						remove : CeL.toggle_log(tag[1])
					});
				return false;
			}
		});
	}
	//	增加 group 以便在多項輸入時亦可 toggle 或排版。
	CeL.Log.controller = {
			div : [ {
				a : 'log',
				href : '#',
				title : 'log 控制項',
				onclick : function() {
					var p = this.parentNode;
					if (p.force_show) {
						//	DOM 不可使用 delete @ IE9
						//delete p.force_show;
						p.force_show = false;
					} else {
						CeL.toggle_display(this.nextSibling, p.force_show = true);
					}
					return false;
				}
			}, {
				span : controller,
				C : 'debug_controller'
			} ],
			//	TODO: 即使僅是移動 mouse 進入 child，也會執行多次。
			onmouseover : function() {
				CeL.toggle_display(this.firstChild.nextSibling, 1);
			},
			onmouseout : function() {
				if (!this.force_show) {
					CeL.toggle_display(this.firstChild.nextSibling, 0);
				}
			},
			C : 'debug_controller_panel'
	};

	//	在 CeL.log 被重新設定前先 cache 一下。
	var log_buffer = CeL.log && CeL.log.buffer;

	// --------------------------------------------------------------------------------------------
	// front ends of log function

	/**
	 * 警告: 在 node.js v0.10.25, v0.11.16 中，不使用 var 的模式設定 function，會造成:<br />
	 * In strict mode code, functions can only be declared at top level or immediately within another function.
	 * 
	 * 在 node.js v4.2.1 中可以順利 pass。
	 */

	var log_front_end_fatal =
	//	fatal: the most serious 致命錯誤。
	function log_front_end_fatal(message, error_to_throw) {
		if (CeL.is_WWW())
			try {
				// 模擬 throw 以 get .stack
				throw CeL.is_type(error_to_throw, 'Error') ? error_to_throw
						: new Error(error_to_throw || 'Fatal error');
			} catch (e) {
				// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error/Stack
				CeL.err(e.stack ? message
						+ '<br />stack:<div class="debug_stack">'
						+ (typeof e.stack === 'string' ? e.stack.replace(/\n/g,
								'<br />') : e.stack) + '</div>' : message);
			}
		else
			CeL.err(message);

		if (typeof error_to_throw === 'undefined')
			// 預設會 throw message.
			error_to_throw = message;

		if (error_to_throw) {
			if (CeL.platform.nodejs && error_to_throw !== message)
				// node.js 中，throw Error 可能無法顯示 local encoding，因此在此先顯示一次。
				console.error(error_to_throw);
			throw CeL.is_type(error_to_throw, 'Error') ? error_to_throw
					: new Error(error_to_throw);
		}
	}

	var log_front_end_debug =
	//	增加 debug 訊息。
	function log_front_end_debug(message, level, caller, clean) {
		if (false)
			alert(CeL.is_debug() + ',' + l + '(' + (l === undefined) + '),' + message);

		if (CeL.is_debug(level)) {
			if (typeof message === 'function') {
				// for .debug(function(){return some_function(..);}, 3);
				message = 'function: [' + message + ']<br />return: [' + message()
						+ ']';
			}

			if (!caller && has_caller) {
				// TODO: do not use arguments
				caller = caller !== arguments.callee
						&& CeL.get_function_name(arguments.callee.caller);
				// CeL.log(CeL.is_type(arguments.callee.caller));
				// CeL.log(Array.isArray(caller));
				// CeL.log(caller+': '+arguments.callee.caller);
				// CeL.warn(CeL.debug);
			}
			if (caller) {
				message = CeL.is_WWW() ? [ {
					// (caller.charAt(0) === '.' ? CeL.Class + caller : caller)
					span : caller,
					'class' : 'debug_caller'
				}, ': ', message ] :
				CeL.to_SGR([ '', 'fg=yellow', caller + ': ', '-fg', message ]);
			}

			CeL.Log.log.call(CeL.Log, message, clean, {
				level : 'debug',
				add_class : 'debug_' + (level || CeL.is_debug())
			});
		}
	}

	var log_front_end_info =
	//
	function log_front_end_info(message, clean) {
		//	information
		CeL.Log.log.call(CeL.Log, message, clean, 'info');
		//CeL.log.apply(CeL, arguments);
	};

	var log_front_end_toggle_log =
	//	切換(顯示/隱藏)個別訊息。
	function log_front_end_toggle_log(type, show) {
		if (!type)
			type = 'debug';
		var hiding = type in CeL.Log.class_hide;
		if (typeof show === 'undefined' || show && hiding || !show && !hiding)
			try {
				// need switch.
				var style_sheet = document.styleSheets[0], selector = '.'
						+ CeL.Log.className_set[type], CSS_index = hiding ? search_CSS_rule(
						style_sheet, selector)
						: undefined;
				if (isNaN(CSS_index)) {
					// assign a new index.
					CSS_index = style_sheet.cssRules && style_sheet.cssRules.length
							||
							// IE6
							style_sheet.rules && style_sheet.rules.length || 0;
					CeL.debug('insert CSS index: ' + CSS_index, 2, 'toggle_log');
					var style = 'display:none';
					style_sheet.insertRule ?
					// firefox, IE 必須輸入 index.
					// <a
					// href="https://developer.mozilla.org/en/DOM/CSSStyleSheet/insertRule"
					// accessdate="2012/5/14 13:13">insertRule - MDN</a>
					style_sheet
							.insertRule(selector + '{' + style + ';}', CSS_index) :
					// IE6:
					// <a
					// href="http://msdn.microsoft.com/en-us/library/aa358796%28v=vs.85%29.aspx"
					// accessdate="2012/5/14 13:13">IHTMLStyleSheet::addRule method
					// (Internet Explorer)</a>
					style_sheet.addRule(selector, style, CSS_index);

					// OK 之後才設定.
					CeL.Log.class_hide[type] = CSS_index;

				} else {
					CeL.debug('delete CSS index: ' + CSS_index, 2, 'toggle_log');
					style_sheet.deleteRule ? style_sheet.deleteRule(CSS_index) :
					// IE6
					style_sheet.removeRule(CSS_index);
					// OK 之後才 delete.
					delete CeL.Log.class_hide[type];
				}
				hiding = !hiding;
			} catch (e) {
				CeL
						.log('The browser may not support <a href="http://www.w3.org/TR/DOM-Level-2-Style/css" target="_blank">Document Object Model CSS</a>? Can not toggle debug message: <em>'
								+ e.message + '</em>');
			}
		return !hiding;
	}

	var log_front_end_assert =
	/**
	 * 斷定/測試/驗證 verify/檢查狀態。<br />
	 * 
	 * @param {Boolean|Array|Function}condition
	 *            test case.<br />
	 *            {Function} testing function to run. Using default expected value:
	 *            true<br />
	 *            {Array} [ condition 1, condition 2 ]<br />
	 *            {Object} 直接將之當作 options
	 * 
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項。 {<br />
	 *            {String}name: test name 此次測試名稱。,<br />
	 *            {String}NG: meaning of failure,<br />
	 *            {String}OK: meaning of passed,<br />
	 *            {String}hide_OK: false: 當 passed 時不顯示,<br />
	 *            {Boolean}ignorable: false / need 手動 check,<br />
	 *            {String|Object}type: expected type,<br />
	 *            {Boolean}no_cache: false,<br />
	 *            {Any}expect: expected value 預期的結果。should be what value.,<br />
	 *            {Number}error_rate > 0: 容許誤差率 permissible error ratio. e.g., Number.EPSILON,<br />
	 *            {Boolean}exactly: true, need exactly (value === expected) or
	 *            false: equal (value == expected) is also OK.<br />
	 *            {Boolean}force_true: false, 當測試效能時，強迫測試結果一定成功。<br />
	 *            {String}eval: testing expression code to eval = value /
	 *            function(){return value_to_test;}<br />
	 *            {Function}callback: 回調函數。 callback(passed)<br /> }
	 * 
	 * @returns {Boolean|...} {Boolean}assertion is succeed.<br />
	 *          {...} ignorable message.
	 * 
	 * @since 2012/9/19 00:20:49, 2015/10/18 21:31:35 重構
	 */
	function log_front_end_assert(condition, options) {

		// --------------------------------
		// 前置處理作業: condition。
		if (!options) {
			if (CeL.is_Object(condition)) {
				// 直接將之當作 options
				options = condition;
				condition = options.eval;
			} else {
				// 前置處理作業: options。
				// (undefined | null).attribute is NOT accessable.
				// ('attribute' in false), ('attribute' in 0) is NOT evaluable.

				// options = CeL.null_Object();
				// This is faster.
				options = new Boolean;

				// assert: options.attribute is accessable.
				// assert: ('attribute' in options) is evaluable.
			}
		} else if (typeof options === 'string') {
			options = {
				name : options
			};
		} else if (typeof options === 'function') {
			options = {
				callback : options
			};
		}

		var type = options.type;
		if (Array.isArray(condition)) {
			condition = condition.slice(0, type ? 1 : 2);
			if (!type && typeof condition[1] !== 'function'
					&& typeof condition[1] !== 'object')
				// record original condition.
				condition.original = condition[0];
		} else {
			// 有 options.type 將忽略 options.expect 以及 condition[1]!!
			if (type) {
				condition = [ condition ];
			} else {
				condition = [ condition,
				// default expected value: true
				'expect' in options ? options.expect : true ];
				// record original condition.
				condition.original = condition[0];
			}
		}
		// assert: condition = {Array} [ condition 1, condition 2 ]

		function condition_handler(_c, index) {
			if (options.eval && typeof _c === 'string')
				_c = CeL.eval_parse(_c);

			if (typeof _c === 'function')
				_c = _c();

			// may use .map()
			condition[index] = _c;
		}

		// fatal error
		var fatal;
		// if(!options.force_true)
		condition.forEach(options.no_cache ? condition_handler
		//
		: function(_c, index) {
			try {
				condition_handler(_c, index);
			} catch (e) {
				// 執行 condition 時出錯，throw 時的處置。
				fatal = true;
				CeL.warn('assert: 執行 condition 時出錯: ' + e.message);
			}
		});

		// assert: condition = {Array} [ 純量 value 1, 純量 value 2: expected value ]
		// condition = The actual value to test.

		// --------------------------------
		var exactly, equal;

		if (!fatal
		// && !options.force_true
		) {
			if (type) {
				// 處理作業: type。
				condition = condition[0];
				exactly = equal = typeof type === 'string'
				//
				? typeof condition === type || CeL.is_type(condition, type)
				// TODO: check
				// String|Function|Object|Array|Boolean|Number|Date|RegExp|Error|undefined
				: condition.constructor === type
						|| Object.getPrototypeOf(condition) === type
						|| (type = CeL.native_name(type))
						&& CeL.is_type(condition, type);
			} else if ((equal = +options.error_rate) > 0) {
				// 容許誤差率 permissible error ratio / rate. e.g., Number.EPSILON
				exactly = equal = Math.abs(1 - +condition[0] / +condition[1]) <= equal;
			} else {
				exactly = equal = Object.is(condition[0], condition[1]);
				if (!exactly) {
					equal = condition[0] == condition[1];
				}
			}
		}

		// --------------------------------
		// report.

		function quote(message, add_type) {
			if (add_type &&
			// 有些 value 沒必要加上 type。
			message !== null && message !== undefined && message === message) {
				add_type = '(' + (typeof message) + ') ';
			} else {
				add_type = '';
				if (typeof message !== 'string')
					message = String(message);
			}
			return add_type + (message.length > 200
			//
			? '[' + message.slice(0, 200) + ']...' + message.length
			//
			: '[' + message + ']');
		}

		var test_name = options.name ? quote(options.name) : 'Assertion';

		// --------------------------------
		// failed.

		if (!options.force_true && (!equal || !exactly &&
		// assert: exactly === true 的條件比 equal === true 嚴苛。
		(!('exactly' in options) || options.exactly))) {
			var error_message = options.NG;
			if (!error_message) {
				error_message = [ test_name,
				// if fault, message: 失敗時所要呈現訊息。
				CeL.to_SGR([ ' ', 'fg=red', 'failed', '-fg', ': ' ]) ];
				if (type) {
					error_message.push('type of ' + quote(condition) + ' is not ('
							+ type + ')');
				} else {
					if (('original' in condition)
							&& condition[0] !== condition.original) {
						var original = '' + condition.original;
						if (typeof condition.original === 'function') {
							var matched = original.match(CeL.PATTERN_function);
							if (matched) {
								original = matched[1];
							}
						}
						error_message.push(quote(original) + '→');
					}
					error_message.push(quote(condition[0], true)
					//
					+ ' !== ' + quote(condition[1], true));
				}

				if (equal) {
					error_message.push('，但 "==" 之關係成立。');
				}

				error_message = error_message.join('');
			}

			CeL.fatal(error_message, CeL.assert.throw_Error ?
			// exception to throw
			new Error(error_message) : false);

			var ignorable = options.ignorable;
			return ignorable ? ignorable === true ? 'ignored' : ignorable
					: fatal ? undefined : false;
		}

		// --------------------------------
		// passed. 無錯誤發生。

		if (!options.hide_OK && CeL.is_debug()) {
			var passed_message = options.OK;
			if (!passed_message) {
				passed_message = [
						test_name,
						//
						CeL.to_SGR([ ' ', 'fg=green', 'passed', '-fg', ' ' ]),
						//
						quote(condition[0], true) ].join('');
			}
			CeL.debug(passed_message, 1,
			// caller: see: CeL.debug
			has_caller && CeL.get_function_name(arguments.callee.caller));
		}

		return true;
	}

	var log_front_end_test =
	/**
	 * 整套測試, unit test 單元測試。
	 * 
	 * @example <code>

	CeL.test([ [ 'aa', {
		type : String
	} ], [ 456, {
		type : 123
	} ], [ {}, {
		type : Object
	} ], [ false, {
		type : Boolean
	} ] ], 'type test');

	 * </code>
	 * 
	 * @param {String}[test_name]
	 *            test name 此次測試名稱。
	 * @param {Array|Function}conditions
	 *            condition list passed to assert(): [ [ condition / test value,
	 *            options ], [], ... ].<br />
	 *            允許 {Function}condition(assert, test_handler)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項。 {<br />
	 *            {String}name: test name 此次測試名稱。<br />
	 *            {Object}options: default options for running CeL.assert().<br />
	 *            {Function}callback: 回調函數。 callback(recorder, test_name)<br /> }
	 * 
	 * @returns {Integer}有錯誤發生的數量。
	 * 
	 * @since 2012/9/19 00:20:49, 2015/10/18 23:8:9 refactoring 重構
	 */
	function log_front_end_test(test_name, conditions, options) {
		if (Array.isArray(test_name) && !options) {
			// shift: 跳過 test_name。
			options = conditions;
			conditions = test_name;
		}

		if (!Array.isArray(conditions) && typeof conditions !== 'function') {
			throw new Error(CeL.Class + '.test: PLease input {Array}!');
			return;
		}

		var assert = CeL.assert,
		// default options for running CeL.assert().
		default_options;

		if (options) {
			if (typeof options === 'function') {
				// console.log('Set callback: ' + options);
				options = {
					callback : options
				};
			} else if (typeof options === 'string') {
				if (!test_name)
					test_name = options;
				options = undefined;
			} else if ('options' in options)
				default_options = options.options;
		}

		default_options = Object.assign({
			hide_OK : true,
			no_cache : true
		}, default_options);

		var recorder = {
			// OK
			passed : [],
			// skipped
			ignored : [],
			// value is not the same.
			failed : [],
			// 執行 condition 時出錯，throw。
			fatal : [],
			//
			all : []
		};

		function handler(condition_arguments) {
			if (!condition_arguments) {
				// skip this one.
				return;
			}

			recorder.all.push(condition_arguments);

			var result;
			try {
				if (typeof condition_arguments === 'function') {
					result = condition_arguments(assert_proxy);
				} else {
					// assert: Array.isArray(condition_arguments) or arguments
					var options = condition_arguments[1],
					//
					condition = condition_arguments[0];
					// 前置處理作業: condition, options。
					// copy from log_front_end_assert()
					// 目的在將輸入轉成 {Object}，以添入 options。
					if (!options) {
						if (CeL.is_Object(condition)) {
							// 直接將之當作 options
							options = condition;
							condition = options.eval;
						}
					} else if (typeof options === 'string') {
						options = {
							name : options
						};
					} else if (typeof options === 'function') {
						options = {
							callback : options
						};
					}

					// 不汙染 default_options, options
					options = Object.assign(Object.clone(default_options), options);

					result = assert(condition, options);
				}

			} catch (e) {
				recorder.fatal.push(condition_arguments);
				return;
			}

			switch (result) {
			case true:
				recorder.passed.push(condition_arguments);
				break;
			case false:
				recorder.failed.push(condition_arguments);
				break;
			default:
				recorder.ignored.push(condition_arguments);
				break;
			}
		}

		// 模擬 CeL.assert()
		function assert_proxy() {
			handler.call(null, arguments);
		}

		// --------------------------------
		// report.
		function report() {
			var messages = test_name ? [ CeL.to_SGR([ 'Test '
				// asynchronous operations
				+ (assert_proxy.asynchronous ? 'asynchronous ' : '')
				+ '[', 'fg=cyan', test_name, '-fg', ']: ' ]) ] : [];

			function join() {
				if (recorder.ignored.length > 0)
					messages.push(CeL.to_SGR([ ', ' + recorder.ignored.length + ' ',
							'fg=yellow', 'ignored', '-fg' ]));

				// Time elapsed, 使用/耗費時間。cf. eta, Estimated Time of Arrival
				var elapsed = Date.now() - assert_proxy.starts;
				if (elapsed >= 1000)
					messages.push(', ' + (elapsed / 1000).to_fixed(2) + 's');
				messages.push(elapsed === 0 ? ', 0s elapsed.' : ', '
						+ ((elapsed = recorder.all.length / elapsed) < 1
						// Hz
						? (1000 * elapsed).to_fixed(2) + ' tests/s.'
						//
						: elapsed.to_fixed(2) + ' tests/ms.'));
				return messages.join('');
			}

			var error_count = recorder.failed.length + recorder.fatal.length;
			if (options && typeof options.callback === 'function') {
				// 確保 callback 會在本函數之後執行。
				// 因為已 callback，自此後不應改變 recorder，否則不會被 callback 處理。
				setTimeout(function() {
					options.callback(recorder, error_count, test_name);
				}, 0);
			}

			if (error_count === 0) {
				// all passed. 測試通過。
				messages.push(CeL.to_SGR([ 'All ' + recorder.passed.length + ' ',
						'fg=green', 'passed', '-fg' ]));

				log_front_end_info(join());
				return error_count;
			}

			// not all passed.
			messages.push(recorder.failed.length + '/'
			//
			+ (recorder.failed.length + recorder.passed.length));
			if (recorder.failed.length + recorder.passed.length !== recorder.all.length)
				messages.push('/' + recorder.all.length);
			messages.push(CeL.to_SGR([ ' ', 'fg=red', 'failed', '-fg' ]));
			if (recorder.fatal.length > 0) {
				// fatal exception error 致命錯誤
				messages.push(CeL.to_SGR([ ', ' + recorder.fatal.length + ' ',
						'fg=red;bg=white', 'fatal', '-fg;-bg' ]));
			}

			// 不採用 log_controller，在 console 會出現奇怪的著色。
			// e.g., @ Travis CI
			if (recorder.passed.length > 0) {
				// CeL.warn(join());
				log_controller[2](join());
			} else {
				// CeL.err(join());
				log_controller[3](join());
			}

			return error_count;
		}

		assert_proxy.report = report;
		assert_proxy.options = default_options;
		assert_proxy.starts = Date.now();

		// --------------------------------
		// ready to go

		if (Array.isArray(conditions)) {
			conditions.forEach(handler);
		} else {
			var tests_left = CeL.null_Object(), tests_count = 0,
			// assert: typeof conditions === 'function'
			finish_test = function(test_name) {
				tests_count--;
				delete tests_left[test_name];
				if (tests_count === 0
				// && CeL.is_empty_object(tests_left)
				) {
					report();
				}
			};

			conditions(assert_proxy, function setup_test(test_name, test_function) {
				// need wait (pending)
				assert_proxy.asynchronous = true;
				tests_count++;
				if (test_name) {
					if (test_name in tests_left) {
						// 已登記過。
						return true;
					}
					tests_left[test_name] = true;
				}
				if (typeof test_function === 'function') {
					try {
						test_function(finish_test);
					} catch (e) {
						recorder.fatal.push(test_name);
					}
					finish_test(test_name);
				}

			}, finish_test);
		}

		if (!assert_proxy.asynchronous) {
			// waiting
			return report();
		}
	}


	// 在 console 則沿用舊 function。
	// 這裡的判別式與 base.js 中的相符: "_.to_SGR = is_WWW ? SGR_to_plain : to_SGR;"
	// 因為 base.js 中的 styled log 也需要此條件才能發動。
	// TODO: 增加 console 的 style (color)
	if (CeL.is_WWW()) {
		// 這裡列出的是 base.js 中即已提供，不設定也會由原先之預設函式處理的函式。
		Object.assign(CeL, {
			log : log_controller[1],
			warn : log_controller[2],
			err : log_controller[3],

			info : log_front_end_info,

			debug : log_front_end_debug
		});
	}

	Object.assign(CeL, {
		em : function log_front_end_em(message, clean) {
			//	emphasis
			CeL.Log.log.call(CeL.Log, message, clean, 'em');
		},

		error : function log_front_end_error() {
			//	使用 .apply() 預防 override.
			CeL.err.apply(CeL, arguments);
		},

		//	致命錯誤。
		fatal : log_front_end_fatal,

		//	增加 debug 訊息。
		trace : function log_front_end_trace() {
			//	trace: the least serious
			CeL.debug.apply(CeL, arguments);
		},

		//	切換(顯示/隱藏)個別訊息。
		toggle_log : log_front_end_toggle_log,

		assert : log_front_end_assert,
		// CeL.test()
		test : log_front_end_test
	});

	//	處理 loading 本 module 前即已 log 之 message。
	if (Array.isArray(log_buffer) && log_buffer.length > 0) {
		CeL.debug({
			em : 'Before loading ' + module_name + ', there are some debugging message.'
		});
		log_buffer.forEach(function(message) {
			CeL.debug(message);
		});

		CeL.debug('<em>' + module_name + ' loaded.<\/em>');
	}

}

}
});


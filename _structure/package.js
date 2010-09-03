
/**
 * @name	CeL function for package
 * @fileoverview
 * 本檔案包含了呼叫其他 library 需要用到的 function。
 * @since	2010/1/8 22:21:36
 */


/*
TODO:

use -> using because of 'use' is a keyword of JScript.

等呼叫時才 initialization


do not eval.
以其他方法取代 eval 的使用。

http://msdn.microsoft.com/en-us/library/2b36h1wa(VS.71).aspx
The arguments object is not available when running in fast mode, the default for JScript .NET. To compile a program from the command line that uses the arguments object, you must turn off the fast option by using /fast-. It is not safe to turn off the fast option in ASP.NET because of threading issues.

*/


typeof CeL === 'function' &&
function(){


var _// JSDT:_module_
= this;



_// JSDT:_module_
.
/**
 * 延展物件 (learned from jQuery):
 * 將 from_name_space 下的 variable_set 延展/覆蓋到 name_space。
 * @since	2009/11/25 21:17:44
 * @param	variable_set	variable set
 * @param	{Object|Function} name_space	extend to what name-space
 * @param	{Object|Function} from_name_space	When inputing function names, we need a base name-space to search these functions.
 * @return	library names-pace
 * @see
 * <a href="http://blog.darkthread.net/blogs/darkthreadtw/archive/2009/03/01/jquery-extend.aspx" accessdate="2009/11/17 1:24" title="jQuery.extend的用法 - 黑暗執行緒">jQuery.extend的用法</a>,
 * <a href="http://www.cnblogs.com/rubylouvre/archive/2009/11/21/1607072.html" accessdate="2010/1/1 1:40">jQuery源码学习笔记三 - Ruby's Louvre - 博客园</a>
 */
extend = function(variable_set, name_space, from_name_space) {
/*
	if(this.is_debug())
		throw new Error('UNDO');
*/
	var _s, i, l;

	if(typeof name_space === 'undefined' || name_space === null)
		//	如果沒有指定擴展的對象，則擴展到自身
		name_space = this;

	if (typeof from_name_space === 'undefined')
		from_name_space = this;
	else if (variable_set === null && _.is_Function(from_name_space))
		variable_set = from_name_space;

	if(typeof variable_set === 'function'){
		if(this.parse_function){
		}else{
			_.warn('Warning: Please include ' + this.Class + '.parse_function() first!');
		}

	}else if(typeof variable_set === 'string'){
		if(name_space === from_name_space)
			;
		else if(variable_set in from_name_space){
			//_.debug('extend (' + (typeof variable_set) + ') ' + variable_set + '\n=' + from_name_space[variable_set] + '\n\nto:\n' + name_space);
			name_space[variable_set] = from_name_space[variable_set];
		}else
			try{
				name_space[variable_set] = this.get_various(variable_set);
				//_.debug(variable_set + ' = ' + name_space[variable_set]);
			}catch(e){
				_.warn(this.Class + '.extend:\n' + e.message);
			}

	} else if (this.is_Array(variable_set)
						&& !this.is_Array(name_space)) {
		for (_s = _.extend, i = 0, l = variable_set.length; i < l; i++) {
			_s(variable_set[i], name_space, from_name_space);
		}

	} else if (this.is_Object(variable_set)
			//|| this.is_Function(variable_set)
			) {
		for(i in variable_set){
			name_space[i] = variable_set[i];
		}
	}

	return this;
};


_// JSDT:_module_
.
/**
 * workaround.
 * 把 name_space 下的 function_name (name_space[function_name]) 換成 new_function。
 * for Lazy Function Definition Pattern.
 * 惰性求值（Lazy Evaluation），又稱懶惰求值、懶漢求值
 * @example
 * library_namespace.replace_function(_, 'to_SI_prefix', to_SI_prefix);
 * @param name_space	which name-space
 * @param {String} function_name	name_space.function_name
 * @param {Function} new_function	replace to what function
 * @return	new_function
 * @see
 * http://realazy.org/blog/2007/08/16/lazy-function-definition-pattern/,
 * http://peter.michaux.ca/article/3556
 */
replace_function = function(name_space, function_name, new_function) {
	if(!name_space)
		return;

	var old_function = name_space[function_name], type = typeof new_function;

	//	TODO: RegExp
	if (type === 'bool' || type === 'string' || type === 'number')
		new_function = new Function('return'
				//	對 String 只是做簡單處理，勢必得再加強。
				+ (type === 'string' ? '"' + type.replace(/\\/g, '\\').replace(/"/g, '\"').replace(/\n/g, '\\n')
						+ '"' : ' '+type));

	name_space[function_name] = new_function;
	//	search for other extends
	if (this[function_name] === old_function)
		this[function_name] = new_function;

	return new_function.apply(name_space, arguments);
};


_// JSDT:_module_
.
/**
 * Get file resource<br/>
 * 用於 include JavaScript 檔之類需求時，取得檔案內容之輕量級函數。<br/>
 * 除 Ajax，本函數亦可用在 CScript 執行中。
 * @example
 * //	get contents of [path/to/file]:
 * var file_contents = CeL.get_file('path/to/file');
 * @param	{String} path	URI / full path. <em style="text-decoration:line-through;">不能用相對path！</em>
 * @param	{String} [encoding]	file encoding
 * @return	{String} data	content of path
 * @return	{undefined}	when error occurred: no Ajax function, ..
 * @throws	uncaught exception @ Firefox: 0x80520012 (NS_ERROR_FILE_NOT_FOUND), <a href="http://www.w3.org/TR/2007/WD-XMLHttpRequest-20070227/#exceptions">NETWORK_ERR</a> exception
 * @throws	'Access to restricted URI denied' 當 access 到上一層目錄時 @ Firefox
 * @see
 * <a href=http://blog.joycode.com/saucer/archive/2006/10/03/84572.aspx">Cross Site AJAX</a>,
 * <a href="http://domscripting.com/blog/display/91">Cross-domain Ajax</a>,
 * <a href="http://forums.mozillazine.org/viewtopic.php?f=25&amp;t=737645" accessdate="2010/1/1 19:37">FF3 issue with iFrames and XSLT standards</a>,
 * <a href="http://kb.mozillazine.org/Security.fileuri.strict_origin_policy" accessdate="2010/1/1 19:38">Security.fileuri.strict origin policy - MozillaZine Knowledge Base</a>
 * Chrome: <a href="http://code.google.com/p/chromium/issues/detail?id=37586" title="between builds 39339 (good) and 39344 (bad)">NETWORK_ERR: XMLHttpRequest Exception 101</a>
 */
get_file = function(path, encoding){
	//with(typeof window.XMLHttpRequest=='undefined'?new ActiveXObject('Microsoft.XMLHTTP'):new XMLHttpRequest()){

	/**
	 * XMLHttpRequest object.
	 * This can't cache.
	 * @inner
	 * @ignore
	 */
	var o;

	try{
		o = new ActiveXObject('Microsoft.XMLHTTP');
	}catch(e){
		o = new XMLHttpRequest();
	}

	if (o) {
		var data, type = 'GET';
		if (typeof path === 'string' && path.length > 4096
				&& (data = path.match(/^([^?]{6,200})\?(.+)$/)))
			path = data[1], data = data[2], type = 'PUT';
		else
			data = null;

		o.open(type, path, false);

		if (encoding && o.overrideMimeType)
			/*
			 * old: o.overrideMimeType('text/xml;charset='+encoding);
			 * 但這樣會被當作 XML 解析，產生語法錯誤。
			 */
			o.overrideMimeType('application/json;charset=' + encoding);

		try {
			//	http://www.w3.org/TR/2007/WD-XMLHttpRequest-20070227/#dfn-send
			//	Invoking send() without the data argument must give the same result as if it was invoked with null as argument.
			o.send(data);

		} catch (e) {
			//	Apple Safari 3.0.3 may throw NETWORK_ERR: XMLHttpRequest Exception 101
			//this.warn(this.Class + '.get_file: Loading [' + path + '] failed: ' + e);
			//this.err(e);
			//this.debug('Loading [' + path + '] failed.');

			//e.object = o;	//	[XPCWrappedNative_NoHelper] Cannot modify properties of a WrappedNative @ firefox

			if (location
							&& (o = path.match(/:(\/\/)?([^\/]+)/))
							&& o[2] !== location.hostname) {
				this.warn('get_file: 所要求檔案之 domain [' + o[2]
							+ '] 與所處之 domain [' + location.hostname + '] 不同!<br/>\n您可能需要嘗試使用 '
							+ this.Class + '.include_resource()!');
				throw new Error('get_file: Different domain!');
			}

			o = this.require_netscape_privilege(e, 2);
			//this.debug('require_netscape_privilege return [' + typeof (o) + ('] ' + o).slice(0, 200) + ' ' + (e === o ? '=' : '!') + '== ' + 'error (' + e + ')');
			if (e === o)
				throw e;
			return o;
		}

		//	當在 local 時，成功的話 status === 0。失敗的話，除 IE 外，status 亦總是 0。
		//	status was introduced in Windows Internet Explorer 7.	http://msdn.microsoft.com/en-us/library/ms534650%28VS.85%29.aspx
		//	因此，在 local 失敗時，僅 IE 可由 status 探測，其他得由 responseText 判別。
		//this.debug('Get [' + path + '], status: [' + o.status + '] ' + o.statusText);

		return Math.floor(o.status / 100) > 3 ? [ o.status, o.responseText ] : o.responseText;
	}
	//	else: This browser does not support XMLHttpRequest.

	//	firefox: This function must return a result of type any
	//return undefined;
	return;
};


_// JSDT:_module_
.
/**
 * Ask privilege in mozilla projects.
 * enablePrivilege 似乎只能在執行的 function 本身或 caller 呼叫才有效果，跳出函數即無效，不能 cache，因此提供 callback。
 * 就算按下「記住此決定」，重開瀏覽器後需要再重新授權。
 * @param {String|Error} privilege	privilege that asked 或因權限不足導致的 Error
 * @param {Function|Number} callback	Run this callback if getting the privilege. If it's not a function but a number(經過幾層/loop層數), detect if there's a loop or run the caller.
 * @return	OK / the return of callback
 * @throws	error
 * @since	2010/1/2 00:40:42
 */
require_netscape_privilege = function require_netscape_privilege(privilege, callback) {
	var _s = require_netscape_privilege, f, i,
	/**
	 * raise error.
	 * error 有很多種，所以僅以 'object' 判定。
	 * @inner
	 * @ignore
	 */
	re = function(m) {
		//this.debug('Error: ' + m);
		throw privilege && typeof privilege === 'object' ?
			//	Error object
			privilege :
			//	new Error (message)
			new Error(m);
	};

	if(!_s.enabled)
		re('Privilege requiring disabled.');

	//	test loop
	//	得小心使用: 指定錯可能造成 loop!
	if (!isNaN(callback) && callback > 0 && callback < 32) {
		for (f = _s, i = 0; i < callback; i++)
			if (f = f.caller)
				//	TODO: do not use arguments
				f = f.arguments.callee;

		if (f === _s)
			// It's looped
			re('Privilege requiring looped.');

		callback = 1;

	}else if (typeof callback !== 'function')
		callback = 0;

	f = _s.enablePrivilege;
	if (!f && !(_s.enablePrivilege = f = this
				.get_various('netscape.security.PrivilegeManager.enablePrivilege')))
		re('No enablePrivilege get.');

	if (this.is_type(privilege, 'DOMException')
					&& privilege.code === 1012)
		//	http://jck11.pixnet.net/blog/post/11630232
		//	Mozilla的安全機制是透過PrivilegeManager來管理，透過PrivilegeManager的enablePrivilege()函式來開啟這項設定。
		//	須在open()之前呼叫enablePrivilege()開啟UniversalBrowserRead權限。

		//	http://code.google.com/p/ubiquity-xforms/wiki/CrossDomainSubmissionDeployment
		//	Or: In the URL type "about:config", get to "signed.applets.codebase_principal_support" and change its value to true.

		//	由任何網站或視窗讀取私密性資料
		privilege = 'UniversalBrowserRead';

	else if (!privilege || typeof privilege !== 'string')
		re('Unknown privilege.');

	//this.debug('privilege: ' + privilege);
	try {
		//this.log(this.Class + '.require_netscape_privilege: Asking privilege [' + privilege + ']..');
		f(privilege);
	} catch (e) {
		this.warn(this.Class + '.require_netscape_privilege: User denied privilege [' + privilege + '].');
		throw e;
	}

	//this.debug('OK. Get [' + privilege + ']');


	if (callback === 1) {
		//this.debug('再執行一次 caller..');
		callback = _s.caller;
		return callback.apply(this, callback.arguments);

/*		i = callback.apply(this, callback.arguments);
		this.debug(('return ' + i).slice(0, 200));
		return i;
*/
	} else if (callback)
		// 已審查過，為 function
		return callback();
};

_// JSDT:_module_
.
/**
 * 當需要要求權限時，是否執行。（這樣可能彈出對話框）
 * @type	Boolean
 */
require_netscape_privilege.enabled = true;



_// JSDT:_module_
.
/**
 * 得知 script file 之相對 base path
 * @param	{String} JSFN	script file name
 * @return	{String} relative base path
 * @example
 * <script type="text/javascript" src="../baseFunc.js"></script>
 * //	引數為本.js檔名。若是更改.js檔名，亦需要同步更動此值！
 * var basePath=get_script_base_path('baseFunc.js');
 * perl: use File::Basename;
 */
get_script_base_path = function(JSFN){
	//alert(JSFN);
	if(!JSFN)
		return (typeof location === 'object' ?
				// location.pathname
				location.href
				: typeof WScript === 'object' ? WScript.ScriptFullName
				//	用在把檔案拉到此檔上時不方便
				//: typeof WshShell === 'object' ? WshShell.CurrentDirectory
				: '').replace(/[^\/\\]+$/, '');

	//	We don't use is_Object or so.
	//	通常會傳入的，都是已經驗證過的值，不會出現需要特殊認證的情況。
	//	因此精確繁複的驗證只用在可能輸入奇怪引數的情況。
	if (typeof document !== 'object')
			return '';

	//	form dojo: d.config.baseUrl = src.substring(0, m.index);
	var i = 0, o = document.getElementsByTagName('script'), l = o.length, j, b, I;

	for (; i < l; i++)
		try {
			//	o[i].src 多是 full path, o[i].getAttribute('src') 僅取得其值，因此可能是相對的。
			j = o[i].getAttribute ? o[i].getAttribute('src') : o[i].src;
			I = j.lastIndexOf(JSFN);
			//alert(j + ',' + JSFN + ',' + I);
			if (I !== -1){
				//	TODO: dirty hack
				if (_.env.script_extension === '.') {
					b = j.slice(I + JSFN.length);
					if (b === 'js' || b === 'txt')
						_.env.script_extension += b,
						_.env.main_script += b;
					else{
						b = '';
						//	遇到奇怪的 extension
						continue;
					}
				}
				//	TODO: test 是否以 JSFN 作為結尾
				b = j.slice(0, I);
			}
		} catch (e) {
		}

	//this.log()

	//	b || './'
	return b || '';
};


var cached_module_path;
_// JSDT:_module_
.
/**
 * get the path of specified module
 * @param {String} module_name	module name
 * @param	{String} file_name	取得在同一目錄下檔名為 file_name 之 path。若填入 '' 可取得 parent 目錄。
 * @return	{String} module path
 */
get_module_path = function(module_name, file_name){
	if(!module_name)
		return module_name;

	//this.debug('load [' + module_name + ']');
	var module_path = cached_module_path
	|| (cached_module_path =
			this.env.registry_path
			|| this.get_script_base_path(this.env.main_script)
			|| this.get_script_base_path()
		);

	module_path += this.split_module_name(module_name).join(/\//.test(module_path)?'/':'\\') + _.env.script_extension;
	//this.debug(module_path);

	if (typeof file_name !== 'undefined')
		module_path = module_path.replace(/[^\/]+$/, file_name);
	else if (this.getFP)
		module_path = this.getFP(module_path, 1);

	//this.debug(module_name + ': ' + module_path);

	return module_path;
};


/*
sample to test:

./a/b
./a/b/
../a/b
../a/b/
a/../b		./b
a/./b		a/b
/../a/b		/a/b
/./a/b		/a/b
/a/./b		/a/b
/a/../b		/b
/a/../../../b	/b
/a/b/..		/a
/a/b/../	/a/
a/b/..		a
a/b/../		a/
a/..		.
./a/b/../../../a.b/../c	../c
../../../a.b/../c	../../../c

*/

//	2009/11/23 22:12:5
if(0)
_// JSDT:_module_
.
deprecated_simplify_path = function(path){
	if(typeof path === 'string'){
		path = path.replace(/\s+$|^\s+/,'').replace(/\/\/+/g,'/');

		var p, is_absolute = '/' === path.charAt(0);

		while( path !== (p=path.replace(/\/\.(\/|$)/g,function($0,$1){return $1;})) )
			path = p;
		_.debug('1. '+p);

		while (path !== (p = path.replace(
				/\/([^\/]+)\/\.\.(\/|$)/g, function($0, $1, $2) {
					alert( [ $0, $1, $2 ].join('\n'));
					return $1 === '..' ? $0 : $2;
				})))
			path = p;
		_.debug('2. '+p);

		if(is_absolute)
			path = path.replace(/^(\/\.\.)+/g,'');
		else
			path = path.replace(/^(\.\/)+/g,'');
		_.debug('3. '+p);

		if(!path)
			path = '.';
	}

	return path;
};

_// JSDT:_module_
.
/**
 * 轉化所有 /., /.., //
 * @since	2009/11/23 22:32:52
 * @param {String} path	欲轉化之 path
 * @return	{String} path
 */
simplify_path = function(path){
	if(typeof path === 'string'){
		var i, j, l, is_absolute, head;

		path = path
			.replace(/^[\w\d\-]+:\/\//,function($0){head = $0; return '';})
			//.replace(/\s+$|^\s+/g,'')
			//.replace(/\/\/+/g,'/')
			.split('/');

		i = 0;
		l = path.length;
		is_absolute = !path[0];

		for(;i<l;i++){
			if(path[i] === '.')
				path[i] = '';

			else if(path[i] === '..'){
				j=i;
				while(j>0)
					if(path[--j] && path[j]!='..'){
						path[i] = path[j] = '';	//	相消
						break;
					}
			}
		}

		if(!is_absolute && !path[0])
			path[0] = '.';

		path = path.join('/')
			.replace(/\/\/+/g,'/')
			.replace(is_absolute? /^(\/\.\.)+/g: /^(\.\/)+/g,'')
			;

		if(!path)
			path = '.';

		if(head)
			path = head + path;
	}

	return path;
};



_// JSDT:_module_
.
extend_module_member = function(module, extend_to, callback) {
	var i, l;

	//typeof name_space !== 'undefined' && this.debug(name_space);
	//	處理 extend to what name-space
	if (!extend_to && extend_to !== false
			//	若是在 .setup_module 中的話，可以探測得到 name_space？（忘了）
			//|| typeof name_space !== 'function'
			|| !this.is_Object(extend_to))
		//	預設會 extend 到 library 本身下
		extend_to = this;

	if (extend_to && (i = this.get_module(module))) {
		var ns = i, kw = this.env.not_to_extend_keyword, no_extend = {};
		//this.debug('load [' + module + ']:\nextend\n' + ns);

		if (kw in ns) {
			l = ns[kw];
			if (typeof l === 'string' && l.indexOf(',') > 0)
				l=l.split(',');

			if (typeof l === 'string') {
				no_extend[l] = 1;
			} else if (this.is_Array(l)) {
				for (i = 0; i < l.length; i++)
					//WScript.Echo('no_extend '+l[i]),
					no_extend[l[i]] = 1;
			} else if (this.is_Object(l)) {
				no_extend = l;
			}

			no_extend[kw] = 1;
		}

		//	'*': 完全不 extend
		if (!no_extend['*']) {
			no_extend.Class = 1;
			var no_self = 'this' in no_extend;
			if(no_self)
				delete no_extend['this'];

			l = [];
			for (i in ns)
				if (!(i in no_extend))
					l.push(i);

			//this.debug('load [' + module + ']:\nextend\n' + l + '\n\nto:\n' + (extend_to.Class || extend_to));
			this.extend(l, extend_to, ns);

			/*
			 * extend module itself.
			 * e.g., .net.web -> .web
			 */
			if (!no_self && (i = this.split_module_name(module))
							&& (i = i.pop()) && !(i in this))
						this[i] = ns;
		}

	}


	try {
		i = typeof callback === 'function' && callback();
	} catch (e) {
	}
	return i;
};

_// JSDT:_module_
.
/**
 * Include specified module<br/>
 * 注意：以下的 code 中，CeL.warn 不一定會被執行（可能會、可能不會），因為執行時 code.log 尚未被 include。<br/>
 * 此時應該改用 CeL.use('code.log', callback);<br/>
 * code in head/script/:
 * <pre>
 * CeL.use('code.log');
 * CeL.warn('a WARNING');
 * </pre>
 * **	在指定 callback 時 name_space 無效！
 * **	預設會 extend 到 library 本身下！
 * @param	{String} module	module name
 * @param	{Function} [callback]	callback function | [callback, 進度改變時之 function (TODO)]
 * @param	{Object|Boolean} [extend_to]	extend to which name-space<br/>
 * false:	just load, don't extend to library name-space<br/>
 * this:	extend to global<br/>
 * object:	extend to specified name-space that you can use [name_space]._func_ to run it<br/>
 * (others, including undefined):	extend to root of this library. e.g., call CeL._function_name_ and we can get the specified function.
 * @return	{Error}
 * @return	-1	will execute callback after load, 不代表一定 load 了!
 * @return	{undefined}	no error, OK
 * @example
 * CeL.use('code.log', function(){..});
 * CeL.use(['code.log', 'code.debug']);
 * @note
 * 'use' 是 JScript.NET 的保留字
 */
use = function requires(module, callback, extend_to){
	var _s = requires, i, l, module_path;

	if (!module)
		return;

	/*
	if (arguments.length > 3) {
		l = arguments.length;
		name_space = arguments[--l];
		callback = arguments[--l];
		--l;
		for (i = 0; i < l; i++)
			_s.call(this, arguments[i], callback, name_space);
		return;
	}
	*/

	if (this.is_Array(module)) {
		var error;
		for (i = 0, l = module.length; i < l; i++)
			if (error = _s.call(this, module[i], 0, extend_to))
				return error;
		try {
			i = typeof callback === 'function' && callback();
		} catch (e) {
		}
		return i;
	}

	if (!(module_path = this.get_module_path(module)) || this.is_loaded(module)){
		try {
			i = typeof callback === 'function' && callback();
		} catch (e) {
		}
		return i;
	}

	//this.debug('load [' + module + ']:\ntry to load [' + module_path + ']');

	//	including code
	try {
		try{
			// this.debug('load ['+module_path+']');
			// this.debug('load ['+module_path+']:\n'+this.get_file(module_path, this.env.source_encoding));
			//WScript.Echo(this.eval);
			if (i = this.get_file(module_path, this.env.source_encoding))
				//	eval @ global. 這邊可能會出現 security 問題。
				//	TODO: 以其他方法取代 eval 的使用。
				this.eval_code(i);
			else
				this.warn('Get nothing from [' + module_path + ']! Some error occurred?');
			i = 0;
		} catch (e) {
			i = e;
		}

		if (i && callback) {
			//	不能直接用 get_file()，得採用其他方法。但只在有 callback 時才 include，否則當下 block 的都沒執行，可能出亂子。
			if (typeof window !== 'undefined') {
				// TODO: 在指定 callback 時使 name_space 依然有效。
				this.include_resource(module_path, {
					module : module,
					callback : function(){
							_.extend_module_member(module, extend_to, callback);
					},
					global : this
				});
				//	TODO: 一次指定多個 module 時可以知道進度，全部 load 完才 callback()。
				//	此時 callback=[callback, 進度改變時之 function]
				//	return 進度 Object
				return -1;
			}
			throw i;
		} else
			return _.extend_module_member(module, extend_to, callback);

	} catch (e) {
		//this.err(e);

		// http://www.w3.org/TR/DOM-Level-2-Core/ecma-script-binding.html
		// http://reference.sitepoint.com/javascript/DOMException
		if (this.is_type(e, 'DOMException') && e.code === 1012)
			this.err(this.Class
					+ '.use:\n'
					+ e.message + '\n'
					+ module_path
					+ '\n\n程式可能呼叫了一個'
					+ (typeof location === 'object'
						&& location.protocol === 'file:' ? '不存在的，\n或是繞經上層目錄'
								: 'cross domain')
								+ '的檔案？\n\n請嘗試使用相對路徑，\n或 '
								+ this.Class
								+ '.use(module, callback function, name_space)');
		else if (this.is_type(e, 'Error') && (e.number & 0xFFFF) == 5
				|| this.is_type(e, 'XPCWrappedNative_NoHelper')
						&& ('' + e.message).indexOf('NS_ERROR_FILE_NOT_FOUND') !== -1) {
			this.err(this.Class + '.use: 檔案可能不存在？\n[' + module_path + ']' +
					(this.get_error_message
							? ('<br/>' + this.get_error_message(e))
							: '\n' + e.message
					)
				);
		} else
			this.err(this.Class + '.use: Cannot load [<a href="' + module_path + '">' + module + '</a>]!'
					+ (this.get_error_message
							? ('<br/>' + this.get_error_message(e) + '<br/>')
							: '\n[' + (e.constructor) + '] ' + (e.number ? (e.number & 0xFFFF) : e.code) + ': ' + e.message + '\n'
					)
					+ '抱歉！在載入其他網頁時發生錯誤，有些功能可能失常。\n重新讀取(reload)，或是過段時間再嘗試或許可以解決問題。');
		//this.log('Cannot load [' + module + ']!', this.log.ERROR, e);

		return e;
	}

};



/*
bad: sometimes doesn't work. e.g. Google Maps API in IE
push inside window.onload:
window.onload=function(){
include_resource(p);
setTimeout('init();',2000);
};

way 3:	ref. dojo.provide();, dojo.require();
document.write('<script type="text/javascript" src="'+encodeURI(p)+'"><\/script>');

TODO:
encode

*/
;

_// JSDT:_module_
.
/**
 * include other JavaScript/CSS files.
 * TODO:
 * callback 完 .js 自動移除
 * @param {String} resource path
 * @param {Function|Object} callback
 * 		use_write ? test function{return } : callback function
 * 		/	{callback: callback function, module: module name, global: global object when run callback}
 * @param {Boolean} [use_write]	use document.write() instead of insert a element
 * @param {Number} [type]	1: is a .css file, others: script
 */
include_resource = function include_resource(path, callback, use_write, type) {
	var _s = _.include_resource, s, t, h;
	//this.debug('Loading [' + path + '].');

	if (!_s.loaded){
		s = this.get_include_resource();
		if(!s){
			//	document!=='object': 誤在非 HTML 環境執行，卻要求 HTML 環境下的 resource？
			//if(typeof document==='object')this.warn(this.Class + ".include_resource: Can't load [" + path + "]!");
			return;
		}
		_s.loaded = s[0],
		_s.count = s[1];
	}

	if (this.is_Array(path)) {
		for (s = 0, t = path.length; s < t; s++)
			_s(path[s], callback, use_write, type);
		return;
	}

	if(path in _s.loaded){
		//	已經 load
		typeof callback === 'function' && _s.wait_to_call(callback);
		return;
	}

	if (typeof type === 'undefined')
		type = /\.css$/i.test(path) ? 1 : 0;

	t = 'text/' + (type === 1 ? 'css' : 'javascript');
/*@cc_on
//use_write=1;	//	old old IE hack
@*/
	if (!use_write)
		try {
			// Dynamic Loading
			// http://code.google.com/apis/ajax/documentation/#Dynamic
			s = document.createElement(type === 1 ? 'link' : 'script');
			s.type = t;
			if (type === 1)
				s.href = path,
				// s.media = 'all',//'print'
				s.rel = 'stylesheet';
			else
				//	TODO: see jquery-1.4a2.js: globalEval
				//	if (is_code) s.text = path;
				//s.setAttribute('src', path);
				s.src = path;

			//	http://wiki.forum.nokia.com/index.php/JavaScript_Performance_Best_Practices
			//	** onload 在 local 好像無效
			var done = false;
			s.onload = s.onreadstatechange = function() {
				var r;
				//_.debug('Loading [' + path + '] .. ' + this.readyState);
				if (!done && (!(r = this.readyState) || r === 'loaded' || r === 'complete')) {
					done = true;
					//_.debug('[' + (this.src || s.href) + '] loaded.');

					//this.onload = this.onreadystatechange = null;
					try{
						delete this.onload;
						delete this.onreadystatechange;
					}catch (e) {
						//	error on IE5~7: Error: Object doesn't support this action
						this.onload = this.onreadystatechange = null;
					}

					_s.loaded[path] = _s.count++;

					if(callback)
						_s.wait_to_call(callback);
				}
			};

			h = (document.getElementsByTagName('head')[0] || document.body.parentNode
					.appendChild(document.createElement('head')));

			h.appendChild(s);

			//this.debug('HTML:\n' + document.getElementsByTagName('html')[0].innerHTML);
			/*
			 * from jquery-1.4a2.js:
			 * Use insertBefore instead of appendChild to circumvent an IE6 bug
			 *  when using globalEval and a base node is found.
			 * This arises when a base node is used (#2709).
			 * @see
			 * http://github.com/jquery/jquery/commit/d44c5025c42645a6e2b6e664b689669c3752b236
			 * 不過這會有問題: 後加的 CSS file 優先權會比較高。因此，可以的話還是用 appendChild。
			 */
			//h.insertBefore(s, h.firstChild);

			//	隨即移除會無效。 .css 移除會失效。
			if (type !== 1)
				setTimeout(function() {
					h.removeChild(s);
					h = s = null;
				}, 8000);

			return s;

		} catch (e) {
		}

	//this.debug('Writing code for [' + path + '].');
	if (use_write
			|| typeof use_write === 'undefined'
			)
		document.write(type === 1 ?
				'<link type="' + t + '" rel="stylesheet" href="' + path + '"><\/link>'
				: '<script type="' + t + '" src="' + path
					// language="JScript"
					+ '"><\/script>');

	//	若是到這邊還沒 load，會造成問題。
	_s.loaded[path] = _s.count++;

	if (callback)
		_s.wait_to_call(callback);
};

_// JSDT:_module_
.
/**
 * 已經 include_resource 了哪些 JavaScript 檔（存有其路徑）.
 * loaded{路徑} = index,
 * 本定義可省略(only for documentation)
 * TODO:
 * data[index] = [time stamp, path],
 * @type	{Object}
 */
include_resource.loaded = null;


_// JSDT:_module_
.
/**
 * 已經 include_resource 了多少個 JavaScript 檔.
 * 本定義可省略(only for documentation)
 * @type Number
 */
include_resource.count = 0;

_// JSDT:_module_
.
include_resource.wait_to_call = function(callback, do_test) {
	//alert('include_resource.wait_to_call:\n' + _.to_module_name(callback.module));

	if (typeof callback === 'function')
		//	不是 module，僅僅為指定 function 的話，直接等一下再看看。
		//	TODO: 等太久時 error handle
		window.setTimeout(callback, 200);

	else if (_.is_Object(callback) && callback.global)
		if (callback.global.is_loaded(callback.module))
			if (typeof callback.callback === 'function')
				callback.callback();
			else if (typeof callback.callback === 'string')
				_.use(callback.callback);
			// TODO
			// else..

		else {
			/**
			 * 還沒 load，所以再等一下。 the function it self, not 'this'.
			 * @inner
			 * @ignore
			 */
			var _s = _.include_resource.wait_to_call, _t = this;
			window.setTimeout(function() {
				_s.call(_t, callback);
			}, 50);
		}
};

//if (typeof include_resource === 'function')
//	_.extend(null, include_resource, _.include_resource);


_// JSDT:_module_
.
get_include_resource = function(split) {
	if (typeof document !== 'object' || !document.getElementsByTagName)
		//	誤在非 HTML 環境執行，卻要求 HTML 環境下的 resource？
		return;

	var i, nodes = document.getElementsByTagName('script'), h, hn, count = 0, p, l;
	if (split)
		h = {
			script : {},
			css : {}
		},
		hn = h.script;
	else
		hn = h = {};

	l = nodes.length;
	for (i = 0; i < l; i++)
		if (p = this.simplify_path(nodes[i].src))
			hn[p] = 1, count++;

	nodes = document.getElementsByTagName('link');
	if (split)
		hn = l.css;

	l = nodes.length;
	for (i = 0; i < l; i++)
		if (p = this.simplify_path(nodes[i].href))
			hn[p] = 1, count++;

	return [ h, count ];
};


_// JSDT:_module_
.
/**
 * include resource of module.
 * @example
 * //	外部程式使用時，通常用在 include 相對於 library 本身路徑固定的檔案。
 * //	例如 file_name 改成相對於 library 本身來說的路徑。
 * CeL.include_module_resource('../../game/game.css');
 * @param {String} file_name	與 module 位於相同目錄下的 resource file name
 * @param {String} [module_name]	呼叫的 module name。未提供則設成 library base path，此時 file_name 為相對於 library 本身路徑的檔案。
 * @return
 * @since	2010/1/1-2 13:58:09
 */
include_module_resource = function(file_name, module_name) {
	//var m = this.split_module_name.call(this, module_name);
	//if (m)m[m.length - 1] = file_name;
	return this.include_resource.call(this,
			this.get_module_path(module_name || this.Class, file_name));
};



_// JSDT:_module_
.
get_module = function(module_name) {
	module_name = this.split_module_name.call(this, module_name);

	//	TODO: test module_name.length
	if(!module_name)
		return null;

	var i = 0, l = module_name.length, name_space = this;
	//	一層一層 call name-space
	while (i < l)
		try {
			name_space = name_space[module_name[i++]];
		} catch (e) {
			return null;
		}

	return name_space;
};



_// JSDT:_module_
.
/**
 * 預先準備好下層 module 定義時的環境。<br/>
 * 請盡量先 call 上層 name-space 再定義下層的。
 * @param	{String} module_name	module name
 * @param	{Function} code_for_including	若欲 include 整個 module 時，需囊括之 code。
 * @return	null	invalid module
 * @return	{Object}	下層 module 之 name-space
 * @return	undefined	something error, e.g., 未成功 load，code_for_including return null, ..
 */
setup_module = function(module_name, code_for_including) {
	module_name = this.split_module_name(module_name);

	//	TODO: test module_name.length
	if(!module_name)
		return null;

	var i = 0, l = module_name.length - 1, name_space = this, name;
	//	一層一層準備好、預定義 name-space
	for (; i < l; i++) {
		if (!name_space[name = module_name[i]])
			//this.debug('預先定義 module [' + this.to_module_name(module_name.slice(0, i + 1)) + ']'),
			name_space[name] = new Function(
					'//	null constructor for module ' +
					this.to_module_name(module_name.slice(0, i + 1)));
		name_space = name_space[name];
	}
	//	name-space 這時是 module 的 parent module。

	if (
			// 尚未被定義或宣告過
			!name_space[name = module_name[l]] ||
			// 可能是之前簡單定義過，例如被上面處理過。這時重新定義，並把原先的 member 搬過來。
			!name_space[name].Class) {

		//	保留原先的 name-space，for 重新定義
		l = name_space[name];

		// extend code, 起始 name-space
		try {
			//this.debug('including code of [' + this.to_module_name(module_name) + ']..'),
			//	TODO: code_for_including(this, load_arguments)
			i = code_for_including(this);
			i.prototype.constructor = i;
			//code_for_including.toString = function() { return '[class_template ' + name + ']'; };
			//i.toString = function() { return '[class ' + name + ']'; };
		} catch (e) {
			this.err(this.Class + '.setup_module: load module ['
					+ this.to_module_name(module_name) + '] error!\n' + e.message);
			i = undefined;
		}
		if (i === undefined)
			return i;
		name_space = name_space[name] = i;

		// 把原先的 member 搬過來
		if (l) {
			delete l.Class;
			//	may use: this.extend()
			for (i in l)
				name_space[i] = l[i];
		}
		name_space.Class = this.to_module_name(module_name);
	}

/*
	l=[];
	for(i in name_space)
		l.push(i);
	WScript.Echo('Get members:\n'+l.join(', '));
*/

	this.set_loaded(name_space.Class, code_for_including);

	return name_space;
};



_// JSDT:_module_
.
/**
 * 是否 cache code。
 * 若不是要重構 code 則不需要。
 * @type	Boolean
 */
cache_code = false;

/**
 * cache 已經 include 之函式或 class
 * @inner
 * @ignore
 */
var loaded_module = {
};


_// JSDT:_module_
.
/**
 * 模擬 inherits
 * @param {String} module_name	欲繼承的 module_name
 * @param initial_arguments	繼承時的 initial arguments
 * @return
 * @see
 * <a href="http://fillano.blog.ithome.com.tw/post/257/17355" accessdate="2010/1/1 0:6">Fillano's Learning Notes | 物件導向Javascript - 實作繼承的效果</a>,
 * <a href="http://www.crockford.com/javascript/inheritance.html" accessdate="2010/1/1 0:6">Classical Inheritance in JavaScript</a>
 */
inherits = function(module_name, initial_arguments) {
	if(!_.cache_code)
		this.debug('inherits: cache code did not setted but want to use inherits function!');

	var c = loaded_module[this.to_module_name(module_name)];
	try {
		if (typeof c === 'function')
			return c(this, initial_arguments);

		this.err('inherits: cache of [' + module_name + '] error!');
	} catch (e) {
		return e;
	}
};


_// JSDT:_module_
.
/**
 * 將輸入的 string 分割成各 module 單元。<br/>
 * need environment_adapter()<br/>
 * ** 並沒有對 module 做完善的審核!
 * @param {String} module_name	module name
 * @return	{Array}	module unit array
 */
split_module_name = function(module_name) {
	//this.debug('[' + module_name + ']→[' + module_name.replace(/\.\.+|\\\\+|\/\/+/g, '.').split(/\.|\\|\/|::/) + ']');
	if (typeof module_name === 'string')
		module_name = module_name.replace(/\.\.+|\\\\+|\/\/+/g, '.').split(/\.|\\|\/|::/);

	if (this.is_Array(module_name)) {
		//	去除 library name
		if (module_name.length>1 && this.Class === module_name[0])
			module_name.shift();
		return module_name;
	} else
		return null;
};



_// JSDT:_module_
.
to_module_name = function(module, separator) {
	if (typeof module === 'function')
		module = module.Class;
	else if (module === this.env.main_script_name)
		module = this.Class;

	if (typeof module === 'string')
		module = this.split_module_name(module);

	var name = '';
	if (this.is_Array(module)) {
		if (typeof separator !== 'string')
			separator = this.env.module_name_separator;
		if (module[0] !== this.Class)
			name = this.Class + separator;
		name += module.join(separator);
	}

	return name;
};



//TODO
_// JSDT:_module_
.
get_requires = function(func){
	if (typeof func === 'function' || typeof func === 'object')
		return func.requires;
};

_// JSDT:_module_
.
unload_module = function(module, g){
};


_// JSDT:_module_
.
/**
 * 判斷 module 是否存在，以及是否破損。
 * @param	{String} module_name	module name
 * @return	{Boolean} module 是否存在以及良好。
 */
is_loaded = function(module_name) {
	// var _s = arguments.callee;
	//this.debug('test ' + this.to_module_name(module_name));
	return !!loaded_module[this.to_module_name(module_name)];
};



_// JSDT:_module_
.
set_loaded = function(module_name, code_for_including) {
	//this.debug(this.to_module_name(module_name));
	loaded_module[this.to_module_name(module_name)] = _.cache_code && code_for_including || true;
};


/**
 * module 的 require 紀錄。
 * use_function_require_queue[module name] = require time.
 * 當 require 超過 2 次則 skip，這是為了預防 Stack overflow。非 1 次即跳出是為了預防發生錯誤的情況。
 * @inner
 * @private
 * @type Object
 */
var use_function_require_queue = {},

/**
 * post_execute[module name] = module load 之後需要執行的函數。
 * //post_execute[module name] 存在表示 load 之後需要執行 module[post_execute_function_name]
 * 當 require 時還未 load 的話，就只好等 load 之後再來設定這些東西了。
 * TODO: 不過還是會有問題，因此需要設定 require 時必需已 load 之 module。
 * @inner
 * @private
 * @type Object
 */
post_execute = {};

//post_execute_function_name = '_post_execute_' + Math.random();


_// JSDT:_module_
.
/**
 * 設定 module load 之後需要執行的函數。
 * @param	{String} module_name	module name
 * @param	{Function} post_execute_function	module load 之後需要執行的函數
 * @return
 * @inner	僅供內部使用
 * @private
 */
set_post_execute = function(module_name, post_execute_function) {
	if(module_name)
		//this.debug('Set post function of module [' + module_name + ']: [' + post_execute_function + ']'),
		post_execute[module_name] = post_execute_function;
};


_// JSDT:_module_
.
/**
 * module 中需要 include function 時使用。<br/>
 * TODO: 輸入 function name 即可
 * @example
 * //	requires (inside module)
 * if(eval(library_namespace.use_function('data.split_String_to_Object')))return;
 * @param function_list	function list
 * @param [return_extend]	設定時將回傳 object
 * @return	error
 * @since
 * 2009/12/26 02:36:31
 * 2009/12/31 22:21:23	add 類似 'data.' 的形式，為 module。
 * 2010/6/14 22:58:18	避免相互 require
 */
use_function = function(function_list, return_extend) {
	///	<returns>error</returns>

/*
	//	若本身已經在需求名單中則放行，避免相互需要造成堆疊空間不足(Out of stack space)或 Stack overflow。..無效，因為 module_name 可能未定義。
	if (typeof module_name === 'string' && module_name)
		if (module_name in use_function_require_queue)
			return 0;
		else
			this.debug('Skip to load module [' + module_name + '] because it is already in the require queue.'),
			use_function_require_queue[module_name] = 1;
*/

	var list = this.is_Array(function_list) ? function_list
			: typeof function_list === 'string' ? function_list
					.split(',') : 0;

	if (!list || !list.length)
		return 1;

	//this.debug('load function [' + list + ']' + (typeof module_name === 'string' && module_name ? ' from [' + module_name + ']' : ''));

	var i = 0, m, l = list.length, n,
	old_module_name,
	module_hash = {},
	variable_hash = {};

	for (; i < l; i++)
		if ((m = this.split_module_name(list[i])) && m.length > 1) {
			//this.debug('load function [' + m + ']');
			//	if(n): 類似 'data.split_String_to_Object' 的形式，為 function。else: 類似 'data.' 的形式，為 module。
			n = m[m.length - 1];
			//if (!n) this.debug('load module [' + this.to_module_name(m) + ']');

			if(!n)
				m.pop();
			variable_hash[n || m[m.length - 1]] = this.to_module_name(m);
			if (n)
				m.pop();
			//this.debug('test module ['+m.join(this.env.module_name_separator)+']: '+this.get_various(m.join(this.env.module_name_separator),this));
			module_hash[m.join(this.env.module_name_separator)] = 1;
		}

	m = [];
	for (i in module_hash)
		if ((i in use_function_require_queue ? ++use_function_require_queue[i] : (use_function_require_queue[i] = 1)) < 2)
			//this.debug('prepare to load module ['+i+']'),
			m.push(i);
		//else this.debug('Skip to load module [' + i + '] because it is already in the require queue with many times.');


	if (m.length){
		//this.debug('module [' + (typeof module_name === 'string' ? module_name: undefined) + '] load:\n' + m);
	
		// include required modules
		try{
		m = this.use(
			n = m,
			//	module_name 為呼叫 modele，在 .use() 中會被重設：eval 時由 modele 裡面的 code 設定。但在 IE 中為 undefined。
			old_module_name = typeof module_name === 'string' ? module_name
					: undefined);
		}catch (e) {
			m=2;// TODO: handle exception
		}
	
		//	消除 require 紀錄：不可不做。因為有時同樣的 module 有不同的 function require。
		for (i = 0; i < n.length; i++)
			;//delete use_function_require_queue[n[i]];
	
		//	回存已被更改的 module_name，/*並消除 require 紀錄。*/
		if (old_module_name)
			//delete use_function_require_queue[module_name = old_module_name];
			module_name = old_module_name;
	
		//	use 失敗: 需要 callback？
		//if (m) this.debug('use [' + function_list + '] 失敗!');
		if (m)
			return 2;

		module_hash = 0;
	}
	else
		//	所有需求皆已在 queue 中，因此最後總**有機會（不包括發生錯誤的情況！）**會被 load，故 skip。
		module_hash = [];


	//	每次 include 皆執行，盡量早一點設定 reference，預防有 M_A loading 中 要求 M_B.F_B，被這麼跳過而未執行，造成 M_A 中 呼叫 F_B（實為 M_B.F_B） 時 error；因為尚未設定，直接跳出了的情形。
	for (i in post_execute)
		try {
			//this.debug('execute post function of module [' + i + ']: [' + post_execute[i] + ']');
			post_execute[i]();
			//this.debug('delete post function of module [' + i + ']');
			delete post_execute[i];
		} catch (e) {
			// TODO: unknown error
		}


	if(!return_extend)
		l = [];

	//	設定 required variables
	for (i in variable_hash) {
		n = variable_hash[i];
		//this.debug('load [' + n + ']: ' + this.get_various(n));

		if (!module_hash &&
				//	test if this function exists
				typeof (m = this.get_various(n)) !== 'function') {
			//	delete it if doesn't exists
			delete variable_hash[i];
			this.err(this.Class + '.use_function: load [' + n + '] error: ' + (m || "Doesn't defined?"));
		} else if (!return_extend) {
			l.push(i + '=' +
					//	預防有保留字，所以用 bracket notation。例如 Chrome 中會出現 'Unexpected token native'。
					//	Dot Notation and Square Bracket Notation in JavaScript	http://www.dev-archive.net/articles/js-dot-notation/
					n.replace(/\.([a-z\d_]+)/gi, '["$1"]'));
			if (module_hash)
				module_hash.push(i);
		}
	}

	//if (!return_extend) this.debug('@[' + (typeof module_name === 'string' ? module_name: undefined) + ']: ' + (l.length ? 'var ' + ( module_hash ? module_hash.join(',') + ';library_namespace.set_post_execute(module_name,function(){' + l.join(',') + ';})' : l.join(',') ) + ';0' : ''));

	//	應注意 module_name 為保留字之類的情況，會掛在這邊 return 後的 eval。
	return return_extend ? variable_hash :
		l.length ? 'var ' + (
			module_hash ?
				module_hash.join(',') + ';library_namespace.set_post_execute(module_name,function(){' + l.join(',') + ';})' :
				l.join(',')
		) + ';0'
		//	error?
		: '';
};


/**
 * 為一些比較舊的版本或不同瀏覽器而做調適。
 * @since	2010/1/14 17:58:31
 * @inner
 * @private
 * @ignore
 */
function environment_adapter() {
	/*
	 * workaround:
	 * 理論上 '.'.split(/\./).length 應該是 2，但 IE 5~8 中卻為 0!
	 * 用 .split('.') 倒是 OK.
	 * TODO:
	 * 應該增加可以管控與回復的手段，預防有時需要回到原有行為。
	 * @since	2010/1/1 19:03:40
	 */
	if ('.'.split(/\./).length === 0)
		(function() {
			var _String_split = String.prototype.split,
				is_Regexp = _.object_tester('RegExp');
			String.prototype.split = function(r) {
				return is_Regexp(r) ?
						_String_split.call(this.valueOf().replace(
								r.global ? r :
									// TODO: 少了 multiline
									new RegExp(r.source, r.ignoreCase ? 'ig' : 'g'),
							'\0'), '\0') :
						_String_split.call(this, r);
			};
		})();
}

environment_adapter();

}.apply(CeL);


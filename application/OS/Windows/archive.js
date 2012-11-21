
/**
 * @name	CeL function for archive file.
 * @fileoverview
 * 本檔案包含了 archive file 的 functions。
 * @since	
 */

'use strict';
if (typeof CeL === 'function')
CeL.setup_module('application.OS.Windows.archive',
{
require : 'data.code.compatibility.|application.OS.Windows.execute.run_command',
code : function(library_namespace, load_arguments) {

//	requiring
var run_command;
eval(library_namespace.use_function(this));

/**
 * null module constructor
 * @class	executing program 的 functions
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






//	2007/5/31 21:5:16
var compress_tool = {
	WinRAR : {
		path : '"%ProgramFiles%\\WinRAR\\rar.exe"',
		ext : 'rar',
		c : {
			// cL:command line, c:compress, s:switch
			cL : '$path $cmd $s $archive -- $files',
			cmd : 'a',

			// l:'-ilog logFN',

			// -rr1p -s<N> -ap -as -ep1 -tl -x<f> -x@<lf> -z<f> -p[p] -hp[p]
			// rar等
			s : '-u -dh -m5 -os -r -ts -scuc'
		},
		// uncompress
		u : {
			cL : '$path $cmd $archive $eF $eTo',
			cmd : 'e'
		},
		// test
		t : {
			cL : '$path $cmd $archive',
			cmd : 't'
		}
	},
	'7-Zip' : {
		//	7zg.exe
		path : '"%ProgramFiles%\\7-Zip\\7z.exe"',
		ext : '7z',
		// compress
		c : {
			cL : '$path $cmd $s $archive $files',
			cmd : 'u',
			s : '-mx9 -ms -mhe -mmt -uy2'
		},
		// uncompress
		u : {
			cL : '$path $cmd $archive $eF $_e',
			cmd : 'e',
			_e : function(fO) {
				return fO.eTo ? '-o' + fO.eTo : '';
			}
		},
		// test
		t : {
			cL : '$path $cmd $archive',
			cmd : 't'
		}
	}
};


/*
test:
var base='C:\\kanashimi\\www\\cgi-bin\\program\\misc\\';
compress(base+'jit','_jit.htm',{tool:'7-Zip',s:''});
uncompress(base+'jit',base,{tool:'7-Zip'});


fO={
	tool:'WinRAR'	//	or '7-Zip'
	,m:'c'	//	method
	,s:''	//	switch
	,archive:''	//	archive file
	,files=''	//	what to compress
	,eTo=''	//	where to uncompress
	,eF=''	//	what to uncompress
	,rcL=1	//	rebuild command line
}
*/
// solid, overwrite, compressLevel, password
function compressF(fO){	//	flags object
	// 參數檢查: 未完全
	if(!fO)fO={};
	if(typeof fO!='object')return;
	if(!fO.tool)fO.tool='WinRAR';
	//if(!fO.m)fO.m='c';//method
	if(!fO.m||!fO.archive&&(fO.m!='c'||fO.m=='c'&&!fO.files))return;
	if(fO.m=='c'){
		if(typeof fO.files!='object')fO.files=fO.files?[fO.files]:fO.archive.replace(/\..+$/,'');
		if(!fO.archive)fO.archive=fO.files[0].replace(/[\\\/]$/,'')+_t.ext;
		fO.files='"'+fO.files.join('" "')+'"';
	}
	var i,_t=compress_tool[fO.tool],_m,_c;
	if(!_t||!(_m=_t[fO.m]))return;
	else if(!/\.[a-z]+$/.test(fO.archive))fO.archive+='.'+_t.ext;
	//if(fO.bD)fO.archive=fO.bD+(/[\\\/]$/.test(fO.bD)?'':'\\')+fO.archive;	//	base directory, work directory, base folder
	if(!/["']/.test(fO.archive))fO.archive='"'+fO.archive+'"';
	//alert('compressF(): check OK.');
	// 構築 command line
	if(_m._cL&&!fO.rcL)_c=_m._cL;	//	rebuild command line
	else{
		_c=_m.cL.replace(/\$path/,_t.path);
		for(i in _m)if(typeof fO[i]=='undefined')_c=_c.replace(new RegExp('\\$'+i),typeof _m[i]=='function'?_m[i](fO):_m[i]||'');
		_m._cL=_c;
		//alert('compressF():\n'+_c);
	}
	for(i in fO)_c=_c.replace(new RegExp('\\$'+i),fO[i]||'');
	if(_c.indexOf('$')!=-1){alert('compressF() error:\n'+_c);return;}
	alert('compressF() '+(_c.indexOf('$')==-1?'run':'error')+':\n'+_c);
	// run
	WshShell.Run(_c,0,true);
};
//compress[generateCode.dLK]='compressF';
function compress(archive,files,fO){	//	compress file path, what to compress, flags object
	if(!fO)fO={};else if(typeof fO!='object')return;
	if(!fO.m)fO.m='c';
	if(archive)fO.archive=archive;
	if(files)fO.files=files;
	return compressF(fO);
};
//uncompress[generateCode.dLK]='uncompressF';
/**
 * uncompress archive file
 * @param archive	compressed archive file path
 * @param eTo	where to uncompress/target
 * @param {Object} flag	flags
 * @returns
 */
function uncompress(archive, eTo, flag) {
	if (!flag)
		flag = {};
	else if (typeof flag != 'object')
		return;

	if (!flag.m)
		flag.m = 'u';

	if (!flag.eF)
		flag.eF = '';

	if (archive)
		flag.archive = archive;

	if (eTo)
		flag.eTo = eTo;

	return compressF(flag);
};



function parse_7z_data(status, log, error) {
	if (error && library_namespace.is_debug())
		library_namespace.err(error);

	var message = log.match(/\nError:\s+(?:[A-Za-z]:)?[^:\n]+: ([^\n]+)/);
	if (message) {
		if (library_namespace.is_debug())
			library_namespace.err(message[1]);
		this.callback.call(this['this'], this.path, new Error(message[1]));
		return;
	}

	library_namespace.debug(log.replace(/\n/g, '<br/>'), 4);
	message = log.match(/\r?\n([^\r\n]+)\r?\n([ \-]+)\r?\n((?:.+|\n)+?)\r?\n[ \-]+\r?\n/);
	library_namespace.debug(message, 3);

	if (!message) {
		if (library_namespace.is_debug())
			library_namespace.warn('無法 parse header!');
		this.callback(this.path, new Error('無法 parse header!'));
		return;
	}

	// TODO: 系統化讀入固定欄位長度之 data。
	var header = [], i = 0, length, match, file_list, file_array = [], pattern = [],
	//
	start = [], end = [];

	message[1].replace(/\s*(\S+)/g, function($0, $1) {
		library_namespace.debug('header: +[' + $1 + '] / [' + $0 + ']', 2);
		header.push($1);
		end.push(i += $0.length);
		start.push(i - $1.length);
		return '';
	});
	start[0] = 0;

	file_list = message[3].replace(/\r/g, '').split(/\n/);
	library_namespace.debug(file_list.join('<br />'), 3);

	var no_calculate_count = 0, calculate_done = true;
	for (i = 0, length = file_list.length; i < length; i++) {
		calculate_done = true;
		var no_calculate = true;
		library_namespace.debug('一個個猜測邊界: ' + i + '/' + length + '<br />start: ' + start
				+ '<br />end: ' + end, 2);
		for ( var j = 1, fragment; j < header.length; j++) {
			if (end[j - 1] + 1 < start[j]) {
				calculate_done = false;
				fragment = file_list[i].slice(end[j - 1], start[j]);
				if (match = fragment.match(/^\S+/))
					if (match[0].length < fragment.length) {
						library_namespace.debug('end: [' + (j - 1) + '] += '
								+ match[0].length, 2);
						end[j - 1] += match[0].length;
						no_calculate = false;
					} else {
						library_namespace.warn('無法判別 ' + header[j - 1] + ' 與 ' + header[j]
								+ ' 之邊界。fragment: [' + fragment + ']');
						continue;
					}
				if (match = fragment.match(/\S+$/)) {
					library_namespace.debug('start: [' + j + '] -= ' + match[0].length, 2);
					start[j] -= match[0].length;
					no_calculate = false;
				}
			}
		}

		if (no_calculate)
			++no_calculate_count;
		else
			no_calculate_count = 0;

		if (calculate_done || no_calculate_count > 20) {
			library_namespace.debug('於 ' + i + '/' + length + ' 跳出邊界判別作業: '
					+ (calculate_done ? '已' : '未') + '完成。');
			break;
		}
	}

	for (i = 0; i < header.length - 1; i++)
		pattern.push('(.{' + (start[i + 1] - start[i]) + '})');
	pattern.push('(.+)');
	pattern = new RegExp(pattern.join(''));
	library_namespace.debug('header: [' + header.join('<b style="color:#e44;">|</b>')
			+ '], using pattern ' + pattern);

	for (i = 0, length = file_list.length; i < length; i++) {
		if (match = file_list[i].match(pattern)) {
			var j = 1, data = [];
			for (; j < match.length; j++)
				data.push(match[j].trim());
			library_namespace.debug(data.join('<b style="color:#e44;">|</b>'), 3);
			file_array.push(data);
		} else {
			library_namespace.warn('無法 parse [' + file_list[i] + ']');
		}
	}

	this.callback(this.path, file_array, header);
}



//List archive file.
//callback(status, log, err)
function archive_data(path, callback, option) {
	if (path && typeof callback === 'function') {
		if (!library_namespace.is_Object(option))
			option = {};
		library_namespace.extend({
			path : path,
			callback : callback
		}, option);

		run_command.Unicode(compress_tool['7-Zip'].path + ' l "' + path + '"',
			parse_7z_data.bind(option));
	}
}

_.archive_data = archive_data;





return (
	_// JSDT:_module_
);
}


});



/**
 * @name	CeL function for thread
 * @fileoverview
 * 本檔案包含了 thread / process 流程控制的 functions。
 * @since	2012/2/3 19:13:49
 */


'use strict';
if (typeof CeL === 'function')
CeL.setup_module('data.code.thread',
{
require : 'data.code.compatibility.',
code : function(library_namespace, load_arguments) {

//	nothing required


/**
 * null module constructor
 * @class	thread 的 functions
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
	//constructor : _
};




/**
 * 設定循序執行(serial execution) 程序，並可以作 stop, resume 等流程控制 (inter-process
 * communication)。<br />
 * 本函數可代替迴圈操作 loop, for，亦可避免長時間之迴圈操作被 browser 判別為耗時 loop 而 hang 住。<br />
 * 可視作一種 iterator / forEach()。<br />
 * 
 * TODO:<br />
 * .result[], .next() = .step(), input array as option
 * 
 * <code>
 * // 單 thread
 * var i=0,s=0;for(;i<99;i++)s+=Math.random();alert(s);
 * // 方法1
 * new CeL.Serial_execute(function(i, d) {d.s+=Math.random();}, {end: 99, run_first: function(d) {d.s=0;}, final: function(i, d) {alert(d.s);}});
 * // 方法2
 * new CeL.Serial_execute(function() {this.s+=Math.random();}, {end: 99, run_first: function() {this.s=0;}, final: function() {alert(this.s);}});
 * </code>
 * 
 * @param {Function}loop_thread
 *            loop_thread({Integer}process_to_index) {<br />
 *            return<br />
 *            'SIGABRT': terminated (accident occurred), won't run
 *            option.final();<br />
 *            others(!0): all done<br /> }
 * 
 * @param {Object}[option]
 *            在各 thread 間當作 this 傳遞的 data.<br /> {<br />
 *            {String}id : process id (有設定 id 則可以從 Serial_execute.process[id]
 *            控制。),<br />
 *            {Integer}start : start from 哪一序號(index),<br />
 *            {Integer}index : process to 哪一序號,<br />
 *            {Integer}end : 執行至哪一序號(index): end - 1,<br />
 *            argument : 傳給 handler 之 argument,<br />
 *            {Integer}interval : 週期間隔(ms),<br />
 *            {Function}run_first : run first,<br />
 *            {Function}final : run after all, 結尾, epilogue.<br />
 *            {Boolean}stop_on_error : stop on error of loop_thread(),<br /> }
 * 
 * @returns {Serial_execute}process handler
 * 
 * @since 2012/2/3 18:38:02 初成。<br />
 *        2012/2/4 12:31:53 包裝成物件。<br />
 *        2012/11/16 19:30:53 re-write。<br />
 */
function Serial_execute(loop_thread, option) {
	if (typeof loop_thread !== 'function')
		return;

	// (private) 行程間核心 data.
	var core_data = {
		start_time : new Date,
		interval : 0,
		thread : loop_thread,
		count : 0
	},
	// 可被變更的值。
	allow_set = {
		interval : '{Integer}週期間隔(ms)',
		thread : '{Function}設定 signal handler',
		'this' : 'this argument send to thread',
		index : '{Integer}index : process to 哪一序號',
		start : '{Integer}start from 哪一序號(index)',
		end : '{Integer}執行至哪一序號(index): end - 1',
		stopped : '{Boolean}stop process',
		argument:'argument : 傳給 handler 之 argument',
		finished : '{Boolean}finish process',
		terminated : '{Boolean}terminate process',
		stop_on_error : '{Boolean}stop on error of loop_thread()'
	};
	// public interface
	// 處理初始化必要，且不允許被 loop_thread 改變的 methods/設定/狀態值.
	this.get = function(name) {
		if (name in core_data)
			return core_data;
	};
	this.set = function(name, value) {
		if (name in allow_set) {
			if (argument.length > 1)
				return core_data[name] = value;
			else
				delete core_data[name];
		}
	};

	// 當作 Array.prototype.forEach()
	if (Array.isArray(option)) {
		option = {
			list : option
		};
	}

	// 處理 option 中與執行相關，且不允許被 loop_thread 改變的設定。
	if (library_namespace.is_Object(option)) {
		library_namespace.extend([ 'start', 'end', 'index' ], core_data,
				option, library_namespace.is_digits);
		library_namespace.extend([ 'stop_on_error', 'final', 'this', 'argument' ],
				core_data, option);
		// data list.
		if ('list' in option)
			try {
				// check if we can use [] operator.
				var l = option.list.length, test = option.list[l - 1];
				if (!library_namespace.is_digits(l))
					throw 1;

				core_data.length = l;
				core_data.list = option.list;
				if (!core_data.start)
					core_data.start = 0;
				if (!core_data.index)
					// start from 哪一序號。
					core_data.index = core_data.start;
				this.add = function(item) {
					core_data.list[core_data.length++] = item;
				};
				this.index = function(index) {
					if (library_namespace.is_digits(index))
						core_data.index = index;
					else
						return core_data.index;
				};

			} catch (e) {
			}

		if (!'this' in core_data)
			core_data['this'] = this;

		if (option.record) {
			// 執行結果將會置於此 Array。
			core_data.result = [];
		}

		// 登記 process id.
		if (option.id) {
			if (!Serial_execute.process)
				Serial_execute.process = {};

			if (Serial_execute.process[option.id])
				library_namespace.debug('已有相同 id 之 process 執行中! [' + option.id
						+ ']');
			else
				// 作個登記。
				Serial_execute.process[core_data.id = option.id] = this;
		}

	} else
		// 還是給予預設值，省略判斷，簡化流程。
		option = {};

	// 外包裹執行緒: 可寫在 prototype 中。
	this.package_thread = package_thread.bind(this, core_data);

	if (typeof option.run_first === 'function')
		if (core_data.argument)
			option.run_first.call(core_data['this'], core_data.argument);
		else
			option.run_first.call(core_data['this']);


	if (!('autostart' in option) || option.autostart)
		setTimeout(this.package_thread, 0);

}

/**
 * signal 定義。
 * 
 * @see <a href="http://en.wikipedia.org/wiki/Unix_signal" accessdate="2012/2/4
 *      15:35">Unix signal</a>
 */
Serial_execute.signal = {
	// running : 0,
	STOP : 1,
	// 結束程序。
	FINISH : 2,
	// about
	TERMINATE : 3
};

// Serial_execute controller
function controller(signal, result) {
	this.signal = signal;
	if (arguments.length > 1)
		this.result = result;
};
Serial_execute.controller = controller;

// const, 不可能為 setTimeout() id.
var is_running = 'is running';

// private: 預設外包裹執行緒。iterator.
function package_thread(data, force) {

	if (data.stopped) {
		library_namespace.debug('請先解除暫停設置。');
		return;
	}

	if (data.timer_id !== undefined) {
		if (data.timer_id === is_running) {
			library_namespace.debug('正執行中。');
			return;
		} else
			clearTimeout(data.timer_id);
	}
	// lock
	data.timer_id = is_running;

	var result, list = data.list, to_terminate = data.terminated, argument_array,
	// 設定是否已結束。
	to_finish = to_terminate
			|| data.finished
			|| (list ? data.index : data.count) >= ('end' in data ? data.end
					: data.length),
	// debug 用
	id_tag = 'process [' + data.id + '] @ ' + (list ? data.index : data.count)
			+ ' / ' + ('end' in data ? data.end : data.length);

	if (!to_finish) {
		data.count++;
		library_namespace.debug('實際執行 loop thread()。', 2);
		if (list)
			argument_array = [list[data.index], index, list];
		if (data.argument) {
			if (!argument_array)
				argument_array = [];
			argument_array.unshift(data.argument);
		}


		try {
			result = argument_array ? data.thread.apply(data['this'], argument_array)
					: data.thread.call(data['this']);
			if (data.result)
				data.result.push(result);

		} catch (e) {
			if (e.constructor === controller) {
				// signal cache
				var signal = Serial_execute.signal;
				switch (e.signal) {
				case signal.STOP:
					library_namespace.debug('Stop ' + id_tag);
					data.stopped = true;
					break;
				case signal.TERMINATE:
					library_namespace.debug('Terminate ' + id_tag);
					to_terminate = true;
				case signal.FINISH:
					to_finish = true;
					break;
				default:
					// ignore others
					break;
				}

				result = e.result;
				if (data.result)
					data.result.push(result);
			} else {
				library_namespace.warn(id_tag + ' failed.');
				library_namespace.err(e);
				if (data.stop_on_error)
					data.stopped = true;
			}
		}
	}

	if (list)
		data.index++;

	if (to_finish) {
		library_namespace.debug('執行收尾/收拾工作。', 2);
		if (!to_terminate && typeof data['final'] === 'function')
			try {
				argument_array = [data.result || data.count];
				if (data.argument)
					argument_array.unshift(data.argument);
				data['final'].apply(data['this'], argument_array);
			} catch (e) {
				library_namespace.err(e);
			}
		if (data.id in Serial_execute.process)
			delete Serial_execute.process[data.id];
		data.stopped = data.ended = true;
		// TODO: delete all elements in this.
	} else {
		data.timer_id = setTimeout(this.package_thread, data.interval);
	}

	return result;
};

library_namespace.extend({

	// 行程控制。
	// run, continue, resume
	start : function() {
		this.set('stopped', false);
		library_namespace.debug('Resume ' + this.get('id'));
		return this.package_thread();
	},

	// pause
	stop : function() {
		this.set('stopped', true);
	},

	// next one, step, moveNext.
	next : function() {
		var result = this.start();
		this.stop();
		return result;
	},

	// set position = start.
	rewind : function() {
		this.set('index', start);
	},

	finish : function() {
		this.set('finished', true);
		this.set('stopped', false);
		return this.package_thread();
	},

	// abort (abnormal termination), remove.
	terminate : function() {
		this.set('terminated', true);
		this.set('stopped', false);
		return this.package_thread();
	},

	// -----------------------------------------------------------------------------------------------------
	// status / property

	// 每隔多少 ms 執行一次。
	interval : function(interval_ms) {
		if (library_namespace.is_digits(interval_ms))
			this.set('interval', interval_ms);
	},

	ended : function() {
		return this.get('ended');
	},

	stopped : function() {
		return this.get('stopped');
	},

	length : function() {
		return this.get('length');
	}

}, Serial_execute.prototype);


_.Serial_execute = Serial_execute;


/*

// for testing
if (1)
	CeL.set_run('data.code.thread',
			function() {
				runCode.setR = 0;
				p = new CeL.Serial_execute(function(i) {
				}, {
					// id : 't',
					interval : 800,
					end : 100,
					final : function(i) {
						CeL.log('Done @ ' + i);
					}
				});
				// p.stop();
			});
// p.next();
// p.terminate();
// CeL.log(p);

if (0)
	CeL.Serial_execute(function(i) {
		CeL.log(i);
		if (i > 99)
			return 1;
	}, {
		final : function(i, id) {
			CeL.log('done @ ' + i);
		}
	});

if (0)
	new CeL.Serial_execute(function(i) {
		CeL.log(i + ':' + (this.s = (this.s || 0) + i));
	}, {
		final : function(i, id) {
			CeL.log('done @ ' + i);
		},
		end : 99
	});

if (0)
	new CeL.Serial_execute(function(i) {
		CeL.log(i + ':' + (this.s = (this.s || 0) + i));
	}, {
		start : 1,
		end : 101
	});

*/


return (
	_// JSDT:_module_
);
}


});

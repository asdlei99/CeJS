
/**
 * @name	CeL function for math application.
 * @fileoverview
 * 本檔案包含了生成 math application 的 functions。
 * @since	2014/10/3
 * @example
 * <code>
 * CeL.run('application.math', function() {
 * 	// ..
 * });
 * </code>
 */

'use strict';
if (typeof CeL === 'function')
CeL.run(
{
name:'application.math',
require : 'data.math.',
code : function(library_namespace) {

//		requiring
//var ;
eval(this.use());


/**
 * null module constructor
 * @class	出數學題目用的 functions
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


// 中式短除法(Chinese short division)並非 short division.
// https://en.wikipedia.org/wiki/Short_division
function draw_short_division(naturals, layer, GCD_only) {
	if (!Array.isArray(naturals))
		if (isNaN(layer))
			naturals = [ naturals ];
		else
			naturals = arguments, layer = null;

	var i, length = naturals.length | 0, divisor, cell_width_em = 2,
	//
	natural_Array = [];
	for (i = 0; i < length; i++)
		if ((divisor = naturals[i] | 0) > 0) {
			natural_Array.push(divisor);
			if (cell_width_em < String(divisor).length * .6)
				cell_width_em = Math.ceil(String(divisor).length * .6);
		}
	length = (naturals = Array.prototype.slice.call(natural_Array)).length | 0;

	var block = [], count = 0,
		//
		_GCD = library_namespace.GCD(natural_Array) | 0,
		//
		GCD = library_namespace.factorize(_GCD);

	library_namespace.debug(length + ' Naturals: '+natural_Array+'.',2);
	if (GCD) {
		// assert: _GCD > 1
		if (_GCD != (divisor = GCD.toString(true)))
			_GCD += ' = ' + divisor;

		// phase 1: 處理 GCD 部分。
		for (divisor in GCD) {
			divisor |= 0;
			for (var j = 0; j < GCD[divisor] | 0; j++)
				if (length !== 1 || natural_Array[0] !== divisor) {
					block.push(draw_short_division.add_line(natural_Array, cell_width_em, divisor, count++, true));
					for (i = 0; i < length; i++)
						natural_Array[i] = natural_Array[i] / divisor | 0;
				}
		}
	}

	// phase 2: 處理 LCM 部分。
	GCD = 0;
	do {
		var LCM = natural_Array[0];
		for (i = 1; i < length; i++)
			if (natural_Array[i] > 1 && (GCD = library_namespace.GCD(LCM, natural_Array[i])) > 1) {
				divisor = library_namespace.first_factor(GCD) | 0;
				block.push(draw_short_division.add_line(natural_Array, cell_width_em, divisor, count++));
				for (i = 0; i < length; i++)
					if (natural_Array[i] % divisor === 0)
						natural_Array[i] = natural_Array[i] / divisor | 0;
				break;
			}
	} while (GCD > 1);

	// 依照各種不同類之輸入，顯示不同備註標示。
	if (length === 1) {
		// 質因數分解。
		block.push(
			draw_short_division.add_line(natural_Array, cell_width_em),
			{
				div: [
					_GCD
				]
			}
		);

	} else {
		i = library_namespace.LCM(naturals);
		block.push(
			draw_short_division.add_line(natural_Array, cell_width_em),
			{
				div: [
					'GCD',
					// '(', naturals.join(', '), ')',
					' = ',
					_GCD
				],
				S: draw_short_division.GCD_style
			}, {
				div: [
					'LCM',
					// '(', naturals.join(', '), ')',
					' = ',
					i,
					' = ',
					library_namespace.factorize(i).toString(true)
				]
			}
		);
	}

	// 最後收尾。
	block = {
		div: block,
		style: 'width:' + (1 + (length + (1 < length ? 2 : 1)) * cell_width_em | 0) + 'em;background-color:#def',
		C: 'short_division'
	};
	return layer ? library_namespace.new_node(block, layer) : block;
}
draw_short_division.GCD_style = 'color:#f79;';

draw_short_division.add_line = function(naturals, cell_width_em, divisor, count, phase_GCD) {
	library_namespace.debug(divisor + ': ' + naturals, 3, 'draw_short_division.add_line');
	var line = [];
	naturals.forEach(function(natural, index) {
		line.push({
			span: natural,
			S: 'display:inline-block;text-align:right;padding-right:.2em;width:'
				+ (cell_width_em + (index ? 0 : .5 - count / 5)).to_fixed(2) + 'em'
		}, ' ');
	});
	line.pop();

	if (divisor)
		line = [{
			span: divisor,
			S: 'text-align:right;padding-right:.2em;'
		}, {
			span: line,
			S: 'border-left:1pt solid #88f;border-bottom:1pt solid #88f'
		}];

	return {
		div: line,
		S: 'clear:both;text-align:right;' + (phase_GCD ? draw_short_division.GCD_style : '')
	};
};


_.draw_short_division = draw_short_division;

/*

CeL.run('application.math', function() {
	CeL.draw_short_division([12], [ document.body, 2 ]);
	CeL.draw_short_division([12, 18], [ document.body, 2 ]);
	CeL.draw_short_division([12, 18, 24], [ document.body, 2 ]);
});

*/




return (
	_// JSDT:_module_
);
}


});



/**
 * @name	CeL base framework build tool
 * @since	2010/1/9 01:16:35
 * 2010/1/14 20:19:27	整理、簡化。
 */

//	[CeL]library_loader_by_registry
try{var o;try{o=new ActiveXObject('Microsoft.XMLHTTP')}catch(e){o=new XMLHttpRequest()}with(o)open('GET',(new ActiveXObject("WScript.Shell")).RegRead('HKCU\\Software\\Colorless echo\\CeL.path'),false),send(null),eval(responseText)}catch(e){}
//	[CeL]End

// WScript.Echo((new ActiveXObject("WScript.Shell")).RegRead('HKCU\\Software\\Colorless echo\\CeL.path'));

//CeL.set_debug();

//CeL.use('code.log');
//var sl = CeL.log;

//CeL.use('code.reorganize');

//CeL.use('IO.file');
CeL.use('IO.Windows.file');
if(!CeL.is_loaded('IO.Windows.file')){
	WScript.Echo("Can't load module!"+CeL.env.registry_path);
	WScript.Quit(1);
}

var structure_directory = '_structure\\',
	main_structure_file = structure_directory + 'structure.js',
	file_list = [ main_structure_file ],
	target_file = CeL.env.registry_path + CeL.env.main_script,
	structure_code;

structure_code = CeL.read_all_file(CeL.env.registry_path + main_structure_file,
	CeL.env.source_encoding)
	.replace(/[\r\n\s]+\/\*((.|\n)*?)\*\/[\r\n\s]+/, '')
	.replace(/\/\/\s*add\s+([a-z]+\.js)/g,
		function($0, $1) {
			file_list.push($1);
			return CeL.read_all_file(
					CeL.env.registry_path + structure_directory + $1,
					CeL.env.source_encoding)
					.replace(/\/\*((.|\n)*?)\*\//, '');
		}
	);

structure_code =
	[
		'',
		'/*',
		'	本檔案為自動生成，請勿編輯！',
		'	This file is auto created from ' + file_list.join(', '),
		'		by tool: ' + CeL.get_script_name() + '.',
		'*/',
		'',
		'',
		''
	].join(CeL.env.new_line)
	+ structure_code;

if (structure_code !== CeL.read_all_file(target_file)) {
	// chmod: change to writeable
	CeL.change_attributes(target_file, -CeL.fso_attributes.ReadOnly);

	//	write contents
	CeL.write_to_file(target_file, structure_code, CeL.env.source_encoding);

	// chmod
	CeL.change_attributes(target_file, CeL.fso_attributes.ReadOnly);
}

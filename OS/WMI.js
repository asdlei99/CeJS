
/**
 * @name	CeL function for WMI
 * @fileoverview
 * 本檔案包含了 WMI 的 functions。
 * @since	
 */

if (typeof CeL === 'function'){

/**
 * 本 module 之 name(id)，<span style="text-decoration:line-through;">不設定時會從呼叫時之 path 取得</span>。
 * @type	String
 * @constant
 * @inner
 * @ignore
 */
var module_name = 'OS.Windows.WMI';

//===================================================
/**
 * 若欲 include 整個 module 時，需囊括之 code。
 * @type	Function
 * @param	{Function} library_namespace	namespace of library
 * @param	load_arguments	呼叫時之 argument(s)
 * @return
 * @_name	_module_
 * @constant
 * @inner
 * @ignore
 */
var code_for_including = function(library_namespace, load_arguments) {

/**
 * null module constructor
 * @class	WMI 的 functions
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







//	WMI set	==================

/*	2007/5/22 23:34:43
	WMI: Windows Management Instrumentation
	http://www.codecomments.com/archive298-2004-5-203306.html
	http://msdn2.microsoft.com/en-us/library/Aa394616
	http://msdn2.microsoft.com/en-us/library/aa389290.aspx
	http://msdn2.microsoft.com/en-us/library/aa389763.aspx
	http://msdn2.microsoft.com/en-us/library/aa393854.aspx	SWbemServices
	http://msdn2.microsoft.com/en-us/library/ms525320.aspx
	http://www.serverwatch.com/tutorials/article.php/1476831
	http://www.serverwatch.com/tutorials/article.php/1476861
	http://www.serverwatch.com/tutorials/article.php/1476871
	http://www.serverwatch.com/tutorials/article.php/1476941

string moniker:
	[[/root/]cimv2:][from[.v]]	[/|\\]root[/|\\]

object moniker:
{
	prefix:'WinMgmts:',	//	moniker prefix
	security:'{impersonationLevel=impersonate}!',
	computer:'.',	//	Computer string(localhost '.')
	p:'cimv2',	//	'/root/' will auto added
	path:'/root/cimv2',	//	Namespace e.g., \root\default

	from:,	//	select from ~
	where:,	//	select from where ~	** You MUST check the string yourself!! This function won't do it!
	v:,	//	value to get
	value:,	//	value used in moniker

	flag:48,	//	flag to call SWbemServices.ExecQuery Method
}

	prefix+security+computer+path+':'+from+'='+value	http://msdn2.microsoft.com/en-us/library/aa389292.aspx

TODO:
多次呼叫最佳化
*/
function WMI_data(moniker,func){	//	moniker, for each do function
	var i,oWMIS,_m={
			prefix:'WinMgmts:'
			,security:'{impersonationLevel=impersonate}!'
			,computer:'.'
			,p:'cimv2'
			,path:''
			,from:''
			,value:''
			,v:''
			,flag:48	//	32: wbemFlagForwardOnly + 16: wbemFlagReturnImmediately
	};
	if(!moniker)
		moniker='';

	if(typeof moniker=='string'){
		//	parse moniker
		_m.from=moniker;
		//	取得path
		if(i=_m.from.match(/^([^:]+):([^\/\\]*)$/)){
			if(/^[\/\\]/.test(i[1]))_m.path=i[1];else _m.p=i[1];
			_m.from=i[2];
		}
		//	取得from[.v]
		if(i=_m.from.match(/^([^.]+)\.(.*)$/))_m.from=i[1],_m.v=i[2];
	}else for(i in moniker)_m[i]=moniker[i];

	//	create object
	try{
		//with(_m)alert(prefix+security+'//'+computer+(path||'/root/'+p)+(value||value===0?':'+from+'='+value:''));
		with(_m)oWMIS=GetObject(prefix+security+'//'+computer+(path||'/root/'+p)
				//+(func||v?'':(from?':'+from+(value||value==0?'':'='+value):''))	//	有func||_m.v時無條件捨棄，到後面再搞。
				+(value||value===0?':'+from+'='+value:'')
		);
		//oLoc=new ActiveXObject("WbemScripting.SWbemLocator");oSvc=oLoc.ConnectServer(sComputer||null,"root\\default");oReg=oSvc.Get("StdRegProv");	//	http://msdn.microsoft.com/library/en-us/wmisdk/wmi/swbemobject_execmethod_.asp
	}catch(e){
		return;
		/*	useless?
  try{
   with(new ActiveXObject("WbemScripting.SWbemLastError"))	//	Error Handling
    return {ProviderName:ProviderName,ParameterInfo:ParameterInfo,Operation:Operation,Description:Description};
  }catch(_e){throw e;}
		 */
	}
	if(!func&&!_m.from)return oWMIS;

	//	do search
	var oE;
	try{
		//	http://msdn2.microsoft.com/en-us/library/aa393866.aspx
		oE=oWMIS.ExecQuery('Select * From '+_m.from+(_m['where']?' Where '+_m.where:'')
				,'WQL'	//	String that contains the query language to be used. If specified, this value must be "WQL".
				,_m.flag
		);
	}catch(e){
		//	程式庫未登錄。
		//	此時 typeof oWMIS=='object'
		popErr(e,0,'WMI_data: error occurred!');
		//if(438!=(e.number&0xFFFF))return;
		return;	//	return {item:function(){}};	//	or return a object using wbemQueryFlagPrototype
	}
	oE=new Enumerator(oE);	//	wbemFlagForwardOnly:32+wbemFlagReturnImmediately:16
	//if(func)for(;!oE.atEnd()&&!func(oE.item());oE.moveNext());
	if(func)while(!oE.atEnd()&&!func(oE.item()))oE.moveNext();
	else return _m.v||_m.v===0?oE.item()?oE.item()[_m.v]:null:oE;
}

/*	用在將 WMI date 轉成 javascript date, old: WMIDateStringToDate
	http://www.microsoft.com/technet/scriptcenter/resources/qanda/sept04/hey0907.mspx
	http://www.microsoft.com/technet/scriptcenter/resources/qanda/aug05/hey0802.mspx

TODO:
return ms
*/
WMI_data.DateStringToDate=function(t){
 if(!t)return new Date(0);
 var m=(''+t).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\.\d+)?([+ \-]\d+)?$/);
 //	http://msdn2.microsoft.com/en-us/library/474de325.aspx
 return m?new Date(m[1],m[2]-1,m[3],m[4],m[5],m[6],m[7]*1e3):t;	//	locale會自己調整
};

/*	用在取得 WMI object 之 property
	http://www.activexperts.com/activmonitor/windowsmanagement/adminscripts/other/wmi/
	http://msdn.microsoft.com/en-us/library/aa393741%28VS.85%29.aspx
*/
WMI_data.getProperties = function(o, is_VBA, is_Date) {
	var oP = new Enumerator(o.Properties_), ph = {}, p;
	while (!oP.atEnd()) {
		o = p = oP.item();

		if (0 && o.Name === 'IPAddress') {
			alert(p);
			alert('' + p + '\n[' + (typeof p) + ']\n'
					// +(new VBArray(p)).toArray()
					+ Object.prototype.toString.call(p));
			for (var i in p)
				alert('' + Object.prototype.toString.call(p[i]) + '\n' + i + '	' + p[i]);
		}

		// 自動別日期
		if (typeof p == 'object' && /^\d{14}(\.\d+)?([+ \-]\d+)?$/.test('' + p))
			p = this.DateStringToDate(p);
		// 自動別 VBA
		else if (typeof p == 'unknown')
			// from VBA_to_JSA()
			try {
				p = new VBArray(p).toArray();
			} catch (e) {
			}
		;
		ph[o.Name] = p;
		oP.moveNext();
	}

	// o=[];for(p in ph)o.push(p+': '+ph[p]);sl(o.join('\n'));
	return ph;
};



/*	cause error!	requires Windows 2003 DNS
	http://forums.devshed.com/dns-36/dns-through-wmi-in-net-140427.html
	http://www.activexperts.com/activmonitor/windowsmanagement/scripts/networking/dns/server/
	http://www.113317.com/blog/article.asp?id=543
	http://blogs.msdn.com/mpoulson/archive/2006/05/10/594950.aspx
	http://www.ureader.com/message/3258511.aspx
	http://www.scriptinganswers.com/forum/forum_posts.asp?TID=516&PID=3124
if(0){
 var qHost='213.22.211.in-addr.arpa',qIP=WMI_data({p:'MicrosoftDNS',from:'MicrosoftDNS_PTRType',where:"OwnerName='"+qHost+"'"}).item();
 alert(qIP.RecordData);
}
*/




/*
	http://msdn2.microsoft.com/en-us/library/aa394239.aspx
	http://tech.163.com/05/0406/10/1GL8FUG200091589.html

test:
with(getSysInfo())alert(Caption+' '+CSDVersion+' '+OtherTypeDescription+'(SP '+ServicePackMajorVersion+'.'+ServicePackMinorVersion+') [Version '+Version+']'
	+'\nWindowsDirectory: '+WindowsDirectory
	+'\nSystemDirectory: '+SystemDirectory
	+'\nFreePhysicalMemory: '+turnSI(FreePhysicalMemory)+'/'+turnSI(PhysicalMemory)+'B ('+PhysicalMemory+' bytes)'
	+'\nOSLanguage: '+OSLanguage+' (0x'+hex(OSLanguage)+')'	//	http://msdn.microsoft.com/zh-tw/library/system.globalization.cultureinfo%28VS.80%29.aspx
	+'\nCountryCode: '+CountryCode
	+'\nCodeSet: CP'+CodeSet	//	http://en.wikipedia.org/wiki/Code_page	http://msdn.microsoft.com/en-us/library/dd317756%28VS.85%29.aspx
	+'\nLocale: '+Locale
	+'\nCurrentTimeZone: '+gDate(CurrentTimeZone*60*1000)
	+'\nMUILanguages: '+MUILanguages
	+'\nBootUpTime: '+LastBootUpTime.toLocaleString()
	+'\nLocalDateTime: '+LocalDateTime.toLocaleString()
	+'\n系統運行 Uptime: '+gDate(Uptime)//+' ms'
	+'\n系統 counter: '+Timestamp+' s'
	+'\nCSName: '+CSName
	+'\nRegisteredUser: '+RegisteredUser
);WScript.Quit();
*/

getSysInfo[generateCode.dLK]='WMI_data';
function getSysInfo(){
 var o=WMI_data('Win32_OperatingSystem').item(),r;
 with(o)r={
	Caption:o.Caption.replace(/\s+$/,''),	//	系統
	Name:o.Name,
	CSDVersion:o.CSDVersion,
	ServicePackMajorVersion:o.ServicePackMajorVersion||(isNaN(o.ServicePackMajorVersion)?'':0),
	ServicePackMinorVersion:o.ServicePackMinorVersion||(isNaN(o.ServicePackMinorVersion)?'':0),
	OtherTypeDescription:o.OtherTypeDescription||'',
	Version:o.Version,	//	系統版本

	WindowsDirectory:o.WindowsDirectory,
	SystemDirectory:o.SystemDirectory,

	CSName:o.CSName,
	RegisteredUser:o.RegisteredUser,

	CurrentTimeZone:o.CurrentTimeZone,
	LastBootUpTime:WMI_data.DateStringToDate(o.LastBootUpTime),	//	系統最後一次啟動的時間
	LocalDateTime:WMI_data.DateStringToDate(o.LocalDateTime),
	OSLanguage:o.OSLanguage,
	CountryCode:o.CountryCode,
	CodeSet:o.CodeSet,
	Locale:o.Locale,
	MUILanguages:VBA_to_JSA(o.MUILanguages),

	FreePhysicalMemory:o.FreePhysicalMemory,
	PhysicalMemory:WMI_data('Win32_PhysicalMemory').item().Capacity,

	// ms	http://msdn2.microsoft.com/en-us/library/aa394272.aspx
	Uptime:WMI_data('Win32_PerfFormattedData_PerfOS_System.SystemUpTime')*1e3,	//	maybe null!
	// 顯示系統運行時間(seconds) (NOT Uptime!)	這個運行時間是從性能計數器中獲得的64位整型數，不會出現在49.7天後溢出的情況。	http://www.dx21.com/SCRIPTING/WMI/SUBCLASS.ASP?CID=201
	//	maybe NaN
	Timestamp:WMI_data('Win32_PerfRawData_PerfOS_System.Timestamp_Sys100NS')/WMI_data('Win32_PerfRawData_PerfOS_System.Frequency_Sys100NS')
 };
 //alert(WMI_data('Win32_PerfRawData_PerfOS_System.Timestamp_Sys100NS')+'/'+WMI_data('Win32_PerfRawData_PerfOS_System.Frequency_Sys100NS'));

 if(!r.Uptime)
  r.Uptime=(new Date()-r.LastBootUpTime);

 return r;
}


/*	http://support.microsoft.com/kb/328874/zh-tw
	http://msdn.microsoft.com/en-us/library/aa394520(VS.85).aspx
	http://msdn.microsoft.com/en-us/library/aa390456(VS.85).aspx	http://school.21tx.com/2004/06/16/11568_4.html
	If this method succeeds and the ActivationRequired property is 1 (one), the method returns 0 (zero). Otherwise, the method returns one of the WMI error constants.

TODO:
判別 OS
*/
getWinID[generateCode.dLK]='WMI_data';
function getWinID(pKey){
 var o=WMI_data('Win32_WindowsProductActivation')
	,WshShell=WScript.CreateObject("WScript.Shell");
 if(!o){alert('getWinID: Can not get Win32_WindowsProductActivation!');return;}
 o=o.item();
 if(o.ActivationRequired){
  //	未啟用 Windows 前, 用錯誤序號會出錯
  alert('Activation Required.');
  return;
 }
 if(pKey)try{
  //	SetProductKey: 修改產品金鑰CD-KEY序號, return 0:OK, else error
  var e=o.SetProductKey(pKey.replace(/[\s\-]/g,''));
  if(e)throw e;
 }catch(e){
  alert('Update failed for ['+pKey+']:\n'+e.description);	//	for old version 有可能：無效的操作, 此時需 delete OOBETimer registry value
  //	TODO: delete OOBETimer registry value for XP 2600: 針對非 Windows XP SP1 或較新版 Windows XP 使用，來停用 Windows。
  //WshShell.RegDelete("HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\WPAEvents\\OOBETimer");
 }
 return o.GetInstallationID(pKey);//||pKey;	//	無法以此方法獲得 ID
}

//  ksp:
//alert(getWinID('Q9FDY-483HM-FV6RQ-2YQQQ-FD7J8'));WScript.Quit();

// NTSU
//alert(getWinID('VWPM3-MH7H6-VDDHG-YVR4Y-W38JQ'));WScript.Quit();
//alert(getWinID());

//alert(getSysInfo().Caption)
//WScript.Quit();

/*
http://163.19.54.70/student/SerialNumber.txt	大量授權
Windows XP Professional		VWPM3-MH7H6-VDDHG-YVR4Y-W38JQ
Windows XP Prof, x64 Ed.	FG2Q3-QX4JG-FQMMB-8XXD6-34MRY
Office XP Applications		MXCVH-R3QQG-DMQ2M-KXPVQ-VKD6W
Office XP Suites		PCCKW-J8Y6T-P632P-9KW9P-PK88B
Office 2003 Applications	TF6RQ-TVG9Q-FVV74-GR4CP-2C2MB
Office 2003 Suites		WCMVH-XJGPJ-G9BKC-2KHY9-Y7V36
Office 2007 Applications	FJXGQ-RDQRY-Q2784-D89BP-M4MYJ
Office 2007 Suites		KX3T3-RYFP7-BMPKG-JXTQ2-9HWBJ

DBXYD-TF477-46YM4-W74MH-6YDQ8 (CD)
W2JJW-4KYDP-2YMKW-FX36H-QYVD8 (FILES)

'Microsoft Windows XP Professional 5.1.2600':'VWPM3-MH7H6-VDDHG-YVR4Y-W38JQ'

ksp:
Windows XP Professional		Q9FDY-483HM-FV6RQ-2YQQQ-FD7J8
Windows XP Prof, x64 Ed.	V3PP8-CD446-62H9J-3XHVF-K44F3
Windows Vista 的 KMS 認證方式，請參考	http://www.ks.edu.tw/KSnet_service.html#D
Office XP Suites		F86BJ-8PJWY-4P8QX-89FKF-896DT
Office 2003 Suites		F4RMR-DKBX3-2TV7F-9T8QJ-8MYQ6
Office 2007 Suites		M3JH3-4R8XX-R37F2-8D8H8-CBVD8

高雄市？
Office 2007
W3GCD-YWK98-8F6BG-2CYBY-KVWBJ


以下序號皆為 VLK 大量授權序號：
HCQ9D-TVCWX-X9QRG-J4B2Y-GR2TT
MRX3F-47B9T-2487J-KWKMF-RPWBY
QC986-27D34-6M3TY-JJXP9-TBGMD
CM3HY-26VYW-6JRYC-X66GX-JVY2D
DP7CM-PD6MC-6BKXT-M8JJ6-RPXGJ
F4297-RCWJP-P482C-YY23Y-XH8W3
HH7VV-6P3G9-82TWK-QKJJ3-MXR96



Windows XP Home Edition 
x:
BQFBV-9J43J-663WJ-T2VDY-X86HY
VTDBB-QVPCJ-33J2V-B9KV4-W2PBM
DJH7R-4CYKJ-GWYDC-7MXHJ-X9VJY
3GT36-XXFDW-JC676-P4FBF-2G6MJ
DGDGK-XVXWR-XJHYK-3688K-8HXYJ
CX7DD-4GX4Y-BTTR4-H88Y7-GQPWQ
J22CH-K4V7X-4G6H6-66JFG-737TK
CG3BH-RG63P-6H2MR-3DVPT-6WTXJ 
JPDR8-7X4G9-Q226K-B7VYR-HFHMD
W888Y-WM6YJ-DJQ27-WRB88-7FG96

*/


/*
	Win32_ComputerSystem:
	http://msdn2.microsoft.com/en-us/library/aa394224.aspx

	Win32_NetworkAdapterConfiguration:
	http://msdn2.microsoft.com/en-us/library/aa394217.aspx
	http://www.microsoft.com/china/technet/community/scriptcenter/topics/networking/01_atnc_intro.mspx
	http://www.codeproject.com/vbscript/ipaddress.asp?df=100&forumid=3295&exp=0&select=123580


test:
with(get_net_info())alert(UserName+'\n'+Name+'\n'+Workgroup+'\n'+Domain+'\n'+BootupState);

with(get_net_info(2)){
 alert(UserName+'\n'+Name+'\n'+Domain+'\n'+BootupState+'\nAll '+netif.length+' interfaces get');
 for(i=0;i<netif.length;i++)with(netif[i])
  sl(Caption+'\n'
	+DNSDomain+'\n'
	+DHCPServer+'\n'
	+DNSHostName+'\n'
	+DNSServerSearchOrder+'\n'
	+IPSubnet+'\n'
	+DefaultIPGateway+'\n'
	+IPAddress+'\n'

	+IPEnabled+'\n'
	+DHCPEnabled+'\n'
	+SettingID+'\n'

	+MACAddress
	);
}
WScript.Quit();

*/
_// JSDT:_module_
.
/**
 * 取得網卡設定的IP地址
 * @param type	default type: ip setted interfaces only, 1: all interfaces, 2: 實體 net interfaces(網路卡，無線)
 * @returns
 * @example
 * IP=get_net_info().netif[0].IPAddress[0];
 * with(get_net_info())alert(UserName+'\n'+Name+'\n'+Workgroup+'\n'+Domain+'\n'+BootupState);
 * @requires	WMI_data,VBA_to_JSA
 * @_memberOf	_module_
 */
get_net_info = function(type) {
	var r = WMI_data('Win32_ComputerSystem');
	if (!r || !r.item()) {
		r = null;
		throw new Error('Can not get Win32_ComputerSystem!\nIs this old system or the function is limited?');
		r = {};
	} else {
		r =
		// WMI_data({computer:IP||'.',from:'Win32_ComputerSystem'}).item()
		WMI_data.getProperties(r.item());
		if (!r.Workgroup)
			//	Windows 2000 and Windows NT: Workgroup is not available. Domain: If the computer is not part of a domain, then the name of the workgroup is returned.
			r.Workgroup = r.Domain;
	}

/*	waste time
 with(WMI_data('Win32_NTDomain').item()){
  r.Caption=Caption,r.Description=Description;
  if(!r.Name)r.Name=Name;
 }
*/

	r.netif = [];
	WMI_data(
			{
				from : 'Win32_NetworkAdapterConfiguration',
				where : type === 1 ? ''
						// 這判別法不是很好
						//	DHCPEnabled 與 IPEnabled 可以同時為 TRUE
						: type === 2 ? 'MACAddress!=NULL AND (DHCPEnabled=TRUE OR IPEnabled=TRUE)'// OR IPXEnabled=TRUE
						: 'IPEnabled=TRUE' // 'NetEnabled=True': Vista only code?
			}, function(o) {
				// 在DHCP可能得到兩筆同IP之data.
				// MACAddress: getmac.exe, arp -a, nbtstat -a 192.168.0.1
				r.netif.push(WMI_data.getProperties(o));
			});
	return r;
};



_// JSDT:_module_
.
/**
 * get CIDR data
 * @param {Number} CIDR	CIDR mask bits, 0~32
 * @param {String} IP	IPv4, e.g., 1.2.3.4
 * @return	CIDR data
 * @since	2010/4/21 22:56:16
 * @_memberOf	_module_
 */
CIDR_to_IP = function (CIDR, IP) {
	if (isNaN(CIDR) || CIDR < 0 || CIDR > 32)
		return;

	if (typeof IP === 'string')
		IP = IP.split('.');
	else if (!(IP instanceof Array))
		IP = [];

	var i = 0, r = {
		//	geteway IP
		geteway : [],
		//	subnet mask
		mask : [],
		//	wildcard mask
		wildcard : [],
		//	subnet start IP,the entire network
		subnet : [],
		//	subnet end IP, broadcast address
		broadcast : [],
		//	Maximum Addresses, range IP count
		//	.count now = Maximum Subnets
		count : 1 << (32 - CIDR)
	};

	for (; i < 4; i++) {
		if (CIDR > 7) {
			CIDR -= 8;
			r.wildcard[i] = 0;
			r.mask[i] = 255;
			r.subnet[i] = r.broadcast[i] = IP[i] || 0;
		} else if (CIDR) {
			r.broadcast[i] = (IP[i] || 0) | (r.wildcard[i] = CIDR = (1 << (8 - CIDR)) - 1);
			r.subnet[i] = (IP[i] || 0) & (r.mask[i] = 255 - CIDR);
			CIDR = 0;
		} else
			r.broadcast[i] = r.wildcard[i] = 255,
			r.subnet[i] = r.mask[i] = 0;
	}

	if (r.count > 2)
		r.count -= 2;
	r.geteway = r.broadcast.join(',').split(',');
	//	[the entire network, .., geteway, broadcast address]
	r.geteway[3] -= 1;

	//alert(r.geteway + '\n' + r.subnet + '\n' + r.broadcast + '\n' + r.wildcard + '\n' + r.subnet + '\n' + r.count);
	return r;
};


_// JSDT:_module_
.
/**
 * 改變網卡的IP地址: change IP, set IP
 * @param to_s	IP or {IP:''||[], CIDR:24||.CIDR_notation, Subnet:''||[], DNS:''||[], Gateway:254||[], GatewayOrder:''||[]}
 * @param from	IP or netif No.
 * @since
 * 2009/5/7 0:24:5	加強
 * 2010/3/3 10:41:17	a work version
 * @see
 * <a href="http://msdn.microsoft.com/en-us/library/aa394217%28VS.85%29.aspx" accessdate="2010/3/3 13:15">Win32_NetworkAdapterConfiguration Class (Windows)</a>
 * <a href="http://www.yongfa365.com/item/Use-WMi-Change-IP-VBS-yongfa365.html" accessdate="2010/3/3 13:14">通过 WMI 改变网卡的IP地址 ChangeIP.vbs - 柳永法(yongfa365)'Blog</a>
 * <a href="http://www.microsoft.com/technet/scriptcenter/topics/networking/01_atnc_intro.mspx">Automating TCP/IP Networking on Clients: Part 1: Introduction</a>
 * <a href="http://www.dotblogs.com.tw/PowerHammer/archive/2008/03/24/2060.aspx" accessdate="2010/3/3 13:15">使用 WMI 更改IP、子網路遮罩、閘道、DNS - 強力鎯頭 VB BLOG - 點部落</a>
 * Using NetSh.exe (no reboot required): <a href="http://techsupt.winbatch.com/webcgi/webbatch.exe?techsupt/tsleft.web+WinBatch/How~To+Change~Ip~Address.txt" accessdate="2010/3/3 13:12">WWW Tech Support/WinBatch/How To\Change Ip Address.txt</a>
 * @example
 * set_net_info({IP:'163.16.20.212',Gateway:254});
 * sl(set_net_info({IP:'163.16.20.30',Gateway:254}));WScript.Quit();
 * @requires	WMI_data,VBA_to_JSA,JSArrayToSafeArray,CIDR_to_IP
 * @_memberOf	_module_
 */
set_net_info = function (to_s, from) {

	var _f = set_net_info, r, count, IPA, i = function(ip) {
		if (!(ip instanceof Array))
			if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip = '' + ip))
				ip = [ ip ];
			else
				return;
		return JSArrayToSafeArray(ip);
	};

	if (typeof to_s === 'string'
			&& (r = to_s
					.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/(\d{1,2}))?$/))) {
		count = r[1];
		to_s = {
			IP : count
		};

		if ((r = r[3]) > 15) {
			r = _.CIDR_to_IP(r, count);
			to_s.Gateway = r.geteway.join('.');
			to_s.Subnet = r.mask.join('.');
		}

	}else if (typeof to_s !== 'object' || to_s instanceof Array)
		// treat as IP
		to_s = {
			IP : to_s
		};

	if (!isNaN(to_s.Gateway))
		to_s.Gateway = (to_s.IP instanceof Array ? to_s.IP.join('.') : to_s.IP)
				.replace(/\d+$/, to_s.Gateway);

	//	SubnetMask: Subnet masks that complement the values in the IPAddress parameter. Example: 255.255.0.0. 
	if (!('Subnet' in to_s) || !isNaN(to_s.Subnet)) {
		r = _.CIDR_to_IP(to_s.Subnet || _f.CIDR_notation, to_s.IP);
		to_s.Subnet = r.subnet.join('.');
	}

	//sl('set_net_info:\n[' + from + '] → [' + to_s.IP + '/' + to_s.Subnet + ']\nGateway: [' + to_s.Gateway + ']\nDNS: [' + ('DNS' in to_s ? to_s.DNS : _f.default_DNS) + ']');
	// return -1;

	to_s.Subnet = i(to_s.Subnet);
	to_s.IP = i(to_s.IP);
	to_s.DNS = i('DNS' in to_s ? to_s.DNS : _f.default_DNS);

	if ((to_s.Gateway = i(to_s.Gateway)))
		if (!to_s.GatewayOrder)
			for (i = 1, to_s.GatewayOrder = [ 0 ], r = to_s.Gateway instanceof Array ? to_s.Gateway.length
					: 0; i < r;)
				to_s.GatewayOrder.push(++i);
		else if (!(to_s.GatewayOrder instanceof Array))
			to_s.GatewayOrder = [ to_s.GatewayOrder ];

	r = -1;
	count = 0;
	if (!from)
		from = 0;

	WMI_data(
			{
				from : 'Win32_NetworkAdapterConfiguration',
				// 這判別法不是很好
				//	DHCPEnabled 與 IPEnabled 可以同時為 TRUE
				where : 'MACAddress!=NULL AND (IPEnabled=TRUE OR DHCPEnabled=TRUE)'// OR IPXEnabled=TRUE
			},
			function(o) {
				// alert('Get if: ' + o.Caption + '\n' + from + ',' + count);
				// 通常我們不會設定無線連線
				if(/wireless/i.test(o.Caption))
					return;

				if (isNaN(from) || from === count++) {
				for (i = 0, IPA = from ? VBA_to_JSA(o.IPAddress) : [ 1 ]; i < IPA.length; i++) {
					if (!from || IPA[i] === from) {
						r = typeof to_s.IP === 'undefined' ? o.EnableDHCP()
								: o
										.EnableStatic(
												to_s.IP,
												typeof to_s.Subnet === 'undefined' ? o.IPSubnet
														: to_s.Subnet)
										|| typeof to_s.Gateway !== 'undefined'
										&& o.SetGateways(to_s.Gateway,
												to_s.GatewayOrder)
										|| typeof to_s.DNS !== 'undefined'
										&& o.SetDNSServerSearchOrder(to_s.DNS);
						//alert('Set if:\n'+o.Caption+'\nto: '+to_s.IP+'\nerrno: '+r);
							// TODO: error detection
							return 1;
						}
					}
				}
			});

	// not found / error
	// http://msdn.microsoft.com/en-us/library/aa390383%28VS.85%29.aspx
	return r;
};

_// JSDT:_module_
.
// default DNS
// 168.95.1.1,8.8.4.4
set_net_info.default_DNS = '8.8.8.8';

_// JSDT:_module_
.
// http://en.wikipedia.org/wiki/CIDR_notation
set_net_info.CIDR_notation = 24;





/*	get IP of Windows Host
	http://www.scriptinganswers.com/forum/forum_posts.asp?TID=516&PID=3124
	Wscript.Network

ping:
	http://blog.blueshop.com.tw/hammerchou/archive/2006/07/08/32205.aspx
1.
GetObject("winmgmts:").Get("NetDiagnostics=@").Ping(strAddr, Ping)
2.
objCls = GetObject("winmgmts:\\" & strMachine & "\root\CIMV2").Get("NetDiagnostics")
objInPara = objCls.Methods_("Ping").inParameters.SpawnInstance_()
objInPara.Properties_("sInAddr") = "www.google.com.tw" // 設定 Ping 的位置
// Ping 為 方法 , ExecMethod 為 執行方法 ( 把參數送入執行 )
objOutPara = objWMIsvc.ExecMethod("NetDiagnostics=@", "Ping", objInPara)
// 取回輸出參數 ( Ping 的結果 ): objOutPara.ReturnValue = True 則 Ping 成功 , 反之則失敗
objOutPara.sOutArg


test:
var h='Public',ip=getIPofHost(h);alert(ip?h+':\n'+ip:'Computer [\\'+h+'] is unreachable!');

*/
//getIPofHost[generateCode.dLK]='WMI_data';
function getIPofHost(h) {
	var qIP = WMI_data( {
		from : 'Win32_PingStatus',
		where : "Address='" + h + "'"
	}).item();
	if (!qIP.StatusCode && qIP.StatusCode != null)
		return qIP.ProtocolAddress;
}

//	終止進程	http://msdn2.microsoft.com/en-us/library/aa393907.aspx
//killProcess[generateCode.dLK]='WMI_data';
function killProcess(n, isPID) {
	var k = 0;
	if (typeof isPID == 'undefined')
		isPID = !isNaN(n);
	WMI_data('Win32_Process', function(p) {
		with (p)
		if (isPID)
			if (ProcessId == n) {
				Terminate();
				k = 1;
				return 1;
			} else if (Caption == n)
				Terminate(), k++;
	});
	return k;
}


/*	列舉進程	http://msdn2.microsoft.com/en-us/library/aa394372.aspx

test:
alert(get_process()['explorer.exe'].CommandLine);
for(i=0,p=get_process();i<p.length;i++)with(p[i])
 alert(i+' / '+p.length+'\n['+ProcessId+'] '+Caption+(Name==Caption?'':' ('+Name+')')+'\n'+(Description==Caption?'':Description+'\n')+CSName+'\n'
	+'Open files: '+HandleCount+'\n'
	//+OSName+'\n'
	+'memory: '+MinimumWorkingSetSize+'-'+MaximumWorkingSetSize+'\n'	//	memory pages visible to the process in physical RAM
	+'Time in kernel mode: '+KernelModeTime+' ms\n'+ExecutablePath+'\n'+CommandLine+'\n'+CreationDate.toLocaleString()
	);
*/
//get_process[generateCode.dLK]='WMI_data';
function get_process() {
	var r = [];
	WMI_data('Win32_Process', function(p) {
		with (p)
		r[Caption] = r[r.push( {
			ProcessId : ProcessId,
			Caption : Caption,
			ExecutablePath : ExecutablePath,
			CommandLine : CommandLine,
			Name : Name, // ==Caption
			Description : Description, // ==Caption
			CSName : CSName,
			HandleCount : HandleCount,
			OSName : OSName,
			MinimumWorkingSetSize : MinimumWorkingSetSize,
			MaximumWorkingSetSize : MaximumWorkingSetSize,
			KernelModeTime : p.KernelModeTime / 1e5, //	100000ms
			CreationDate : WMI_data
			.DateStringToDate(CreationDate)
		}) - 1];
	});
	return r;
}



/*	列舉服務
	http://msdn2.microsoft.com/en-us/library/aa394418.aspx
	http://www.microsoft.com/taiwan/technet/scriptcenter/topics/vista/indexer.mspx

test:
alert(get_service()['Event Log'].Description);
for(i=0,s=get_service();i<s.length;i++){t=i+' / '+s.length;for(j in s[i])t+='\n'+j+': '+s[i][j];alert(t);}
*/
//get_service[generateCode.dLK]='WMI_data';
function get_service() {
	var r = [];
	WMI_data('Win32_Service', function(s) {
		with (s)
		r[Caption] = r[r.push( {
			AcceptPause : AcceptPause,
			AcceptStop : AcceptStop,
			Caption : Caption,
			Description : Description,
			DisplayName : DisplayName,
			ExitCode : ExitCode,
			InstallDate : WMI_data.DateStringToDate(InstallDate),
			Name : Name,
			Pathname : Pathname,
			ProcessId : ProcessId,
			ServiceSpecificExitCode : ServiceSpecificExitCode,
			Started : Started,
			StartMode : StartMode,
			StartName : StartName,
			State : State,
			Status : Status,
			SystemName : SystemName
		}) - 1];
	});
	return r;
}


/*	http://msdn.microsoft.com/en-us/library/bb774148.aspx
WinShell.ShellExecute(appName, appArgs, appPath, "", 0);	http://msdn.microsoft.com/en-us/library/bb774148.aspx
Private Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" (ByVal hwnd As Long, ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
<object runat="server" id="WinShell" scope="page" classid="clsid:13709620-C279-11CE-A49E-444553540000"></object>
<object runat="server" id="fso" scope="page" classid="clsid:0D43FE01-F093-11CF-8940-00A0C9054228"></object>

http://windowssdk.msdn.microsoft.com/en-us/library/ms630425.aspx
WinShell.ShutdownWindows();	//	Open the Shutdown dialog	http://www.robvanderwoude.com/index.html
*/


/*	2008/8/8 18:29:44
	run them with administrator rights	runs under administrator privileges.
帳戶控制	Windows Vista：使用軟體限制原則對抗未授權的軟體	http://www.microsoft.com/taiwan/technet/windowsvista/security/rstrplcy.mspx
http://4sysops.com/archives/vista%E2%80%99s-uac-how-to-elevate-scripts-vbscript-and-jscript/
http://blogs.msdn.com/aaron_margosis/archive/2007/07/01/scripting-elevation-on-vista.aspx
Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableLUA	c:\windows\system32\control.exe /name Microsoft.UserAccounts	http://www.dashken.net/index.php?/archives/280-VBScript-Check-if-OS-is-Vista-and-Vistas-UAC-status.html
http://msdn.microsoft.com/en-us/magazine/cc163486.aspx
HKEY_LOCAL_MACHINESOFTWARE MicrosoftWindowsCurrentVersionPoliciesSystem\ConsentPromptBehaviorAdmin	http://hsu.easynow.com.tw/index.php?load=read&id=28
http://vistavitals.blogspot.com/2008/02/logon-scripts-token-effort.html
runas	http://www.merawindows.com/Forums/tabid/324/forumid/82/postid/32458/scope/posts/Default.aspx
	http://www.winhelponline.com/articles/185/1/VBScripts-and-UAC-elevation.html

http://forums.techarena.in/vista-security/654643.htm
Set objShell = CreateObject("Shell.Application")
Set objFolder = objShell.Namespace("C:\")
Set objFolderItem = objFolder.ParseName("myhta.hta")
objFolderItem.InvokeVerb "runas"

var WinShell=new ActiveXObject("Shell.Application"),p=location.pathname.replace(/[^\\]+$/,''),o=WinShell.Namespace(p).ParseName(location.pathname.slice(p.length));
o.InvokeVerb("runas");

http://www.zaoxue.com/article/tech-28339_2.htm	http://www.lob.cn/vbs/20071126203237.shtml

TODO:
對 prompt 回應不允許時的處理: 若想在受限的情況下使用?
不使用自訂程式	http://msdn.microsoft.com/en-us/library/bb776820(VS.85).aspx
*/
function runas(p){
 if(!p)p=typeof WScript=='object'?WScript.ScriptFullName:unescape(location.pathname);
 var a={js:'wscript.exe',vbs:'wscript.exe',hta:'mshta.exe'},ext=p.match(/([^.]+)$/);
 a=ext&&((ext=ext[1].toLowerCase()) in a)?a[ext]:'';
 //	判斷是否有權限
 if(!registryF.checkAccess('HKLM\\SOFTWARE\\')){
  //	以管理者權限另外執行新的	It will get the UAC prompt if this feature is not disabled.
  new ActiveXObject("Shell.Application").ShellExecute(a||p,a?p:'','','runas'/*,5*/);
  //	執行完本身則退出
  if(typeof WScript=='object')WScript.Quit();else if(typeof window=='object')window.close();
 }
}


/*	JScript file: check owner, .exe file
	http://www.microsoft.com/taiwan/technet/scriptcenter/resources/qanda/nov04/hey1115.mspx
	Exec Method (Windows Script Host)	http://msdn.microsoft.com/en-us/library/ateytk4a(VS.85).aspx

usage:
runProg(path): use WshShell.Exec, return [StdOut, StdErr, ExitCode]
runProg(path, 1): use WshShell.Exec, can get output by .StdOut.ReadAll(), or .StdErr.ReadAll()
runProg([path, WindowStyle, WaitonReturn],2): use WshShell.Run
runProg(script path, remote computer): use WshRemote
runProg(path, remote computer): use WMI

TODO:
runProg([path, Verb],3): use Shell.Application InvokeVerb
runProg([path, arg1, arg2,..]): use Shell.Application.ShellExecute


example:
WScript.Echo(runProg('%COMSPEC% /U /c ""C:\\Program Files\\WinRAR\\Rar.exe" vt -scuc "F:\\CLAMP 01.rar""')[0]);


WshShell.Run(command, [WindowStyle 0-10], [WaitonReturn false: nowait & return 0, true: wait & return error code])
WshShell.Exec(),objFolderItem.InvokeVerb()
WshShell.Run('command /k ' + ドライブ +' | cd /D '+ パス);// cd で他ドライブへ移れないので。
*/
//runProg[generateCode.dLK]='initWScriptObj';
function runProg(p,r){try{
 var s;
 if(!r||r===1||r===2)if(typeof (s=new ActiveXObject('WScript.Shell'))=='object'){
  if(typeof p=='object'&&r===2)
   r=s.Run(p[0],p[1],p[2]);
  else if(s=s.Exec(p),r)r=s;
  else with(s){
   while(!Status)WScript.Sleep(80);
   r=[StdOut.ReadAll(),StdErr.ReadAll(),ExitCode];
  }
  return r;
 }else return;

 if(/^[^ ]+\.(j|vb)s$/i.test(p)){
  s=(WScript.CreateObject('WSHController')).CreateScript(p,r);
  s.Execute();
  return s;
 }

 s=GetObject("winmgmts:{impersonationLevel=impersonate}//"+(r||'.')+"/root/cimv2:Win32_Process");
 //if(/^[^ ]+\.(j|vb)s$/i.test(p))p="wscript.exe "+p;
 return s.Create(p/*,null,null,intProcessID*/);	//	Create 方法會讓這個指令碼在「遠端電腦」上執行。
}catch(e){
 //popErr(e);
 return e;
}}	//	function runProg



/*	shutdown/reboot computer	2007/5/8-9 0:8:52
	http://www.robvanderwoude.com/index.html
	http://www.ericphelps.com/batch/samples/reboot.txt

	http://www.semcase.com/docus/iis/prog_wmi_tut_03_01.htm	http://www.semcase.com/docus/iis/iis.htm
	http://support.microsoft.com/kb/913538	當您使用會讓列舉程式物件在 Microsoft Windows Server 2003 或 Microsoft Windows XP 用戶端電腦上進行內部複製的 Windows Management Instrumentation (WMI) 功能時，列舉程式物件於用戶端電腦尚未完成使用列舉程式物件的動作時，即遭取消。此外，WMI 功能還可能傳回錯誤碼。

mode:
0	poweroff (if supported by the hardware)
null,1	reboot
	restart
	logoff
	shutdown
	suspend, sleep, hibernate
	lock
//	standby	http://www.tutorials-xe.com/SCRIPTING/Restart-service/
16	force

	open the shutdown dialog

time: seconds
*/
var shutdownF;
setObjValue('shutdownF','poweroff,reboot,restart,logoff,shutdown,suspend,lock,force=16,dialog=32',1);
shutdown[generateCode.dLK]='initWScriptObj,shutdownF,Sleep';
function shutdown(mode,time/*,message*/){
 if(isNaN(mode))mode=shutdownF.reboot;

 var f,sComputer="."
	,_s,s=function(t){
		if(t)return _s;
		if(time&&!_s)Sleep(time);
		_s=1;
	}
	,force=mode&shutdownF.force
	,sF=function(a){f={};for(i=0;i<a.length;i+=2)f[a[i]]=a[i+1];}
	,oWMIS
	;

 if((mode-=force)==shutdownF.dialog)try{
  s();
  WinShell.ShutdownWindows();
  return;
 }catch(e){}

 // way 1: WMI
 sF([0,0,shutdownF.logoff,0,shutdownF.shutdown,1,shutdownF.reboot,2,shutdownF.force,4,shutdownF.poweroff,8]);
 if(mode in f)try{	//	f.hasOwnProperty(mode)
  f=f[mode]&f[force];
  oWMIS=new Enumerator(
	 GetObject("winmgmts:{impersonationLevel=impersonate,(Shutdown)}//"+(sComputer||'.')+"/root/cimv2")
	 .ExecQuery("Select * from Win32_OperatingSystem")//Select * from Win32_OperatingSystem Where primary=true
	);
  if(!oWMIS)throw 1;
  s();
  for(;!oWMIS.atEnd();oWMIS.moveNext()){
   //oWMIS.item().Reboot();//.Shutdown();	//	force!
   oWMIS.item().Win32Shutdown(f);//if()	//	http://msdn2.microsoft.com/en-us/library/aa394058.aspx
  }
  return;
 }catch(e){}
 // way 2: RUNDLL32 SHELL32.DLL, SHExitWindowsEx [n]
 if(mode in f)try{WshShell.Run(" RUNDLL32 SHELL32.DLL,SHExitWindowsEx "+f[mode]);return;}catch(e){}

 // way 3: shutdown.exe utility
 sF([shutdownF.logoff,'l',shutdownF.poweroff,'s',shutdownF.shutdown,'s',shutdownF.reboot,'r',shutdownF.dialog,'i']);
 if(mode in f)try{WshShell.Run('%windir%\System32\shutdown.exe -'+f+(!time||s(1)?'':' -t '+time)+(force?' -f':''));return;}catch(e){}	//	-s or -r

 // way 4: rundll.exe
 sF([shutdownF.logoff,'SHELL.DLL,RestartDialog',shutdownF.poweroff,'USER.EXE,ExitWindows',shutdownF.shutdown,'USER.EXE,ExitWindows'/*'USER.EXE,#7'||'USER.EXE, #7'||'USER.EXE,#7 0'*/,shutdownF.restart,'USER.EXE,ExitWindowsExec'/*'USER.EXE,#246'*/]);
 if(mode in f)try{WshShell.Run("rundll.exe "+f[mode]);return;}catch(e){}

 // way 5: rundll32.exe
 sF([shutdownF.poweroff,'KRNL386.EXE,exitkernel',shutdownF.shutdown,'USER.EXE,ExitWindows',shutdownF.suspend,'PowrProf.dll,SetSuspendState']);
 if(mode in f)try{WshShell.Run("rundll32.exe "+f[mode]);return;}catch(e){}
 // way 6: RUNDLL32 USER32.DLL
 sF([shutdownF.lock,'LockWorkStation',shutdownF.logoff,'ExitWindowsEx']);
 if(mode in f)try{WshShell.Run("rundll32.exe user32.dll,"+f[mode]);return;}catch(e){}

 // way 7: RUNONCE.EXE	runonce.exe是微軟Run Once的包裝。它用於第三方應用程序的安裝程序。它允許安裝程序添加到啟動項中，用於再次啟動後，進行進一步配置。
 if(mode==shutdownF.reboot)try{WshShell.Run("RUNONCE.EXE -q");return;}catch(e){}

 return 1;
}


//	↑WMI set	==================







return (
	_// JSDT:_module_
);
};

//===================================================

CeL.setup_module(module_name, code_for_including);

};

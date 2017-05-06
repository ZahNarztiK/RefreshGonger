var rg_defaultInfo={
		owrai:"",
		dataClear:false,
		delayed:1000,
		focusFin:false,
		focusFinW:false,
		inverse:false,
		noredirect:false,
		noti:false,
		proxy:false,
		proxyIP:"",
		run:false
	},
	rg_defaultClearList={
		appcache: false,
		cache: false,
		cookies: false,
		downloads: false,
		fileSystems: false,
		formData: false,
		history: false,
		indexedDB: false,
		localStorage: false,
		pluginData: false,
		passwords: false,
		webSQL: false
	},
	rg_info,rg_clearList;

var counter=0;

var room;

function chkIP(ip) { return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d{1,5})?$/.test(ip); }

function postCmd(cmd) { room.postMessage(cmd); }

function rg_availKW() { return $('#rg_keyword').val().replace(/^\s+|\s+$/g,"")!=""; }

function rg_load(){
	chrome.storage.sync.get(null,save=>{
		rg_info=rg_defaultInfo;
		for(var k in save) if(k in rg_info) rg_info[k]=save[k];
		rg_clearList=rg_defaultClearList;
		if(save.dataClearList!=undefined)
			for(var k in save.dataClearList)
				if(k in rg_clearList) rg_clearList[k]=save.dataClearList[k];
		rg_setForm();
		postCmd("getCounter");
	});
}

function rg_saveKeyword(kw){
	$('#rg_button').attr("class",rg_availKW()?"start":"");
	chrome.storage.sync.set({owrai:(rg_info.owrai=kw.replace(/^\s+|\s+$/g,""))});
}

function rg_saveProxy(){
	chrome.storage.sync.set({
		proxyIP:(rg_info.proxyIP=/[^\d\.\:]/.test($('#rg_proxyIP').val())?
			$('#rg_proxyIP').val($('#rg_proxyIP').val().replace(/[^\d\.\:]+/g,"")):$('#rg_proxyIP').val())
	},()=>{
		var pok=chkIP(rg_info.proxyIP);
		$('#proxy').attr("class",(rg_info.proxyIP==""||pok)?"":"red");
		$('#rg_proxy').prop("disabled",!pok);
	});
}

function rg_setCounter(n) { $('#rg_counter').html(n); }

function rg_setClearList(status){
	if(rg_info.run) return;
	$('.clearList').each(function(){ $(this).prop("checked",status); });
	rg_clearList=rg_defaultClearList;
	for(var k in rg_clearList)
		rg_clearList[k]=status;
	chrome.storage.sync.set({dataClearList:rg_clearList});
}

function rg_setForm(){
	$('.chkBox').each(function(){
		$(this).prop("checked",rg_info[$(this).attr("name")]);
	});
	$('.clearList').each(function(){
		$(this).prop("checked",rg_clearList[$(this).attr("name")]);
	});
	rg_setCounter(counter);
	rg_setFormAvail();
}

function rg_setFormAvail(){
	$('#rg_keyword').val(rg_info.owrai);
	$('#rg_interval').val(rg_info.delayed==0?"":rg_info.delayed);
	$('#rg_proxyIP').val(rg_info.proxyIP);
	var pok=chkIP(rg_info.proxyIP);
	$('#proxy').attr("class",(rg_info.proxyIP==""||chkIP(rg_info.proxyIP))?"":"red");
	$('#rg_button').attr("class",rg_info.run?"stop":(rg_availKW()?"start":""));
	$('#clear').attr("class",rg_info.run?"disable":"");
	$('.dis').prop("disabled",rg_info.run);
	$('#rg_focusFinW').prop("disabled",rg_info.run?true:!rg_info.focusFin);
	$('#rg_proxy').prop("disabled",rg_info.run?true:!pok);
	$('#rg_proxyIP').prop("disabled",rg_info.proxy);
	rg_setCounter(counter);
}

function rg_setRun(status){
	postCmd("Toggle");
	rg_info.run=status;
	rg_setFormAvail();
}

function rg_toggle(){ if(rg_info.run||rg_availKW()) rg_toggleRun(); }

function rg_toggleProxy(status){
	chrome.storage.sync.set({proxy:(rg_info.proxy=status)},function(){
		$('#rg_proxyIP').prop("disabled",rg_info.proxy);
		postCmd("Proxyosas "+(rg_info.proxy?1:0));
	});
	
}

function rg_toggleRun(){
	if(!rg_info.run) {
		if(rg_info.delayed<1000) rg_confirm();
		else rg_setRun(true);
	}
	else rg_setRun(false);
}

function rg_confirm() { $('#confirm-modal').removeClass("hidden"); }

function rg_confirm_close() { $('#confirm-modal').addClass("hidden"); }

function rg_confirm_yes() {
	rg_setRun(true);
	rg_confirm_close();
}

$(function(){
	room = chrome.extension.connect({ name:"GongChatRoom" });
	room.onMessage.addListener(msg=>{
		var cmd=msg.split(" ",1)[0];
		var tail=msg.substr(cmd.length+1);
		switch(cmd){
			case "setCounter":
				rg_setCounter(counter=tail);
				break;
			case "Stop":
				rg_info.run=false;
				rg_setFormAvail();
				break;
			default: break;
		}
	});

	$('.chkBox').change(function(){
		var obj={};
		rg_info[$(this).attr("name")]=(obj[$(this).attr("name")]=$(this).prop("checked"));		
		chrome.storage.sync.set(obj);
	});

	$('.clearList').change(function(){
		rg_clearList[$(this).attr("name")]=$(this).prop("checked");
		chrome.storage.sync.set({dataClearList:rg_clearList});
	});

	$('#modal-no').click(rg_confirm_close);

	$('#modal-yes').click(rg_confirm_yes);

	$('#rg_button').click(rg_toggle);

	$('#rg_focusFin').change(function(){
		chrome.storage.sync.set({focusFin:(rg_info.focusFin=$(this).prop("checked"))});
		$('#rg_focusFinW').prop("disabled",!rg_info.focusFin);
	});

	$('#rg_interval,#rg_proxyIP').focus(function(){ $(this).attr("placeHolder",""); });

	$('#rg_interval').bind({
		focusout:function(){ $(this).attr("placeHolder","0"); },
		keydown:e=>{
			if($.inArray(e.keyCode,[8,9,13,27,46])!=-1 ||
				((e.ctrlKey==true||e.metaKey==true)&&(e.keyCode==65||e.keyCode==67)) ||
				(e.keyCode>=35&&e.keyCode<=40))
					return;
			if((e.keyCode<48||e.keyCode>57)&&(e.keyCode<96||e.keyCode>105)) return false;
		},
		keyup:function(e){
			chrome.storage.sync.set({
				delayed:(rg_info.delayed=((!isNaN($(this).val())&&$(this).val().length>0)?Number($(this).val()):0))
			});
			if(e.keyCode==13) rg_toggle();
		},
		paste:()=>{ return false; }
	});

	$('#rg_keyword').bind({
		change:function(){ rg_saveKeyword($(this).val()); },
		keyup:function(e){
			rg_saveKeyword($(this).val());
			if(e.keyCode==13) rg_toggle();
		}
	});

	$('#rg_proxy').change(function(){ rg_toggleProxy($(this).prop("checked")) });

	$('#rg_proxyIP').bind({
		change:function(){ rg_saveProxy(); },
		focusout:function(){ $(this).attr("placeHolder","IPv4:PORT"); },
		keydown:e=>{
			if($.inArray(e.keyCode,[8,9,13,27,46,110,190])!=-1 ||
				((e.ctrlKey==true||e.metaKey==true)&&(e.keyCode==65||e.keyCode==67||e.keyCode==86)) ||
				(e.shiftKey==true&&e.keyCode==186) ||
				(e.keyCode>=35&&e.keyCode<=40))
					return;
			if((e.keyCode<48||e.keyCode>57)&&(e.keyCode<96||e.keyCode>105)) return false;
		},
		keyup:function(e){
			rg_saveProxy();
			if(e.keyCode==13&&chkIP(rg_info.proxyIP)){
				$('#rg_proxy').prop("checked",true);
				rg_toggleProxy(true);
			}
		}
	});

	$('#rg_reset').click(()=>{
		if(!rg_info.run)
			chrome.storage.sync.clear(()=>{
				var obj=(rg_info=rg_defaultInfo);
				obj["dataClearList"]=(rg_clearList=rg_defaultClearList);
				chrome.storage.sync.set(obj,rg_setForm);
			});
	});

	$('#rg_selectAll').click(()=>rg_setClearList(true));

	$('#rg_selectNone').click(()=>rg_setClearList(false));

	$('#rg_toggleClearList').click(()=>$('#clearList').toggle());

	//$(document).contextmenu(()=>{ return false; });

	rg_load();
});
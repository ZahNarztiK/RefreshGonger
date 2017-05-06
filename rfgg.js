function rg_chk(){chrome.storage.sync.get("owrai",kw=>chrome.runtime.sendMessage({daimai:(document.documentElement.innerHTML.indexOf(kw.owrai)==-1)}))}
rg_chk();
document.addEventListener("click",()=>chrome.runtime.sendMessage({yuudwoi:true}));
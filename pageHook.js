(function () {
console.log("[TechVaiHook] Iniciando");

let capturedToken = null;
let capturedProjectId = null;
let capturedBrowserSessionId = null;

function decodePayload(token){
  try{
    var parts = String(token || "").replace(/^Bearer\s+/i, "").trim().split(".");
    if(parts.length !== 3) return null;
    var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64));
  }catch(e){ return null; }
}

function isLikelyLovableToken(token){
  var payload = decodePayload(token);
  if(!payload || !payload.sub) return false;
  var iss = String(payload.iss || "").toLowerCase();
  var role = String(payload.role || "").toLowerCase();
  if(role === "anon" || role === "service_role") return false;
  if(iss.indexOf("supabase") >= 0 || iss.indexOf("supabase.co") >= 0) return false;
  return true;
}

function getHeaderValue(headers, name){
  try{
    if(!headers) return null;
    var lower = String(name).toLowerCase();
    if(typeof headers.get === "function") return headers.get(name) || headers.get(lower);
    if(Array.isArray(headers)){
      for(var i = 0; i < headers.length; i++){
        var row = headers[i];
        if(row && String(row[0]).toLowerCase() === lower) return row[1];
      }
      return null;
    }
    if(typeof headers === "object"){
      for(var k in headers){
        if(Object.prototype.hasOwnProperty.call(headers, k) && String(k).toLowerCase() === lower) return headers[k];
      }
    }
  }catch(e){}
  return null;
}

function getProjectFromPage(){
  try{
    const m = window.location.pathname.match(/projects\/([0-9a-fA-F-]{36})/i);
    return m ? m[1] : null;
  }catch{ return null; }
}

function extractProjectIdFromUrl(url){
  try{
    const m = String(url).match(/projects\/([0-9a-fA-F-]{36})/i);
    return m ? m[1] : null;
  }catch{ return null; }
}

function notifyFound(token, projectId, browserSessionId, force = false){
  const newProject = projectId || getProjectFromPage();
  const normalizedToken = typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : null;
  const normalizedSession = typeof browserSessionId === "string" ? browserSessionId.trim() : null;
  let changed = false;
  if(normalizedToken && isLikelyLovableToken(normalizedToken) && normalizedToken !== capturedToken){ capturedToken = normalizedToken; changed = true; }
  if(newProject && newProject !== capturedProjectId){ capturedProjectId = newProject; changed = true; }
  if(normalizedSession && normalizedSession !== capturedBrowserSessionId){ capturedBrowserSessionId = normalizedSession; changed = true; }
  if(!changed && !force) return;
  console.log("[TechVaiHook] ✅ Lovable session synced", capturedToken ? "token" : "no token", capturedBrowserSessionId ? "bsess" : "no bsess");
  console.log("[TechVaiHook] ProjectId:", capturedProjectId);
  window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:capturedProjectId, browserSessionId:capturedBrowserSessionId },"*");
}

window.addEventListener("message", (event)=>{
  if(event.source !== window) return;
  if(!event.data) return;

  if(event.data.type === "lovableRequestToken"){
    notifyFound(capturedToken, getProjectFromPage() || capturedProjectId, capturedBrowserSessionId, true);
  } else if(event.data.type === "ql_inject_prompt"){
    try {
      const prompt = event.data.prompt;
      const thinking = event.data.thinking;
      const files = event.data.files || [];

      // Find textarea - try multiple selectors with increasing specificity
      let textarea = null;

      // Try direct input/textarea elements first
      const allTextareas = document.querySelectorAll('textarea');
      for (let i = 0; i < allTextareas.length; i++) {
        const ta = allTextareas[i];
        const visible = ta.offsetParent !== null;
        if (visible && ta.offsetWidth > 100 && ta.offsetHeight > 30) {
          textarea = ta;
          break;
        }
      }

      // Fallback: search by placeholder/class patterns
      if (!textarea) {
        textarea = document.querySelector('textarea[placeholder*="ask"], textarea[placeholder*="message"], textarea[placeholder*="prompt"], textarea[placeholder*="type"]');
      }

      if(!textarea) {
        console.warn('[QL] Textarea not found. Available textareas:', document.querySelectorAll('textarea').length);
        return;
      }

      console.log('[QL] Textarea found, injecting prompt');

      // Set the prompt text using multiple methods for maximum compatibility
      textarea.value = prompt;

      // Trigger all necessary events for React/Vue/vanilla JS listeners
      textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      textarea.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
      textarea.dispatchEvent(new Event('focus', { bubbles: true, cancelable: true }));

      // For React apps, also trigger keyboard events
      const inputEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(inputEvent);

      console.log('[QL] Prompt text set, value length:', textarea.value.length);

      // Set thinking mode if applicable
      if(thinking){
        console.log('[QL] Setting thinking mode');
        let thinkCheckbox = document.querySelector('input[type="checkbox"][aria-label*="think"], input[type="checkbox"][title*="think"]');

        // Fallback: find by searching label text
        if (!thinkCheckbox) {
          const checkboxes = document.querySelectorAll('input[type="checkbox"]');
          for (let i = 0; i < checkboxes.length; i++) {
            const cb = checkboxes[i];
            const label = cb.parentElement?.textContent?.toLowerCase() || '';
            if (label.includes('think') || label.includes('plan') || label.includes('mode')) {
              thinkCheckbox = cb;
              break;
            }
          }
        }

        if(thinkCheckbox && !thinkCheckbox.checked){
          thinkCheckbox.click();
          console.log('[QL] Thinking checkbox clicked');
        }
      }

      // Trigger send - multiple strategies
      setTimeout(() => {
        console.log('[QL] Looking for send button');
        let sendBtn = null;

        // Strategy 1: aria-label or title attributes
        sendBtn = document.querySelector('button[aria-label*="send"], button[title*="send"]');

        // Strategy 2: Search by button position (send button usually on right side)
        if (!sendBtn) {
          const buttons = document.querySelectorAll('button');
          const rightMostX = Math.max(...Array.from(buttons).map(b => b.getBoundingClientRect().right));
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const rect = btn.getBoundingClientRect();
            const text = btn.textContent?.toLowerCase().trim() || '';

            // Send button is usually on right, visible, and near the bottom
            if (rect.right > rightMostX - 100 && rect.width > 30 && rect.height > 24 &&
                (text === 'send' || text.includes('send') || text === '📤' || text === '⬆️')) {
              sendBtn = btn;
              break;
            }
          }
        }

        // Strategy 3: Fallback - any visible button with "send" text (case-insensitive)
        if (!sendBtn) {
          const allBtns = document.querySelectorAll('button');
          for (let i = 0; i < allBtns.length; i++) {
            const btn = allBtns[i];
            const text = btn.textContent?.toLowerCase().trim() || '';
            const isVisible = btn.offsetParent !== null && btn.offsetWidth > 0;
            if (isVisible && (text === 'send' || text.includes('send message'))) {
              sendBtn = btn;
              break;
            }
          }
        }

        if(sendBtn){
          console.log('[QL] Send button found, clicking');
          sendBtn.click();
          console.log('[QL] Prompt injected and sent successfully');
        } else {
          console.warn('[QL] Send button not found after all strategies');
        }
      }, 150);

    } catch(e){
      console.error('[QL] Failed to inject prompt:', e, e.stack);
    }
  }
});

(function wrapFetch(){
  try{
    const originalFetch = window.fetch;
    window.fetch = async function(...args){
      try{
        let reqUrl = typeof args[0] === "string" ? args[0] : ((args[0] && args[0].url) || "");
        let opts = args[1] || {};
        let auth = null;
        let bsess = null;
        if(args[0] instanceof Request){
          reqUrl = args[0].url || reqUrl;
          auth = getHeaderValue(args[0].headers, "Authorization");
          bsess = getHeaderValue(args[0].headers, "X-Browser-Session-ID");
        }
        if(opts.headers){
          auth = getHeaderValue(opts.headers, "Authorization") || auth;
          bsess = getHeaderValue(opts.headers, "X-Browser-Session-ID") || bsess;
        }
        const pid = extractProjectIdFromUrl(reqUrl);
        if(auth && auth.startsWith("Bearer ")){
          const rawToken = auth.slice(7);
          notifyFound(rawToken, pid, bsess);
        } else if(bsess) {
          notifyFound(null, pid, bsess);
        }
      }catch(e){}
      return originalFetch.apply(this,args);
    };
  }catch(e){ console.warn("[TechVaiHook] fetch error",e); }
})();

(function wrapXHR(){
  try{
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function(method,url){
      this._lovable_url = url;
      return origOpen.apply(this,arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function(name,value){
      if(name && name.toLowerCase()==="x-browser-session-id" && value){
        this._lovable_bsess = value;
        notifyFound(null, extractProjectIdFromUrl(this._lovable_url), value);
      }
      if(name && name.toLowerCase()==="authorization" && value && value.startsWith("Bearer ")){
        const rawToken = value.slice(7);
        notifyFound(rawToken, extractProjectIdFromUrl(this._lovable_url), this._lovable_bsess);
      }
      return origSetHeader.apply(this,arguments);
    };
  }catch(e){ console.warn("[TechVaiHook] xhr error",e); }
})();

setInterval(()=>{
  const p = getProjectFromPage();
  if(p && p !== capturedProjectId){
    capturedProjectId = p;
    window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:p, browserSessionId:capturedBrowserSessionId },"*");
  }
},1500);

})();
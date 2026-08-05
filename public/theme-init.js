(function () {
  var dark = {
    '--bg':'#0f172a','--card':'#1e293b','--border':'#334155','--border-hover':'#475569',
    '--ink':'#f1f5f9','--ink2':'#b0d0d0','--muted':'#64748b','--input':'#1e293b',
    '--hover':'#334155','--active-bg':'#1e3a5f','--table-header':'#172033',
    '--dropdown':'#1e293b','--modal':'#0f172a'
  };
  var light = {
    '--bg':'#f4f6fa','--card':'#ffffff','--border':'#e2e8f0','--border-hover':'#b8c4d8',
    '--ink':'#0f172a','--ink2':'#475569','--muted':'#94a3b8','--input':'#f8fafc',
    '--hover':'#f1f5f9','--active-bg':'#eef2ff','--table-header':'#f8fafc',
    '--dropdown':'#ffffff','--modal':'#ffffff'
  };
  var mode = localStorage.getItem('theme') || 'light';
  var vars = mode === 'dark' ? dark : light;
  var r = document.documentElement;
  Object.keys(vars).forEach(function(k){ r.style.setProperty(k, vars[k]); });
})();

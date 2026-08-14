(function () {
  var dark = {
    '--bg':'#1a1815','--bg-sidebar':'#26231e','--card':'#26231e','--border':'#413e38','--border-hover':'#605b53',
    '--ink':'#f5ead8','--ink2':'#b3ab9e','--muted':'#7d776d','--input':'#26231e',
    '--hover':'#322f29','--active-bg':'#e08b52','--accent-ink':'#1a1815','--table-header':'#2c2924',
    '--dropdown':'#26231e','--modal':'#26231e','--p':'#e08b52'
  };
  var light = {
    '--bg':'#f5ead8','--bg-sidebar':'#ebddc5','--card':'#ebddc5','--border':'#dcd3c4','--border-hover':'#c0b6a5',
    '--ink':'#201e1d','--ink2':'#645c50','--muted':'#a19786','--input':'#ebddc5',
    '--hover':'#dfd2bb','--active-bg':'#c67139','--accent-ink':'#f5ead8','--table-header':'#e5d7c0',
    '--dropdown':'#ebddc5','--modal':'#ebddc5','--p':'#c67139'
  };
  var mode = localStorage.getItem('theme') || 'light';
  var vars = mode === 'dark' ? dark : light;
  var r = document.documentElement;
  Object.keys(vars).forEach(function(k){ r.style.setProperty(k, vars[k]); });
})();

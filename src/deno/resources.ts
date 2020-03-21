// Generated automatically from resource files. Do not edit.
export let resources: { [name: string]: string } = {
  "classic-footer.rmu": String.raw `/*
  Used by rimuc.js --styled option.
*/

// Close article div.
</div>

{--highlightjs=}.+skip
{--highlightjs-scripts}

{--mathjax!}{--mathjax-scripts}

.+skip
{--no-toc=}.-skip
{--header-links!}.-skip
<script>
window.onload = function() {
  var headings = [].slice.call(document.body.querySelectorAll('#article > h1, #article > h2, #article > h3'));
  headings.forEach(function(heading) {
{--header-links!}    setHeaderLink(heading);
{--no-toc=}    appendTocEntry(heading);
  });
}
</script>

{--header-links=}.+skip
<script>
function setHeaderLink(heading) {
  var id = heading.getAttribute('id');
  if (id) {
    var link = document.createElement('a');
    link.classList.add('header-link');
    link.setAttribute('href', '#' + id);
    heading.appendChild(link);
  }
}
</script>

{--no-toc!}.+skip
<script>
function appendTocEntry(heading) {
  var id = heading.getAttribute('id');
  if (heading.classList.contains('no-auto-toc')) {
    return;
  }
  var container = document.getElementById('auto-toc');
  if (container === null) {
    return;
  }
  var tocLink = document.createElement('a');
  tocLink.setAttribute('href', '#' + id);
  tocLink.textContent = heading.textContent;
  var tocEntry = document.createElement('div');
  tocEntry.setAttribute('class', heading.tagName.toLowerCase());
  tocEntry.appendChild(tocLink);
  container.appendChild(tocEntry);
}
</script>

{--dropdown-toc=}.+skip
<script>
// matches() polyfill for old browsers.
if (!Element.prototype.matches) {
  var p = Element.prototype;
  if (p.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
    p.matches = p.webkitMatchesSelector;
  if (p.msMatchesSelector) // IE9/10/11 & Edge
    p.matches = p.msMatchesSelector;
  if (p.mozMatchesSelector) // FF<34
    p.matches = p.mozMatchesSelector;
}
window.onclick = function(event) {
  var body = document.getElementsByTagName('body')[0];
  if (event.target.matches('#toc-button, #toc a')) {
    // Toggle TOC if TOC button or TOC link is clicked.
    body.classList.toggle('show-toc');
  }
  else if (!event.target.matches('#toc, #toc *')) {
    // Hide TOC if clicked outside TOC.
    body.classList.remove('show-toc');
  }
}
</script>

</body>
</html>
`,
  "classic-header.rmu": String.raw `/*
  Used by rimuc \x60--layout classic\x60 option.
*/

/*
  Default values for styling themes and content options.
*/

{--section-numbers?} = ''
{--lang?} = ''
{--title?} = '&nbsp;'
{--theme?} = ''
{--no-toc?} = ''
{--custom-toc?} = ''
{--header-links?} = ''
{--small-screen?} = '(max-width: 800px)'
{--meta?} = '<meta charset="UTF-8">
  {--!} Make old IE versions use the latest rendering engine.
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">'
// Additional <head> child elements.
{--head?} = ''

{--highlightjs?} = ''
{--highlightjs-css} = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css">'
{--highlightjs-scripts} = '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
<script>
hljs.configure({languages: []});
hljs.initHighlightingOnLoad();
</script>'

{--mathjax?} = ''
{--mathjax-scripts} = '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>'

// List item CSS counters.
{--dl-counter} = '<span class="dl-counter"></span>'
{--ol-counter} = '<span class="ol-counter"></span>'
{--ul-counter} = '<span class="ul-counter"></span>'

// Classic layout specific.
{--dropdown-toc?} = ''

/*
  Legend theme.
*/
{--theme!.*\x5Cblegend\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#34495e'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#428bca'
{--border-radius?} = '0'
{--max-text-width?} = '50rem'
..

/*
  Vintage theme.
*/
{--theme!.*\x5Cbvintage\x5Cb.*}.+skip
// Default to this theme if none of the built-in themes is specified.
{--theme!.*\x5Cb(legend|vintage|graystone)\x5Cb.*}.-skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#527bbd'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#527bbd'
{--border-radius?} = '4px'
{--max-text-width?} = '50rem'
..

/*
  Graystone theme.
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#888'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#888'
{--border-radius?} = '0'
{--max-text-width?} = '50rem'
..

/*
  Private layout parameters.
*/
// Accomodate the new default TOC generation and --no-toc option.
// DEPRECATED --sidebar-toc: Used internally, external definition tolerated for backward comaptibility.
{--dropdown-toc!}.+skip
..
{--sidebar-toc?} = 'yes'
..

{--dropdown-toc=}.+skip
..
{--sidebar-toc?} = ''
..

// DEPRECATED --toc: If --toc is non-blank make --sidebar-toc non-blank.
{--toc?} = ''
{--sidebar-toc} = '{--toc}{--sidebar-toc}'

// Ensures no TOC.
{--no-toc=}.+skip
..
{--dropdown-toc} = ''
{--sidebar-toc} = ''
..


/*
  HTML header
*/
<!DOCTYPE HTML>
{--lang=}<html>
{--lang!}<html lang="{--lang}">
<head>
{--meta}
<title>{--title}</title>
{--highlightjs!}{--highlightjs-css}


/*
  Layout independent styles
*/
<style>
  :root {
    font-size: 16px;
    line-height: 20px;
    color: {--text-color};
    background-color: {--primary-background};
    font-family: {--sans-font};
  }
  * {
    margin: 0;
    padding: 0;
    white-space: inherit;
    box-sizing: border-box;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 10px 0;
    color: {--primary-color};
  }
  h1 { font-size: 2.2rem; line-height: 40px;}
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.2rem; }
  h4 { font-size: 1.1rem; }
  h5 { font-size: 1.0rem; }
  h6 { font-size: 0.9rem; }
  h2, h3, h4, h5, h6 {
    line-height: normal;
    margin-top: 1.0rem;
    margin-bottom: 0.2rem;
  }
  h2 {
    margin-top: 1.5rem;
    border-bottom: 1px solid {--border-color};
  }
  img {
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  td, th {
    text-align: left;
    vertical-align: top;
  }
  {--!} tbody necessary because: http://stackoverflow.com/questions/7490364/why-do-browsers-still-inject-tbody-in-html5
  table.bordered > tbody > tr > th,
  table.bordered > tbody > tr > td {
    border: 1px solid {--border-color};
  }
  a, a:hover {
    color: {--primary-color};
  }
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  p, pre, li, dt, dd, blockquote p {
    line-height: 1.45;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  ul, ol {
    padding: 0;
    margin: 0 0 10px 25px;
  }
  dt {
    margin-bottom: 0;
    font-style: italic;
  }
  dd {
    margin-left: 1.0rem;
    margin-top: 0;
  }
  blockquote {
    padding: 0 0 0 15px;
    border: none;
    border-left: 5px solid #eeeeee;
    font-family: {--serif-font};
    width: 80%;
    margin: 1.5em 0;
    color: #383838;
  }
  .cite {
    color: #777;
    padding: 5px 0;
  }
  .cite::before {
    content: "\x5C2014 \x5C2009";
  }
  code {
    font-family: {--mono-font};
    {--!} Monspace fonts are relatively oversized.
    font-size: {--mono-size};
    background-color: {--code-background};
  }
{--highlightjs!}  .hljs { background-color: {--code-background}; }
  pre {
    font-family: {--mono-font};
    line-height: normal;
    white-space: pre-wrap;
    background-color: {--code-background};
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    padding: 6px;
  }
  .light-background {
    background-color: {--code-background};
    border: none;
    white-space: pre-wrap;
  }
  *:not(pre) > code {
    white-space: nowrap;
  }
  .dl-horizontal > dd {
    margin-top: 1.0rem;
  }
  pre > code {
    background-color: inherit;
    {--!} highlight.js tweak.
    padding: 0;
  }
  pre span {
    {--!} highlight.js tweak.
    opacity: 1 !important;
  }
  {--!} Rimu classes.
  {--!} Apply verse class to Normal Paragraphs and Division blocks.
  .verse {
    margin: 1.5em 20px;
  }
  div.verse p, p.verse {
    font-family: {--serif-font};
    white-space: pre;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }
  {--!} Apply sidebar class to Normal Paragraphs and Division blocks.
  .sidebar {
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    background: {--sidebar-background};
    padding: 10px;
    margin: 1.5em 0;
  }
  div.sidebar *:first-child {
    margin-top: 0.2rem;
  }
  {--!} Force page break before the element.
  .page-break {
    page-break-before: always;
  }
  {--!} Avoid page breaks inside the element.
  .no-page-break {
    page-break-inside: avoid;
  }
  {--!} Text block alignment classes.
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
  {--!} Preserve line breaks.
  .preserve-breaks {
    white-space: pre;
  }
  {--!} DEPRECATED: Use \x60preserve-breaks\x60 instead.
  .line-breaks {
    white-space: pre;
  }
  {--!} Horizontal labeled list.
  .dl-horizontal:before, .dl-horizontal:after {
    display: table;
    content: "";
    line-height: 0;
  }
  .dl-horizontal:after {
    clear: both;
  }
  .dl-horizontal > dt {
    float: left;
    clear: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    margin-top: 1.0rem;
    width: 25%;
  }
  .dl-horizontal > dd {
    margin-left: 25%;
    padding-left: 1.0rem;
  }
  {--!} List item counters.
  dl {
    counter-reset: dl-counter;
  }
  dl > dt {
    counter-increment: dl-counter;
  }
  ol {
    counter-reset: ol-counter;
  }
  ol > li {
    counter-increment: ol-counter;
  }
  ul {
    counter-reset: ul-counter;
  }
  ul > li {
    counter-increment: ul-counter;
  }
  {--!} Prefix list counter to counter class element content.
  .dl-counter:before {
    content: counter(dl-counter) " ";
  }
  .ol-counter:before {
    content: counter(ol-counter) " ";
  }
  .ul-counter:before {
    content: counter(ul-counter) " ";
  }
  {--!} Number labeled list items.
  .dl-numbered > dt:before {
    content: counter(dl-counter) ". ";
  }
  {--!} Printing.
  @media print {
    .no-print, .no-print * {
      display: none !important;
    }
    a:hover {
      text-decoration: none !important;
    }
  }
</style>

{--section-numbers=}.+skip
<style>
  /* Section numbers. */
  body,h1 { counter-reset: h2-counter; }
  h2      { counter-reset: h3-counter; }
  #article > h2:before {
    content: counter(h2-counter) ". ";
    counter-increment: h2-counter;
  }
  #article > h3:before {
    content: counter(h2-counter) "." counter(h3-counter) ". ";
    counter-increment: h3-counter;
  }
</style>

// Common to --sidebar-toc and --dropdown-toc.
{--no-toc!}.+skip
<style>
  #toc {
    padding-left: 1rem;
  }
  #toc h2 {
    font-size: 125%;
    margin-top:1.0rem;
    margin-left: 0;
  }
  #toc .h1 {
    font-size: 110%;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 0.4rem;
  }
  #toc .h2 {
    margin-top: 0.4rem;
  }
  #toc .h3 {
    margin-left: 1.5rem;
    font-size: 90%;
  }
  #toc div[class^="h"]:nth-child(even) {
    background-color: #f8f8f8;
  }
  #auto-toc {
    width: 100%;
  }
</style>

{--header-links=}.+skip
<style>
  .header-link {
    text-decoration: none;
    color: lightgray;
    visibility: hidden;
  }
  .header-link:hover {
    text-decoration: none;
    color: gray;
  }
  .header-link::before {
    content: " \x5C00b6";
  }
  h2:hover > .header-link, h3:hover > .header-link {
    visibility: visible;
  }
  @media print {
    .header-link {
      display: none !important;
    }
  }
</style>


/*
  Layout styles
*/
<style>
  #article {
    padding-left: 2rem;
    padding-right: 1rem;
    max-width: {--max-text-width};
  }
</style>

{--sidebar-toc=}.+skip
<style>
  #article {
    margin-left: 20rem;
  }
  #toc {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 20rem;
    border-right: 1px solid #cccccc;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.35);
  }
  @media screen and {--small-screen} {
    {--!}  Sidebar TOC hidden as it does not work on small screens.
    #article {
      margin-left: 0;
    }
    #toc {
      display: none !important;
    }
  }
</style>

{--dropdown-toc=}.+skip
<style>
  .show-toc #toc {
    display: block !important;
  }
  #toc-button {
    position: fixed;
    top: 22px;
    left: 15px;
    z-index: 1;
    cursor: pointer;
    color: silver;
    font-size: 3.2rem;
  }
  #toc {
    display: none;
    position: fixed;
    top: 55px;
    left: 17px;
    right: 10%;
    z-index: 1;
    max-width: 30rem;
    max-height: 80%;
    overflow-y: auto;
    background-color: {--primary-background};
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
  }
  #article {
    margin-left: 2rem;
  }
</style>

// Format (non-layout) related styles.
<style>
  @media screen and {--small-screen} {
    body {
      font-size: 20px;
    }
  }
  @media print {
    #article {
      margin-left: 0;
      max-width: 100%;
    }
  }
</style>

/*
  Theme related styles
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
<style>
  h1, h2 {
    text-transform: uppercase;
  }
</style>

{--head}

</head>
<body>

// Include dropdown TOC button.
{--dropdown-toc=}.+skip
<div id="toc-button" class="no-print">&#8801;</div>

// Include TOC unless a custom TOC is specified.
.+skip
{--no-toc=}.-skip
{--custom-toc!}.+skip
<div id="toc" class="no-print">
  <div id="auto-toc"></div>
</div>

<div id="article">
`,
  "flex-footer.rmu": String.raw `/*
  Used by rimuc.js --styled option.
*/

// Close article div.
</div>

{--highlightjs=}.+skip
{--highlightjs-scripts}

{--mathjax!}{--mathjax-scripts}

.+skip
{--no-toc=}.-skip
{--header-links!}.-skip
<script>
window.onload = function() {
{--no-toc=}  document.getElementsByTagName('body')[0].appendChild(document.getElementById('toc')); // Ensure custom TOC is child of body.
  var headings = [].slice.call(document.body.querySelectorAll('#article > h1, #article > h2, #article > h3'));
  headings.forEach(function(heading) {
{--header-links!}    setHeaderLink(heading);
{--no-toc=}    appendTocEntry(heading);
  });
}
</script>

{--header-links=}.+skip
<script>
function setHeaderLink(heading) {
  var id = heading.getAttribute('id');
  if (id) {
    var link = document.createElement('a');
    link.classList.add('header-link');
    link.setAttribute('href', '#' + id);
    heading.appendChild(link);
  }
}
</script>

{--no-toc!}.+skip
<script>
function appendTocEntry(heading) {
  var id = heading.getAttribute('id');
  if (heading.classList.contains('no-auto-toc')) {
    return;
  }
  var container = document.getElementById('auto-toc');
  if (container === null) {
    return;
  }
  var tocLink = document.createElement('a');
  tocLink.setAttribute('href', '#' + id);
  tocLink.textContent = heading.textContent;
  var tocEntry = document.createElement('div');
  tocEntry.setAttribute('class', heading.tagName.toLowerCase());
  tocEntry.appendChild(tocLink);
  container.appendChild(tocEntry);
}
// matches() polyfill for old browsers.
if (!Element.prototype.matches) {
  var p = Element.prototype;
  if (p.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
    p.matches = p.webkitMatchesSelector;
  if (p.msMatchesSelector) // IE9/10/11 & Edge
    p.matches = p.msMatchesSelector;
  if (p.mozMatchesSelector) // FF<34
    p.matches = p.mozMatchesSelector;
}
document.onclick = function(event) {
  if (event.target.matches('#toc-button *, #toc a')) {
    // Toggle TOC if TOC button or TOC link is clicked.
    document.getElementsByTagName('body')[0].classList.toggle('show-toc');
  }
}
</script>

</body>
</html>
`,
  "flex-header.rmu": String.raw `/*
  Used by rimuc \x60--layout flex\x60 option.
*/

/*
  Default values for styling themes and content options.
*/

{--section-numbers?} = ''
{--lang?} = ''
{--title?} = '&nbsp;'
{--theme?} = ''
{--no-toc?} = ''
{--custom-toc?} = ''
{--header-links?} = ''
{--small-screen?} = '(max-width: 800px)'
{--meta?} = '<meta charset="UTF-8">
  {--!} Make old IE versions use the latest rendering engine.
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">'
// Additional <head> child elements.
{--head?} = ''

{--highlightjs?} = ''
{--highlightjs-css} = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css">'
{--highlightjs-scripts} = '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
<script>
hljs.configure({languages: []});
hljs.initHighlightingOnLoad();
</script>'

{--mathjax?} = ''
{--mathjax-scripts} = '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>'

// List item CSS counters.
{--dl-counter} = '<span class="dl-counter"></span>'
{--ol-counter} = '<span class="ol-counter"></span>'
{--ul-counter} = '<span class="ul-counter"></span>'

/*
  Legend theme.
*/
{--theme!.*\x5Cblegend\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#34495e'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#428bca'
{--border-radius?} = '0'
{--max-text-width?} = '50rem'
..

/*
  Vintage theme.
*/
{--theme!.*\x5Cbvintage\x5Cb.*}.+skip
// Default to this theme if none of the built-in themes is specified.
{--theme!.*\x5Cb(legend|vintage|graystone)\x5Cb.*}.-skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#527bbd'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#527bbd'
{--border-radius?} = '4px'
{--max-text-width?} = '50rem'
..

/*
  Graystone theme.
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#888'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#888'
{--border-radius?} = '0'
{--max-text-width?} = '50rem'
..

/*
  HTML header
*/
<!DOCTYPE HTML>
{--lang=}<html>
{--lang!}<html lang="{--lang}">
<head>
{--meta}
<title>{--title}</title>
{--highlightjs!}{--highlightjs-css}

/*
  Layout independent styles
*/
<style>
  :root {
    font-size: 16px;
    line-height: 20px;
    color: {--text-color};
    background-color: {--primary-background};
    font-family: {--sans-font};
  }
  * {
    margin: 0;
    padding: 0;
    white-space: inherit;
    box-sizing: border-box;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 10px 0;
    color: {--primary-color};
  }
  h1 { font-size: 2.2rem; line-height: 40px;}
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.2rem; }
  h4 { font-size: 1.1rem; }
  h5 { font-size: 1.0rem; }
  h6 { font-size: 0.9rem; }
  h2, h3, h4, h5, h6 {
    line-height: normal;
    margin-top: 1.0rem;
    margin-bottom: 0.2rem;
  }
  h2 {
    margin-top: 1.5rem;
    border-bottom: 1px solid {--border-color};
  }
  img {
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  td, th {
    text-align: left;
    vertical-align: top;
  }
  {--!} tbody necessary because: http://stackoverflow.com/questions/7490364/why-do-browsers-still-inject-tbody-in-html5
  table.bordered > tbody > tr > th,
  table.bordered > tbody > tr > td {
    border: 1px solid {--border-color};
  }
  a, a:hover {
    color: {--primary-color};
  }
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  p, pre, li, dt, dd, blockquote p {
    line-height: 1.45;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  ul, ol {
    padding: 0;
    margin: 0 0 10px 25px;
  }
  dt {
    margin-bottom: 0;
    font-style: italic;
  }
  dd {
    margin-left: 1.0rem;
    margin-top: 0;
  }
  blockquote {
    padding: 0 0 0 15px;
    border: none;
    border-left: 5px solid #eeeeee;
    font-family: {--serif-font};
    width: 80%;
    margin: 1.5em 0;
    color: #383838;
  }
  .cite {
    color: #777;
    padding: 5px 0;
  }
  .cite::before {
    content: "\x5C2014 \x5C2009";
  }
  code {
    font-family: {--mono-font};
    {--!} Monspace fonts are relatively oversized.
    font-size: {--mono-size};
    background-color: {--code-background};
  }
{--highlightjs!}  .hljs { background-color: {--code-background}; }
  pre {
    font-family: {--mono-font};
    line-height: normal;
    white-space: pre-wrap;
    background-color: {--code-background};
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    padding: 6px;
  }
  .light-background {
    background-color: {--code-background};
    border: none;
    white-space: pre-wrap;
  }
  *:not(pre) > code {
    white-space: nowrap;
  }
  .dl-horizontal > dd {
    margin-top: 1.0rem;
  }
  pre > code {
    background-color: inherit;
    {--!} highlight.js tweak.
    padding: 0;
  }
  pre span {
    {--!} highlight.js tweak.
    opacity: 1 !important;
  }
  {--!} Rimu classes.
  {--!} Apply verse class to Normal Paragraphs and Division blocks.
  .verse {
    margin: 1.5em 20px;
  }
  div.verse p, p.verse {
    font-family: {--serif-font};
    white-space: pre;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }
  {--!} Apply sidebar class to Normal Paragraphs and Division blocks.
  .sidebar {
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    background: {--sidebar-background};
    padding: 10px;
    margin: 1.5em 0;
  }
  div.sidebar *:first-child {
    margin-top: 0.2rem;
  }
  {--!} Force page break before the element.
  .page-break {
    page-break-before: always;
  }
  {--!} Avoid page breaks inside the element.
  .no-page-break {
    page-break-inside: avoid;
  }
  {--!} Text block alignment classes.
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
  {--!} Preserve line breaks.
  .preserve-breaks {
    white-space: pre;
  }
  {--!} DEPRECATED: Use \x60preserve-breaks\x60 instead.
  .line-breaks {
    white-space: pre;
  }
  {--!} Horizontal labeled list.
  .dl-horizontal:before, .dl-horizontal:after {
    display: table;
    content: "";
    line-height: 0;
  }
  .dl-horizontal:after {
    clear: both;
  }
  .dl-horizontal > dt {
    float: left;
    clear: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    margin-top: 1.0rem;
    width: 25%;
  }
  .dl-horizontal > dd {
    margin-left: 25%;
    padding-left: 1.0rem;
  }
  {--!} List item counters.
  dl {
    counter-reset: dl-counter;
  }
  dl > dt {
    counter-increment: dl-counter;
  }
  ol {
    counter-reset: ol-counter;
  }
  ol > li {
    counter-increment: ol-counter;
  }
  ul {
    counter-reset: ul-counter;
  }
  ul > li {
    counter-increment: ul-counter;
  }
  {--!} Prefix list counter to counter class element content.
  .dl-counter:before {
    content: counter(dl-counter) " ";
  }
  .ol-counter:before {
    content: counter(ol-counter) " ";
  }
  .ul-counter:before {
    content: counter(ul-counter) " ";
  }
  {--!} Number labeled list items.
  .dl-numbered > dt:before {
    content: counter(dl-counter) ". ";
  }
  {--!} Printing.
  @media print {
    .no-print, .no-print * {
      display: none !important;
    }
    a:hover {
      text-decoration: none !important;
    }
  }
</style>

{--section-numbers=}.+skip
<style>
  /* Section numbers. */
  body,h1 { counter-reset: h2-counter; }
  h2      { counter-reset: h3-counter; }
  #article > h2:before {
    content: counter(h2-counter) ". ";
    counter-increment: h2-counter;
  }
  #article > h3:before {
    content: counter(h2-counter) "." counter(h3-counter) ". ";
    counter-increment: h3-counter;
  }
</style>

{--no-toc!}.+skip
<style>
  #toc .h1 {
    font-size: 110%;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 0.4rem;
  }
  #toc .h2 {
    margin-top: 0.4rem;
  }
  #toc .h3 {
    margin-left: 1.5rem;
    font-size: 90%;
  }
  #toc div[class^="h"]:nth-child(even) {
    background-color: #f8f8f8;
  }
  #auto-toc {
    width: 100%;
  }
</style>

{--header-links=}.+skip
<style>
  .header-link {
    text-decoration: none;
    color: lightgray;
    visibility: hidden;
  }
  .header-link:hover {
    text-decoration: none;
    color: gray;
  }
  .header-link::before {
    content: " \x5C00b6";
  }
  h2:hover > .header-link, h3:hover > .header-link {
    visibility: visible;
  }
  @media print {
    .header-link {
      display: none !important;
    }
  }
</style>

/*
  Layout styles
*/
<style>
  #article > * {
    max-width: {--max-text-width};
  }
  #article, #toc {
    padding-left: 1rem;
    padding-right: 1rem;
  }
{--!} Small screen.
  @media screen and {--small-screen} {
    #article, #toc {
      padding-left: 10px;
      padding-right: 10px;
    }
  }
</style>

// TOC specific styles.
// Flexbox layout inspired by http://codepen.io/VinSpee/pen/zxBJVO
{--no-toc!}.+skip
<style>
  html, body {
    height: 100%;
    min-height: 100%;
    overflow: hidden;
  }
  body {
    display: flex;
  }
  #nav {
    flex: auto;
    order: 1;
    flex-grow: 0;
    background: {--primary-color};
  }
  #toc {
    display: none;
    flex: auto;
    order: 2;
    overflow-y: scroll;
    height: 100%;
    width: 100%;
  }
  #toc h2 {
    font-size: 125%;
    margin-top:1.0rem;
  }
  #toc-button {
    cursor: pointer;
    color: white;
    font-size: 48px;
    font-family: Arial;
    display: inline-block;
  }
  #article {
    flex: auto;
    order: 3;
    overflow-y: scroll;
    width: 100%;
  }
  #close-icon {
    display: none;
  }
  .show-toc #toc {
    display: block !important;
  }
  .show-toc #article {
    display: none !important;
  }
  .show-toc #menu-icon {
    display: none !important;
  }
  .show-toc #close-icon {
    display: inline !important;
  }
  @media print {
    html, body {
      height: auto;
      min-height: 0;
    }
    #article, #toc {
      overflow-y: visible;
    }
  }
</style>

{--no-toc!}.+skip
<style>
{--!} Side-bar for large screen and small screen landscape mode.
  body {
    flex-direction: row;
  }
  #nav {
    height: 100%;
    width: 40px;
  }
  #toc-button {
    padding-left: 4px;
    padding-top: 15px;
  }
{--!} Top-bar for small screen portrait mode.
  @media screen and {--small-screen} and (orientation: portrait) {
    body {
      flex-direction: column;
    }
    #nav {
      height: 40px;
      width: 100%;
    }
    #toc-button {
      padding-left: 10px;
      padding-top: 10px;
    }
  }
</style>

// Format (non-layout) related styles.
<style>
  @media screen and {--small-screen} {
    body {
      font-size: 20px;
    }
  }
</style>

/*
  Theme related styles
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
<style>
  h1, h2 {
    text-transform: uppercase;
  }
</style>

{--head}

</head>
<body>

// Include TOC menu bar if a TOC is specified.
{--no-toc!}.+skip
<div id="nav" class="no-print">
  <span id="toc-button">
    <span id="menu-icon">&#8801;</span>
    <span id="close-icon">&times;</span>
  </span>
</div>

// Include TOC unless a custom TOC is specified.
.+skip
{--no-toc=}.-skip
{--custom-toc!}.+skip
<div id="toc">
  <div id="auto-toc"></div>
</div>

<div id="article">
`,
  "manpage.txt": String.raw `NAME
  rimuc - convert Rimu source to HTML

SYNOPSIS
  rimuc [OPTIONS...] [FILES...]

DESCRIPTION
  Reads Rimu source markup from stdin, converts them to HTML
  then writes the HTML to stdout. If FILES are specified
  the Rimu source is read from FILES. The contents of files
  with an .html extension are passed directly to the output.
  An input file named '-' is read from stdin.

  If a file named .rimurc exists in the user's home directory
  then its contents is processed (with --safe-mode 0).
  This behavior can be disabled with the --no-rimurc option.

  Inputs are processed in the following order: .rimurc file then
  --prepend-file option files then --prepend option source and
  finally FILES...

OPTIONS
  -h, --help
    Display help message.

  --html-replacement TEXT
    Embedded HTML is replaced by TEXT when --safe-mode is set to 2.
    Defaults to '<mark>replaced HTML</mark>'.

  --layout LAYOUT
    Generate a styled HTML document. rimuc includes the
    following built-in document layouts:

    'classic': Desktop-centric layout.
    'flex':    Flexbox mobile layout (experimental).
    'plain':   Unstyled HTML layout.
    'sequel':  Responsive cross-device layout.

    If only one source file is specified and the --output
    option is not specified then the output is written to a
    same-named file with an .html extension.
    This option enables --header-ids.

  -s, --styled
    Style output using default layout.
    Shortcut for '--layout sequel --header-ids --no-toc'

  -o, --output OUTFILE
    Write output to file OUTFILE instead of stdout.
    If OUTFILE is a hyphen '-' write to stdout.

  --pass
    Pass the stdin input verbatim to the output.

  -p, --prepend SOURCE
    Process the Rimu SOURCE text (immediately after --prepend-file
    option files). Rendered with --safe-mode 0. This option can be
    specified multiple times.

  --prepend-file PREPEND_FILE
    Process the PREPEND_FILE contents (immediately after .rimurc file).
    Rendered with --safe-mode 0. This option can be specified
    multiple times.

  --no-rimurc
    Do not process .rimurc from the user's home directory.

  --safe-mode NUMBER
    Non-zero safe modes ignore: Definition elements; API option elements;
    HTML attributes in Block Attributes elements.
    Also specifies how to process HTML elements:

    --safe-mode 0 renders HTML (default).
    --safe-mode 1 ignores HTML.
    --safe-mode 2 replaces HTML with --html-replacement option value.
    --safe-mode 3 renders HTML as text.

    Add 4 to --safe-mode to ignore Block Attribute elements.
    Add 8 to --safe-mode to allow Macro Definitions.

  --theme THEME, --lang LANG, --title TITLE, --highlightjs, --mathjax,
  --no-toc, --custom-toc, --section-numbers, --header-ids, --header-links
    Shortcuts for the following prepended macro definitions:

    --prepend "{--custom-toc}='true'"
    --prepend "{--header-ids}='true'"
    --prepend "{--header-links}='true'"
    --prepend "{--highlightjs}='true'"
    --prepend "{--lang}='LANG'"
    --prepend "{--mathjax}='true'"
    --prepend "{--no-toc}='true'"
    --prepend "{--section-numbers}='true'"
    --prepend "{--theme}='THEME'"
    --prepend "{--title}='TITLE'"

  --version
    Print version number.

LAYOUT OPTIONS
  The following options are available when the --layout option
  specifies a built-in layout:

  Option             Description
  _______________________________________________________________
  --custom-toc       Set to a non-blank value if a custom table
                     of contents is used.
  --header-links     Set to a non-blank value to generate h2 and
                     h3 header header links.
  --highlightjs      Set to non-blank value to enable syntax
                     highlighting with Highlight.js.
  --lang             HTML document language attribute value.
  --mathjax          Set to a non-blank value to enable MathJax.
  --no-toc           Set to a non-blank value to suppress table of
                     contents generation.
  --section-numbers  Apply h2 and h3 section numbering.
  --theme            Styling theme. Theme names:
                     'legend', 'graystone', 'vintage'.
  --title            HTML document title.
  _______________________________________________________________
  These options are translated by rimuc to corresponding layout
  macro definitions using the --prepend option.

LAYOUT CLASSES
  The following CSS classes are available for use in Rimu Block
  Attributes elements when the --layout option specifies a
  built-in layout:

  CSS class        Description
  ______________________________________________________________
  align-center     Text alignment center.
  align-left       Text alignment left.
  align-right      Text alignment right.
  bordered         Adds table borders.
  cite             Quote and verse attribution.
  dl-horizontal    Format labeled lists horizontally.
  dl-numbered      Number labeled list items.
  dl-counter       Prepend dl item counter to element content.
  ol-counter       Prepend ol item counter to element content.
  ul-counter       Prepend ul item counter to element content.
  no-auto-toc      Exclude heading from table of contents.
  no-page-break    Avoid page break inside the element.
  no-print         Do not print.
  page-break       Force page break before the element.
  preserve-breaks  Honor line breaks in source text.
  sidebar          Sidebar format (paragraphs, division blocks).
  verse            Verse format (paragraphs, division blocks).
  ______________________________________________________________

PREDEFINED MACROS
  Macro name         Description
  _______________________________________________________________
  --                 Blank macro (empty string).
                     The Blank macro cannot be redefined.
  --header-ids       Set to a non-blank value to generate h1, h2
                     and h3 header id attributes.
  _______________________________________________________________`,
  "plain-footer.rmu": String.raw `</body>
</html>
`,
  "plain-header.rmu": String.raw `/*
  Used by rimuc \x60--layout plain\x60 option.
*/

{--lang?} = ''
{--title?} = 'Title'
{--meta?} = '<meta charset="UTF-8">'
// Additional <head> element children.
{--head?} = ''

<!DOCTYPE html>
{--lang=}<html>
{--lang!}<html lang="{--lang}">
<head>
{--meta}
<title>{--title}</title>

{--head}
</head>
<body>
`,
  "sequel-footer.rmu": String.raw `/*
  Used by rimuc \x60--layout sequel\x60 option.
*/

// Close main and article divs.
</div>
</div>

{--highlightjs=}.+skip
{--highlightjs-scripts}

{--mathjax!}{--mathjax-scripts}

{--no-toc!}.+skip
<script>
window.onload = function() {
  document.getElementById('sidebar').appendChild(document.getElementById('toc')); // Ensure custom TOC is child of sidebar.
  var headings = [].slice.call(document.body.querySelectorAll('#article > h1, #article > h2, #article > h3'));
  headings.forEach(function(heading) {
{--header-links!}    setHeaderLink(heading);
    appendTocEntry(heading);
  });
  if (isSmallScreen()) {
    toggleToc();  // Hide TOC.
  }
}
</script>

{--header-links=}.+skip
<script>
function setHeaderLink(heading) {
  var id = heading.getAttribute('id');
  if (id) {
    var link = document.createElement('a');
    link.classList.add('header-link');
    link.setAttribute('href', '#' + id);
    heading.appendChild(link);
  }
}
</script>

{--no-toc!}.+skip
<script>
function appendTocEntry(heading) {
  var id = heading.getAttribute('id');
  if (heading.classList.contains('no-auto-toc')) {
    return;
  }
  var container = document.getElementById('auto-toc');
  if (container === null) {
    return;
  }
  var tocLink = document.createElement('a');
  tocLink.setAttribute('href', '#' + id);
  tocLink.textContent = heading.textContent;
  var tocEntry = document.createElement('div');
  tocEntry.setAttribute('class', heading.tagName.toLowerCase());
  tocEntry.appendChild(tocLink);
  container.appendChild(tocEntry);
}
</script>

{--no-toc!}.+skip
<script>
  document.onclick = function (event) {
    if (event.target.matches('#toc-button') || event.target.matches('#toc a') && isSmallScreen()) {
{--!} Toggle TOC if TOC button or small-screen TOC link is clicked.
      toggleToc();
    }
  }
  function toggleToc() {
    document.body.classList.toggle('hide-toc');
  }
  function isSmallScreen() {
    return window.matchMedia('{--small-screen}').matches;
  }
  // matches() polyfill for old browsers.
  if (!Element.prototype.matches) {
    var p = Element.prototype;
    if (p.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
      p.matches = p.webkitMatchesSelector;
    if (p.msMatchesSelector) // IE9/10/11 & Edge
      p.matches = p.msMatchesSelector;
    if (p.mozMatchesSelector) // FF<34
      p.matches = p.mozMatchesSelector;
  }
</script>

</body>
</html>
`,
  "sequel-header.rmu": String.raw `/*
  Used by rimuc \x60--layout sequel\x60 option.
*/

/*
  Default values for styling themes and content options.
*/

{--section-numbers?} = ''
{--lang?} = ''
{--title?} = '&nbsp;'
{--theme?} = ''
{--no-toc?} = ''
{--custom-toc?} = ''
{--header-links?} = ''
{--!} The min-width: 1px clause stops page load transitions in IE11 and Edge (https://stackoverflow.com/a/25850649).
{--small-screen?} = '(min-width: 1px) and (max-width: 800px)'
{--meta?} = '<meta charset="UTF-8">
  {--!} Make old IE versions use the latest rendering engine.
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">'
// Additional <head> element children.
{--head?} = ''

{--highlightjs?} = ''
{--highlightjs-css} = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css">'
{--highlightjs-scripts} = '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
<script>
hljs.configure({languages: []});
hljs.initHighlightingOnLoad();
</script>'

{--mathjax?} = ''
{--mathjax-scripts} = '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>'

// List item CSS counters.
{--dl-counter} = '<span class="dl-counter"></span>'
{--ol-counter} = '<span class="ol-counter"></span>'
{--ul-counter} = '<span class="ul-counter"></span>'

// Sequel layout specific.
{--toc-width?} = '300px'
{--nav-width?} = '40px'
{--content-margin?} = '340px'
{--transition-duration?} = '0.2s'

/*
  Legend theme.
*/
{--theme!.*\x5Cblegend\x5Cb.*}.+skip
// Default to this theme if none of the built-in themes is specified.
{--theme!.*\x5Cb(legend|vintage|graystone)\x5Cb.*}.-skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#34495e'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#428bca'
{--border-radius?} = '0'
{--max-text-width?} = '55rem'
..

/*
  Vintage theme.
*/
{--theme!.*\x5Cbvintage\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#527bbd'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#527bbd'
{--border-radius?} = '4px'
{--max-text-width?} = '55rem'
..

/*
  Graystone theme.
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
..
{--sans-font?} = 'Helvetica, Arial, sans-serif'
{--serif-font?} = 'Georgia, Times, serif'
{--mono-font?} = 'Consolas, "Andale Mono", Monaco, monospace'
{--mono-size?} = '90%'
{--text-color?} = '#333333'
{--border-color?} = '#dddddd'
{--primary-color?} = '#888'
{--primary-background?} = 'white'
{--code-background?} = '#f8f8f8'
{--sidebar-background?} = '#ffffee'
{--link-color?} = '#888'
{--border-radius?} = '0'
{--max-text-width?} = '55rem'
..

/*
  HTML header
*/
<!DOCTYPE HTML>
{--lang=}<html>
{--lang!}<html lang="{--lang}">
<head>
{--meta}
<title>{--title}</title>
{--highlightjs!}{--highlightjs-css}

/*
  Layout independent styles
*/
<style>
  :root {
    font-size: 16px;
    line-height: 20px;
    color: {--text-color};
    background-color: {--primary-background};
    font-family: {--sans-font};
  }
  * {
    margin: 0;
    padding: 0;
    white-space: inherit;
    box-sizing: border-box;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 10px 0;
    color: {--primary-color};
  }
  h1 { font-size: 2.2rem; line-height: 40px;}
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.2rem; }
  h4 { font-size: 1.1rem; }
  h5 { font-size: 1.0rem; }
  h6 { font-size: 0.9rem; }
  h2, h3, h4, h5, h6 {
    line-height: normal;
    margin-top: 1.0rem;
    margin-bottom: 0.2rem;
  }
  h2 {
    margin-top: 1.5rem;
    border-bottom: 1px solid {--border-color};
  }
  img {
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
  }
  td, th {
    text-align: left;
    vertical-align: top;
  }
  {--!} tbody necessary because: http://stackoverflow.com/questions/7490364/why-do-browsers-still-inject-tbody-in-html5
  table.bordered > tbody > tr > th,
  table.bordered > tbody > tr > td {
    border: 1px solid {--border-color};
  }
  a, a:hover {
    color: {--link-color};
  }
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  p, pre, li, dt, dd, blockquote p {
    line-height: 1.45;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  ul, ol {
    padding: 0;
    margin: 0 0 10px 25px;
  }
  dt {
    margin-bottom: 0;
    font-style: italic;
  }
  dd {
    margin-left: 1.0rem;
    margin-top: 0;
  }
  blockquote {
    padding: 0 0 0 15px;
    border: none;
    border-left: 5px solid #eeeeee;
    font-family: {--serif-font};
    width: 80%;
    margin: 1.5em 0;
    color: #383838;
  }
  .cite {
    color: #777;
    padding: 5px 0;
  }
  .cite::before {
    content: "\x5C2014 \x5C2009";
  }
  code {
    font-family: {--mono-font};
    {--!} Monspace fonts are relatively oversized.
    font-size: {--mono-size};
    background-color: {--code-background};
  }
{--highlightjs!}  .hljs { background-color: {--code-background}; }
  pre {
    font-family: {--mono-font};
    line-height: normal;
    white-space: pre-wrap;
    background-color: {--code-background};
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    padding: 6px;
  }
  .light-background {
    background-color: {--code-background};
    border: none;
    white-space: pre-wrap;
  }
{--!} So hyphenated words like \x60--word-wrap\x60 are not broken (there is no CSS property that will break on white space only).
  *:not(pre) > code {
    white-space: nowrap;
  }
  .dl-horizontal > dd {
    margin-top: 1.0rem;
  }
  pre > code {
    background-color: inherit;
    {--!} highlight.js tweak.
    padding: 0;
  }
  pre span {
    {--!} highlight.js tweak.
    opacity: 1 !important;
  }
  {--!} Rimu classes.
  {--!} Apply verse class to Normal Paragraphs and Division blocks.
  .verse {
    margin: 1.5em 20px;
  }
  div.verse p, p.verse {
    font-family: {--serif-font};
    white-space: pre-wrap;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }
  {--!} Apply sidebar class to Normal Paragraphs and Division blocks.
  .sidebar {
    border: 1px solid {--border-color};
    border-radius: {--border-radius};
    background: {--sidebar-background};
    padding: 10px;
    margin: 1.5em 0;
  }
  div.sidebar *:first-child {
    margin-top: 0.2rem;
  }
  {--!} Force page break before the element.
  .page-break {
    page-break-before: always;
  }
  {--!} Avoid page breaks inside the element.
  .no-page-break {
    page-break-inside: avoid;
  }
  {--!} Text block alignment classes.
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
  {--!} Preserve line breaks.
  .preserve-breaks {
    white-space: pre;
  }
  {--!} DEPRECATED: Use \x60preserve-breaks\x60 instead.
  .line-breaks {
    white-space: pre-wrap;
  }
  {--!} Horizontal labeled list.
  .dl-horizontal:before, .dl-horizontal:after {
    display: table;
    content: "";
    line-height: 0;
  }
  .dl-horizontal:after {
    clear: both;
  }
  .dl-horizontal > dt {
    float: left;
    clear: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    margin-top: 1.0rem;
    width: 25%;
  }
  .dl-horizontal > dd {
    margin-left: 25%;
    padding-left: 1.0rem;
  }
  {--!} List item counters.
  dl {
    counter-reset: dl-counter;
  }
  dl > dt {
    counter-increment: dl-counter;
  }
  ol {
    counter-reset: ol-counter;
  }
  ol > li {
    counter-increment: ol-counter;
  }
  ul {
    counter-reset: ul-counter;
  }
  ul > li {
    counter-increment: ul-counter;
  }
  {--!} Prefix list counter to counter class element content.
  .dl-counter:before {
    content: counter(dl-counter) " ";
  }
  .ol-counter:before {
    content: counter(ol-counter) " ";
  }
  .ul-counter:before {
    content: counter(ul-counter) " ";
  }
  {--!} Number labeled list items.
  .dl-numbered > dt:before {
    content: counter(dl-counter) ". ";
  }
  {--!} Printing.
  @media print {
    .no-print, .no-print * {
      display: none !important;
    }
    a:hover {
      text-decoration: none !important;
    }
  }
</style>

{--section-numbers=}.+skip
<style>
  /* Section numbers. */
  body,h1 { counter-reset: h2-counter; }
  h2      { counter-reset: h3-counter; }
  #article > h2:before {
    content: counter(h2-counter) ". ";
    counter-increment: h2-counter;
  }
  #article > h3:before {
    content: counter(h2-counter) "." counter(h3-counter) ". ";
    counter-increment: h3-counter;
  }
</style>

// TOC styling.
{--no-toc!}.+skip
<style>
  #toc h2 {
    font-size: 125%;
    padding-left: 1rem;
    margin-top:1.0rem;
    margin-left: 0;
  }
  #toc .h1 {
    font-size: 110%;
    font-weight: bold;
    padding-left: 1rem;
    margin-top: 0.5rem;
    margin-bottom: 0.4rem;
  }
  #toc .h2 {
    padding-left: 1rem;
    margin-top: 0.4rem;
  }
  #toc .h3 {
    padding-left: 2.5rem;
    font-size: 90%;
  }
  #toc div[class^="h"]:nth-child(even) {
    background-color: #f8f8f8;
  }
  #auto-toc {
    width: 100%;
  }
  #toc a, #toc a:hover {
    color: {--primary-color};
  }
</style>

{--header-links=}.+skip
<style>
  .header-link {
    text-decoration: none;
    color: lightgray;
    visibility: hidden;
  }
  .header-link:hover {
    text-decoration: none;
    color: gray;
  }
  .header-link::before {
    content: " \x5C00b6";
  }
  h2:hover > .header-link, h3:hover > .header-link {
    visibility: visible;
  }
  @media print {
    .header-link {
      display: none !important;
    }
  }
</style>


/*
  Layout styles
*/
<style>
  #main {
    z-index: 1;
    min-height: 100%;
    max-width: {--max-text-width};
    margin-left: 0;
    padding-left: 40px;
    padding-right: 40px;
  }
  #article {
    padding-top: 1px;
  }
</style>

{--no-toc!}.+skip
<style>
  #main {
    margin-left: {--content-margin};
  }
  #nav {
    z-index: 3;
    position: fixed;
    left: 0;
    height: 100%;
    width: {--nav-width};
    background-color: {--primary-color};
    color: white;
  }
  #sidebar {
    z-index: 2;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    margin-left: {--nav-width};
    width: {--toc-width};
    overflow: auto;
    border-right: 1px solid #ccc;
    background: #eee;
  }
  body.hide-toc #sidebar {
    width: 0;
  }
  body.hide-toc #main {
    margin-left: {--nav-width};
  }
  #toc-button {
    cursor: pointer;
    color: white;
    font-size: 48px;
    line-height: 40px;
    font-family: Arial, sans-serif;
    display: inline-block;
    padding-left: 5px;
  }
{--!} Apply TOC slide in/out transition when not in small screen mode.
  @media not screen and {--small-screen} {
    #sidebar {
      opacity: 1;
      transition: opacity {--transition-duration} ease;
    }
    body.hide-toc #sidebar {
      width: 0;
      opacity: 0;
    }
    #main {
      transition: margin-left {--transition-duration} ease;
    }
    body.hide-toc #main {
      transition: margin-left {--transition-duration} ease;
    }
  }
  @media screen and {--small-screen} {
    body:not(.hide-toc) {
{--!} Hide body Y scroll bar when #main content is hidden.
      overflow: hidden;
    }
    body:not(.hide-toc) #sidebar {
      width: 100%;
    }
    #main {
      margin-left: {--nav-width};
    }
    body:not(.hide-toc) #main {
      visibility: hidden;
    }
    #toc {
      margin-right: 40px;
    }
  }
</style>

<style>
  @media screen and {--small-screen} {
    body {
      font-size: 20px;
    }
    #main {
      padding-left: 10px;
      padding-right: 10px;
    }
    * {
      overflow-wrap: break-word;
    }
  }
</style>

<style>
  @media print {
    #main {
      margin-left: 0;
    }
  }
</style>

/*
  Theme related styles
*/
{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
<style>
  h1, h2 {
    text-transform: uppercase;
  }
</style>

{--head}

</head>
<body>

{--no-toc!}.+skip
<div id="nav" class="no-print">
    <span id="toc-button">&#8801;</span>
</div>

{--no-toc!}.+skip
<div id="sidebar" class="no-print">

// Include TOC unless no TOC or custom TOC is specified.
{--no-toc!}.+skip
{--custom-toc!}.+skip
<div id="toc" class="no-print">
  <div id="auto-toc"></div>
</div>

{--no-toc!}.+skip
</div>

<div id="main">
<div id="article">
`,
  "v8-footer.rmu": String.raw `/*
  Used by rimuc \x60--layout v8\x60 option.
  DEPRECATED: This layout is no longer maintained, for Rimu version 8 compatibility.
*/

// Close contents div.
</div>

{--highlightjs!}<script src="http://yandex.st/highlightjs/7.3/highlight.min.js"></script><script>hljs.initHighlightingOnLoad();</script>

{--mathjax!}<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>

<script>
window.onload = function() {
  var headings = [].slice.call(document.body.querySelectorAll('#contents > h1, #contents > h2, #contents > h3'));
  headings.forEach(function(heading, index) {
    var title = heading.textContent;
    var id = heading.getAttribute('id');
    if (!id) {
      id = slugify(title);
      heading.setAttribute('id', id);
    }
    if (index === 0 && heading.tagName === 'H1') {
      id = ''; // Go to top of page.
    }
{--sidebar-toc!}    appendTocEntry(heading, id);
{--dropdown-toc!}    appendTocEntry(heading, id);
  });
}
function slugify(text) {
  var slug = text.replace(/\x5Cs+/g, '-') // Replace spaces with dashes.
      .replace(/[^\x5Cw-]/g, '')          // Retain alphanumeric, '-' and '_' characters.
      .toLowerCase()
  if (!slug) slug = 'x';
  if (document.getElementById(slug)) { // Another element already has that id.
    var i = 2, prefix = slug;
    while (document.getElementById(slug = prefix + '-' + i++)) {}
  }
  return slug;
}
</script>

.+skip
{--sidebar-toc!}.-skip
{--dropdown-toc!}.-skip
<script>
function appendTocEntry(heading, id) {
  if (heading.classList.contains('no-auto-toc')) {
    return;
  }
  var container = document.getElementById('auto-toc');
  if (container === null) {
    return;
  }
  var tocLink = document.createElement('a');
  tocLink.setAttribute('href', '#' + id);
  tocLink.textContent = heading.textContent;
  var tocEntry = document.createElement('div');
  tocEntry.setAttribute('class', heading.tagName.toLowerCase());
  tocEntry.appendChild(tocLink);
  container.appendChild(tocEntry);
}
</script>

{--dropdown-toc=}.+skip
<script>
function toggleToc() {
    document.getElementById("toc").classList.toggle('toc-visible');
}
window.onclick = function(event) {
  if (!Element.prototype.matches) {
    // matches() polyfill for old browsers.
    var p = Element.prototype;
    if (p.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
      p.matches = p.webkitMatchesSelector;
    if (p.msMatchesSelector) // IE9/10/11 & Edge
      p.matches = p.msMatchesSelector;
    if (p.mozMatchesSelector) // FF<34
      p.matches = p.mozMatchesSelector;
  }
  if (!event.target.matches('#toc-button, #toc, #toc :not(a)')) {
    // Hide TOC if clicked outside TOC or on TOC link.
    var toc = document.getElementById('toc');
    if (toc.classList.contains('toc-visible')) {
      toc.classList.remove('toc-visible');
    }
  }
}
</script>

</body>
</html>
`,
  "v8-header.rmu": String.raw `/*
  Used by rimuc \x60--layout v8\x60 option.
  DEPRECATED: This layout is no longer maintained, for Rimu version 8 compatibility.
  Styled using Bootstrap.
  Syntax highlighting with Highlight.js
  Bootstrap and Highlight.js sourced from CDNs.
*/

// Set macro default values.
{--highlightjs?} = ''
{--mathjax?} = ''
{--section-numbers?} = ''
{--lang?} = ''
{--title?} = '&nbsp;'
{--custom-toc?} = ''
{--theme?} = 'default'
{--sidebar-toc?} = ''
{--dropdown-toc?} = ''

// DEPRECATED --toc: If --toc is non-blank make --sidebar-toc non-blank.
{--toc?} = ''
{--sidebar-toc} = '{--toc}{--sidebar-toc}'

<!DOCTYPE HTML>
<html lang="{--lang}">
<head>
{--!} Force IE into Standards mode.
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta charset="UTF-8">
  <title>{--title}</title>
  <link rel="stylesheet" href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css">
  <link rel="stylesheet" href="http://yandex.st/highlightjs/7.3/styles/default.min.css">

<style>
  /* Bootstrap tweaks. */
  body {
    margin: 1em;
    max-width: 50em;
    font-family: Arial, Helvetica, sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #527bbd;
  }
  h1 { font-size: 2.2em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.2em; }
  h4 { font-size: 1.1em; }
  h5 { font-size: 1.0em; }
  h6 { font-size: 0.9em; }
  h2, h3, h4, h5, h6 {
    line-height: normal;
    margin-top: 1.0em;
    margin-bottom: 0.2em;
  }
  h2 {
    margin-top: 1.5em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  }
  a, a:hover {
    color: #527bbd;
  }
  li, dd {
    margin-bottom: 0.25em;
  }
  p, pre, li, dt, dd, blockquote p {
    font-size: inherit;
    line-height: 1.45;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }
  blockquote {
    border: none;
    border-left: 5px solid #eeeeee;
    font-family: Georgia, serif;
    font-style: italic;
    width: 80%;
    margin: 1.5em 0;
    color: #383838;
  }
  .cite {
    font-style: italic;
    color:#777;
    padding:5px 0;
  }
  .cite::before {
    content: "\x5C2014 \x5C2009";
  }
  pre {
    padding: 6px;
    line-height: normal;
  }
  .light-background {
    background-color: #f8f8f8;
    border: none;
  }
  code {
    color: inherit;
    font-size: inherit;
  }
  *:not(pre) > code {
    border: none;
    background-color: #f8f8f8;
  }
  .dl-horizontal > dt {
    text-align: left;
    margin-top: 1.0em;
  }
  .dl-horizontal > dd {
    margin-top: 1.0em;
  }
  /* highlight.js tweaks. */
  pre > code {
    background-color: inherit;
    padding: 0;
  }
  pre span {
    opacity: 1 !important;
  }
  /* Rimu styles. */
{--!} Apply verse class to Normal Paragraphs and Division blocks.
  .verse {
    margin: 1.5em 20px;
  }
  div.verse p, p.verse {
    font-family: Georgia, serif;
    white-space:pre;
    margin-top: 0.75em;
    margin-bottom: 0.75em;
  }
{--!} Apply sidebar class to Normal Paragraphs and Division blocks.
  .sidebar {
    border: 1px solid silver;
    border-radius:4px;
    background: #ffffee;
    padding: 10px;
    margin: 1.5em 20px;
  }
  div.sidebar *:first-child {
    margin-top: 0.2em;
  }
  /* List item counters and definition list numbering. */
{--!} List item counters.
  dl {
    counter-reset: dl-counter;
  }
  dl > dt {
    counter-increment: dl-counter;
  }
  ol {
    counter-reset: ol-counter;
  }
  ol > li {
    counter-increment: ol-counter;
  }
  ul {
    counter-reset: ul-counter;
  }
  ul > li {
    counter-increment: ul-counter;
  }
{--!} Prefix list counter to counter class element content.
  .dl-counter:before {
    content: counter(dl-counter) " ";
  }
  .ol-counter:before {
    content: counter(ol-counter) " ";
  }
  .ul-counter:before {
    content: counter(ul-counter) " ";
  }
{--!} Number labeled list items.
  .dl-numbered > dt:before {
    content: counter(dl-counter) ". ";
  }
{--!} Force page break before the element.
  .page-break {
    page-break-before: always;
  }
{--!} Avoid page breaks inside the element.
  .no-page-break {
    page-break-inside: avoid;
  }
{--!} Text block alignment classes.
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
{--!} Do not wrap line breaks.
  .line-breaks {
    white-space:pre;
  }
</style>

{--section-numbers=}.+skip
<style>
  /* Section numbers. */
  body,h1 { counter-reset: h2-counter; }
  h2      { counter-reset: h3-counter; }
  #contents > h2:before {
    content: counter(h2-counter) ". ";
    counter-increment: h2-counter;
  }
  #contents > h3:before {
    content: counter(h2-counter) "." counter(h3-counter) ". ";
    counter-increment: h3-counter;
  }
</style>

{--sidebar-toc=}.+skip
<style>
  body {
    padding-left: 21em;
  }
  #toc {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 18em;
    border-right: 1px solid #cccccc;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.35);
  }
</style>

{--dropdown-toc=}.+skip
<style>
  .toc-visible {
    display: block !important;
  }
  #toc-button {
    position: fixed;
    top: 22px;
    left: 15px;
    z-index: 1;
    cursor: pointer;
    color: silver;
    font-size:3.2em;
  }
  #toc {
    display: none;
    position: fixed;
    top: 55px;
    left: 15px;
    right: 10%;
    z-index: 1;
    max-width: 30em;
    max-height: 80%;
    overflow-y: auto;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
  }
  #contents {
    margin-left: 40px;
  }
</style>

// Common to --sidebar-toc and --dropdown-toc.
.+skip
{--sidebar-toc!}.-skip
{--dropdown-toc!}.-skip
<style>
  @media print {
    .no-print, .no-print * {
      display: none !important;
    }
    body {
      padding-left: 1em;
    }
  }
  #toc {
    padding-left: 1em;
  }
  #toc .h1 {
    font-size: 110%;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.4em;
  }
  #toc .h2 {
    margin-top: 0.4em;
  }
  #toc .h3 {
    margin-left: 1.5em;
    font-size: 90%;
  }
  #toc div:nth-child(even) {
    background-color: #f8f8f8;
  }
</style>

{--theme!.*\x5Cbgraystone\x5Cb.*}.+skip
<style>
  body {
    font-size: 13pt;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #888;
  }
  h1, h2 {
    text-transform: uppercase;
  }
  a, a:hover {
    color: #888;
    text-decoration: underline;
  }
  @media print {
    a {
      text-decoration: none;
    }
  }
</style>

</head>
<body>

// Include dropdown TOC button unless a custom TOC is specified.
{--dropdown-toc=}.+skip
{--custom-toc!}.+skip
<div id="toc-button" onclick="toggleToc()" class="no-print">&#8801;</div>

// Include for sidebar and dropdown TOC unless a custom TOC is specified.
.+skip
{--sidebar-toc!}.-skip
{--dropdown-toc!}.-skip
{--custom-toc!}.+skip
<div id="toc" class="no-print">
  <div id="auto-toc"></div>
</div>

<div id="contents">
`
};

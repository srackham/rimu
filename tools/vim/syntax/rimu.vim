" Vim syntax file
" Language:     Rimu Markup
" Author:       Stuart Rackham <srackham@gmail.com>
" URL:          http://rimumarkup.org
" Licence:      MIT
" Limitations:
" - An indented paragraph preceded by a non-blank line is not highlighted.
" - Nested quoted text formatting is highlighted according to the outer
"   format.
 
if exists("b:current_syntax")
  finish
endif

syn clear
syn sync fromstart
syn sync linebreaks=100

syn keyword rimuTodo TODO FIXME XXX ZZZ DEPRECATED

syn match rimuBar /|/ contained containedin=rimuURLParams,rimuVariableParams
syn match rimuBackslash /\\/ containedin=ALL
syn match rimuSpanLineBreak / +$/
syn match rimuSpanEntity /\\\@<!&[#a-zA-Z]\w\{-1,};/
syn match rimuSpanURL /\\\@<!<\S\+\(|\_.\{-}\)\?>/ contains=rimuURLParams
syn match rimuURLParams /|\_[^>]*/ contains=rimuVariableRef
syn match rimuSpanHTML /\\\@<!<[!\/]\?[a-zA-Z-]\+\(\_s\_.\{-}\|\)>/
syn match rimuVariableRef /\\\@<!{[0-9A-Za-z_-]\+\(|\_.\{-}\)\?}/ contains=rimuVariableParams containedin=ALL
syn match rimuVariableParams /|\_[^}]*/ contains=rimuSpan.*
syn match rimuSpanAnchor /<<#[a-zA-Z_-].*>>/

syn match rimuSpanInserted /\\\@<!+[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!+/
syn match rimuSpanDeleted /\\\@<!=[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!=/
syn match rimuSpanMarked /\\\@<!#[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!#/
syn match rimuSpanSuperScript /\\\@<!\^[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\^/
syn match rimuSpanSubScript /\\\@<!\~[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\~/
syn match rimuSpanStrong /\\\@<!\*[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\*/
syn match rimuSpanEmphasized /\\\@<!_[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!_/
syn match rimuSpanCode /\\\@<!`[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!`/

syn region rimuHeader matchgroup=rimuHeaderStartEnd start=/^\(=\|#\)\{1,6}\s\+/ end=/\(\s\+\(=\|#\)\{1,6}\)\?\_$/ contains=rimuSpan.* oneline keepend
syn match rimuBlockDelimiter /^\("\|\.\)\{2,}$/
syn region rimuCodeBlock start=/^-\{2,}$/ end=/^-\{2,}$/ keepend
syn region rimuIndentedParagraph start=/\(\%^\|\_^\n\)\@<=\s\+\S/ end=/\n\n/ keepend
syn match rimuComment "^\\\@<!//.*$" contains=rimuTodo
syn region rimuComment start=/^\/\*$/ end=/^\*\/$/ contains=rimuTodo keepend
syn region rimuHTMLBlock start=/<!\|\(<\/\?\(html\|head\|body\|script\|style\|address\|article\|aside\|audio\|blockquote\|canvas\|dd\|div\|dl\|fieldset\|figcaption\|figure\|figcaption\|footer\|form\|h1\|h2\|h3\|h4\|h5\|h6\|header\|hgroup\|hr\|noscript\|ol\|output\|p\|pre\|section\|table\|tfoot\|ul\|video\)[ >\n]\?\)/ end=/\n\n/ contains=rimuSpanHTML keepend
syn match rimuVariableAssign /^{[0-9A-Za-z_-]\+}\s*=\s*'\_.\{-}'\n/
syn match rimuVariableValue /'\_.\{-}'\n/ contained containedin=rimuVariableAssign
syn match rimuVariableParam /$\d\+/ contained containedin=rimuVariableValue
syn match rimuHTMLAttributes /^\.[a-zA-Z#\[].*$/

syn match rimuListId /^\s*\(-\|\*\{1,4}\)\s/
syn match rimuListId /^\s*\(\(\d\+\.\)\|\.\{1,4}\)\s/
syn region rimuListLabel matchgroup=rimuListId start=/^\s*/ end=/:\{2,4}/ contains=rimuSpan.* oneline keepend

hi def link rimuBackslash Special
hi def link rimuBar Label
hi def link rimuBlockDelimiter Label
hi def link rimuCodeBlock Identifier
hi def link rimuComment Comment
hi def link rimuHeader Label
hi def link rimuHeaderStartEnd Label
hi def link rimuHTMLAttributes Title
hi def link rimuIndentedParagraph Identifier
hi def link rimuListId Label
hi def link rimuSpanAnchor Title
hi def link rimuSpanCode Identifier
hi def link rimuSpanDeleted Special
hi def link rimuSpanEmphasized Type
hi def link rimuSpanEntity Special
hi def link rimuSpanHTML Title
hi def link rimuSpanInserted Title
hi def link rimuSpanLineBreak Special
hi def link rimuSpanMarked Label
hi def link rimuSpanQuote Label
hi def link rimuSpanStrong Special
hi def link rimuSpanSubscript Type
hi def link rimuSpanSuperscript Type
hi def link rimuSpanURL Title
hi def link rimuTodo Todo
hi def link rimuVariableValue Type
hi def link rimuVariableParam Macro
hi def link rimuVariableRef Special

let b:current_syntax = "rimu"

" Formatting preferences.
setlocal autoindent expandtab tabstop=8 softtabstop=2 shiftwidth=2
setlocal textwidth=70 wrap formatoptions=tcqn
setlocal formatlistpat=^\\s*\\d\\+\\.\\s\\+\\\\|^\\s*<\\d\\+>\\s\\+\\\\|^\\s*[a-zA-Z.]\\.\\s\\+\\\\|^\\s*[ivxIVX]\\+\\.\\s\\+
setlocal comments=s1:/*,ex:*/,://,b:#,:%,:XCOMM,fb:-,fb:*,fb:+,fb:.,fb:>

" vim: wrap et sw=2 sts=2:

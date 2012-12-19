" Vim syntax file
" Language:     Rimu Markup
" Author:       Stuart Rackham <srackham@gmail.com>
" URL:          http://rimumarkup.org
" Licence:      MIT
" Limitations:
" - An indented paragraph preceded by a non-blank line is not highlighted.
 
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

syn match rimuSpanInserted /\\\@<!+\s\@!.*[ \t\\]\@<!+/ contains=rimuSpan.*
syn match rimuSpanDeleted /\\\@<!=\s\@!.*[ \t\\]\@<!=/ contains=rimuSpan.*
syn match rimuSpanMarked /\\\@<!#\s\@!.*[ \t\\]\@<!#/ contains=rimuSpan.*
syn match rimuSpanSuperScript /\\\@<!\^\s\@!.*[ \t\\]\@<!\^/ contains=rimuSpan.*
syn match rimuSpanSubScript /\\\@<!\~\s\@!.*[ \t\\]\@<!\~/ contains=rimuSpan.*
syn match rimuSpanStrong /\\\@<!\*\s\@!.*[ \t\\]\@<!\*/ contains=rimuSpan.*
syn match rimuSpanEmphasized /\\\@<!_\s\@!.*[ \t\\]\@<!_/ contains=rimuSpan.*
syn match rimuSpanCode /\\\@<!`\s\@!.*[ \t\\]\@!<`/

syn region rimuHeader matchgroup=rimuHeaderStartEnd start=/^\(=\|#\)\{1,6}\s\+/ end=/\(\s\+\(=\|#\)\{1,6}\)\?\_$/ contains=rimuSpan.* oneline keepend
syn match rimuBlockDelimiter /^\("\|\.\)\{2,}$/
syn region rimuCodeBlock start=/^-\{2,}$/ end=/^-\{2,}$/ keepend
syn region rimuIndentedParagraph start=/\(\%^\|\_^\n\)\@<=\s\+\S/ end=/\n\n/ keepend
syn match rimuComment "^\\\@<!//.*$" contains=rimuTodo
syn region rimuComment start=/^\/\*$/ end=/^\*\/$/ contains=rimuTodo keepend
syn region rimuHTMLBlock start=/<!\|\(<\/\?\(html\|head\|body\|script\|style\|address\|article\|aside\|audio\|blockquote\|canvas\|dd\|div\|dl\|fieldset\|figcaption\|figure\|figcaption\|footer\|form\|h1\|h2\|h3\|h4\|h5\|h6\|header\|hgroup\|hr\|noscript\|ol\|output\|p\|pre\|section\|table\|tfoot\|ul\|video\)[ >\n]\?\)/ end=/\n\n/ contains=rimuSpanHTML keepend
syn region rimuVariableAssign matchgroup=rimuVariableAssignStartEnd start=/^{[0-9A-Za-z_-]\+}\s*=\s*'/ end=/'\n/ keepend
syn match rimuVariableParam /$\d\+/ contained containedin=rimuVariableAssign
syn match rimuHTMLAttributes /^\.[a-zA-Z#\[].*$/

syn match rimuListId /^\s*\(-\|\*\{1,4}\)\s/
syn match rimuListId /^\s*\(\(\d\+\.\)\|\.\{1,4}\)\s/
syn region rimuListLabel matchgroup=rimuListId start=/^\s*/ end=/:\{2,4}/ contains=rimuSpan.* oneline keepend

highlight link rimuBackslash Special
highlight link rimuBar Label
highlight link rimuBlockDelimiter Label
highlight link rimuCodeBlock Identifier
highlight link rimuComment Comment
highlight link rimuHeader Label
highlight link rimuHeaderStartEnd Label
highlight link rimuHTMLAttributes Title
highlight link rimuIndentedParagraph Identifier
highlight link rimuListId Label
highlight link rimuSpanAnchor Title
highlight link rimuSpanCode Identifier
highlight link rimuSpanDeleted Special
highlight link rimuSpanEmphasized Type
highlight link rimuSpanEntity Special
highlight link rimuSpanHTML Title
highlight link rimuSpanInserted Title
highlight link rimuSpanLineBreak Special
highlight link rimuSpanMarked Label
highlight link rimuSpanQuote Label
highlight link rimuSpanStrong Special
highlight link rimuSpanSubscript Type
highlight link rimuSpanSuperscript Type
highlight link rimuSpanURL Title
highlight link rimuTodo Todo
highlight link rimuVariableAssignStartEnd Special
highlight link rimuVariableParam Macro
highlight link rimuVariableRef Special

let b:current_syntax = "rimu"

" Formatting preferences.
setlocal autoindent expandtab tabstop=8 softtabstop=2 shiftwidth=2
setlocal textwidth=70 wrap formatoptions=tcqn
setlocal formatlistpat=^\\s*\\d\\+\\.\\s\\+\\\\|^\\s*<\\d\\+>\\s\\+\\\\|^\\s*[a-zA-Z.]\\.\\s\\+\\\\|^\\s*[ivxIVX]\\+\\.\\s\\+
setlocal comments=s1:/*,ex:*/,://,b:#,:%,:XCOMM,fb:-,fb:*,fb:+,fb:.,fb:>

" vim: wrap et sw=2 sts=2:

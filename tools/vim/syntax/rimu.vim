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

syn match rimuBar /|/
syn match rimuBackslash /\\/
syn match rimuSpanLineBreak / +$/
syn match rimuSpanEntity /\\\@<!&[#a-zA-Z]\w\{-1,};/
syn match rimuSpanAnchor /<<#[a-zA-Z_-].*>>/

syn region rimuSpanURLandHTML matchgroup=rimuURLandHTMLStartEnd start=/\\\@<!\zs<\_[^|>]\+\ze|\?/ end=/>/ contains=rimuBar
syn region rimuVariableRef matchgroup=rimuVariableRefStartEnd start=/\\\@<!\zs{[0-9A-Za-z_-]\+\ze|\?/ end=/}/ contains=rimuBar,rimuSpan.*

"TODO other quotes.
" As a damage control measure quoted patterns always terminate at a blank.
syn region rimuSpanCode start=/\\\@<!`\s\@!/ end=/[ \t\\]\@<!\(`\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanInserted start=/\\\@<!+\s\@!/ end=/[ \t\\]\@<!\(+\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanDeleted start=/\\\@<!=\s\@!/ end=/[ \t\\]\@<!\(=\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanSuperScript start=/\\\@<!\^\s\@!/ end=/[ \t\\]\@<!\(\^\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanSubScript start=/\\\@<!\~\s\@!/ end=/[ \t\\]\@<!\(\~\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanStrong start=/\\\@<!\*\s\@!/ end=/[ \t\\]\@<!\(\*\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanMarked start=/\\\@<!#\s\@!/ end=/[ \t\\]\@<!\(#\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend
syn region rimuSpanEmphasized start=/\\\@<!_\s\@!/ end=/[ \t\\]\@<!\(_\|\n\n\)/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* keepend

"syn match rimuHeader /^\(=\|#\)\{1,6}\s\+/
"syn region rimuHeader start=/^\(=\|#\)\{1,6}\s\+/ end=/\(\s\+\(=\|#\)\{1,6}\)\?\_$/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* oneline keepend
syn region rimuHeader start=/^\(=\|#\)\{1,6}\s\+/ end=/\(\s\+\(=\|#\)\{1,6}\)\?\_$/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* oneline keepend

syn match rimuBlockDelimiter /^\("\|\.\)\{2,}$/

syn region rimuCodeBlock start=/^-\{2,}$/ end=/^-\{2,}$/ contains=rimuTodo,rimuVariableRef keepend
syn region rimuCodeBlock start=/\(\%^\|\_^\n\)\@<=\s\+\ze\S/ end=/\n\n/ contains=rimuTodo,rimuVariableRef keepend

syn match rimuComment "^\\\@<!//.*$" contains=rimuTodo
syn region rimuComment start=/^\/\*$/ end=/^\*\/$/ contains=rimuTodo keepend

syn match rimuListId /^\s*\(-\|\*\{1,4}\)\ze\s/
syn match rimuListId /^\s*\(\(\d\+\.\)\|\.\{1,4}\)\ze\s/
syn region rimuListLabel matchgroup=rimuListId start=/^\s*/ end=/:\{2,4}/ contains=rimuBackslash,rimuVariableRef,rimuSpan.* oneline keepend

syn match rimuHTMLAttributes /^\.[a-zA-Z#\[].*$/

highlight link rimuAnchor Macro
highlight link rimuBackslash Special
highlight link rimuBar Label
highlight link rimuBlockDelimiter Label
highlight link rimuCodeBlock Identifier
highlight link rimuComment Comment
highlight link rimuHeader Label
highlight link rimuHTMLAttributes Title
highlight link rimuListId Label
highlight link rimuSpanAnchor Title
highlight link rimuSpanCode Identifier
highlight link rimuSpanDeleted Special
highlight link rimuSpanEmphasized Type
highlight link rimuSpanEntity Special
highlight link rimuSpanInserted Title
highlight link rimuSpanLineBreak Special
highlight link rimuSpanMarked Label
highlight link rimuSpanQuote Label
highlight link rimuSpanStrong Special
highlight link rimuSpanSubscript Type
highlight link rimuSpanSuperscript Type
highlight link rimuURLandHTMLStartEnd Title
highlight link rimuTodo Todo
highlight link rimuVariableRefStartEnd Special

let b:current_syntax = "rimu"


" Formatting preferences.
setlocal autoindent expandtab tabstop=8 softtabstop=2 shiftwidth=2
setlocal textwidth=70 wrap formatoptions=tcqn
setlocal formatlistpat=^\\s*\\d\\+\\.\\s\\+\\\\|^\\s*<\\d\\+>\\s\\+\\\\|^\\s*[a-zA-Z.]\\.\\s\\+\\\\|^\\s*[ivxIVX]\\+\\.\\s\\+
setlocal comments=s1:/*,ex:*/,://,b:#,:%,:XCOMM,fb:-,fb:*,fb:+,fb:.,fb:>

" vim: wrap et sw=2 sts=2:

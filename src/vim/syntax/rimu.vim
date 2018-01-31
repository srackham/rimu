" Vim syntax file
" Language:     Rimu Markup
" Author:       Stuart Rackham <srackham@gmail.com>
" URL:          http://srackham.github.io/rimu/
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

syn match rimuParamSeparator /|/ contained containedin=rimuURLParams,rimuDefinitionParams
syn match rimuParamSeparator /?/ contained containedin=rimuDefinitionParams
syn match rimuBackslash /\\\@<!\\/ containedin=ALLBUT,rimuComment,rimuCodeBlock,rimuIndentedParagraph,rimuSpanQuoteCode
syn match rimuSpanLineBreak / \\$/
syn match rimuSpanEntity /\\\@<!&[#a-zA-Z]\w\{-1,};/
syn match rimuSpanURL /\\\@<!<\S\+\(|\_.\{-}\)\?>/ contains=rimuURLParams
syn match rimuURLParams /|\_[^>]*/ contained contains=rimuSpanQuote.*
syn match rimuSpanURL /[\\]\@<!!\?\[\_.\{-}](\S\{-1,})/ contains=rimuURLText
syn match rimuURLText /\[\@<=\_.\{-}]\@=/ contained containedin=rimuSpanURL contains=rimuSpanQuote.*
syn match rimuSpanHTML /\\\@<!<[!\/]\?[a-zA-Z-]\+\(\_s\_.\{-}\|\)>/
syn match rimuMacroInvocation /\\\@<!{[0-9A-Za-z_-]\+\([?!=|]\_.\{-}\)\?}/ contains=rimuDefinitionParams containedin=ALLBUT,rimuComment,rimuCodeBlock,rimuIndentedParagraph
syn match rimuDefinitionParams /[?|]\_[^}]*/ contained contains=rimuSpan.*
" DEPRECATED as of 3.4.0: rimuSpanAnchor.
syn match rimuSpanAnchor /<<#[a-zA-Z_-].*>>/
syn match rimuSpanRawURL /[\\<]\@<!\(http\|https\):\/\/[^ \t"]*[^ \t",.;?)]/

syn match rimuSpanQuoteEmphasized /\\\@<!\*[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\*/ contains=rimuSpanEntity
syn match rimuSpanQuoteStrong /\\\@<!\*\*[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\*\*/ contains=rimuSpanEntity
syn match rimuSpanQuoteEmphasized /\\\@<!_[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!_/ contains=rimuSpanEntity
syn match rimuSpanQuoteStrong /\\\@<!__[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!__/ contains=rimuSpanEntity
syn match rimuSpanQuoteCode /\\\@<!`[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[ \t\n]\@<!`/
syn match rimuSpanQuoteCode /\\\@<!``[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[ \t\n]\@<!``/
syn match rimuSpanQuoteDeleted /\\\@<!\~\~[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\~\~/ contains=rimuSpanEntity
syn region rimuHeader matchgroup=rimuHeaderStartEnd start=/^\(=\|#\)\{1,6}\s\+/ end=/\(\s\+\(=\|#\)\{1,6}\)\?\_$/ contains=rimuSpan.* oneline keepend
syn match rimuBlockDelimiter /^\("\{2,}\|\.\{2,}\)[ 0-9a-zA-Z-]*$/
syn region rimuCodeBlock start=/^-\{2,}$/ end=/^-\{2,}$/ keepend
syn region rimuCodeBlock start=/^`\{2,}[ 0-9a-zA-Z-]*$/ end=/^`\{2,}$/ keepend
syn region rimuIndentedParagraph start=/\(\%^\|\_^\n\|^\(=\|#\)\{1,6}\s\+\S\+.*\n\|^\(\.\|"\)\{2,}\n\|^\.[a-zA-Z#\[+\-].*\n\)\@<=\s\+\S/ end=/\n\(\.\.\|""\|\n\)\@=/ keepend
syn region rimuQuoteParagraph start=/\(\%^\|\_^\n\|^\(=\|#\)\{1,6}\s\+\S\+.*\n\|^\.\{2,}\n\)\@<=\\\@<!>\s*\S/ end=/\n\(\.\.\|""\|\n\)\@=/ keepend contains=rimuSpan.*,rimuQuotePrefix
syn match rimuQuotePrefix /^\\\@<!>/ contained
syn region rimuHTMLBlock start=/<!\|\(<\/\?\(html\|head\|body\|script\|style\|address\|article\|aside\|audio\|blockquote\|canvas\|dd\|div\|dl\|fieldset\|figcaption\|figure\|figcaption\|footer\|form\|h1\|h2\|h3\|h4\|h5\|h6\|header\|hgroup\|hr\|noscript\|ol\|output\|p\|pre\|section\|table\|tfoot\|ul\|video\)[ >\n]\?\)/ end=/\n\n/ contains=rimuSpanHTML keepend

syn match rimuMacroDefinition /^{[0-9A-Za-z_-]\+}\s*=\s*\(['`]\)\_.\{-}\1\n/
syn match rimuReplacementDefinition /^\/.\+\/[igm]*\s*=\s*'\_.\{-}'\n/
syn match rimuReplacementRegExp /^\/.\+\/[igm]*[\t =]\@=/ contained containedin=rimuReplacementDefinition
syn match rimuDelimitedBlockDefinition /^|[0-9A-Za-z-]\+|*\s*=\s*'\_.\{-}'\n/
syn match rimuDelimitedBlockDefinitionName /^|[0-9A-Za-z-]\+|[\t =]\@=/ contained containedin=rimuDelimitedBlockDefinition

syn match rimuBlockAttributes /^\.[a-zA-Z#"\[+\-].*$/
syn match rimuComment "^\\\@<!//.*$" contains=rimuTodo
syn region rimuComment start=/^\/\*$/ end=/^\*\/$/ contains=rimuTodo keepend

syn match rimuListId /^\s*\(-\|\*\{1,4}\)\s/
syn match rimuListId /^\s*\(\(\d\+\.\)\|\.\{1,4}\)\s/
syn match rimuListId /:\{2,4}/ contained containedin=rimuListLabel
syn region rimuListLabel start=/^/ end=/:\{2,4}/ contains=rimuSpan.* oneline keepend

syn match rimuApiElement /^\.[a-zA-Z]\+\s*=\s*'\_.\{-}'\n/
syn match rimuApiOption /^\.\(safeMode\|htmlReplacement\|macroMode\|reset\)/ contained containedin=rimuApiElement
syn match rimuQuoteDefinition /^\S\{1,2}\s*=\s*'\_.\{-}'\n/
syn match rimuQuoteQuote /^\S\{1,2}/ contained containedin=rimuQuoteDefinition
syn match rimuDefinitionValue /'\_.\{-}'\n/ contained containedin=rimuMacroDefinition,rimuReplacementDefinition,rimuQuoteDefinition,rimuDelimitedBlockDefinition,rimuApiElement
syn match rimuExpressionValue /`\_.\{-}`\n/ contained containedin=rimuMacroDefinition
syn match rimuDefinitionParam /\(\\\@<!$\{1,2}\d\+\(\\\@<!:.\{-}\\\@<!\$\)\?\)\|\(|\)/ contained containedin=rimuDefinitionValue,rimuExpressionValue

hi def link rimuApiOption Special
hi def link rimuBackslash Special
hi def link rimuParamSeparator Label
hi def link rimuBlockDelimiter Label
hi def link rimuCodeBlock Identifier
hi def link rimuComment Comment
hi def link rimuDelimitedBlockDefinitionName Special
hi def link rimuHeader Label
hi def link rimuHeaderStartEnd Label
hi def link rimuBlockAttributes Title
hi def link rimuIndentedParagraph Identifier
hi def link rimuListId Label
hi def link rimuQuotePrefix Label
hi def link rimuQuoteQuote Special
hi def link rimuReplacementRegExp Special
" DEPRECATED as of 3.4.0: rimuSpanAnchor.
hi def link rimuSpanAnchor Title
hi def link rimuSpanQuoteCode Identifier
hi def link rimuSpanQuoteEmphasized Type
hi def link rimuSpanEntity Special
hi def link rimuSpanHTML Title
hi def link rimuSpanLineBreak Special
hi def link rimuSpanQuote Label
hi def link rimuSpanRawURL Title
hi def link rimuSpanQuoteStrong Special
hi def link rimuSpanQuoteDeleted Todo
hi def link rimuSpanURL Title
hi def link rimuTodo Todo
hi def link rimuDefinitionValue Type
hi def link rimuExpressionValue Label
hi def link rimuDefinitionParam Macro
hi def link rimuMacroInvocation Special

let b:current_syntax = "rimu"

" Formatting preferences.
setlocal autoindent expandtab tabstop=8 softtabstop=2 shiftwidth=2
setlocal textwidth=70 wrap formatoptions=tcqn
setlocal formatlistpat=^\\s*\\d\\+\\.\\s\\+\\\\|^\\s*<\\d\\+>\\s\\+\\\\|^\\s*[a-zA-Z.]\\.\\s\\+\\\\|^\\s*[ivxIVX]\\+\\.\\s\\+
setlocal comments=s1:/*,ex:*/,://,b:#,:%,:XCOMM,fb:-,fb:*,fb:+,fb:.,fb:>

" vim: wrap et sw=2 sts=2:

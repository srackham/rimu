"
" Custom Vim highlighting for additional custom syntax defined in
" example-rimurc file. Rename this file to ~/.vim/after/syntax/rimu.vim and
" it will be automatically sourced by Vim.
"
" NOTE: This file is sourced after the default ~/.vim/syntax/rimu.vim
"       syntax file (which is distributed in ./src/vim/syntax/).
"

" Admonishments.
syn match rimuAdmonition /^\\\@<!\(NOTES\?\|IMPORTANT\|WARNINGS\?\|TIPS\?\):/ containedin=ALLBUT,rimuComment,rimuCodeBlock
hi def link rimuAdmonition Special
" __Underlined__ (overrides __strong__).
syn match rimuSpanUnderlined /\\\@<!__[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!__/ contains=rimuSpanEntity
hi def link rimuSpanUnderlined Underlined

" ~/.vim/after/syntax/rimu.vim
"
" Custom Vim highlighting for custom syntax defined in ~/.rimurc
"

" Admonishments.
syn match rimuAdmonition /^\\\@<!\(NOTES\?\|IMPORTANT\|WARNINGS\?\|TIPS\?\):/ containedin=ALLBUT,rimuComment,rimuCodeBlock
hi def link rimuAdmonition Special
" __Underlined__ (overrides __strong__).
syn match rimuSpanUnderlined /\\\@<!__[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!__/ contains=rimuSpanEntity
hi def link rimuSpanUnderlined Underlined

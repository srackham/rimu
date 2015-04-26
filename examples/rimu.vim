" ~/.vim/after/syntax/rimu.vim
"
" Custom Vim highlighting for custom syntax defined in ~/.rimurc
"

" Admonishments.
syn match rimuAdmonition /^\\\@<!\(NOTES\?\|IMPORTANT\|WARNINGS\?\|TIPS\?\):/ containedin=ALLBUT,rimuComment,rimuCodeBlock
hi def link rimuAdmonition Special


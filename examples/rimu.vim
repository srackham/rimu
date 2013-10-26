" ~/.vim/after/syntax/rimu.vim
"
" Custom Vim highlighting for custom syntax defined in ~/.rimurc
"

" Admonishments.
syn match rimuAdmonition /^\([A-Z]\+\):/ containedin=ALLBUT,rimuComment,rimuCodeBlock
hi def link rimuAdmonition Special

" ~ quote.
syn match rimuSpanDeleted /\\\@<!\~[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\~/ contains=rimuSpanEntity
hi def link rimuSpanDeleted Todo

" Raw HTTP URLs as links.
syn match rimuSpanRawURL /[\\<]\@<!\(http\|https\):\/\/[^\s"']*[^\s"',.;?)]/
hi def link rimuSpanRawURL Title

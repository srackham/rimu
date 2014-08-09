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

" Markdown ** quote.
syn match rimuSpanStrong /\\\@<!\*\*[ \t\n]\@!\(.\|\n\(\s*\n\)\@!\)\{-1,}[\\ \t\n]\@<!\*\*/ contains=rimuSpanEntity

" Raw HTTP URLs as links.
syn match rimuSpanRawURL /[\\<]\@<!\(http\|https\):\/\/[^ \t"]*[^ \t",.;?)]/
hi def link rimuSpanRawURL Title

" Markdown [link-text](url) and ![alt-text](image-url) syntaxes.
syn match rimuSpanURL /[\\]\@<!!\?\[\_.\{-1,}]\s*(\S\{-1,})/ contains=rimuURLText
syn match rimuURLText /\[\@<=\_.\{-1,}]\@=/ contained containedin=rimuSpanURL

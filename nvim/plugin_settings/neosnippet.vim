imap <C-k>   <Plug>(neosnippet_expand_or_jump)
smap <C-k>   <Plug>(neosnippet_expand_or_jump)
xmap <C-k>   <Plug>(neosnippet_expand_target)

" SuperTab like snippets behavior.
" Note: It must be "imap" and "smap". It uses <Plug> mappings.
"imap <expr><TAB>
" \ pumvisible() ? "\<C-n>" :
" \ neosnippet#expandable_or_jumpable() ?
" \     "\<Plug>(neosnippet_expand_or_jump)" : "\<TAB>"
smap <expr><TAB> neosnippet#expandable_or_jumpable() ?
\ "\<Plug>(neosnippet_expand_or_jump)" : "\<TAB>"

" For conceal markers.
if has('conceal')
    set conceallevel=2 concealcursor=niv
endif

let g:neosnippet#enable_snipmate_compatibility = 1
"let g:neosnippet#snippets_directory = $HOME . '/.vim/neosnippet.vim'
let g:neosnippet#snippets_directory = $HOME . '/.vim/dein/repos/github.com/Shougo/neosnippet-snippets/neosnippets'

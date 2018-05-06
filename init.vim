set encoding=utf-8
set fileencodings=iso-2022-jp,euc-jp,sjis,utf-8
set fileformats=unix,dos,mac
set clipboard=unnamedplus

let g:vimproc#download_wimdows_dll = 1

"if(has('win32') || has('win64')) && has('gui') && &shell =~"bash"
"    echo "bingo!"
"endif 

" windows setting {{{
if( has('win32') || has('win64') )
    "backup files directory (use only KaoriYa vim)
    set undodir=~/.vim/temp/un
    set backupdir=~/.vim/temp/tilde
    set viminfo+=n~/.vim/temp/viminfo
    set directory=~/.vim/temp
    "shell use msys2 設定途中
"    set shell=C:\msys64/msys2.exe  "use shell
"    set shell=cmd
"    set noshellslash
"    set shellcmdflag=-e
"    set shellpipe=\|&\ tee
"    set shellredir=>%s\ 2>&1
"    set shellxquote=\"
endif
" }}}

"マーカー折り畳み機能の設定
au Filetype vim setlocal foldmethod=marker
" $VIMRUNTIME/syntax/php.vim
let g:php_baselib = 1
let g:php_htmlInStrings = 1
let g:php_noShortTags = 1
let g:php_sql_query = 1

"$VIMRUNTIME/syntax/sql.vim
let g:sql_type_default = 'mysql'

"dein.vim_config{{{
  "パス設定
  let s:dein_dir = fnamemodify('~/.vim/dein/',':p')
  let s:dein_repo_dir = s:dein_dir . 'repos/github.com/Shougo/dein.vim'

  "dein.vimがなければインストール
  if !isdirectory(s:dein_repo_dir)
      execute '!git clone https://github.com/Shougo/dein.vim' shellescape(s:dein_repo_dir)
  endif

  "dein.vimをランタイムパスに追加
  if &runtimepath !~# '/dein.vim'
      execute 'set runtimepath^=' . s:dein_repo_dir
  endif

  "deinのfunctionを呼び出し
"  let s:toml_file = fnamemodify(expand('<sfile>'), ':h'). '~/dotfiles/dein.toml'
  let s:toml_file = '~/dotfiles/dein.toml'

  if dein#load_state(s:dein_dir)
  	call dein#begin(s:dein_dir)
  	call dein#load_toml(s:toml_file)
  	call dein#end()
  	call dein#save_state()
  endif

  filetype plugin indent on
  syntax enable

  " Plugins_install
  if dein#check_install()
    call dein#install()
  endif

" | uninstall Plugins
" | 1.uncomment the following description & reboot vim
" | 2.command :call dein#recache_runtimepath() by vim (can't use gvim)
" | 3.reboot vim
"  call map(dein#check_clean(), "delete(v:val, 'rf')")
"}}}

 "vim-ref {{{
 inoremap <silent><C-k> <C-o>:call<Space>ref#K('normal')<CR><ESC>
 nmap <silent>K <Plug>(ref-keyword)
 let g:ref_no_default_key_mappings = 1
 let g:ref_cache_dir               = $HOME . '/.vim/vim-ref/cache'
 let g:ref_detect_filetype         = {
\    'php': 'phpmanual'
\} 
 let g:ref_phpmanual_path = $HOME . '/.vim/vim-ref/php-chunked-xhtml'
 let g:ref_phpmanual_cmd = 'lynx -dump %s'
 let g:ref_use_cache      = 1
 let g:ref_use_vimproc    = 1 
 "}}}

"BasicSettings {{{
    " + Edit Settings {{{
        "insert mode IME OFF
        set iminsert=0
    " }}}
    " + VisualSettings {{{
        colorscheme hybrid
        set background=dark
        set number
        set ruler
        set nowrap
    " }}}
    " + SearchSettings {{{
        set hlsearch
        set ignorecase
        set smartcase
        "検索モード時の自動日本語入力化をオフ
        set imsearch=0
    " }}}
    " + IndentSettings {{{
        set autoindent
        set shiftwidth=4
        set expandtab
        set tabstop=4
        set softtabstop=4
        set smarttab
    " }}}
" }}}

"NERDTree Settings {{{
"Allways open NERDTree, to start vim
"autocmd VimEnter * execute 'NERDTree'
"To start vim without specifying a file, open NERDTree
if(has('gvim'))
    if argc() == 0
        let g:nerdtree_tabs_open_on_console_startup = 1
    end
end
"Show invisible files
let NERDTreeShowHidden = 1
"Open & close
nnoremap<silent><C-f> :NERDTreeToggle<CR>
"}}}

"universal-ctags Settings {{{
"rootディレクトリのtagsファイルを参照する
set tags=./tags;,tags;
"}}}

" taglist config {{{
let Tlist_Use_Right_Window = 1  "diaplay on the right side
let Tlist_Show_One_File = 1     "indicate only current file
let Tlist_Exit_OnlyWindow = 1   "window only taglist, close vim 
"open & close with \t
map <silent><leader>t :TlistToggle<CR>
" }}}

"neocomplete Settings {{{
"Note: This option must be set in .vimrc(_vimrc).  NOT IN .gvimrc(_gvimrc)!
" Disable AutoComplPop.
let g:acp_enableAtStartup = 0
" Use neocomplete.
let g:neocomplete#enable_at_startup = 1
" Use smartcase.
let g:neocomplete#enable_smart_case = 1
" Set minimum syntax keyword length.
let g:neocomplete#sources#syntax#min_keyword_length = 3

" Define dictionary.
let g:neocomplete#sources#dictionary#dictionaries = {
    \ 'default' : '',
    \ 'vimshell' : $HOME.'/.vimshell_hist',
    \ 'scheme' : $HOME.'/.gosh_completions'
        \ }

" Define keyword.
if !exists('g:neocomplete#keyword_patterns')
    let g:neocomplete#keyword_patterns = {}
endif
let g:neocomplete#keyword_patterns['default'] = '\h\w*'

" Plugin key-mappings.
inoremap <expr><C-g>     neocomplete#undo_completion()
inoremap <expr><C-l>     neocomplete#complete_common_string()

" Recommended key-mappings.
" <CR>: close popup and save indent.
inoremap <silent> <CR> <C-r>=<SID>my_cr_function()<CR>
function! s:my_cr_function()
  "return (pumvisible() ? "\<C-y>" : "" ) . "\<CR>"
  " For no inserting <CR> key.
  return pumvisible() ? "\<C-y>" : "\<CR>"
endfunction
" <TAB>: completion.
inoremap <expr><TAB>  pumvisible() ? "\<C-n>" : "\<TAB>"
" <C-h>, <BS>: close popup and delete backword char.
inoremap <expr><C-h> neocomplete#smart_close_popup()."\<C-h>"
"inoremap <expr><BS> neocomplete#smart_close_popup()."\<C-h>"
" Close popup by <Space>.
"inoremap <expr><Space> pumvisible() ? "\<C-y>" : "\<Space>"

" AutoComplPop like behavior.
"let g:neocomplete#enable_auto_select = 1

" Shell like behavior(not recommended).
"set completeopt+=longest
"let g:neocomplete#enable_auto_select = 1
"let g:neocomplete#disable_auto_complete = 1
"inoremap <expr><TAB>  pumvisible() ? "\<Down>" : "\<C-x>\<C-u>"

" Enable omni completion.
autocmd FileType css setlocal omnifunc=csscomplete#CompleteCSS
autocmd FileType html,markdown setlocal omnifunc=htmlcomplete#CompleteTags
autocmd FileType javascript setlocal omnifunc=javascriptcomplete#CompleteJS
autocmd FileType python setlocal omnifunc=pythoncomplete#Complete
autocmd FileType xml setlocal omnifunc=xmlcomplete#CompleteTags

" Enable heavy omni completion.
if !exists('g:neocomplete#sources#omni#input_patterns')
  let g:neocomplete#sources#omni#input_patterns = {}
endif
"let g:neocomplete#sources#omni#input_patterns.php = '[^. \t]->\h\w*\|\h\w*::'
"let g:neocomplete#sources#omni#input_patterns.c = '[^.[:digit:] *\t]\%(\.\|->\)'
"let g:neocomplete#sources#omni#input_patterns.cpp = '[^.[:digit:] *\t]\%(\.\|->\)\|\h\w*::'

" For perlomni.vim setting.
" https://github.com/c9s/perlomni.vim
let g:neocomplete#sources#omni#input_patterns.perl = '\h\w*->\h\w*\|\h\w*::'
"}}}

" lexima.vim config {{{
let g:lexima_no_default_rules = 1
call lexima#set_default_rules()
call lexima#insmode#map_hook('before', '<CR>', '')

function! s:my_cr_function() abort
    "neocomplete#smart_close_popup() . 
    return lexima#expand("<CR>", 'i')
endfunction

inoremap <expr><CR> <SID>my_cr_function()
"}}}

"neosnippets Settings {{{
" Plugin key-mappongs.
" Note: It must be "imap" and "smap". It uses <Plug> mappings.
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
"}}}

"emmet-vim config {{{
"<C-y>はneocompleteとkeymappingがconfrectするため<C-t>変更
let g:user_emmet_leader_key='<C-t>'
"}}}

"vim-gista config {{{
let g:gista#client#default_username = 'ShouN-7'
"}}}

" memolist.vim config {{{
let g:memolist_path = $HOME . "/Dropbox/memo"
let g:memolist_memo_suffix = "md"

map <Leader>mn :Memonew<CR>
map <Leader>ml :MemoList<CR>
map <Leader>mg :MemoGrep<CR>
"}}}

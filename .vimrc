set encoding=utf-8
set fileencodings=iso-2022-jp,euc-jp,sjis,utf-8
set fileformats=unix,dos,mac

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
  call dein#begin(s:dein_dir)
  call dein#add('Shougo/neocomplcache')

  "Plugins{{{
  "+ clorscheme
  call dein#add('altercation/vim-colors-solarized')
  call dein#add('tomasr/molokai')
  "+ スニペット
  call dein#add('Shougo/neosnippet')
  call dein#add('Shougo/neosnippet-snippets')
  call dein#add('honza/vim-snippets')
  "dictionary
  call dein#add('Shougo/vimproc.vim',{'build': 'make'})
  call dein#add('thinca/vim-quickrun')
  call dein#add('thinca/vim-ref')
  call dein#add('vim-scripts/taglist.vim')
  call dein#add('w0rp/ale')
  "+ HTML/CSS
  "call dein#add('amirh/HTML-AutoCloseTag')
  call dein#add('hail2u/vim-css3-syntax')
  call dein#add('gorodinskiy/vim-coloresque')
  call dein#add('mattn/emmet-vim')
  call dein#add('tpope/vim-surround')
  call dein#add('othree/yajs.vim')
  "}}}
  "+ FileTree{{{
  call dein#add('scrooloose/nerdtree')
  "}}}
  call dein#add('Shougo/unite.vim')
  "+ git-plugin{{{
  call dein#add('tpope/vim-fugitive')
  " }}}
  "json-plugin
  call dein#add('elzr/vim-json')
  "indent可視化
  call dein#add('Yggdroot/indentLine')

  " 必須
  call dein#end()
  filetype plugin indent on
  syntax enable

  " Plugins_install
  if dein#check_install()
    call dein#install()
  endif
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
 let g:ref_use_cache      = 1
 let g:ref_use_vimproc    = 1 
 "}}}

"BasicSettings {{{
    " + VisualSettings {{{
        colorscheme solarized
        set background=dark
        set number
        set ruler
        set nowrap
    " }}}
    " + SearchSettings {{{
        set hlsearch
        set ignorecase
        set smartcase
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
"NERDTree自動起動設定
"autocmd VimEnter * execute 'NERDTree'

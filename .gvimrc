" $VIMRUNTIME/syntax/php.vim
let g:php_baselib = 1
let g:php_htmlInStrings = 1
let g:php_noShortTags = 1
let g:php_sql_query = 1

"$VIMRUNTIME/syntax/sql.vim
let g:sql_type_default = 'mysql'

"dein.vim_config{{{
  "�p�X�ݒ�
  let s:dein_dir = fnamemodify('~/.vim/dein/',':p')
  let s:dein_repo_dir = s:dein_dir . 'repos/github.com/Shougo/dein.vim'

  "dein.vim���Ȃ���΃C���X�g�[��
  if !isdirectory(s:dein_repo_dir)
      execute '!git clone https://github.com/Shougo/dein.vim' shellescape(s:dein_repo_dir)
  endif

  "dein.vim�������^�C���p�X�ɒǉ�
  if &runtimepath !~# '/dein.vim'
      execute 'set runtimepath^=' . s:dein_repo_dir
  endif

  "dein��function���Ăяo��
  call dein#begin(s:dein_dir)
  call dein#add('Shougo/neocomplcache')

  "Plugins{{{
  "+ clorscheme
  call dein#add('altercation/vim-colors-solarized')
  call dein#add('tomasr/molokai')
  "+ �X�j�y�b�g
  call dein#add('Shougo/neosnippet')
  call dein#add('Shougo/neosnippet-snippets')
  call dein#add('honza/vim-snippets')
  "+ HTML/CSS
  "call dein#add('amirh/HTML-AutoCloseTag')
  "call dein#add('hail2u/vim-css3-syntax')
  "call dein#add('gorodinskiy/vim-coloresque')
  "call dein#add('mattn/emmet-vim')
  "call dein#add('tpope/vim-surround')
  "call dein#add('othree/yajs.vim')
  "}}}

  " �K�{
  call dein#end()
  filetype plugin indent on
  syntax enable

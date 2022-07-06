set noswapfile
set hidden
set autoread
set nobackup
set nowrap
set number
set ruler
if has('win32') || has('win64') || has('mac')
  set clipboard+=unnamed
else
  set clipboard+=unnamedplus
endif

set conceallevel=0
let g:vim_json_syntax_conceal = 0
autocmd FileType vue syntax sync fromstart

set iminsert=0
set imsearch=0
set hlsearch
set ignorecase
set smartcase
augroup fileTypeIndent
  autocmd!
  autocmd BufNewFile,BufRead *.php setlocal tabstop=4 softtabstop=4 shiftwidth=0
  autocmd BufNewFile,BufRead *.go setlocal tabstop=2 softtabstop=2 shiftwidth=0
augroup END


set autoindent
set tabstop=2
set shiftwidth=0
set expandtab

set wildmenu
"set cursorline

if has('persistent_undo')
  set undodir=~/.vim/undo
  set undofile
endif
set undolevels=1000

set backspace=indent,eol,start

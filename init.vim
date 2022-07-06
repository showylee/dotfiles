if &compatible
  set nocompatible
endif

augroup MyAutoCmd
  autocmd!
augroup END

" If directory not exist, ask if you want to create.
augroup vimrc-auto-mkdir " {{{
  autocmd!
  autocmd BufWritePre * call s:auto_mkdir(expand('<afile>:p:h'), v:cmdbang)
  function s:auto_mkdir(dir, force) "{{{
    if !isdirectory(a:dir) && (a:force ||
          \ input(printf('"%s" does not exist.Create? [y/;N]', a:dir)) =~? '^y\%[es]$')
      call mkdir(iconv(a:dir, &encoding, &termencoding), 'p')
    endif
  endfunction "}}}
augroup END "}}}

" Removed a space at the end of a line when saving a file.
autocmd BufWritePre * :%s/\s\+$//ge


autocmd BufWritePre *.js, *.ts, *.vue, *.html, *.scss :call CocAction('format')
command! -nargs=0 Format :call CocAction('format')

if has('nvim')
  let $NVIM_TUI_ENABLE_TRUE_COLOR=1
endif

" true colors option
if (has("termguicolors"))
    set termguicolors
endif 

" dein.vim config
  let s:dein_cache_path = expand('~/.cache/nvim/dein')
  let s:dein_dir = s:dein_cache_path
    \ .'repos/github.com/Shougo/dein.vim'

  " If dein.vim is not installed, install it.
  if !isdirectory(s:dein_dir)
      execute '!git clone https://github.com/Shougo/dein.vim' s:dein_dir
  endif
" Add dein.vim directory to runtimepath
  if &runtimepath !~ '/dein.vim'
      execute 'set runtimepath+=' . fnamemodify(s:dein_dir, ':p')
  endif

  " Call dein.vim functions
"  let s:toml_file = fnamemodify(expand('<sfile>'), ':h'). '~/dotfiles/dein.toml'
  let s:toml_file = '~/dotfiles/nvim/dein.toml'
  let s:toml_lazy_file = '~/dotfiles/nvim/dein_lazy.toml'

  if dein#load_state(s:dein_cache_path)
  	call dein#begin(s:dein_cache_path)
  	call dein#load_toml(s:toml_file)
	call dein#load_toml(s:toml_lazy_file, {'lazy': 1})

  	call dein#end()
  	call dein#save_state()
  endif

  filetype plugin indent on
  syntax enable

  " Install plugins
  if dein#check_install()
    call dein#install()
  endif

" | Uninstall plugins
" | 1.uncomment the following description & reboot vim
" | 2.command :call dein#recache_runtimepath() by vim (can't use gvim)
" | 3.reboot vim
"  call map(dein#check_clean(), "delete(v:val, 'rf')")

source ~/dotfiles/nvim/options.rc.vim
source ~/dotfiles/nvim/keymap.rc.vim

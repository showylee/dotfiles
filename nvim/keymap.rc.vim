" Open init.vim
nnoremap <F9> :<C-u>vsplit ~/dotfiles/init.vim<CR>
" Reload neovim
nnoremap <F10> :<silent><C-u>source $MYVIMRC<CR>
                \ :source $MYGVIMRC<CR>

" Leader => Space
let mapleader = "\<Space>"

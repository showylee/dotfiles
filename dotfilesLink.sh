#!/bin/sh
ln -sf ~/dotfiles/.vimrc ~/.vimrc
ln -sf ~/dotfiles/init.vim ~/.config/nvim/init.vim

# set symbolic link to zshconfigs
setopt EXTENDED_GLOB
ZPREZTO="~/.zprozto/runcoms"
for rcfile in $HOME/dotfiles/zsh/^README.md(.N); do
  ln -sf "$rcfile" "$HOME/.${rcfile:t}"
  if [-e $ZPREZTO]; then
    if [-e "${ZPREZTO}/${rcfile}"]; then
      rm -rf $ZPREZTO/$rcfile
      ln -sf ~/dotfiles/zsh/$file $ZPREZTO/$file
    fi
  else
    ln -sf ~/dotfiles/zsh/$file ~/.$file
  fi
done

# set symbolic link to .tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~/.tmux.conf

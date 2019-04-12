#!/bin/sh

# install xcode
xcode-select --install

# install homebrew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# install brew app
brew bundle

# clone prezto to home dir
git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"

# set synbolic link zshfiles
setopt EXTENDED_GLOB
for rcfile in "${ZDOTDIR:-$HOME}"/.zprezto/runcoms/^README.md(.N); do
  ln -s "$rcfile" "${ZDOTDIR:-$HOME}/.${rcfile:t}"
done

# clone powerline fonts
git clone https://github.com/powerline/fonts.git --depath=1 "$HOME/fonts"

# install
$HOME/fonts/install.sh

# remove installer
rm -rf "$HOME/fonts"

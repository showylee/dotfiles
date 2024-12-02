export TERM="xterm-256color"
typeset -U path PATH
path=(
  /opt/homebrew/bin(N-/)
  /opt/homebrew/sbin(N-/)
  /usr/bin
  /usr/sbin
  /bin
  /sbin
  /usr/local/bin(N-/)
  /usr/local/sbin(N-/)
  /Library/Apple/usr/bin(N-/)
)
export PATH=$PATH:$HOME/Library/Python/3.7/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export GO111MODULE=on
export PATH=$PATH:$HOME/bin
export PATH=$HOME/.nodebrew/current/bin:$PATH
export PYENV_ROOT=$HOME/.pyenv
export PATH=$PYENV_ROOT/shims:$HOME/.local/bin:$PATH

# ruby version management
if rbenv -v; then
  eval "$(rbenv init -)"
fi

autoload -Uz vcs_info
setopt prompt_subst
zstyle ':vcs_info:git:*' check-for-changes true
zstyle ':vcs_info:git:*' stagedstr "%F{yellow}!"
zstyle ':vcs_info:git:*' unstagedstr "%F{red}+"
zstyle ':vcs_info:*' formats "%F{green}%c%u[%b]%f"
zstyle ':vcs_info:*' actionformats "[%b|%a]"
precmd () { vcs_info }

PROMPT='
[%B%F{cyan}%n@%m%f%b:%F{green}%~%f]%F{cyan}$vcs_info_msg_0_%f
%F{white}$%f '
#PS1="%{$fg[cyan]%}[${USER} %1~[$vcs_info_msg_0]]%(!.#.$)${reset_color}"

if [[ ! -n $TMUX && $- == *l* ]]; then
  ID="`tmux list-sessions`"
  if [[ -z "$ID" ]]; then
    tmux new-session
  fi
  create_new_session="Create New Session"
  ID="$ID\n${create_new_session}:"
  ID="`echo $ID | $PERCOL | cut -d: -f1`"
  if [[ "$ID" = "${create_new_session}" ]]; then
    tmux new-session
  elif [[ -n "$ID" ]]; then
    tmux attach-session -t "$ID"
  else
    : # Start terminal normally
  fi
fi

#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#

# Source Prezto.
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Customize to your needs...
POWERLEVEL9K_RPROMPT_ON_NEWLINE=true
POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(dir newline vcs)
POWERLEVEL9K_PROMPT_ADD_NEWLINE=true

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/s10066/Downloads/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/s10066/Downloads/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/s10066/Downloads/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/s10066/Downloads/google-cloud-sdk/completion.zsh.inc'; fi

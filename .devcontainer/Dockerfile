FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Install dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        tmux \
        curl \
        git \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure npm global path for non-root user
USER $USERNAME
WORKDIR /home/$USERNAME

# Set npm prefix and install Claude Code CLI
ENV NPM_CONFIG_PREFIX=/home/$USERNAME/.npm-global
ENV PATH=/home/$USERNAME/.npm-global/bin:$PATH

RUN mkdir -p /home/$USERNAME/.npm-global \
    && npm install -g @anthropic-ai/claude-code

# Add PATH to shell configs
RUN echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc \
    && echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc

# Add multi-agent-shogun aliases
RUN echo '' >> ~/.bashrc \
    && echo '# multi-agent-shogun aliases' >> ~/.bashrc \
    && echo 'alias css="cd /workspaces/multi-agent-shogun-kakeibo && ./shutsujin_departure.sh"' >> ~/.bashrc \
    && echo 'alias csm="cd /workspaces/multi-agent-shogun-kakeibo"' >> ~/.bashrc \
    && echo 'alias cshogun="tmux attach-session -t shogun"' >> ~/.bashrc \
    && echo 'alias cmulti="tmux attach-session -t multiagent"' >> ~/.bashrc

# Set working directory
WORKDIR /workspaces/multi-agent-shogun-kakeibo

# Default shell
ENV SHELL=/bin/bash
ENV TERM=xterm-256color

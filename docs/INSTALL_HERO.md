# Installing Hero Template Engine

The Hero CLI tool is located in a subdirectory of the repository. Use one of these methods:

## Method 1: Direct Install (Recommended)

```bash
go install github.com/shiyanhui/hero/hero@latest
```

If you get TLS/certificate errors:
```bash
GOPROXY=direct go install github.com/shiyanhui/hero/hero@latest
```

## Method 2: Clone and Build

```bash
# Clone the repository
git clone https://github.com/shiyanhui/hero.git /tmp/hero
cd /tmp/hero/hero

# Build and install
go install

# Clean up
cd ~
rm -rf /tmp/hero
```

## Method 3: Download Pre-built Binary

Visit the [Hero releases page](https://github.com/shiyanhui/hero/releases) and download the binary for your platform.

## Verify Installation

After installation, verify it works:

```bash
hero --version
```

If the command is not found, make sure `$HOME/go/bin` is in your PATH:

```bash
export PATH=$PATH:$HOME/go/bin
```

Add this to your `~/.zshrc` or `~/.bashrc` to make it permanent.


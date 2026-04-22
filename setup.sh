#!/usr/bin/env bash
# =============================================================
# Nexa Safety — Local Development Setup Script
# Supports: macOS (Homebrew), Debian/Ubuntu (apt), RHEL/Fedora (dnf)
# =============================================================

set -euo pipefail

# ---------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}▶ $*${RESET}"; }

# ---------------------------------------------------------------
# Detect OS / package manager
# ---------------------------------------------------------------
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif command -v apt-get &>/dev/null; then
        OS="debian"
    elif command -v dnf &>/dev/null; then
        OS="fedora"
    elif command -v yum &>/dev/null; then
        OS="rhel"
    else
        OS="unknown"
    fi
    info "Detected OS: $OS"
}

# ---------------------------------------------------------------
# 1. Check Node.js
# ---------------------------------------------------------------
check_node() {
    step "Checking Node.js"

    if command -v node &>/dev/null; then
        NODE_VER=$(node --version)
        success "Node.js found: $NODE_VER"

        # Warn if below v18
        MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
        if [[ "$MAJOR" -lt 18 ]]; then
            warn "Node.js $NODE_VER is below the recommended v18. Consider upgrading."
        fi
    else
        error "Node.js is not installed."
        echo "  Install it from https://nodejs.org or via your package manager:"
        echo "    macOS:  brew install node"
        echo "    Ubuntu: sudo apt-get install -y nodejs"
        exit 1
    fi
}

# ---------------------------------------------------------------
# 2. Check npm
# ---------------------------------------------------------------
check_npm() {
    step "Checking npm"

    if command -v npm &>/dev/null; then
        success "npm found: $(npm --version)"
    else
        error "npm is not installed. It normally ships with Node.js."
        exit 1
    fi
}

# ---------------------------------------------------------------
# 3. Install PostgreSQL client tools (psql)
# ---------------------------------------------------------------
install_psql() {
    step "Checking PostgreSQL client (psql)"

    if command -v psql &>/dev/null; then
        success "psql found: $(psql --version)"
        return
    fi

    warn "psql not found — attempting to install PostgreSQL client tools..."

    case "$OS" in
        macos)
            if ! command -v brew &>/dev/null; then
                error "Homebrew is required to install psql on macOS."
                echo "  Install Homebrew: https://brew.sh"
                exit 1
            fi
            info "Running: brew install libpq"
            brew install libpq
            # libpq is keg-only; add to PATH for this session
            LIBPQ_BIN="$(brew --prefix libpq)/bin"
            export PATH="$LIBPQ_BIN:$PATH"
            echo ""
            warn "Add the following line to your shell profile (~/.zshrc or ~/.bash_profile)"
            warn "so psql is available in future sessions:"
            echo ""
            echo "    export PATH=\"\$(brew --prefix libpq)/bin:\$PATH\""
            echo ""
            ;;
        debian)
            info "Running: sudo apt-get install -y postgresql-client"
            sudo apt-get update -qq
            sudo apt-get install -y postgresql-client
            ;;
        fedora)
            info "Running: sudo dnf install -y postgresql"
            sudo dnf install -y postgresql
            ;;
        rhel)
            info "Running: sudo yum install -y postgresql"
            sudo yum install -y postgresql
            ;;
        *)
            error "Cannot auto-install psql on this OS."
            echo "  Please install the PostgreSQL client manually:"
            echo "    https://www.postgresql.org/download/"
            exit 1
            ;;
    esac

    if command -v psql &>/dev/null; then
        success "psql installed: $(psql --version)"
    else
        error "psql installation failed. Please install it manually."
        exit 1
    fi
}

# ---------------------------------------------------------------
# 4. Install npm dependencies
# ---------------------------------------------------------------
install_deps() {
    step "Installing npm dependencies"

    if [[ ! -f "package.json" ]]; then
        error "package.json not found. Run this script from the project root."
        exit 1
    fi

    npm install
    success "npm dependencies installed"
}

# ---------------------------------------------------------------
# 5. Create .env from .env.example
# ---------------------------------------------------------------
setup_env() {
    step "Setting up .env file"

    if [[ -f ".env" ]]; then
        warn ".env already exists — skipping. Edit it manually if needed."
        return
    fi

    if [[ ! -f ".env.example" ]]; then
        error ".env.example not found. Cannot create .env."
        exit 1
    fi

    cp .env.example .env
    success ".env created from .env.example"
    warn "Open .env and fill in your DATABASE_URL before starting the server."
}

# ---------------------------------------------------------------
# 6. Print connection instructions
# ---------------------------------------------------------------
print_instructions() {
    step "Next steps"

    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}  Nexa Safety — Setup Complete${RESET}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    echo -e "  ${CYAN}1. Configure your database connection${RESET}"
    echo "     Edit .env and set DATABASE_URL to your PostgreSQL connection string."
    echo "     Railway example:"
    echo "       DATABASE_URL=postgresql://postgres:<password>@<host>:<port>/railway"
    echo ""
    echo -e "  ${CYAN}2. Initialise the database schema${RESET}"
    echo "     The server auto-creates all tables on first boot via initDB()."
    echo "     Alternatively, run the SQL script manually:"
    echo "       psql \"\$DATABASE_URL\" -f db-init.sql"
    echo ""
    echo -e "  ${CYAN}3. (Optional) Load sample data${RESET}"
    echo "       psql \"\$DATABASE_URL\" -f seed-data.sql"
    echo ""
    echo -e "  ${CYAN}4. Start the development server${RESET}"
    echo "       npm start"
    echo "     The API will be available at http://localhost:3000"
    echo ""
    echo -e "  ${CYAN}5. Connect to the database interactively${RESET}"
    echo "       psql \"\$DATABASE_URL\""
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
}

# ---------------------------------------------------------------
# Main
# ---------------------------------------------------------------
main() {
    echo ""
    echo -e "${BOLD}✈️  Nexa Safety — Development Environment Setup${RESET}"
    echo ""

    detect_os
    check_node
    check_npm
    install_psql
    install_deps
    setup_env
    print_instructions
}

main "$@"

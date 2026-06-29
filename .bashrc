# ~/.bashrc: Được thực thi bởi bash(1) cho các shell không đăng nhập.
# Xem thêm: /usr/share/doc/bash/examples/startup-files (trong package bash-doc)
# để biết các ví dụ.

# Nếu không chạy tương tác thì không làm gì cả
[ -z "$PS1" ] && return

# Không lưu các dòng trùng lặp trong history. Xem bash(1) để biết thêm tùy chọn.
HISTCONTROL=ignoredups:ignorespace

# Ghi nối tiếp vào file history, không ghi đè
shopt -s histappend

# Tăng độ dài history
HISTSIZE=10000
HISTFILESIZE=20000

# Kiểm tra kích thước cửa sổ sau mỗi lệnh
shopt -s checkwinsize

# Sửa lỗi gõ tự động
shopt -s cdspell

# Làm cho less thân thiện hơn với các file không phải văn bản
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# Đặt biến xác định chroot bạn đang làm việc trong đó (dùng trong prompt bên dưới)
if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# Đặt prompt đẹp (không màu, trừ khi chúng ta "muốn" màu)
case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

# Bỏ chú thích để có prompt màu nếu terminal hỗ trợ; tắt mặc định để không làm phân tâm
# người dùng: tập trung trong cửa sổ terminal nên là output của lệnh, không phải prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# Chúng ta có hỗ trợ màu; giả sử tuân thủ Ecma-48 (ISO/IEC-6429)
	# (Thiếu hỗ trợ này rất hiếm, và trường hợp đó sẽ hỗ trợ setf thay vì setaf)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

# Nếu là xterm, đặt tiêu đề thành user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

# Bật hỗ trợ màu cho ls và thêm các alias tiện ích
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# Một số alias ls khác
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias bashrc='source ~/.bashrc'

# Định nghĩa alias.
# Bạn có thể muốn đưa tất cả các bổ sung vào một file riêng như
# ~/.bash_aliases, thay vì thêm trực tiếp vào đây.
# Xem /usr/share/doc/bash-doc/examples trong package bash-doc.

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# Bật các tính năng hoàn thành lập trình
if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
    . /etc/bash_completion
fi
# Bỏ # để apply script tự động chạy backend-core 
# bash /storage/emulated/0/coder/media/ubuntu-backend-core/scripts/auto_start.sh

# ═══════════════════════════════════════════════════════════════════
#  🔧 ALIAS DỰ ÁN
# ═══════════════════════════════════════════════════════════════════
alias myenv='cd ~ && source myenv/bin/activate'
alias deploy='python3 /storage/emulated/0/coder/media/deploy.py'
alias update='python3 /storage/emulated/0/coder/media/update.py'
alias rename='python3 /storage/emulated/0/coder/media/rename.py'
alias track='python3 /storage/emulated/0/coder/media/tracks.py'
alias server='~/myenv/bin/python3 /storage/emulated/0/coder/media/server.py'
alias backend='bash /storage/emulated/0/coder/media/ubuntu-backend-core/scripts/auto_start.sh'
alias avatar='~/myenv/bin/python3 /root/avatar-server/run_server.py'

alias clean='apt autoremove -y && apt clean && rm -rf ~/.cache/* && echo "✅ Đã dọn dẹp rác hệ thống!"'
alias troly='unset LD_PRELOAD LD_LIBRARY_PATH && ~/myenv/bin/python3 /sdcard/coder/media/app.py'
alias runai='~/run_ai.sh'
alias meta='cd ~/meta && yarn dev'
alias galleryflow='cd ~/galleryflow && yarn dev'
alias chatbox='~/myenv/bin/python3 /sdcard/coder/media/Ai-ChatBox/server.py'



# ═══════════════════════════════════════════════════════════════════
#  🎯 QUICK CD & MKCD
# ═══════════════════════════════════════════════════════════════════

# Quick cd - lùi thư mục nhanh
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias .....='cd ../../../..'

# Mkcd - Tạo folder + cd vào luôn
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# ═══════════════════════════════════════════════════════════════════
#  🔍 TÌM KIẾM NHANH
# ═══════════════════════════════════════════════════════════════════

# Tìm file
findf() {
    find . -type f -name "*$1*" 2>/dev/null
}

# Tìm folder
findd() {
    find . -type d -name "*$1*" 2>/dev/null
}

# ═══════════════════════════════════════════════════════════════════
#  🛑 STOP / RESTART SERVICES
# ═══════════════════════════════════════════════════════════════════

# Stop code-server
stopcode() {
    if pgrep -f "code-server" > /dev/null 2>&1; then
        pkill -f "code-server"
        echo -e "  ${GREEN}✅ Đã dừng code-server${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Code-server không chạy${NC}"
    fi
}

# Stop web server
stopserver() {
    if pgrep -f "server.*1515" > /dev/null 2>&1 || pgrep -f ".*1515" > /dev/null 2>&1; then
        pkill -f ".*1515"
        echo -e "  ${GREEN}✅ Đã dừng web server (Port 1515)${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Web server không chạy${NC}"
    fi
}

# Restart code-server
restartcode() {
    stopcode
    sleep 1
    echo -e "  ${YELLOW}🚀 Đang khởi động lại code-server...${NC}"
    nohup code-server --bind-addr 0.0.0.0:8080 --auth none > /dev/null 2>&1 &
    sleep 2
    echo -e "  ${GREEN}✅ Đã khởi động lại code-server!${NC}"
    echo -e "  ${CYAN}➜${NC} ${WHITE}Localhost${NC}: ${CYAN}http://127.0.0.1:8080${NC}"
    echo -e "  ${CYAN}➜${NC} ${WHITE}WiFi IP${NC}:   ${CYAN}http://${IP_WAN}:8080${NC}"
}

# Restart web server
restartserver() {
    stopserver
    sleep 1
    echo -e "  ${YELLOW}🚀 Đang khởi động lại web server...${NC}"
    nohup python3 /storage/emulated/0/coder/media/server.py > /dev/null 2>&1 &
    sleep 2
    echo -e "  ${GREEN}✅ Đã khởi động lại web server!${NC}"
    echo -e "  ${CYAN}➜${NC} ${WHITE}Localhost${NC}: ${CYAN}http://127.0.0.1:1515${NC}"
    echo -e "  ${CYAN}➜${NC} ${WHITE}WiFi IP${NC}:   ${CYAN}http://${IP_WAN}:1515${NC}"
}

# ═══════════════════════════════════════════════════════════════════
#  🌐 PORT CHECK
# ═══════════════════════════════════════════════════════════════════

portcheck() {
    echo -e ""
    echo -e "  ${WHITE}╭──────────────────────────────────────────────────────────────╮${NC}"
    echo -e "  ${WHITE}│${NC}  ${LMAGENTA}📡 KIỂM TRA PORT ĐANG DÙNG${NC}"
    echo -e "  ${WHITE}╰──────────────────────────────────────────────────────────────╯${NC}"
    echo -e ""
    echo -e "  ${CYAN}Port 8080 (code-server):${NC}"
    if netstat -tlnp 2>/dev/null | grep ':8080' > /dev/null; then
        netstat -tlnp 2>/dev/null | grep ':8080' | while read line; do
            echo -e "    ${GREEN}●${NC} $line"
        done
    else
        echo -e "    ${GRAY}○ Không có process${NC}"
    fi
    echo -e ""
    echo -e "  ${CYAN}Port 1515 (web server):${NC}"
    if netstat -tlnp 2>/dev/null | grep ':1515' > /dev/null; then
        netstat -tlnp 2>/dev/null | grep ':1515' | while read line; do
            echo -e "    ${GREEN}●${NC} $line"
        done
    else
        echo -e "    ${GRAY}○ Không có process${NC}"
    fi
    echo -e ""
}

# ═══════════════════════════════════════════════════════════════════
#  ✏️ QUICK EDIT BASHRC
# ═══════════════════════════════════════════════════════════════════

alias editbash='nano ~/.bashrc'

# ═══════════════════════════════════════════════════════════════════
#  🐙 GIT ALIAS & PROMPT
# ═══════════════════════════════════════════════════════════════════

# Git aliases
alias gs='git status'
alias gc='git commit'
alias gca='git commit -a'
alias gp='git push'
alias gpl='git pull'
alias gd='git diff'
alias gl='git log --oneline -10'
alias ga='git add'
alias gaa='git add --all'
alias gb='git branch'
alias gco='git checkout'
alias gcb='git checkout -b'

# Hàm hiển thị Git branch trong prompt
parse_git_branch() {
    git branch 2>/dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'
}

# ═══════════════════════════════════════════════════════════════════
#  🎨 PROMPT ĐẸP VỚI GIT BRANCH
# ═══════════════════════════════════════════════════════════════════

# Màu cho prompt
export PROMPT_COLOR_GREEN='\[\033[01;32m\]'
export PROMPT_COLOR_BLUE='\[\033[01;34m\]'
export PROMPT_COLOR_YELLOW='\[\033[01;33m\]'
export PROMPT_COLOR_PURPLE='\[\033[01;35m\]'
export PROMPT_COLOR_CYAN='\[\033[01;36m\]'
export PROMPT_COLOR_RED='\[\033[01;31m\]'
export PROMPT_COLOR_RESET='\[\033[00m\]'

# Prompt với git branch
PS1="${debian_chroot:+($debian_chroot)}${PROMPT_COLOR_GREEN}\u${PROMPT_COLOR_RESET}@${PROMPT_COLOR_BLUE}\h${PROMPT_COLOR_RESET}:${PROMPT_COLOR_YELLOW}\w${PROMPT_COLOR_PURPLE}\$(parse_git_branch)${PROMPT_COLOR_RESET}\$ "

# ═══════════════════════════════════════════════════════════════════
#  🔋 THÔNG BÁO PIN
# ═══════════════════════════════════════════════════════════════════

# Lấy thông tin pin
get_battery_info() {
    if [ -f /sys/class/power_supply/battery/capacity ]; then
        BATTERY_LEVEL=$(cat /sys/class/power_supply/battery/capacity 2>/dev/null)
        BATTERY_STATUS=$(cat /sys/class/power_supply/battery/status 2>/dev/null)
        
        if [ "$BATTERY_STATUS" = "Charging" ]; then
            BATTERY_ICON="⚡"
            BATTERY_COLOR="${GREEN}"
        elif [ "$BATTERY_LEVEL" -le 20 ]; then
            BATTERY_ICON="🪫"
            BATTERY_COLOR="${RED}"
        elif [ "$BATTERY_LEVEL" -le 50 ]; then
            BATTERY_ICON="🔋"
            BATTERY_COLOR="${YELLOW}"
        else
            BATTERY_ICON="🔋"
            BATTERY_COLOR="${GREEN}"
        fi
        
        echo -e "${BATTERY_COLOR}${BATTERY_ICON} ${BATTERY_LEVEL}%${NC}"
    else
        echo -e "${GRAY}🔌 Không xác định${NC}"
    fi
}

BATTERY_INFO=$(get_battery_info)

# ═══════════════════════════════════════════════════════════════════
#  🚀 DASHBOARD TERMINAL CỰC NGẦU - BỞI D4M-DEV
# ═══════════════════════════════════════════════════════════════════

# Bảng màu nâng cao
GREEN='\033[0;32m'
LGREEN='\033[1;32m'
CYAN='\033[0;36m'
LCYAN='\033[1;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
LRED='\033[1;31m'
MAGENTA='\033[0;35m'
LMAGENTA='\033[1;35m'
BLUE='\033[0;34m'
LBLUE='\033[1;34m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # Không màu

# Hiệu ứng gradient màu
GRADIENT_START='\033[38;5;39m'
GRADIENT_MID='\033[38;5;123m'
GRADIENT_END='\033[38;5;207m'

# Giữ máy luôn thức
termux-wake-lock 2>/dev/null

# Lấy IP 127.0.0.1 (localhost)
IP_LOCAL="127.0.0.1"

# Lấy IP mạng nội bộ (để truy cập từ máy khác trong cùng WiFi)
IP_WAN=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | grep -v '172.16.' | awk '{print $2}' | head -1)
[ -z "$IP_WAN" ] && IP_WAN=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)
[ -z "$IP_WAN" ] && IP_WAN=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$IP_WAN" ] && IP_WAN="${GRAY}Không thể xác định${NC}"

# ═══════════════════════════════════════════════════════════════════
#  🎨 LOGO ASCII ART VỚI HIỆU ỨNG ĐẸP
# ═══════════════════════════════════════════════════════════════════

echo -e ""
echo -e "${GRADIENT_START}  ╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GRADIENT_MID}  ║${NC}                ${LMAGENTA}⚡${NC} ${WHITE}WELCOME TO${NC} ${LCYAN}TERMINAL PRO${NC} ${LMAGENTA}⚡${NC}              ${GRADIENT_MID}║${NC}"
echo -e "${GRADIENT_END}  ╚═══════════════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  ${LRED}██████╗${NC} ${LCYAN}██╗  ██╗${NC} ${LGREEN}███╗   ███╗${NC}         ${LRED}██████╗${NC} ${LCYAN}███████╗${NC}${LGREEN}██╗   ██╗${NC}"
echo -e "  ${LRED}██╔══██╗${NC}${LCYAN}██║  ██║${NC} ${LGREEN}████╗ ████║${NC}         ${LRED}██╔══██╗${NC}${LCYAN}██╔════╝${NC}${LGREEN}██║   ██║${NC}"
echo -e "  ${LRED}██║  ██║${NC}${LCYAN}███████║${NC} ${LGREEN}██╔████╔██║${NC} ${WHITE}██████╗${NC} ${LRED}██║  ██║${NC}${LCYAN}█████╗${NC}  ${LGREEN}██║   ██║${NC}"
echo -e "  ${LRED}██║  ██║${NC}${LCYAN}╚════██║${NC} ${LGREEN}██║╚██╔╝██║${NC} ${WHITE}╚═════╝${NC} ${LRED}██║  ██║${NC}${LCYAN}██╔══╝${NC}  ${LGREEN}╚██╗ ██╔╝${NC}"
echo -e "  ${LRED}██████╔╝${NC}${LCYAN}     ██║${NC} ${LGREEN}██║ ╚═╝ ██║${NC}         ${LRED}██████╔╝${NC}${LCYAN}███████╗${NC} ${LGREEN}╚████╔╝${NC}"
echo -e ""
echo -e "        ${WHITE}👤 System Operator:${NC} ${CYAN}D4M-DEV${NC}"
echo -e ""

# ═══════════════════════════════════════════════════════════════════
#  📊 BẢNG THÔNG TIN HỆ THỐNG
# ═══════════════════════════════════════════════════════════════════

# Lấy thông tin hệ thống
DATETIME=$(date '+%H:%M:%S 📅 %d/%m/%Y')
DEVICE=$(getprop ro.product.model 2>/dev/null || echo "Unknown")
ANDROID_VER=$(getprop ro.build.version.release 2>/dev/null || echo "Unknown")
RAM_USAGE=$(free -h | awk '/Mem:/ {print $3 "/" $2}' 2>/dev/null || echo "Unknown")
CPU_LOAD=$(cat /proc/loadavg | awk '{print $1}' 2>/dev/null || echo "Unknown")
DISK_AVAIL=$(df -h /data | awk 'NR==2 {print $4}' 2>/dev/null || echo "Unknown")

# Kiểm tra code-server (Port 8080)
if pgrep -f "code-server" > /dev/null 2>&1; then
    CODE_STATUS="${GREEN}● ONLINE${NC}"
    CODE_URL="${CYAN}http://127.0.0.1${NC} ${GRAY}hoặc${NC} ${CYAN}http://${IP_WAN}:8080${NC}"
else
    CODE_STATUS="${GRAY}○ OFFLINE${NC}"
    CODE_URL="${GRAY}Chạy 'run' để khởi động${NC}"
fi

# Kiểm tra WEB APP (Port 1515)
if pgrep -f "server.*1515" > /dev/null 2>&1 || pgrep -f ".*1515" > /dev/null 2>&1; then
    WEBAPP_STATUS="${GREEN}● ONLINE${NC}"
    WEBAPP_URL="${CYAN}http://127.0.0.1:1515${NC} ${GRAY}hoặc${NC} ${CYAN}http://${IP_WAN}:1515${NC}"
else
    WEBAPP_STATUS="${GRAY}○ OFFLINE${NC}"
    WEBAPP_URL="${GRAY}Chạy 'server' để khởi động${NC}"
fi

# Hiển thị Dashboard với border đẹp
echo -e "  ${WHITE}╭──────────────────────────────────────────────────────────────╮${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🖥️${NC} ${WHITE}THIẾT BỊ${NC}     : ${CYAN}${DEVICE}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🤖${NC} ${WHITE}ANDROID${NC}    : ${CYAN}${ANDROID_VER}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🔋${NC} ${WHITE}PIN${NC}        : ${BATTERY_INFO}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🏠${NC} ${WHITE}LOCALHOST${NC}  : ${YELLOW}${IP_LOCAL}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🌐${NC} ${WHITE}IP NETWORK${NC}  : ${YELLOW}${IP_WAN}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}💾${NC} ${WHITE}RAM USAGE${NC}   : ${CYAN}${RAM_USAGE}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}🧠${NC} ${WHITE}CPU LOAD${NC}    : ${CYAN}${CPU_LOAD}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}💽${NC} ${WHITE}DISK FREE${NC}   : ${CYAN}${DISK_AVAIL}${NC}"
echo -e "  ${WHITE}│${NC}  ${LMAGENTA}⏰${NC} ${WHITE}THỜI GIAN${NC}   : ${WHITE}${DATETIME}${NC}"
echo -e "  ${WHITE}├──────────────────────────────────────────────────────────────┤${NC}"
echo -e "  ${WHITE}│${NC}  ${GREEN}📦${NC} ${WHITE}CODE SERVER${NC}  : ${CODE_STATUS}"
echo -e "  ${WHITE}│${NC}     ${CYAN}➜${NC} ${WHITE}URL${NC}: ${CODE_URL}"
echo -e "  ${WHITE}│${NC}  ${YELLOW}🚀${NC} ${WHITE}WEB APP${NC}    : ${WEBAPP_STATUS}"
echo -e "  ${WHITE}│${NC}     ${CYAN}➜${NC} ${WHITE}URL${NC}: ${WEBAPP_URL}"
echo -e "  ${WHITE}╰──────────────────────────────────────────────────────────────╯${NC}"
echo -e ""

# ═══════════════════════════════════════════════════════════════════
#  🚀 LỆNH TẮT KHỞI ĐỘNG CODE-SERVER THÔNG MINH
# ═══════════════════════════════════════════════════════════════════

run() {
    # Kiểm tra code-server đã chạy chưa
    if pgrep -f "code-server" > /dev/null 2>&1; then
        # Đã chạy rồi, hiển thị địa chỉ truy cập
        echo -e ""
        echo -e "  ${GREEN}╭────────────────────────────────────────────────────────────╮${NC}"
        echo -e "  ${GREEN}│${NC}  ${WHITE}✅ CODE-SERVER ĐÃ CHẠY${NC}"
        echo -e "  ${GREEN}│${NC}     ${CYAN}➜${NC} ${WHITE}Localhost${NC}: ${CYAN}http://127.0.0.1:8080${NC}"
        echo -e "  ${GREEN}│${NC}     ${CYAN}➜${NC} ${WHITE}WiFi IP${NC}:   ${CYAN}http://${IP_WAN}:8080${NC}"
        echo -e "  ${GREEN}╰────────────────────────────────────────────────────────────╯${NC}"
        echo -e ""
    else
        # Chưa chạy, khởi động code-server
        echo -e ""
        echo -e "  ${YELLOW}🚀 Đang khởi động code-server...${NC}"
        echo -e ""
        code-server --bind-addr 0.0.0.0:8080 --auth none
    fi
}

# ═══════════════════════════════════════════════════════════════════
#  🔥 TỰ ĐỘNG KHỞI ĐỘNG CODE-SERVER KHI MỞ TERMUX
# ═══════════════════════════════════════════════════════════════════

# Hàm kiểm tra và khởi động code-server tự động
auto_start_code_server() {
    if pgrep -f "code-server" > /dev/null 2>&1; then
        # Đã chạy rồi - Dashboard đã hiển thị thông tin, không in thêm
        :
    else
        # Chưa chạy, khởi động code-server trong background
        echo -e ""
        echo -e "  ${YELLOW}🚀 Tự động khởi động code-server...${NC}"
        nohup code-server --bind-addr 0.0.0.0:8080 --auth none > /dev/null 2>&1 &
        sleep 2
        echo -e "  ${GREEN}✅ Đã khởi động code-server thành công!${NC}"
        echo -e ""
    fi
}

# Gọi hàm tự động khởi động
auto_start_code_server

# ═══════════════════════════════════════════════════════════════════
#  💡 HƯỚNG DẪN LỆNH TẮT
# ═══════════════════════════════════════════════════════════════════

echo -e "  ${GRAY}╭──────────────────────────────────────────────────────────────╮${NC}"
echo -e "  ${GRAY}│${NC}  ${WHITE}⌨️  CÁC LỆNH TẮT:${NC}"
echo -e "  ${GRAY}│${NC}"
echo -e "  ${GRAY}│${NC}  ${LMAGENTA}🚀 SERVICES:${NC}"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• run${NC}         → Khởi động code-server (Port 8080)"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• server${NC}      → Khởi động web server (Port 1515)"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• stopcode${NC}    → Dừng code-server"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• stopserver${NC}  → Dừng web server"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• restartcode${NC} → Restart code-server"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• restartserver${NC} → Restart web server"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• portcheck${NC}   → Kiểm tra port đang dùng"
echo -e "  ${GRAY}│${NC}"
echo -e "  ${GRAY}│${NC}  ${LMAGENTA}📁 FILE & FOLDER:${NC}"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• ..${NC}          → Lùi 1 thư mục"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• ...${NC}         → Lùi 2 thư mục"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• mkcd${NC}        → Tạo folder + cd vào"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• findf${NC}       → Tìm file"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• findd${NC}       → Tìm folder"
echo -e "  ${GRAY}│${NC}"
echo -e "  ${GRAY}│${NC}  ${LMAGENTA}🐙 GIT:${NC}"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gs${NC}          → git status"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gc${NC}          → git commit"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gp${NC}          → git push"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gpl${NC}         → git pull"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gd${NC}          → git diff"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gl${NC}          → git log (10 dòng)"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• ga${NC}          → git add"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gb${NC}          → git branch"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gco${NC}         → git checkout"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• gcb${NC}         → git checkout -b"
echo -e "  ${GRAY}│${NC}"
echo -e "  ${GRAY}│${NC}  ${LMAGENTA}🛠️  HỆ THỐNG:${NC}"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• deploy${NC}      → Deploy dự án"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• update${NC}      → Cập nhật hệ thống"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• track${NC}       → Theo dõi tiến trình"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• clean${NC}       → Dọn dẹp rác"
echo -e "  ${GRAY}│${NC}     ${YELLOW}• editbash${NC}    → Sửa file .bashrc"
echo -e "  ${GRAY}╰──────────────────────────────────────────────────────────────╯${NC}"
echo -e ""
. "$HOME/.cargo/env"

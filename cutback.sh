#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

BACKEND_PID_FILE="$SCRIPT_DIR/.cutback_backend.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/.cutback_frontend.pid"
BACKEND_LOG_FILE="$SCRIPT_DIR/.cutback_backend.log"
FRONTEND_LOG_FILE="$SCRIPT_DIR/.cutback_frontend.log"

BACKEND_PORT=3000
FRONTEND_PORT=8080

start_process() {
    local dir=$1
    local cmd=$2
    local pid_file=$3
    local log_file=$4
    local name=$5

    if [ -f "$pid_file" ] && ps -p $(cat "$pid_file") > /dev/null 2>&1; then
        echo "$name is already running (PID $(cat "$pid_file"))."
    else
        echo "Starting $name..."
        cd "$dir" || return
        # Run command in background
        eval "$cmd > \"$log_file\" 2>&1 &"
        echo $! > "$pid_file"
        echo "$name started (PID $(cat "$pid_file")). Log: $(basename "$log_file")"
        cd "$SCRIPT_DIR" || return
    fi
}

stop_process() {
    local pid_file=$1
    local name=$2
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (MSYS PID $pid)..."
            win_pid=$(cat /proc/$pid/winpid 2>/dev/null)
            if [ -n "$win_pid" ]; then
                taskkill //F //T //PID $win_pid > /dev/null 2>&1
            else
                kill -9 $pid > /dev/null 2>&1
            fi
            echo "$name stopped."
        else
            echo "$name is not running (stale PID file)."
        fi
        rm -f "$pid_file"
    else
        echo "$name is not running."
    fi
}

check_status() {
    echo "--- STATUS ---"
    # Backend
    if [ -f "$BACKEND_PID_FILE" ] && ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
        echo "Backend: RUNNING (PID $(cat "$BACKEND_PID_FILE")) -> http://localhost:$BACKEND_PORT"
    else
        echo "Backend: STOPPED"
    fi
    # Frontend
    if [ -f "$FRONTEND_PID_FILE" ] && ps -p $(cat "$FRONTEND_PID_FILE") > /dev/null 2>&1; then
        echo "Frontend: RUNNING (PID $(cat "$FRONTEND_PID_FILE")) -> http://localhost:$FRONTEND_PORT"
    else
        echo "Frontend: STOPPED"
    fi
    echo ""
    echo "--- PORTS ---"
    netstat -ano | grep -E "LISTENING" | grep -E ":($BACKEND_PORT|$FRONTEND_PORT)\b" || echo "Ports $BACKEND_PORT and $FRONTEND_PORT are not listening."
    echo "-------------"
}

ports_menu() {
    while true; do
        echo ""
        echo "=== PORTS MENU ==="
        echo "1. LIST (View all listening ports)"
        echo "2. KILL (Kill process by port)"
        echo "0. BACK"
        read -p "Select option: " p_opt
        case $p_opt in
            1)
                echo "Listening Ports:"
                netstat -ano | grep "LISTENING"
                ;;
            2)
                read -p "Enter port number to kill: " target_port
                if [[ ! "$target_port" =~ ^[0-9]+$ ]]; then
                    echo "Invalid port number."
                    continue
                fi
                win_pid=$(netstat -ano | grep "LISTENING" | awk '{print $2, $5}' | grep ":$target_port " | awk '{print $2}' | head -n 1)
                if [ -n "$win_pid" ]; then
                    echo "Process listening on port $target_port is Windows PID $win_pid:"
                    tasklist //FI "PID eq $win_pid"
                    read -p "Kill this process? (y/n): " confirm
                    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                        taskkill //F //T //PID $win_pid
                    else
                        echo "Cancelled."
                    fi
                else
                    echo "No listening process found on port $target_port."
                fi
                ;;
            0)
                return
                ;;
            *)
                echo "Invalid option."
                ;;
        esac
    done
}

while true; do
    echo ""
    echo "=== CUTBACK MANAGER ==="
    echo "1. ON      - Start frontend & backend"
    echo "2. OFF     - Stop frontend & backend"
    echo "3. RESTART - Restart both"
    echo "4. STATUS  - Check status and ports"
    echo "5. PORTS   - Manage ports"
    echo "0. EXIT"
    read -p "Select option: " opt

    case $opt in
        1)
            start_process "$BACKEND_DIR" "npm run dev" "$BACKEND_PID_FILE" "$BACKEND_LOG_FILE" "Backend"
            start_process "$FRONTEND_DIR" "npm run dev -- --port $FRONTEND_PORT" "$FRONTEND_PID_FILE" "$FRONTEND_LOG_FILE" "Frontend"
            echo ""
            echo "==> Backend URL:  http://localhost:$BACKEND_PORT"
            echo "==> Frontend URL: http://localhost:$FRONTEND_PORT"
            ;;
        2)
            stop_process "$BACKEND_PID_FILE" "Backend"
            stop_process "$FRONTEND_PID_FILE" "Frontend"
            ;;
        3)
            stop_process "$BACKEND_PID_FILE" "Backend"
            stop_process "$FRONTEND_PID_FILE" "Frontend"
            sleep 1
            start_process "$BACKEND_DIR" "npm run dev" "$BACKEND_PID_FILE" "$BACKEND_LOG_FILE" "Backend"
            start_process "$FRONTEND_DIR" "npm run dev -- --port $FRONTEND_PORT" "$FRONTEND_PID_FILE" "$FRONTEND_LOG_FILE" "Frontend"
            echo ""
            echo "==> Backend URL:  http://localhost:$BACKEND_PORT"
            echo "==> Frontend URL: http://localhost:$FRONTEND_PORT"
            ;;
        4)
            check_status
            ;;
        5)
            ports_menu
            ;;
        0)
            echo "Exiting."
            exit 0
            ;;
        *)
            echo "Invalid option."
            ;;
    esac
done


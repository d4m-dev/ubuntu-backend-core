import sqlite3
import os
import mysql.connector
from mysql.connector import pooling
from core.config import settings

# ==========================================
# --- PHẦN 1: SQLITE CHO ACCESS LOGS ---
# ==========================================
DB_PATH = "/storage/emulated/0/coder/media/ubuntu-backend-core/database/logs.db"

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT,
            method TEXT,
            path TEXT,
            status_code INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def log_request(ip, method, path, status_code):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO access_logs (ip_address, method, path, status_code) VALUES (?, ?, ?, ?)",
            (ip, method, path, status_code)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Lỗi ghi log SQLite: {e}")

def get_request_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT substr(datetime(timestamp, 'localtime'), 12, 5) as minute, COUNT(*)
            FROM access_logs
            GROUP BY minute
            ORDER BY minute DESC
            LIMIT 10
        ''')
        rows = cursor.fetchall()
        conn.close()
        rows.reverse()
        return {"timeline": [{"time": row[0], "count": row[1]} for row in rows]}
    except Exception:
        return {"timeline": []}

def get_raw_logs(limit=30):
    """Trích xuất nhật ký dạng chuỗi văn bản thô cho AI đọc hiểu"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT datetime(timestamp, 'localtime'), ip_address, method, path, status_code 
            FROM access_logs ORDER BY id DESC LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return "\n".join([f"[{r[0]}] IP: {r[1]} | {r[2]} {r[3]} | Status: {r[4]}" for r in rows])
    except Exception:
        return "Không thể đọc Access Logs."


# ==========================================
# --- PHẦN 2: MARIADB CHO SOCIAL SERVICES & GAME ---
# ==========================================
class DbManager:
    """Quản lý Connection Pool"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DbManager, cls).__new__(cls)
            cls._instance._init_pool()
        return cls._instance

    def _init_pool(self):
        self.pool = None
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name="social_hub_pool",
                pool_size=10, 
                pool_reset_session=True,
                host=settings.DB_HOST,
                port=int(settings.DB_PORT),
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASS
            )
            print("✅ DB Connection Pool đã được khởi tạo thành công!")
        except Exception as e:
            print(f"⚠️ Khởi tạo MariaDB Pool thất bại (Sẽ thử lại sau): {e}")

    def connect(self):
        """Hàm được gọi từ api/server.py để khởi chạy/kiểm tra pool kết nối"""
        if self.pool is None:
            self._init_pool()
        else:
            try:
                conn = self.pool.get_connection()
                conn.close()
                print("✅ MariaDB Connection Pool hoạt động bình thường!")
            except Exception as e:
                print(f"⚠️ Cảnh báo kết nối Pool: {e}")
                self._init_pool()

    def init_social_tables(self):
        """Khởi tạo cấu trúc các bảng cho mạng xã hội nếu chưa tồn tại"""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS post (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS media (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    post_id INT NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    media_type VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
                )
            ''')
            
            conn.commit()
            print("✅ Đã kiểm tra và khởi tạo thành công các bảng: user, post, media!")
            
        except Exception as e:
            print(f"⚠️ Lỗi khi khởi tạo bảng Social: {e}")
            if conn: conn.rollback()
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    def get_connection(self):
        if self.pool:
            return self.pool.get_connection()
        self._init_pool()
        if self.pool:
            return self.pool.get_connection()
        raise Exception("Connection pool chưa được khởi tạo hoặc CSDL đang sập!")


class DbExecutor:
    def __init__(self):
        self.db = DbManager()

    def select_as_list_dict(self, sql, params=None):
        conn = None
        cursor = None
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params or ())
            return cursor.fetchall()
        except Exception as e:
            print(f"⚠️ DbExecutor EXCEPTION: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: conn.close()


class DbInserter:
    def __init__(self):
        self.db = DbManager()

    def insert(self, sql, params=None):
        conn = None
        cursor = None
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"⚠️ DbInserter EXCEPTION: {e}")
            if conn: conn.rollback()
            return None
        finally:
            if cursor: cursor.close()
            if conn: conn.close()


class DbUpdater:
    def __init__(self):
        self.db = DbManager()

    def update(self, sql, params=None):
        conn = None
        cursor = None
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            print(f"⚠️ DbUpdater EXCEPTION: {e}")
            if conn: conn.rollback()
            return -1
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

db_manager = DbManager()
db_executor = DbExecutor()
db_inserter = DbInserter()
db_updater = DbUpdater()
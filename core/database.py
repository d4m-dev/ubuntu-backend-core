# -*- coding: utf-8 -*-
import sqlite3
import os
import logging
import threading
import mysql.connector
from mysql.connector import pooling
from core.config import settings

# ==========================================
# --- PHẦN 1: SQLITE CHO ACCESS LOGS (TỐI ƯU HÓA) ---
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "logs.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
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

def log_request(ip, method, path, status_code):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO access_logs (ip_address, method, path, status_code) VALUES (?, ?, ?, ?)",
                (ip, method, path, status_code)
            )
            conn.commit()
    except Exception as e:
        logging.error(f"Lỗi ghi log SQLite: {e}")

def get_request_stats():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT substr(datetime(timestamp, 'localtime'), 12, 5) as minute, COUNT(*)
                FROM access_logs
                GROUP BY minute ORDER BY minute DESC LIMIT 10
            ''')
            rows = cursor.fetchall()
            rows.reverse()
            return {"timeline": [{"time": row[0], "count": row[1]} for row in rows]}
    except Exception:
        return {"timeline": []}

def get_raw_logs(limit=30):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT datetime(timestamp, 'localtime'), ip_address, method, path, status_code 
                FROM access_logs ORDER BY id DESC LIMIT ?
            ''', (limit,))
            rows = cursor.fetchall()
            return "\n".join([f"[{r[0]}] IP: {r[1]} | {r[2]} {r[3]} | Status: {r[4]}" for r in rows])
    except Exception:
        return "Không thể đọc Access Logs."


# ==========================================
# --- PHẦN 2: MARIADB CHO SIÊU HỆ SINH THÁI D4M ---
# ==========================================
class DbManager:
    """Quản lý Connection Pool với Thread-Safe Singleton"""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DbManager, cls).__new__(cls)
                cls._instance.pool = None
        return cls._instance

    def _init_pool(self):
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name="d4m_ecosystem_pool",
                pool_size=15, # Tăng size pool cho hệ sinh thái Game + MXH
                pool_reset_session=True,
                host=settings.DB_HOST,
                port=int(settings.DB_PORT),
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASS
            )
            print("✅ DB Connection Pool đã được khởi tạo thành công!")
        except Exception as e:
            logging.error(f"⚠️ Khởi tạo MariaDB Pool thất bại (Sẽ thử lại sau): {e}")

    def connect(self):
        """Hàm Ping kiểm tra kết nối lúc Server khởi động (được gọi từ server.py)"""
        if self.pool is None:
            self._init_pool()
        else:
            try:
                conn = self.pool.get_connection()
                conn.close()
                print("✅ MariaDB Connection Pool hoạt động bình thường!")
            except Exception:
                self._init_pool()

    def get_connection(self):
        if self.pool is None:
            self._init_pool()
        if self.pool:
            return self.pool.get_connection()
        raise Exception("Connection pool chưa được khởi tạo hoặc CSDL MariaDB đang sập!")

    def init_social_tables(self):
        """Khởi tạo tự động 20 bảng cốt lõi của Hệ Sinh Thái D4M"""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Tắt kiểm tra khóa ngoại tạm thời để tránh lỗi đụng độ thứ tự tạo bảng
            cursor.execute("SET foreign_key_checks = 0;")
            
            for table_query in self._get_schema_queries():
                cursor.execute(table_query)
            
            # Bật lại kiểm tra khóa ngoại
            cursor.execute("SET foreign_key_checks = 1;")
            conn.commit()
            print("✅ Đã khởi tạo và đồng bộ thành công 20 Bảng Dữ Liệu của Hệ Sinh Thái D4M!")
        except Exception as e:
            logging.error(f"Lỗi khi khởi tạo cấu trúc MariaDB: {e}")
            if conn: conn.rollback()
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    def _get_schema_queries(self):
        """Chứa định dạng chuẩn 100% của 19 bảng D4M Ecosystem"""
        return [
            # 1. Bảng Users (Trung tâm SS0)
            """CREATE TABLE IF NOT EXISTS `users` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `username` varchar(50) NOT NULL UNIQUE,
                `fullname` varchar(100) DEFAULT NULL,
                `avatar_url` varchar(255) DEFAULT '',
                `created_at` timestamp NULL DEFAULT current_timestamp(),
                `email` varchar(100) UNIQUE DEFAULT NULL,
                `password_hash` varchar(255) NOT NULL,
                `full_name` varchar(100) DEFAULT NULL,
                `cccd` varchar(20) UNIQUE DEFAULT NULL,
                `phone` varchar(20) DEFAULT NULL,
                `dob` date DEFAULT NULL,
                `address` text DEFAULT NULL,
                `is_verified` tinyint(1) DEFAULT 0,
                `otp_code` varchar(10) DEFAULT NULL,
                `role` smallint(6) NOT NULL DEFAULT -1,
                `ban` varchar(500) DEFAULT NULL,
                `active` int(11) NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",
            
            # 2. Bảng Items (Vật phẩm gốc)
            """CREATE TABLE IF NOT EXISTS `items` (
                `id` int(11) NOT NULL PRIMARY KEY,
                `coin` int(11) NOT NULL DEFAULT 0,
                `gold` smallint(6) NOT NULL DEFAULT 0,
                `type` smallint(6) NOT NULL,
                `icon` smallint(6) NOT NULL,
                `name` varchar(200) NOT NULL DEFAULT '',
                `sell` tinyint(4) DEFAULT NULL,
                `expired_day` tinyint(4) NOT NULL DEFAULT 0,
                `zorder` tinyint(4) DEFAULT NULL,
                `gender` tinyint(4) DEFAULT NULL,
                `level` tinyint(4) DEFAULT NULL,
                `animation` text DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 3. Bảng Players (Dữ liệu Game của User)
            """CREATE TABLE IF NOT EXISTS `players` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user_id` int(11) NOT NULL UNIQUE,
                `last_online` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
                `is_online` tinyint(1) NOT NULL DEFAULT 0,
                `client_id` int(11) NOT NULL DEFAULT 0,
                `xu` int(11) NOT NULL DEFAULT 20000,
                `luong` int(11) NOT NULL DEFAULT 0,
                `luong_khoa` int(11) NOT NULL DEFAULT 0,
                `xeng` int(11) NOT NULL DEFAULT 0,
                `clan_id` int(11) NOT NULL DEFAULT 0,
                `star` int(11) NOT NULL DEFAULT -1,
                `items` varchar(5000) NOT NULL DEFAULT '[]',
                `gender` tinyint(1) NOT NULL DEFAULT 0,
                `level_main` int(11) NOT NULL DEFAULT 1,
                `exp_main` int(11) NOT NULL DEFAULT 0,
                `exp_farm` int(11) NOT NULL DEFAULT 0,
                `friendly` tinyint(4) NOT NULL DEFAULT 100,
                `crazy` tinyint(4) NOT NULL DEFAULT 0,
                `stylish` tinyint(4) NOT NULL DEFAULT 0,
                `happy` tinyint(4) NOT NULL DEFAULT 100,
                `hunger` tinyint(4) NOT NULL DEFAULT 0,
                `chest_slot` int(11) NOT NULL DEFAULT 10,
                `chest_home_slot` int(11) NOT NULL DEFAULT 10,
                `chests` text NOT NULL,
                `wearing` text NOT NULL,
                CONSTRAINT `players_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 4. Posts (Mạng Xã Hội)
            """CREATE TABLE IF NOT EXISTS `posts` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user_id` int(11) DEFAULT NULL,
                `content` text DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT current_timestamp(),
                `attached_media` varchar(255) DEFAULT NULL,
                `media_type` varchar(50) DEFAULT NULL,
                CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 5. Media (Đính kèm MXH)
            """CREATE TABLE IF NOT EXISTS `media` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `post_id` int(11) DEFAULT NULL,
                `file_url` varchar(255) NOT NULL,
                `media_type` varchar(50) DEFAULT 'image',
                CONSTRAINT `media_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 6. Chests (Hành trang cá nhân)
            """CREATE TABLE IF NOT EXISTS `chests` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user_id` int(11) NOT NULL,
                `item_id` int(11) NOT NULL,
                `is_use` tinyint(1) NOT NULL DEFAULT 0,
                `is_show` int(11) NOT NULL DEFAULT 1,
                `date_expired` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
                CONSTRAINT `chests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT `chests_ibfk_3` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 7. Dial Lucky (Vòng Quay)
            """CREATE TABLE IF NOT EXISTS `dial_lucky` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `item_id` int(11) NOT NULL,
                `xu` tinyint(4) NOT NULL DEFAULT 0,
                `luong` tinyint(4) NOT NULL DEFAULT 0,
                `free` tinyint(4) NOT NULL DEFAULT 0,
                `ratio` tinyint(4) NOT NULL DEFAULT 100,
                CONSTRAINT `dial_lucky_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 8. Settings (Cấu hình Game)
            """CREATE TABLE IF NOT EXISTS `settings` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `name` varchar(50) NOT NULL UNIQUE,
                `value` text DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 9. Giaodich_logs (Nhật ký giao dịch)
            """CREATE TABLE IF NOT EXISTS `giaodich_logs` (
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user` int(11) NOT NULL DEFAULT 0,
                `transID` varchar(50) DEFAULT NULL,
                `type` varchar(20) NOT NULL DEFAULT '0',
                `amount` int(11) NOT NULL DEFAULT 0,
                `log` text NOT NULL,
                `status` varchar(20) DEFAULT 'SUCCESS',
                `time` varchar(50) NOT NULL DEFAULT '0',
                KEY `user_index` (`user`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 10. Giftcode
            """CREATE TABLE IF NOT EXISTS `giftcode` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `code` varchar(50) NOT NULL UNIQUE,
                `message` varchar(255) DEFAULT NULL,
                `data` text NOT NULL,
                `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
                `end_time` timestamp NOT NULL DEFAULT current_timestamp(),
                `num` int(11) NOT NULL DEFAULT 1,
                `create_by` int(11) NOT NULL DEFAULT 0,
                `create_time` timestamp NOT NULL DEFAULT current_timestamp()
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 11. Giftcode Use
            """CREATE TABLE IF NOT EXISTS `giftcode_use` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user` int(11) NOT NULL,
                `giftcode_id` int(11) NOT NULL,
                `time` timestamp NOT NULL DEFAULT current_timestamp(),
                CONSTRAINT `fk_giftcode_use_code` FOREIGN KEY (`giftcode_id`) REFERENCES `giftcode` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_giftcode_use_user` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 12. Gioithieu (Mời bạn bè)
            """CREATE TABLE IF NOT EXISTS `gioithieu` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user` int(11) NOT NULL,
                `user_ref` int(11) NOT NULL,
                `ip` varchar(50) NOT NULL DEFAULT '0.0.0.0',
                `date` datetime NOT NULL DEFAULT current_timestamp(),
                CONSTRAINT `fk_gioithieu_ref` FOREIGN KEY (`user_ref`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_gioithieu_user` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 13. Map Item Type
            """CREATE TABLE IF NOT EXISTS `map_item_type` (
                `id` int(11) NOT NULL PRIMARY KEY,
                `name` varchar(100) NOT NULL,
                `description` varchar(255) DEFAULT '',
                `image` smallint(6) NOT NULL,
                `icon` tinyint(4) NOT NULL,
                `price_coin` int(11) NOT NULL DEFAULT 0,
                `price_gold` int(11) NOT NULL DEFAULT 0,
                `buy` int(11) NOT NULL DEFAULT 1,
                `dx` smallint(6) NOT NULL DEFAULT 0,
                `dy` smallint(6) NOT NULL DEFAULT 0,
                `position` text NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 14. Map Item
            """CREATE TABLE IF NOT EXISTS `map_item` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `type_id` int(11) NOT NULL,
                `type` int(11) NOT NULL DEFAULT 0,
                `x` int(11) NOT NULL,
                `y` int(11) NOT NULL,
                `map_id` int(11) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 15. NPC
            """CREATE TABLE IF NOT EXISTS `npc` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `name` varchar(50) NOT NULL,
                `items` text NOT NULL,
                `map` int(11) NOT NULL,
                `x` int(11) NOT NULL DEFAULT 0,
                `y` int(11) NOT NULL DEFAULT 0,
                `star` int(11) NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 16. Foods (Đồ ăn)
            """CREATE TABLE IF NOT EXISTS `foods` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `name` varchar(100) NOT NULL,
                `description` varchar(255) NOT NULL,
                `img` int(11) NOT NULL,
                `shop` int(11) NOT NULL,
                `percent_health` int(11) NOT NULL DEFAULT 0,
                `price` int(11) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 17. Image Data (Tọa độ Sprite)
            """CREATE TABLE IF NOT EXISTS `image_data` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `item_id` int(11) NOT NULL,
                `image_id` int(11) NOT NULL,
                `x` int(11) NOT NULL,
                `y` int(11) NOT NULL,
                `w` int(11) NOT NULL,
                `h` int(11) NOT NULL,
                KEY `idx_item` (`item_id`),
                KEY `idx_image` (`image_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 18. Item Image Data
            """CREATE TABLE IF NOT EXISTS `item_image_data` (
                `id` int(11) NOT NULL PRIMARY KEY,
                `image_id` int(11) DEFAULT NULL,
                `x` int(11) DEFAULT NULL,
                `y` int(11) DEFAULT NULL,
                `w` int(11) DEFAULT NULL,
                `h` int(11) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 19. Farm Image Data
            """CREATE TABLE IF NOT EXISTS `farm_image_data` (
                `id` int(11) NOT NULL PRIMARY KEY,
                `image_id` int(11) DEFAULT NULL,
                `x` int(11) DEFAULT NULL,
                `y` int(11) DEFAULT NULL,
                `w` int(11) DEFAULT NULL,
                `h` int(11) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

            # 20. Work Schedules (Lịch làm việc thông minh)
            """CREATE TABLE IF NOT EXISTS `work_schedules` (
                `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `user_id` int(11) NOT NULL,
                `work_date` date NOT NULL,
                `shift_name` varchar(50) NOT NULL,
                `start_time` time DEFAULT NULL,
                `end_time` time DEFAULT NULL,
                `is_off` tinyint(1) NOT NULL DEFAULT 0,
                `gcal_event_id` varchar(255) DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT current_timestamp(),
                CONSTRAINT `fk_work_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"""
        ]


# ==========================================
# --- BỘ CÔNG CỤ DAO (Data Access Object) CHUẨN MỰC ---
# ==========================================

class DbExecutor:
    """Class chuyên xử lý các lệnh truy vấn (SELECT) lấy dữ liệu"""
    def __init__(self):
        self.db = db_manager

    def select_as_list_dict(self, sql, params=None):
        conn = None
        cursor = None
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params or ())
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"DbExecutor EXCEPTION: {e} - SQL: {sql}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

class DbInserter:
    """Class chuyên xử lý lệnh chèn (INSERT)"""
    def __init__(self):
        self.db = db_manager

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
            logging.error(f"DbInserter EXCEPTION: {e} - SQL: {sql}")
            if conn: conn.rollback()
            return None
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

class DbUpdater:
    """Class chuyên xử lý lệnh cập nhật (UPDATE)"""
    def __init__(self):
        self.db = db_manager

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
            logging.error(f"DbUpdater EXCEPTION: {e} - SQL: {sql}")
            if conn: conn.rollback()
            return -1
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

class DbDeleter:
    """Class chuyên xử lý lệnh xóa (DELETE) bổ sung sức mạnh cho Backend"""
    def __init__(self):
        self.db = db_manager

    def delete(self, sql, params=None):
        conn = None
        cursor = None
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            logging.error(f"DbDeleter EXCEPTION: {e} - SQL: {sql}")
            if conn: conn.rollback()
            return -1
        finally:
            if cursor: cursor.close()
            if conn: conn.close()


# Khởi tạo Lõi Database Singleton cho toàn hệ thống
db_manager = DbManager()
db_executor = DbExecutor()
db_inserter = DbInserter()
db_updater = DbUpdater()
db_deleter = DbDeleter()

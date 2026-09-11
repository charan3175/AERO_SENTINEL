import psycopg2

DATABASE_CONFIG = {
    "host": "localhost",
    "database": "aero_sentinel",
    "user": "postgres",
    "password": "$HanzDTy2120G",
    "port": 5432,
}


def get_connection():
    return psycopg2.connect(**DATABASE_CONFIG)
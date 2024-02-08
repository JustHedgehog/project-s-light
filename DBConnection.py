from pymongo import MongoClient


class DBConnector:
    def __init__(self):
        self.ip = 'mongodb'
        self.port = 27017
        self.dbconn = None

    def create_connection(self):
        return MongoClient(self.ip, self.port)

    def __enter__(self):
        self.dbconn = self.create_connection()
        return self.dbconn

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.dbconn.close()


class DBConnection:
    connection = None

    @classmethod
    def get_connection(cls, new=False):
        if new or not cls.connection:
            cls.connection = DBConnector().create_connection()
        return cls.connection

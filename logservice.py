import datetime
import json
import os

from confluent_kafka import Producer

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")

class LogService:

    @staticmethod
    def send_message_to_kafka(type, message):
        producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER})

        kafka_data = {
            'Type': type,
            'Message': message,
            'Date': str(datetime.datetime.now()),
        }

        m = json.dumps(kafka_data)
        print(m)
        producer.poll(1)
        producer.produce('logs', m.encode('utf-8'))
        producer.flush()
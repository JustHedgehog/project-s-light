import json
import os

from confluent_kafka import Consumer

from preprocessing import PreProcessing
from logservice import LogService

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
KAFKA_GROUP_ID = os.environ.get("KAFKA_GROUP_ID")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC")

consumer = Consumer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER, 'group.id': KAFKA_GROUP_ID})
consumer.subscribe([KAFKA_TOPIC])

# to do zabezpieczenia jeszcze
if __name__ == "__main__":
    print("Started...")
    while True:
        msg = consumer.poll(1)
        if msg is None:
            continue
        if msg.error():
            LogService.send_message_to_kafka('ERROR', str(msg.error()))
            print('Error: {}'.format(msg.error()))
            continue

        try:
            post_data = msg.value().decode('utf-8')
            LogService.send_message_to_kafka('INFO', "Container " + KAFKA_GROUP_ID + " received kafka message")
            print(post_data)

            post_data = json.loads(post_data)
            id = post_data['id']
            model_id = post_data['model_id']
            target = post_data['target']
            data_id = post_data['data_id']

            column_names = post_data['column_names']

            categorical_features = []

            if 'categorical_features' in post_data:
                if post_data['categorical_features'] != []:
                    categorical_features = post_data['categorical_features']

            LogService.send_message_to_kafka('INFO', "Pre-processing...")
            PreProcessing().preprocess(data_id, column_names, categorical_features, model_id, target, id)
            LogService.send_message_to_kafka('INFO', "Completion of pre-processing...")
        except Exception as e:
            print(e)

import os
import random
import socket
import time
from datetime import datetime
from confluent_kafka.cimpl import Producer
import pandas as pd


KAFKA_BROKER_URL_OUT = os.environ.get("KAFKA_BROKER_URL_OUT")
KAFKA_GROUP_ID = os.environ.get("KAFKA_GROUP_ID")
KAFKA_TOPIC_OUT = os.environ.get("KAFKA_TOPIC_OUT")
FILES = os.environ.get("FILES")

def load_csv(files, sep):
    frames = []
    for file in files:
        frames.append(pd.read_csv(file, sep=sep, low_memory=False))
    return pd.concat(frames)

producer = Producer({
    'bootstrap.servers': KAFKA_BROKER_URL_OUT,
    'client.id': socket.gethostname()
})

df = load_csv(
    FILES.split(sep=";")
, ',')

df_shuffled = df.sample(frac=1).reset_index(drop=True)


for index, row in df_shuffled.iterrows():
    randomSecond = random.randint(1, 15)
    row['date'] = datetime.now().isoformat()
    row.drop('attack_t')
    json_object = row.to_json()
    print(f"waiting: {randomSecond} second")
    producer.produce(KAFKA_TOPIC_OUT, key=KAFKA_GROUP_ID, value=json_object.encode('utf-8'))
    producer.poll(1)
    time.sleep(randomSecond)

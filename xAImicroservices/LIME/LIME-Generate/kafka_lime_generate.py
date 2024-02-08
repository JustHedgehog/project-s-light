import json
import os
import traceback

import gridfs
from bson import ObjectId
from confluent_kafka import Consumer
import paho.mqtt.client as mqtt
from tensorflow.python.checkpoint.util import get_full_name

from DBConnection import DBConnection
from LimeGenerate import LimeTabularGenerate
from logservice import LogService

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
KAFKA_GROUP_ID = os.environ.get("KAFKA_GROUP_ID")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC")
MQTT_SERVER = os.environ.get("MQTT_SERVER")
MQTT_TOPIC_PUBLISH = os.environ.get("MQTT_TOPIC_PUBLISH")
MQTT_TOPIC_PUBLISH_ERROR = os.environ.get("MQTT_TOPIC_PUBLISH_ERROR")
MQTT_PORT = os.environ.get("MQTT_PORT")

consumer = Consumer(
    {'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER, 'group.id': KAFKA_GROUP_ID, 'max.poll.interval.ms': 14400000})
consumer.subscribe([KAFKA_TOPIC])

if __name__ == "__main__":
    LogService.send_message_to_kafka('INFO', "Database connection init...")
    db = DBConnection().get_connection()['explainer']
    fs = gridfs.GridFS(db)
    LogService.send_message_to_kafka('INFO', KAFKA_GROUP_ID + " container started...")
    print("Started...")
    client = mqtt.Client()
    client.connect(MQTT_SERVER, port=int(MQTT_PORT))
    client.loop_start()

    while True:
        msg = consumer.poll(1)
        if msg is None:
            continue
        if msg.error():
            LogService.send_message_to_kafka('ERROR', str(msg.error()))
            print('Error: {}'.format(msg.error()))
            continue
        post_data = msg.value().decode('utf-8')
        LogService.send_message_to_kafka('INFO', "Container " + KAFKA_GROUP_ID + " received kafka message")
        print(post_data)
        post_data = json.loads(post_data)
        explainer_id = post_data['id']

        try:
            inputType = post_data['inputType']
            explainer_name = post_data['name']
            explainer_input_type = post_data['inputType']
            model_id = post_data['modelId']

            if inputType == "tabular":
                data_id = post_data['datasetId']
                column_names = "".join(post_data['columnNames']).split(",")
                label_column = "".join(post_data['labelColumn'])
                feature_names = "".join(post_data['featureNames']).split(",")

                categorical_features = []

                if len(post_data['categoricalFeatures']) != 0:
                    categorical_features = "".join(post_data['categoricalFeatures']).split(",")

                data = fs.get(ObjectId(data_id)).read()
                data = "".join(data.decode('utf-8'))
                LogService.send_message_to_kafka('INFO', "Start of LIME object generation...")

                LimeTabularGenerate().generate(data, feature_names, column_names, label_column,
                                               categorical_features, model_id, explainer_name, explainer_id)

                fs.delete(ObjectId(data_id))
                LogService.send_message_to_kafka('INFO', "LIME object generated...")
                LogService.send_message_to_kafka('INFO', "Saving LIME object...")
                db.explainer.insert_one({
                    '_id': explainer_id,
                    'name': explainer_name,
                    'modelId': model_id,
                    'inputType': explainer_input_type,
                    'columnNames': ",".join(column_names),
                    'labelColumn': label_column,
                    'featureNames': ",".join(feature_names),
                    'categoricalFeatures': ",".join(categorical_features) if categorical_features else None,
                })

            LogService.send_message_to_kafka('INFO', "LIME object saved...")
            info_message_for_front = {'explainerId': explainer_id, 'message': "Created"}
            client.publish(MQTT_TOPIC_PUBLISH, json.dumps(info_message_for_front), qos=1)
            LogService.send_message_to_kafka('INFO', "Message to MQTT published...")

        except Exception as e:
            error_message_for_front = {'explainerId': explainer_id, 'message': type(e).__name__ + ":" + str(e)}
            LogService.send_message_to_kafka('ERROR', str(traceback.format_exc()))
            client.publish(MQTT_TOPIC_PUBLISH_ERROR, json.dumps(error_message_for_front), qos=1)
            LogService.send_message_to_kafka('INFO', "Error message to MQTT published...")
